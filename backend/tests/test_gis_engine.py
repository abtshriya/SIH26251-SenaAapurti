"""
Unit and Integration Test Suite for Sena Aapurti GIS Tactical Engine.
Covers:
  - Spatial topology graph and multi-modal handoff solver
  - High-altitude rotary-wing service ceiling and cargo partitioning
  - Mountain pass weather and avalanche disruption registry
  - FastAPI endpoints returning RFC 7946 GeoJSON FeatureCollections
"""

import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.gis_engine.terrain_weather_feed import (
    TerrainWeatherFeed,
    PassStatus,
    HazardGrade,
    get_weather_feed,
)
from app.gis_engine.air_drop_allocator import (
    AirDropAllocator,
    FLEET_SPECIFICATIONS,
)
from app.gis_engine.spatial_router import (
    TacticalSpatialRouter,
    get_spatial_router,
)


@pytest.fixture(autouse=True)
def reset_theater_state():
    """Ensure every test runs from a pristine theater state."""
    wf = get_weather_feed()
    wf.reset_all_passes()
    yield
    wf.reset_all_passes()


def test_terrain_weather_feed_baseline():
    feed = get_weather_feed()
    passes = feed.get_all_passes()
    assert "khardung la" in passes
    assert "zoji la" in passes
    assert "chang la" in passes

    khardung = feed.get_pass("Khardung La")
    assert khardung is not None
    assert khardung.status == PassStatus.OPEN
    assert khardung.is_passable() is True


def test_terrain_weather_feed_blockage_and_reset():
    feed = get_weather_feed()
    updated = feed.set_pass_status("Khardung La", "BLOCKED", "AVALANCHE_WARNING_RED", 4)
    assert updated.status == PassStatus.BLOCKED
    assert updated.cause == "AVALANCHE_WARNING_RED"
    assert updated.avalanche_hazard_grade == HazardGrade.GRADE_4_HIGH
    assert updated.is_passable() is False

    # Verify reset
    feed.reset_all_passes()
    restored = feed.get_pass("Khardung La")
    assert restored.status == PassStatus.OPEN
    assert restored.is_passable() is True


def test_air_drop_allocator_dbo_ceiling_filter():
    allocator = AirDropAllocator()
    dbo_elevation = 5065  # DBO is at 5065m

    eligible, disqualified = allocator.get_eligible_fleet(dbo_elevation)

    # Chinook has 5000m ceiling, so it must be disqualified for DBO (5065m)
    assert "CH47_CHINOOK" not in eligible
    assert "Boeing CH-47F Chinook Heavy-Lift Tandem Rotor" in disqualified
    assert "MI17_V5" in eligible
    assert "ALH_DHRUV" in eligible

    # For 13,000 kg cargo, should partition into 3x Mi-17 (12,000 kg) and 1x Dhruv (1,000 kg)
    manifest = allocator.allocate(
        total_cargo_weight_kg=13000.0,
        destination_elevation_m=dbo_elevation,
        flight_distance_km=115.0,
        staging_helipad_id="NODE-BSP-DISKIT",
        drop_zone_id="NODE-FOB-DBO",
    )

    assert manifest.total_sorties_count == 4
    assert manifest.sorties_summary == {"MI17_V5": 3, "ALH_DHRUV": 1}
    assert manifest.allocated_cargo_weight_kg == 13000.0


def test_air_drop_allocator_lower_altitude_chinook_inclusion():
    allocator = AirDropAllocator()
    galwan_elevation = 4750  # Galwan is at 4750m

    eligible, disqualified = allocator.get_eligible_fleet(galwan_elevation)
    # Chinook has 5000m ceiling, so it IS eligible at 4750m
    assert "CH47_CHINOOK" in eligible
    assert len(disqualified) == 0


def test_spatial_router_all_surface_clear():
    router = get_spatial_router()
    plan = router.solve_route_plan(
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-FOB-DBO",
        cargo_weight_kg=13000.0,
    )

    assert plan["type"] == "FeatureCollection"
    props = plan["properties"]
    assert props["status"] == "ALL_SURFACE_PASSES_CLEAR"
    assert props["mode"] == "ALL_SURFACE_CONVOY"
    assert props["total_distance_km"] == 255.0
    assert props["total_lead_time_hrs"] == 12.5
    assert props["disruption_active"] is False

    # Features check
    features = plan["features"]
    line_features = [f for f in features if f["geometry"]["type"] == "LineString"]
    assert len(line_features) == 1
    assert line_features[0]["properties"]["mode"] == "GROUND_CONVOY"
    assert line_features[0]["properties"]["color"] == "#2563EB"


