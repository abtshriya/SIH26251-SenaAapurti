"""
FastAPI Routes for Dynamic Multi-Modal Tactical Routing & Rotary Air-Drop Handoff Engine.
Exposes standard GeoJSON FeatureCollections consumable by Leaflet map components and tactical dashboards.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.gis_engine.air_drop_allocator import FLEET_SPECIFICATIONS, RotaryAircraftSpec
from app.gis_engine.spatial_router import get_spatial_router
from app.gis_engine.terrain_weather_feed import PassCondition, PassStatus, get_weather_feed

logger = logging.getLogger("sena_aapurti.api.multimodal")

router = APIRouter(prefix="/gis", tags=["Multi-Modal Tactical GIS Engine"])


class BlockageSimulationRequest(BaseModel):
    """Payload to trigger an active pass blockage simulation or weather hazard alert."""

    pass_name: str = Field(..., description="High-altitude pass identifier (e.g. Khardung La, Zoji La, Chang La)")
    status: str = Field(default="BLOCKED", description="Operational clearance status: OPEN, RESTRICTED_CHAINS, BLOCKED")
    cause: str = Field(
        default="AVALANCHE_WARNING_RED",
        description="Hazard notification (e.g., AVALANCHE_WARNING_RED, BLIZZARD_WHITEOUT, ROCKFALL)",
    )
    hazard_grade: Optional[int] = Field(default=4, ge=1, le=5, description="SASE Avalanche Hazard Grade (1-5)")
    origin_id: Optional[str] = Field(default="NODE-DEPOT-LEH", description="Origin tactical logistics depot")
    destination_id: Optional[str] = Field(default="NODE-FOB-DBO", description="Destination forward outpost/DZ")
    cargo_weight_kg: Optional[float] = Field(default=13000.0, description="Convoy gross cargo weight in kg")


@router.get("/route-plan", status_code=status.HTTP_200_OK)
def get_tactical_route_plan(
    origin_id: str = Query(
        default="NODE-DEPOT-LEH",
        description="Origin depot node (e.g., NODE-DEPOT-LEH, NODE-HQ-UDHAMPUR, NODE-DEPOT-SRINAGAR)",
    ),
    destination_id: str = Query(
        default="NODE-FOB-DBO",
        description="Destination forward outpost (e.g., NODE-FOB-DBO, NODE-FOB-SIACHEN, NODE-FOB-GALWAN)",
    ),
    cargo_weight_kg: float = Query(
        default=13000.0,
        ge=100.0,
        le=500000.0,
        description="Convoy cargo weight in kilograms",
    ),
) -> Dict[str, Any]:
    """
    Computes optimal tactical transit plan:
    - If all mountain passes are clear, generates least-cost ground route LineString.
    - If any critical pass is blocked, computes dynamic multi-modal handoff to closest forward staging helipad,
      generates rotary air corridor flight waypoints, and partitions cargo into optimal air sorties.
    - Returns RFC 7946 GeoJSON FeatureCollection directly consumable by Leaflet map layers.
    """
    router_engine = get_spatial_router()
    try:
        plan = router_engine.solve_route_plan(
            origin_id=origin_id,
            destination_id=destination_id,
            cargo_weight_kg=cargo_weight_kg,
        )
        return plan
    except ValueError as e:
        logger.error("Routing resolution error: %s", str(e))
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in spatial route solver: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tactical GIS solver failure: {str(e)}",
        )


@router.post("/simulate-blockage", status_code=status.HTTP_200_OK)
def simulate_pass_blockage(payload: BlockageSimulationRequest) -> Dict[str, Any]:
    """
    Simulates a sudden mountain pass disruption (e.g., Khardung La avalanche warning red):
    1. Ingests pass disruption event into real-time weather & pass registry.
    2. Dynamically re-computes the tactical route.
    3. Returns the multi-modal handoff plan and partitioned air-drop manifest as GeoJSON.
    """
    weather_feed = get_weather_feed()
    router_engine = get_spatial_router()

    # Update pass condition
    updated_condition = weather_feed.set_pass_status(
        pass_name=payload.pass_name,
        status=payload.status,
        cause=payload.cause,
        hazard_grade=payload.hazard_grade,
    )

    origin_id = payload.origin_id or "NODE-DEPOT-LEH"
    destination_id = payload.destination_id or "NODE-FOB-DBO"
    cargo_weight_kg = payload.cargo_weight_kg or 13000.0

    try:
        plan = router_engine.solve_route_plan(
            origin_id=origin_id,
            destination_id=destination_id,
            cargo_weight_kg=cargo_weight_kg,
        )
        # Augment with simulation trigger receipt
        plan["simulation_receipt"] = {
            "target_pass": updated_condition.pass_name,
            "status": updated_condition.status.value,
            "cause": updated_condition.cause,
            "hazard_grade": updated_condition.avalanche_hazard_grade.value,
            "updated_at": updated_condition.last_updated,
        }
        return plan
    except Exception as e:
        logger.exception("Failed to recompute route following blockage simulation: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Blockage simulation recompute failed: {str(e)}",
        )


@router.post("/reset-passes", status_code=status.HTTP_200_OK)
def reset_all_mountain_passes() -> Dict[str, Any]:
    """
    Restores all northern theater mountain passes to default OPEN operational condition.
    """
    weather_feed = get_weather_feed()
    reset_list = weather_feed.reset_all_passes()
    return {
        "status": "SUCCESS",
        "message": f"Successfully reset {len(reset_list)} tactical mountain passes to OPEN clearance.",
        "passes": [p.model_dump() for p in reset_list],
    }


@router.get("/passes", status_code=status.HTTP_200_OK)
def list_mountain_passes() -> List[Dict[str, Any]]:
    """
    Returns real-time clearance, meteorological conditions, and avalanche hazard grades
    for all monitored high-altitude passes.
    """
    weather_feed = get_weather_feed()
    passes = weather_feed.get_all_passes()
    return [p.model_dump() for p in passes.values()]


@router.get("/fleet-specs", status_code=status.HTTP_200_OK)
def get_fleet_specifications() -> Dict[str, RotaryAircraftSpec]:
    """
    Returns rotary-wing tactical airframe specifications, payload capacities,
    and high-altitude service ceilings.
    """
    return FLEET_SPECIFICATIONS


@router.get("/topology-nodes", status_code=status.HTTP_200_OK)
def get_topology_nodes() -> List[Dict[str, Any]]:
    """
    Returns all registered Northern Sector logistics depots, forward outposts,
    and staging helipads with coordinates.
    """
    router_engine = get_spatial_router()
    return [node.model_dump() for node in router_engine.nodes_registry.values()]
