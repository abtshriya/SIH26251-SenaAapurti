"""
Master Procedural Synthetic Dataset Generator for Sena Aapurti (SIH26251).
Generates a mathematically coherent 18-month historical time-series (548 days)
plus a 30-day live operational forecast window (total 578 days) across Northern Command
and Ladakh Theatre nodes with realistic cross-stream correlations:

1. Weather & Terrain Stream (`weather_telemetry`):
   - Altitude-lapsed sinusoidal seasonal temperature (-35°C to +25°C)
   - Snow accumulation, wind speed, avalanche warning levels (GREEN / YELLOW / RED)
   - Landslide risk indices during monsoon/thaw transitions

2. Consumption & Demand Stream (`consumption_history`):
   - Echelon troop-proportional daily consumption across 12 military SKUs
   - Predictable Winter Stocking Surge (September - November) before Zoji La / Khardung La close
   - Stochastic 7-day Tactical Alert Surges triggering 3.0x ammunition (Class V) and POL (Class III) burn

3. GIS Convoy & Airlift Mission Stream (`transit_missions`):
   - Dynamic route blocking when snow/avalanche thresholds spike
   - Delay multipliers (1.5x to 5.0x) and automatic rotary-wing air-drop rerouting (`CH47F_CHINOOK` / `MI17_V5`)

4. IoT Edge Sensor Telemetry Stream (`iot_telemetry_streams`):
   - Monotonic sequence IDs, RFID gate counts, ultrasonic POL tank levels, scale discrepancies,
     cold-chain temperature logs (2°C to 8°C with excursion alerts)
   - Injected EW/jamming comms blackout windows and HMAC-verifiable tamper anomalies

CLI Execution:
  python -m app.data_engine.generate_datasets --scale large --seed 2026 --export
"""

import argparse
import hashlib
import hmac
import json
import math
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.core.config import settings
from app.data_engine.data_loader import ingest_bundle_to_postgis
from app.data_engine.military_ontology import (
    NODE_MAP,
    SKU_MAP,
    SUPPLY_CATALOG,
    SUPPLY_CORRIDORS,
    THEATRE_NODES,
    TRANSPORT_FLEET,
    TheatreNodeSpec,
)
from app.data_engine.schemas import GeneratedDatasetBundle

console = Console()

BACKEND_ROOT = Path(__file__).resolve().parents[2]
RAW_STATIC_DIR = BACKEND_ROOT / "app" / "data" / "raw_static"
EXPORTS_DIR = BACKEND_ROOT / "app" / "data" / "exports"


