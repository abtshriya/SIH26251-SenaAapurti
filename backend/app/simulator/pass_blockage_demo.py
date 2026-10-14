"""
Sena Aapurti - SIH Jury Live Demonstration Script
Feature: 'Silent Pass' Dynamic Rerouting & Multi-Modal Tactical Air-Drop Handoff Engine.

CLI Demonstration Workflow:
  Step 1: Queries normal surface transit from Leh to DBO (Status: All Surface Passes Clear).
  Step 2: Injects a live Avalanche/Pass Blockage alert on Khardung La (Status: BLOCKED).
  Step 3: Shows backend catching disruption, calculating staging helipad at Diskit,
          partitioning cargo into 3x Mi-17 and 1x Dhruv air-drop sorties,
          and outputting the dual-layer Leaflet-compatible GeoJSON transit plan.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict

# Ensure backend root is on sys.path regardless of working directory
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import httpx
from rich.align import Align
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

# In-process engine fallbacks for zero crash tolerance during live jury evaluation
from app.gis_engine.spatial_router import get_spatial_router
from app.gis_engine.terrain_weather_feed import get_weather_feed

console = Console()


def render_banner() -> None:
    title_text = Text()
    title_text.append("SENA AAPURTI ", style="bold gold1")
    title_text.append("| ZERO-TRUST TACTICAL LOGISTICS DECISION SUPPORT ENGINE\n", style="bold white")
    title_text.append("SMART INDIA HACKATHON 2026 - PROBLEM STATEMENT SIH26251\n", style="bold cyan")
    title_text.append(
        "Demonstration: 'Silent Pass' Dynamic Rerouting & Multi-Modal Air-Drop Handoff Engine",
        style="italic dim yellow",
    )

    console.print(
        Panel(
            Align.center(title_text),
            border_style="bright_blue",
            subtitle="[bold red]NORTHERN THEATER COMMAND | 14 CORPS LEH SECTOR[/bold red]",
            padding=(1, 2),
        )
    )


def execute_step_1_baseline(
    client: httpx.Client,
    base_url: str,
    origin_id: str,
    dest_id: str,
    cargo_kg: float,
) -> Dict[str, Any]:
    console.print(Rule(title="[bold green]STEP 1: BASELINE SURFACE TRANSIT PLAN (ALL PASSES CLEAR)[/bold green]", style="green"))
    console.print(
        f"[cyan]Origin:[/cyan] [bold white]{origin_id}[/bold white] | "
        f"[cyan]Destination:[/cyan] [bold white]{dest_id}[/bold white] | "
        f"[cyan]Convoy Manifest Weight:[/cyan] [bold yellow]{cargo_kg:,.0f} kg[/bold yellow]"
    )

    plan_data: Dict[str, Any] = {}
    is_live_api = False

    try:
        # Reset passes first
        client.post(f"{base_url}/api/v1/gis/reset-passes", timeout=2.0)
        # Fetch normal route plan
        resp = client.get(
            f"{base_url}/api/v1/gis/route-plan",
            params={"origin_id": origin_id, "destination_id": dest_id, "cargo_weight_kg": cargo_kg},
            timeout=3.0,
        )
        if resp.status_code == 200:
            plan_data = resp.json()
            is_live_api = True
    except Exception:
        # Fallback to direct in-process GIS engine
        pass

    if not is_live_api:
        weather_feed = get_weather_feed()
        weather_feed.reset_all_passes()
        router = get_spatial_router()
        plan_data = router.solve_route_plan(origin_id, dest_id, cargo_kg)

    props = plan_data.get("properties", {})
    features = plan_data.get("features", [])

    table = Table(title="Tactical Convoy Surface Route Assessment", border_style="cyan")
    table.add_column("Operational Parameter", style="bold white", width=32)
    table.add_column("Assigned Value / Status", style="green", width=48)

    table.add_row("Plan Status", f"[bold green]{props.get('status')}[/bold green]")
    table.add_row("Transport Modality", f"[bold blue]{props.get('mode')}[/bold blue]")
    table.add_row("Total Surface Distance", f"{props.get('total_distance_km')} km")
    table.add_row("Estimated Surface Lead Time", f"{props.get('total_lead_time_hrs')} Hours")
    table.add_row("Disruption Active", f"{props.get('disruption_active')}")
    table.add_row("GeoJSON Features Generated", f"{len(features)} Features (Road LineString + Tactical Nodes)")
    table.add_row("API Gateway Link", "[bold green]LIVE REST API (HTTP 200 OK)[/bold green]" if is_live_api else "[bold yellow]IN-PROCESS GIS ENGINE (STANDALONE RESILIENT)[/bold yellow]")

    console.print(table)
    console.print(f"[dim italic]Tactical Advisory: {props.get('tactical_advisory')}[/dim italic]\n")
    return plan_data


def execute_step_2_inject_blockage(
    client: httpx.Client,
    base_url: str,
    pass_name: str,
    hazard_cause: str,
) -> Dict[str, Any]:
    console.print(
        Rule(
            title=f"[bold red]STEP 2: INGESTING SEVERE WEATHER & AVALANCHE DISRUPTION ALERT ({pass_name})[/bold red]",
            style="red",
        )
    )

    alert_panel_content = Text()
    alert_panel_content.append("[!] URGENT TACTICAL WEATHER INTERCEPT - SASE DRDO & BRO HIMANK\n", style="bold red")
    alert_panel_content.append(f"Target Mountain Pass: {pass_name} (Summit 5,359m AMSL)\n", style="bold white")
    alert_panel_content.append("Clearance Status: BLOCKED / IMPASSABLE TO ALL CONVOYS\n", style="bold red reverse")
    alert_panel_content.append(f"Disruption Cause: {hazard_cause}\n", style="bold yellow")
    alert_panel_content.append("Meteorological Telemetry: Temp -24.5C | Wind 78 km/h | Snowfall 5.2 cm/hr | Vis <250m\n", style="white")
    alert_panel_content.append("Direct surface highway corridor cut off. Ground convoy halted south of summit.\n", style="dim white")

    console.print(Panel(alert_panel_content, border_style="red", title="[bold]SASE AVALANCHE HAZARD GRADE 4 (HIGH)[/bold]"))

    payload = {
        "pass_name": pass_name,
        "status": "BLOCKED",
        "cause": hazard_cause,
        "hazard_grade": 4,
        "origin_id": "NODE-DEPOT-LEH",
        "destination_id": "NODE-FOB-DBO",
        "cargo_weight_kg": 13000.0,
    }

    rerouted_plan: Dict[str, Any] = {}
    is_live_api = False

    try:
        resp = client.post(f"{base_url}/api/v1/gis/simulate-blockage", json=payload, timeout=3.0)
        if resp.status_code == 200:
            rerouted_plan = resp.json()
            is_live_api = True
    except Exception:
        pass

    if not is_live_api:
        weather_feed = get_weather_feed()
        weather_feed.set_pass_status(pass_name, "BLOCKED", hazard_cause, 4)
        router = get_spatial_router()
        rerouted_plan = router.solve_route_plan("NODE-DEPOT-LEH", "NODE-FOB-DBO", 13000.0)

    console.print(f"[bold green][OK] Blockage Ingested & Processed Successfully[/bold green] (Mode: {'FastAPI REST' if is_live_api else 'Local In-Process'})\n")
    return rerouted_plan


def execute_step_3_multimodal_handoff(rerouted_plan: Dict[str, Any]) -> None:
    console.print(
        Rule(
            title="[bold yellow]STEP 3: 'SILENT PASS' DYNAMIC REROUTING & MULTI-MODAL AIR-DROP EXECUTION[/bold yellow]",
            style="yellow",
        )
    )

    props = rerouted_plan.get("properties", {})
    manifest = props.get("air_drop_manifest", {})
    leg1 = props.get("leg1_surface", {})
    leg2 = props.get("leg2_air_corridor", {})
    features = rerouted_plan.get("features", [])

    # Table 1: Dual-Layer Transit Plan Architecture
    layer_table = Table(title="Dual-Layer Multi-Modal Transit Geometry", border_style="yellow")
    layer_table.add_column("Transit Leg", style="bold white", width=16)
    layer_table.add_column("Modality", style="bold cyan", width=22)
    layer_table.add_column("Tactical Segment Corridor", style="white", width=36)
    layer_table.add_column("Distance", style="green", width=12)
    layer_table.add_column("Lead Time", style="green", width=12)
    layer_table.add_column("Leaflet Rendering", style="magenta", width=20)

    layer_table.add_row(
        "Leg 1 (Surface)",
        "[blue]GROUND_CONVOY[/blue]",
        f"{leg1.get('origin')} -> {leg1.get('destination')} (Bypass: {', '.join(leg1.get('passes_traversed', []))})",
        f"{leg1.get('distance_km')} km",
        f"{leg1.get('transit_time_hrs')} hrs",
        "[blue]Solid Line (#2563EB)[/blue]",
    )
    layer_table.add_row(
        "Handoff Point",
        "[yellow]STAGING_HELIPAD[/yellow]",
        f"Multi-Modal Handoff Point: {props.get('handoff_staging_helipad_name')}",
        "Elevation",
        "3,144m AMSL",
        "[yellow]Gold Heliport Pin[/yellow]",
    )
    layer_table.add_row(
        "Leg 2 (Air)",
        "[red]AIR_DROP_CORRIDOR[/red]",
        f"{leg2.get('origin')} -> {leg2.get('destination')} ({leg2.get('corridor_name')})",
        f"{leg2.get('distance_km')} km",
        f"{leg2.get('flight_time_hrs')} hrs",
        "[red]Dashed Line (#DC2626)[/red]",
    )

    console.print(layer_table)

    # Table 2: Aircraft Service Ceiling & Allocation Logic
    ceiling_table = Table(
        title=f"Rotary-Wing Service Ceiling Filter (Target Drop Zone: {manifest.get('drop_zone_id')} @ {manifest.get('destination_elevation_m')}m AMSL)",
        border_style="magenta",
    )
    ceiling_table.add_column("Airframe Model", style="bold white", width=22)
    ceiling_table.add_column("Payload Cap", style="cyan", width=12)
    ceiling_table.add_column("Service Ceiling", style="yellow", width=16)
    ceiling_table.add_column("DZ Qualification Status", style="white", width=40)

    ceiling_table.add_row(
        "Boeing CH-47F Chinook",
        "9,500 kg",
        "5,000m AMSL",
        "[bold red][DISQUALIFIED][/bold red] (5000m Ceiling < 5065m DZ Elevation - Vortex Ring Hazard)",
    )
    ceiling_table.add_row(
        "Mil Mi-17V5 Hip",
        "4,000 kg",
        "6,000m AMSL",
        "[bold green][QUALIFIED - HEAVY LIFT][/bold green] (6000m Ceiling >= 5065m DZ)",
    )
    ceiling_table.add_row(
        "HAL ALH Dhruv Mk-III",
        "1,000 kg",
        "6,500m AMSL",
        "[bold green][QUALIFIED - HIGH AGILE][/bold green] (6500m Ceiling >= 5065m DZ - Cold Chain)",
    )

    console.print(ceiling_table)

    # Table 3: Itemized Sortie Manifest
    sortie_table = Table(
        title=f"Itemized Rotary-Wing Dispatch Manifest ({manifest.get('total_sorties_count')} Total Sorties | {manifest.get('allocated_cargo_weight_kg'):,.0f} kg Total Cargo)",
        border_style="green",
    )
    sortie_table.add_column("Sortie ID", style="bold cyan", width=18)
    sortie_table.add_column("Airframe", style="bold white", width=14)
    sortie_table.add_column("Callsign", style="magenta", width=12)
    sortie_table.add_column("Payload Allocated", style="green", width=18)
    sortie_table.add_column("Cargo Breakdown", style="dim white", width=34)
    sortie_table.add_column("Air Delivery Mode", style="yellow", width=22)

    for s in manifest.get("sorties", []):
        items_str = ", ".join(f"{it['name'][:22]} ({it['weight_kg']}kg)" for it in s.get("items_breakdown", []))
        sortie_table.add_row(
            s.get("sortie_id"),
            s.get("aircraft_type"),
            s.get("callsign"),
            f"{s.get('allocated_payload_kg')} kg ({s.get('payload_utilization_pct')}%)",
            items_str or "Class V Munitions & POL Bladders",
            s.get("delivery_method"),
        )

    console.print(sortie_table)

    # Summary Panel
    sorties_summary = manifest.get("sorties_summary", {})
    summary_str = ", ".join(f"{count}x {key}" for key, count in sorties_summary.items())

    tactical_summary_text = Text()
    tactical_summary_text.append("TACTICAL AIR-DROP SUMMARY: ", style="bold gold1")
    tactical_summary_text.append(f"Dispatched {summary_str} sorties.\n", style="bold green")
    tactical_summary_text.append(f"Total Fuel Burn: {manifest.get('total_fuel_burn_liters')} Litres | ", style="white")
    tactical_summary_text.append(f"Total Flight Time: {manifest.get('total_estimated_flight_hours')} Flight Hours\n", style="white")
    tactical_summary_text.append(f"GeoJSON Layers: {len(features)} Features rendered in Leaflet map.\n", style="cyan")
    tactical_summary_text.append(props.get("tactical_advisory", ""), style="italic yellow")

    console.print(Panel(tactical_summary_text, border_style="gold1", title="[bold]MISSION DISPATCH AUTHORIZATION[/bold]"))

    # GeoJSON Feature Snippet Inspection
    console.print("[bold cyan]Standard GeoJSON FeatureCollection Preview (Consumable by Leaflet):[/bold cyan]")
    geojson_preview = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": f.get("type"),
                "geometry": {"type": f.get("geometry", {}).get("type"), "coordinates_count": len(f.get("geometry", {}).get("coordinates", []))},
                "properties": {
                    "id": f.get("properties", {}).get("id"),
                    "name": f.get("properties", {}).get("name"),
                    "mode": f.get("properties", {}).get("mode"),
                    "color": f.get("properties", {}).get("color"),
                },
            }
            for f in features[:4]
        ],
        "properties": {
            "plan_id": props.get("plan_id"),
            "mode": props.get("mode"),
            "handoff_staging_helipad": props.get("handoff_staging_helipad_name"),
            "sorties_allocated": summary_str,
        },
    }
    console.print_json(json.dumps(geojson_preview, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Sena Aapurti SIH Jury Pass Blockage Demo CLI")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Base URL of FastAPI backend")
    parser.add_argument("--origin", default="NODE-DEPOT-LEH", help="Origin depot node")
    parser.add_argument("--destination", default="NODE-FOB-DBO", help="Destination forward outpost")
    parser.add_argument("--cargo-weight", type=float, default=13000.0, help="Cargo weight in kg")
    parser.add_argument("--pass-name", default="Khardung La", help="Mountain pass to disrupt")
    parser.add_argument("--cause", default="AVALANCHE_WARNING_RED", help="Disruption cause")

    args = parser.parse_args()

    render_banner()

    with httpx.Client() as client:
        # Step 1: Normal surface transit
        execute_step_1_baseline(
            client=client,
            base_url=args.api_url,
            origin_id=args.origin,
            dest_id=args.destination,
            cargo_kg=args.cargo_weight,
        )

        time.sleep(1.0)

        # Step 2: Ingest pass blockage
        rerouted_plan = execute_step_2_inject_blockage(
            client=client,
            base_url=args.api_url,
            pass_name=args.pass_name,
            hazard_cause=args.cause,
        )

        time.sleep(1.0)

        # Step 3: Multi-modal handoff visualization
        execute_step_3_multimodal_handoff(rerouted_plan)


if __name__ == "__main__":
    main()