def test_spatial_router_khardung_la_blockage_multimodal_handoff():
    wf = get_weather_feed()
    wf.set_pass_status("Khardung La", "BLOCKED", "AVALANCHE_WARNING_RED", 4)

    router = get_spatial_router()
    plan = router.solve_route_plan(
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-FOB-DBO",
        cargo_weight_kg=13000.0,
    )

    assert plan["type"] == "FeatureCollection"
    props = plan["properties"]
    assert props["status"] == "MULTI_MODAL_AIR_HANDOFF_ACTIVATED"
    assert props["mode"] == "MULTI_MODAL_AIR_HANDOFF"
    assert props["handoff_staging_helipad_id"] == "NODE-BSP-DISKIT"
    assert props["disruption_active"] is True

    # Check Dual-Layer LineStrings
    features = plan["features"]
    line_features = [f for f in features if f["geometry"]["type"] == "LineString"]
    assert len(line_features) == 2

    # Leg 1: Ground convoy to Diskit via Wari La bypass
    leg1 = [f for f in line_features if f["properties"]["mode"] == "GROUND_CONVOY"][0]
    assert leg1["properties"]["color"] == "#2563EB"
    assert leg1["properties"]["distance_km"] == 148.0
    assert "Wari La" in leg1["properties"]["passes_traversed"]

    # Leg 2: Tactical air corridor Diskit to DBO
    leg2 = [f for f in line_features if f["properties"]["mode"] == "AIR_DROP_CORRIDOR"][0]
    assert leg2["properties"]["color"] == "#DC2626"
    assert leg2["properties"]["distance_km"] == 115.0
    assert leg2["properties"]["sorties_count"] == 4

    # Check Sortie Allocations: 3x Mi-17 and 1x Dhruv
    manifest = props["air_drop_manifest"]
    assert manifest["sorties_summary"] == {"MI17_V5": 3, "ALH_DHRUV": 1}

    # Check Staging Helipad Marker
    helipad_pts = [f for f in features if f["properties"].get("node_type") == "STAGING_HELIPAD"]
    assert len(helipad_pts) == 1
    assert helipad_pts[0]["properties"]["id"] == "NODE-BSP-DISKIT"
    assert helipad_pts[0]["properties"]["marker-color"] == "#EAB308"


def test_fastapi_route_plan_endpoint():
    client = TestClient(app)
    resp = client.get(
        "/api/v1/gis/route-plan",
        params={"origin_id": "NODE-DEPOT-LEH", "destination_id": "NODE-FOB-DBO", "cargo_weight_kg": 13000.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert data["properties"]["mode"] == "ALL_SURFACE_CONVOY"


def test_fastapi_simulate_blockage_endpoint():
    client = TestClient(app)
    resp = client.post(
        "/api/v1/gis/simulate-blockage",
        json={
            "pass_name": "Khardung La",
            "status": "BLOCKED",
            "cause": "AVALANCHE_WARNING_RED",
            "origin_id": "NODE-DEPOT-LEH",
            "destination_id": "NODE-FOB-DBO",
            "cargo_weight_kg": 13000.0,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert data["properties"]["mode"] == "MULTI_MODAL_AIR_HANDOFF"
    assert data["properties"]["handoff_staging_helipad_id"] == "NODE-BSP-DISKIT"
    assert data["properties"]["air_drop_manifest"]["sorties_summary"] == {"MI17_V5": 3, "ALH_DHRUV": 1}
    assert "simulation_receipt" in data


def test_fastapi_passes_and_fleet_endpoints():
    client = TestClient(app)

    # Passes list
    p_resp = client.get("/api/v1/gis/passes")
    assert p_resp.status_code == 200
    passes = p_resp.json()
    assert len(passes) >= 6

    # Fleet specs
    f_resp = client.get("/api/v1/gis/fleet-specs")
    assert f_resp.status_code == 200
    fleet = f_resp.json()
    assert "ALH_DHRUV" in fleet
    assert "MI17_V5" in fleet
    assert "CH47_CHINOOK" in fleet

    # Topology nodes
    t_resp = client.get("/api/v1/gis/topology-nodes")
    assert t_resp.status_code == 200
    nodes = t_resp.json()
    assert len(nodes) >= 10