def _build_spatial_nodes_and_routes() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Serializes theatre nodes and supply corridors with PostGIS EWKT geometries."""
    nodes_out: List[Dict[str, Any]] = []
    for n in THEATRE_NODES:
        nodes_out.append(
            {
                "node_id": n.node_id,
                "name": n.name,
                "echelon": n.echelon,
                "sector": n.sector,
                "elevation_m": n.elevation_m,
                "lat": n.lat,
                "lon": n.lon,
                "storage_capacity_tons": n.storage_capacity_tons,
                "baseline_troop_strength": n.baseline_troop_strength,
                "wkt_point": f"SRID=4326;POINT({n.lon} {n.lat})",
            }
        )

    routes_out: List[Dict[str, Any]] = []
    for r in SUPPLY_CORRIDORS:
        coord_str = ", ".join(f"{lon} {lat}" for lon, lat in r.waypoints)
        routes_out.append(
            {
                "route_id": r.route_id,
                "origin_id": r.origin_id,
                "destination_id": r.destination_id,
                "distance_km": r.distance_km,
                "terrain_type": r.terrain_type,
                "seasonal_pass_name": r.seasonal_pass_name,
                "default_lead_time_hrs": r.default_lead_time_hrs,
                "wkt_linestring": f"SRID=4326;LINESTRING({coord_str})",
            }
        )

    return nodes_out, routes_out


def generate_multi_stream_datasets(
    scale: str = "large",
    seed: int = 2026,
    historical_days: int = 548,
    forecast_days: int = 30,
) -> GeneratedDatasetBundle:
    """
    Vectorized & procedurally correlated multi-stream generator producing >75,000 records
    for `--scale large` across 18 months history + 30 days forecast.
    """
    rng = np.random.default_rng(seed)

    if scale == "small":
        historical_days = 90
        forecast_days = 15
    elif scale == "medium":
        historical_days = 270
        forecast_days = 30
    else:
        historical_days = 548  # 18 months
        forecast_days = 30     # 30-day forward window

    total_days = historical_days + forecast_days
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = now_utc - timedelta(days=historical_days)

    nodes_list, routes_list = _build_spatial_nodes_and_routes()

    weather_records: List[Dict[str, Any]] = []
    consumption_records: List[Dict[str, Any]] = []
    transit_records: List[Dict[str, Any]] = []
    iot_records: List[Dict[str, Any]] = []

    # Pre-assign random 7-day Tactical Alert Surge windows per node (3 surges over 18 months)
    tactical_alert_days_by_node: Dict[str, set[int]] = {}
    for node in THEATRE_NODES:
        alert_starts = rng.choice(range(15, total_days - 10), size=4, replace=False)
        alert_days: set[int] = set()
        for start_idx in alert_starts:
            for d in range(int(start_idx), int(start_idx) + 7):
                alert_days.add(d)
        tactical_alert_days_by_node[node.node_id] = alert_days

    # Track weather condition per (node_id, day_idx) for downstream route & mission correlation
    node_day_weather: Dict[Tuple[str, int], Dict[str, Any]] = {}

    # -------------------------------------------------------------------------
    # STREAM 1 & 2: Weather Telemetry + Correlated Multi-Class Consumption
    # -------------------------------------------------------------------------
    for day_idx in range(total_days):
        current_dt = start_date + timedelta(days=day_idx)
        ts_iso = current_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        day_of_year = current_dt.timetuple().tm_yday
        month = current_dt.month
        is_forecast = day_idx >= historical_days

        # Seasonal cosine wave: peak warmth around day 200 (July), deepest cold around day 15 (Jan)
        seasonal_phase = math.cos(2.0 * math.pi * (day_of_year - 200) / 365.25)
        is_winter_stocking_month = month in (9, 10, 11)

        for node in THEATRE_NODES:
            # Altitude lapse rate: ~6.5°C drop per 1000m elevation
            mean_temp = 20.0 - ((node.elevation_m - 700) / 1000.0) * 7.8
            seasonal_swing = 14.5 + (node.elevation_m / 5500.0) * 8.0
            raw_temp = (
                mean_temp
                + seasonal_swing * seasonal_phase
                + float(rng.normal(0.0, 2.4))
            )
            temp_c = round(float(np.clip(raw_temp, -35.0, 25.0)), 2)

            # Snow accumulation rises sharply when temp < -2°C at high altitude
            if temp_c < -2.0 and node.elevation_m >= 2500:
                base_snow = max(0.0, (-temp_c - 2.0) * 2.1 * float(rng.gamma(1.6, 0.8)))
            else:
                base_snow = 0.0
            snow_cm = round(float(np.clip(base_snow, 0.0, 165.0)), 1)

            wind_kmh = round(
                float(
                    np.clip(
                        18.0
                        + (node.elevation_m / 250.0)
                        + abs(min(0.0, temp_c)) * 0.9
                        + rng.normal(0.0, 8.0),
                        5.0,
                        125.0,
                    )
                ),
                1,
            )

            # Avalanche Risk Index (0.0 - 1.0) & Warning Level (GREEN / YELLOW / RED)
            elev_factor = min(1.0, max(0.0, (node.elevation_m - 2200) / 3200.0))
            avalanche_risk = round(
                float(
                    np.clip(
                        elev_factor * (snow_cm / 95.0) * 0.75
                        + (wind_kmh / 130.0) * 0.25,
                        0.0,
                        1.0,
                    )
                ),
                3,
            )
            if avalanche_risk >= 0.65 or snow_cm >= 55.0:
                avalanche_level = "RED"
            elif avalanche_risk >= 0.35 or snow_cm >= 25.0:
                avalanche_level = "YELLOW"
            else:
                avalanche_level = "GREEN"

            # Landslide risk peaks during monsoon / snow-melt (June - Sept) at mid-altitudes
            is_monsoon_thaw = month in (6, 7, 8, 9)
            landslide_risk = round(
                float(
                    np.clip(
                        (0.45 if is_monsoon_thaw else 0.12)
                        * (1.0 if node.elevation_m < 4200 else 0.3)
                        + float(rng.uniform(0.0, 0.25)),
                        0.0,
                        1.0,
                    )
                ),
                3,
            )

            weather_entry = {
                "log_id": f"WTH-{node.node_id}-{day_idx:04d}",
                "timestamp": ts_iso,
                "node_id": node.node_id,
                "temperature_c": temp_c,
                "snow_accumulation_cm": snow_cm,
                "wind_speed_kmh": wind_kmh,
                "avalanche_warning_level": avalanche_level,
                "avalanche_risk_index": avalanche_risk,
                "landslide_risk_index": landslide_risk,
            }
            weather_records.append(weather_entry)
            node_day_weather[(node.node_id, day_idx)] = weather_entry

            # Determine operational tempo & troop density variations
            in_tactical_alert = day_idx in tactical_alert_days_by_node[node.node_id]
            if in_tactical_alert:
                op_tempo = "TACTICAL_ALERT_SURGE"
                troop_multiplier = float(rng.uniform(1.18, 1.32))
            elif is_winter_stocking_month and node.winter_cutoff_prone:
                op_tempo = "WINTER_STOCKING"
                troop_multiplier = float(rng.uniform(1.08, 1.16))
            else:
                op_tempo = "BASELINE"
                troop_multiplier = float(rng.uniform(0.95, 1.05))

            active_troops = int(round(node.baseline_troop_strength * troop_multiplier))

            # Generate daily SKU consumption for this node
            for sku_spec in SUPPLY_CATALOG:
                base_demand = active_troops * sku_spec.per_capita_daily_rate

                # Cross-stream modifiers
                surge_mult = 1.0
                if is_winter_stocking_month and node.winter_cutoff_prone:
                    # Pre-winter stockpiling surge (Sept - Nov) before Zoji La / Khardung La close
                    surge_mult *= 1.65

                if in_tactical_alert:
                    # 3.0x surge on Class V (Munitions) and Class III (POL), 1.8x on Medical
                    if sku_spec.supply_class in ("CLASS_V", "CLASS_III"):
                        surge_mult *= 3.0
                    elif sku_spec.supply_class == "CLASS_VIII":
                        surge_mult *= 1.85
                    else:
                        surge_mult *= 1.30

                # Sub-zero heating & caloric burn multiplier
                if temp_c < -10.0:
                    if sku_spec.supply_class == "CLASS_III":
                        surge_mult *= 1.40
                    elif sku_spec.supply_class == "CLASS_I":
                        surge_mult *= 1.22
                    elif sku_spec.sku == "CL8-MED-HAPE-OXY":
                        surge_mult *= 1.55

                noise = float(rng.normal(1.0, 0.08))
                units_consumed = max(1, int(round(base_demand * surge_mult * max(0.6, noise))))

                consumption_records.append(
                    {
                        "record_id": f"CNS-{node.node_id}-{sku_spec.sku}-{day_idx:04d}",
                        "timestamp": ts_iso,
                        "node_id": node.node_id,
                        "sku": sku_spec.sku,
                        "units_consumed": units_consumed,
                        "active_troop_count": active_troops,
                        "operational_tempo": op_tempo,
                        "is_winter_stocking_surge": bool(
                            is_winter_stocking_month and node.winter_cutoff_prone
                        ),
                        "is_forecast_window": is_forecast,
                    }
                )

    # -------------------------------------------------------------------------
    # STREAM 3: GIS-Enabled Convoy & Rotary Airlift Missions (`transit_missions`)
    # -------------------------------------------------------------------------
    ground_vehicles = [
        f for f in TRANSPORT_FLEET if f.modality in ("HEAVY_SURFACE", "LIGHT_MOUNTAIN")
    ]
    air_vehicles = [f for f in TRANSPORT_FLEET if f.modality == "ROTARY_WING_AIR"]

    mission_seq = 1
    for day_idx in range(total_days):
        current_dt = start_date + timedelta(days=day_idx, hours=6)
        for corridor in SUPPLY_CORRIDORS:
            dest_weather = node_day_weather[(corridor.destination_id, day_idx)]
            snow_cm = dest_weather["snow_accumulation_cm"]
            avalanche_lvl = dest_weather["avalanche_warning_level"]

            # Evaluate route status & delay multiplier from weather + pass vulnerability
            if corridor.terrain_type == "AIR_CORRIDOR":
                vehicle = air_vehicles[mission_seq % len(air_vehicles)]
                route_status = "OPEN"
                delay_mult = 1.0 if avalanche_lvl != "RED" else 1.35
            elif (
                avalanche_lvl == "RED"
                or (snow_cm >= 45.0 and corridor.avalanche_vulnerability >= 0.70)
            ):
                # Extreme snow / Red avalanche warning blocks surface pass -> triggers Air-Drop Reroute or 3.5-5.0x delay
                if rng.random() < 0.65:
                    vehicle = air_vehicles[mission_seq % len(air_vehicles)]
                    route_status = "REROUTED_AIR_DROP"
                    delay_mult = round(float(rng.uniform(1.5, 2.2)), 2)
                else:
                    vehicle = ground_vehicles[mission_seq % len(ground_vehicles)]
                    route_status = "BLOCKED"
                    delay_mult = round(float(rng.uniform(3.5, 5.0)), 2)
            elif avalanche_lvl == "YELLOW" or snow_cm >= 20.0:
                vehicle = ground_vehicles[mission_seq % len(ground_vehicles)]
                route_status = "DEGRADED_SNOW"
                delay_mult = round(float(rng.uniform(1.5, 2.8)), 2)
            else:
                vehicle = ground_vehicles[mission_seq % len(ground_vehicles)]
                route_status = "OPEN"
                delay_mult = round(float(rng.uniform(1.0, 1.2)), 2)

            effective_hours = corridor.default_lead_time_hrs * delay_mult
            eta_dt = current_dt + timedelta(hours=effective_hours)

            # Construct realistic multi-class cargo manifest
            primary_sku = SUPPLY_CATALOG[mission_seq % len(SUPPLY_CATALOG)]
            secondary_sku = SUPPLY_CATALOG[(mission_seq + 3) % len(SUPPLY_CATALOG)]
            manifest = {
                "convoy_callsign": f"BRAHMA-{corridor.route_id[-7:]}-{day_idx:03d}",
                "seasonal_pass": corridor.seasonal_pass_name,
                "weather_gate_level": avalanche_lvl,
                "payload_tons": round(vehicle.payload_capacity_tons * 0.88, 2),
                "items": [
                    {
                        "sku": primary_sku.sku,
                        "supply_class": primary_sku.supply_class,
                        "quantity": int(rng.integers(120, 650)),
                    },
                    {
                        "sku": secondary_sku.sku,
                        "supply_class": secondary_sku.supply_class,
                        "quantity": int(rng.integers(80, 400)),
                    },
                ],
            }

            transit_records.append(
                {
                    "mission_id": f"MSN-{day_idx:04d}-{mission_seq:05d}",
                    "route_id": corridor.route_id,
                    "origin_id": corridor.origin_id,
                    "destination_id": corridor.destination_id,
                    "vehicle_type": vehicle.vehicle_type,
                    "cargo_manifest": manifest,
                    "route_status": route_status,
                    "delay_multiplier": delay_mult,
                    "departure_time": current_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "eta": eta_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                }
            )
            mission_seq += 1

    # -------------------------------------------------------------------------
    # STREAM 4: IoT Edge Sensor Telemetry Stream (`iot_telemetry_streams`)
    # -------------------------------------------------------------------------
    modalities_by_class = {
        "CLASS_I": "RFID_GATE",
        "CLASS_III": "ULTRASONIC_POL",
        "CLASS_V": "SCALE_LOADCELL",
        "CLASS_VIII": "COLD_CHAIN_PROBE",
    }

    secret_bytes = settings.IOT_HMAC_SECRET.encode("utf-8")
    seq_counter_by_device: Dict[str, int] = {}

    # Sample 4 high-priority SKUs per node per day to generate ~23,000 rich IoT sensor packets
    sampled_skus = [
        SKU_MAP["CL1-MRE-WINTER-4500"],
        SKU_MAP["CL3-DHPP-W-ARCTIC"],
        SKU_MAP["CL5-155MM-BOFORS-HE"],
        SKU_MAP["CL8-MED-HAPE-OXY"],
    ]

    for day_idx in range(total_days):
        current_dt = start_date + timedelta(days=day_idx, hours=12)
        ts_iso = current_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        for node in THEATRE_NODES:
            wth = node_day_weather[(node.node_id, day_idx)]
            for sku_spec in sampled_skus:
                device_id = f"IOT-{node.node_id[-6:]}-{sku_spec.supply_class}"
                seq_id = seq_counter_by_device.get(device_id, 1000) + 1
                seq_counter_by_device[device_id] = seq_id

                modality = modalities_by_class[sku_spec.supply_class]
                reported_qty = round(
                    float(
                        sku_spec.critical_safety_threshold * rng.uniform(0.75, 2.40)
                    ),
                    2,
                )

                # Weight sensor noise & discrepancy
                weight_discrepancy_kg = round(float(rng.normal(0.0, 1.85)), 2)

                # Cold-chain medical probes maintain 2°C - 8°C unless thermal excursion occurs
                if sku_spec.requires_cold_chain:
                    excursion = rng.random() < 0.03
                    ambient_temp_c = round(
                        float(
                            rng.uniform(9.5, 14.0)
                            if excursion
                            else rng.uniform(2.4, 7.2)
                        ),
                        2,
                    )
                else:
                    ambient_temp_c = wth["temperature_c"]

                vibration_g = round(float(np.clip(rng.gamma(2.0, 0.45), 0.05, 6.5)), 2)

                # Simulate intermittent EW / harsh weather comms blackout (2.5%) & tamper anomalies (1.2%)
                comms_blackout = bool(
                    (wth["avalanche_warning_level"] == "RED" and rng.random() < 0.12)
                    or rng.random() < 0.02
                )
                hmac_tamper = bool(rng.random() < 0.012)

                if hmac_tamper:
                    weight_discrepancy_kg = round(float(rng.uniform(45.0, 180.0)), 2)

                canonical_str = (
                    f"{device_id}|{node.node_id}|{sku_spec.sku}|{seq_id}|"
                    f"{reported_qty}|{ts_iso}"
                )
                valid_sig = hmac.new(
                    secret_bytes, canonical_str.encode("utf-8"), hashlib.sha256
                ).hexdigest()
                signature = (
                    ("deadbeef" + valid_sig[8:]) if hmac_tamper else valid_sig
                )

                iot_records.append(
                    {
                        "telemetry_id": f"TEL-{node.node_id[-6:]}-{sku_spec.sku[:7]}-{day_idx:04d}",
                        "timestamp": ts_iso,
                        "device_id": device_id,
                        "node_id": node.node_id,
                        "sku": sku_spec.sku,
                        "sensor_modality": modality,
                        "monotonic_seq_id": seq_id,
                        "reported_quantity": reported_qty,
                        "weight_discrepancy_kg": weight_discrepancy_kg,
                        "ambient_temp_c": ambient_temp_c,
                        "transit_vibration_g": vibration_g,
                        "comms_blackout_flag": comms_blackout,
                        "hmac_tamper_flag": hmac_tamper,
                        "hmac_signature": signature,
                    }
                )

    return GeneratedDatasetBundle(
        seed=seed,
        scale=scale,
        historical_days=historical_days,
        forecast_days=forecast_days,
        nodes=nodes_list,
        routes=routes_list,
        consumption_history=consumption_records,
        weather_telemetry=weather_records,
        transit_missions=transit_records,
        iot_telemetry_streams=iot_records,
    )


def export_datasets_to_disk(bundle: GeneratedDatasetBundle) -> Dict[str, str]:
    """
    Persists:
      1. Instant-startup static snapshots in `backend/app/data/raw_static/` (JSON & CSV)
      2. ML-ready feature-engineered training datasets in `backend/app/data/exports/` (CSV)
    """
    RAW_STATIC_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Save static JSON snapshots for instant startup
    static_topology_path = RAW_STATIC_DIR / "theatre_topology_snapshot.json"
    with open(static_topology_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "seed": bundle.seed,
                "scale": bundle.scale,
                "nodes": bundle.nodes,
                "routes": bundle.routes,
                "supply_catalog": [s.__dict__ for s in SUPPLY_CATALOG],
                "transport_fleet": [t.__dict__ for t in TRANSPORT_FLEET],
            },
            f,
            indent=2,
        )

    # 2. Export ML-Ready DataFrames into `backend/app/data/exports/`
    df_consumption = pd.DataFrame(bundle.consumption_history)
    df_weather = pd.DataFrame(bundle.weather_telemetry)
    df_missions = pd.DataFrame(bundle.transit_missions)
    df_iot = pd.DataFrame(bundle.iot_telemetry_streams)

    # Join Consumption + Weather for AI/ML Demand Forecasting feature matrix
    df_ml_features = df_consumption.merge(
        df_weather[
            [
                "timestamp",
                "node_id",
                "temperature_c",
                "snow_accumulation_cm",
                "wind_speed_kmh",
                "avalanche_warning_level",
                "avalanche_risk_index",
                "landslide_risk_index",
            ]
        ],
        on=["timestamp", "node_id"],
        how="left",
    )

    paths: Dict[str, str] = {
        "static_topology_json": str(static_topology_path),
        "ml_demand_forecasting_csv": str(EXPORTS_DIR / "ml_demand_forecasting_dataset.csv"),
        "consumption_history_csv": str(EXPORTS_DIR / "consumption_history.csv"),
        "weather_telemetry_csv": str(EXPORTS_DIR / "weather_telemetry.csv"),
        "transit_missions_csv": str(EXPORTS_DIR / "transit_missions.csv"),
        "iot_telemetry_streams_csv": str(EXPORTS_DIR / "iot_telemetry_streams.csv"),
    }

    df_ml_features.to_csv(paths["ml_demand_forecasting_csv"], index=False)
    df_consumption.to_csv(paths["consumption_history_csv"], index=False)
    df_weather.to_csv(paths["weather_telemetry_csv"], index=False)
    df_missions.to_csv(paths["transit_missions_csv"], index=False)
    df_iot.to_csv(paths["iot_telemetry_streams_csv"], index=False)

    return paths


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sena Aapurti Multi-Stream Defense Logistics Dataset Generator (SIH26251)"
    )
    parser.add_argument(
        "--scale",
        choices=["small", "medium", "large"],
        default="large",
        help="Dataset scale ('large' generates 18 months history + 30-day forecast, >100k records)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=2026,
        help="Deterministic PRNG seed for reproducible military simulation",
    )
    parser.add_argument(
        "--export",
        action="store_true",
        help="Export static JSON snapshots and ML-ready CSV training files to app/data/",
    )
    args = parser.parse_args()

    console.print(
        Panel.fit(
            "[bold cyan]SENA AAPURTI — DEFENSE DATA ENGINE & OR SIMULATOR (SIH26251)[/bold cyan]\n"
            f"[dim]Scale: {args.scale.upper()} | PRNG Seed: {args.seed} | Horizon: 18 Months + 30d Forecast[/dim]",
            border_style="cyan",
        )
    )

    t0 = time.perf_counter()
    bundle = generate_multi_stream_datasets(scale=args.scale, seed=args.seed)
    gen_elapsed = round(time.perf_counter() - t0, 3)

    db_report = ingest_bundle_to_postgis(bundle)

    exported_paths: Dict[str, str] = {}
    if args.export:
        exported_paths = export_datasets_to_disk(bundle)

    # Render Summary Table
    summary_table = Table(
        title="Multi-Stream Synthetic Data Generation & PostGIS Ingestion Summary",
        header_style="bold magenta",
    )
    summary_table.add_column("Data Stream / Pillar", style="white")
    summary_table.add_column("Target PostGIS Table", style="cyan")
    summary_table.add_column("Records Generated", justify="right", style="bold green")
    summary_table.add_column("Key Domain Features", style="yellow")

    summary_table.add_row(
        "GIS Theatre Nodes",
        "nodes",
        f"{len(bundle.nodes):,}",
        "Udhampur HQ, Leh/Srinagar Depots, Siachen/DBO/Galwan/Nyoma (Point 4326)",
    )
    summary_table.add_row(
        "GIS Supply Corridors",
        "routes",
        f"{len(bundle.routes):,}",
        "Zoji La, Khardung La, Chang La, Siachen Airbridge (LineString 4326)",
    )
    summary_table.add_row(
        "AI/ML Consumption History",
        "consumption_history",
        f"{len(bundle.consumption_history):,}",
        "Class I/III/V/VIII, Sept-Nov Winter Surge, 7-day 3x Tactical Alerts",
    )
    summary_table.add_row(
        "High-Altitude Weather",
        "weather_telemetry",
        f"{len(bundle.weather_telemetry):,}",
        "-35°C to +25°C, Snow cm, Avalanche Warning (GREEN/YELLOW/RED)",
    )
    summary_table.add_row(
        "Convoy & Airlift Missions",
        "transit_missions",
        f"{len(bundle.transit_missions):,}",
        "Stallion/Tatra/Chinook, Pass Blockages, 1.5x-5.0x Delays, Air-Drop Reroutes",
    )
    summary_table.add_row(
        "IoT Edge Sensor Streams",
        "iot_telemetry_streams",
        f"{len(bundle.iot_telemetry_streams):,}",
        "Monotonic RFID/Ultrasonic/Cold-Chain, EW Comms Blackouts, HMAC Tamper Flags",
    )

    total_rows = (
        len(bundle.nodes)
        + len(bundle.routes)
        + len(bundle.consumption_history)
        + len(bundle.weather_telemetry)
        + len(bundle.transit_missions)
        + len(bundle.iot_telemetry_streams)
    )
    summary_table.add_section()
    summary_table.add_row(
        "[bold]TOTAL DATA POINTS[/bold]",
        "[bold]ALL TABLES[/bold]",
        f"[bold green]{total_rows:,}[/bold green]",
        f"Generated in {gen_elapsed}s | DB Status: {db_report['db_status']}",
    )

    console.print(summary_table)

    if exported_paths:
        export_table = Table(
            title="Exported ML Training Datasets & Static Snapshots",
            header_style="bold green",
        )
        export_table.add_column("Artifact Key", style="cyan")
        export_table.add_column("File Path", style="white")
        for key, path_str in exported_paths.items():
            export_table.add_row(key, path_str)
        console.print(export_table)


if __name__ == "__main__":
    main()
