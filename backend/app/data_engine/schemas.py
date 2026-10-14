"""
Pydantic & SQLAlchemy Core Schemas for Sena Aapurti Multi-Stream Data Engine.
Covers:
  - `nodes`: Spatial logistics nodes with Point(4326) geometry
  - `routes`: Supply corridors with LineString(4326) geometry & seasonal pass metadata
  - `consumption_history`: Time-series consumption across echelons & operational tempos
  - `weather_telemetry`: Temperature, snow accumulation, and avalanche risk indices
  - `transit_missions`: Convoy & rotary airlift dispatches with JSONB cargo manifests
  - `iot_telemetry_streams`: Edge sensor logs (RFID, ultrasonic POL, cold-chain, EW jamming/tamper flags)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    MetaData,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB

metadata = MetaData()

# -----------------------------------------------------------------------------
# SQLAlchemy Core Table Definitions (Compatible with PostgreSQL / PostGIS)
# Note: `geom` columns are managed via PostGIS DDL in `ensure_postgis_schema()`
# -----------------------------------------------------------------------------
nodes_table = Table(
    "nodes",
    metadata,
    Column("node_id", String(48), primary_key=True),
    Column("name", String(160), nullable=False),
    Column("echelon", String(64), nullable=False),
    Column("sector", String(64), nullable=False),
    Column("elevation_m", Integer, nullable=False),
    Column("lat", Float, nullable=False),
    Column("lon", Float, nullable=False),
    Column("storage_capacity_tons", Float, nullable=False),
    Column("baseline_troop_strength", Integer, nullable=False, default=1000),
)

routes_table = Table(
    "routes",
    metadata,
    Column("route_id", String(48), primary_key=True),
    Column("origin_id", String(48), nullable=False),
    Column("destination_id", String(48), nullable=False),
    Column("distance_km", Float, nullable=False),
    Column("terrain_type", String(64), nullable=False),
    Column("seasonal_pass_name", String(96), nullable=True),
    Column("default_lead_time_hrs", Float, nullable=False),
)

consumption_history_table = Table(
    "consumption_history",
    metadata,
    Column("record_id", String(64), primary_key=True),
    Column("timestamp", DateTime(timezone=True), nullable=False, index=True),
    Column("node_id", String(48), nullable=False, index=True),
    Column("sku", String(48), nullable=False, index=True),
    Column("units_consumed", Integer, nullable=False),
    Column("active_troop_count", Integer, nullable=False),
    Column("operational_tempo", String(32), nullable=False),
    Column("is_winter_stocking_surge", Boolean, nullable=False, default=False),
    Column("is_forecast_window", Boolean, nullable=False, default=False),
)

weather_telemetry_table = Table(
    "weather_telemetry",
    metadata,
    Column("log_id", String(64), primary_key=True),
    Column("timestamp", DateTime(timezone=True), nullable=False, index=True),
    Column("node_id", String(48), nullable=False, index=True),
    Column("temperature_c", Float, nullable=False),
    Column("snow_accumulation_cm", Float, nullable=False),
    Column("wind_speed_kmh", Float, nullable=False),
    Column("avalanche_warning_level", String(16), nullable=False),
    Column("avalanche_risk_index", Float, nullable=False),
    Column("landslide_risk_index", Float, nullable=False),
)

transit_missions_table = Table(
    "transit_missions",
    metadata,
    Column("mission_id", String(64), primary_key=True),
    Column("route_id", String(48), nullable=False),
    Column("origin_id", String(48), nullable=False, index=True),
    Column("destination_id", String(48), nullable=False, index=True),
    Column("vehicle_type", String(48), nullable=False),
    Column("cargo_manifest", JSONB, nullable=False),
    Column("route_status", String(32), nullable=False),
    Column("delay_multiplier", Float, nullable=False, default=1.0),
    Column("departure_time", DateTime(timezone=True), nullable=False),
    Column("eta", DateTime(timezone=True), nullable=False),
)

iot_telemetry_streams_table = Table(
    "iot_telemetry_streams",
    metadata,
    Column("telemetry_id", String(64), primary_key=True),
    Column("timestamp", DateTime(timezone=True), nullable=False, index=True),
    Column("device_id", String(64), nullable=False, index=True),
    Column("node_id", String(48), nullable=False, index=True),
    Column("sku", String(48), nullable=False),
    Column("sensor_modality", String(48), nullable=False),
    Column("monotonic_seq_id", Integer, nullable=False),
    Column("reported_quantity", Float, nullable=False),
    Column("weight_discrepancy_kg", Float, nullable=False),
    Column("ambient_temp_c", Float, nullable=False),
    Column("transit_vibration_g", Float, nullable=False),
    Column("comms_blackout_flag", Boolean, nullable=False),
    Column("hmac_tamper_flag", Boolean, nullable=False),
    Column("hmac_signature", Text, nullable=False),
)


# -----------------------------------------------------------------------------
# Pydantic v2 Schemas for Validation & Serialization
# -----------------------------------------------------------------------------
class NodeRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    node_id: str
    name: str
    echelon: str
    sector: str
    elevation_m: int
    lat: float
    lon: float
    storage_capacity_tons: float
    baseline_troop_strength: int
    wkt_point: str = Field(..., description="EWKT representation: SRID=4326;POINT(lon lat)")


class RouteRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    route_id: str
    origin_id: str
    destination_id: str
    distance_km: float
    terrain_type: str
    seasonal_pass_name: Optional[str] = None
    default_lead_time_hrs: float
    wkt_linestring: str = Field(
        ..., description="EWKT representation: SRID=4326;LINESTRING(...)"
    )


class ConsumptionRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    record_id: str
    timestamp: datetime
    node_id: str
    sku: str
    units_consumed: int
    active_troop_count: int
    operational_tempo: str  # BASELINE | WINTER_STOCKING | TACTICAL_ALERT_SURGE
    is_winter_stocking_surge: bool
    is_forecast_window: bool


class WeatherTelemetryRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    log_id: str
    timestamp: datetime
    node_id: str
    temperature_c: float
    snow_accumulation_cm: float
    wind_speed_kmh: float
    avalanche_warning_level: str  # GREEN | YELLOW | RED
    avalanche_risk_index: float = Field(..., ge=0.0, le=1.0)
    landslide_risk_index: float = Field(..., ge=0.0, le=1.0)


class TransitMissionRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    mission_id: str
    route_id: str
    origin_id: str
    destination_id: str
    vehicle_type: str
    cargo_manifest: Dict[str, Any]
    route_status: str  # OPEN | DEGRADED_SNOW | BLOCKED | REROUTED_AIR_DROP
    delay_multiplier: float
    departure_time: datetime
    eta: datetime


class IoTTelemetryStreamRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    telemetry_id: str
    timestamp: datetime
    device_id: str
    node_id: str
    sku: str
    sensor_modality: str  # RFID_GATE | ULTRASONIC_POL | SCALE_LOADCELL | COLD_CHAIN_PROBE
    monotonic_seq_id: int
    reported_quantity: float
    weight_discrepancy_kg: float
    ambient_temp_c: float
    transit_vibration_g: float
    comms_blackout_flag: bool
    hmac_tamper_flag: bool
    hmac_signature: str


class GeneratedDatasetBundle(BaseModel):
    """Container holding all generated synthetic tables & metadata."""

    seed: int
    scale: str
    historical_days: int
    forecast_days: int
    nodes: List[Dict[str, Any]]
    routes: List[Dict[str, Any]]
    consumption_history: List[Dict[str, Any]]
    weather_telemetry: List[Dict[str, Any]]
    transit_missions: List[Dict[str, Any]]
    iot_telemetry_streams: List[Dict[str, Any]]
