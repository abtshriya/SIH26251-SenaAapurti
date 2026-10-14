"""
Sena Aapurti — Tactical Mesh Resilience & Blackout Sync API Routes
File: backend/app/api/routes_resilience.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Endpoints:
- POST /api/v1/resilience/sync-batch        : Idempotent batch sync for buffered offline events
- GET  /api/v1/resilience/node-health       : Echelon connectivity matrix & freshness indicators
- POST /api/v1/resilience/simulate-blackout : Simulates communications cutoff for testing
- GET  /api/v1/resilience/node-stock        : Direct stock query for validation
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api.routes_inventory import memory_store
from app.mesh_engine.mesh_reconciler import (
    MeshSyncResult,
    get_mesh_reconciler,
)
from app.mesh_engine.node_health_monitor import get_node_health_monitor
from app.mesh_engine.offline_buffer import MeshSyncBatch

logger = logging.getLogger("sena_aapurti.mesh.routes")

router = APIRouter(tags=["Tactical Mesh Resilience & Blackout Sync"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
class BlackoutSimulationRequest(BaseModel):
    node_id: str = Field(..., examples=["DEPOT-KGL"], description="Outpost or depot ID")
    hours_ago: float = Field(default=72.0, ge=0.0, description="Hours of simulated comms silence")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post(
    "/resilience/sync-batch",
    response_model=MeshSyncResult,
    status_code=status.HTTP_200_OK,
    summary="Idempotent Batch Sync for Buffered Offline Events",
    description=(
        "Reconciles a bundle of offline logistics transactions generated during a comms blackout. "
        "Deduplicates replayed packets, executes atomic stock transition, and generates audit ledger proofs."
    ),
)
def sync_offline_batch(batch: MeshSyncBatch) -> MeshSyncResult:
    reconciler = get_mesh_reconciler()
    result = reconciler.reconcile_batch(batch)
    return result


@router.get(
    "/resilience/node-health",
    summary="Echelon Connectivity Matrix & Freshness Badges",
    description="Returns real-time connectivity status across military units in theater matching frontend dashboard.",
)
def get_node_health_status() -> Dict[str, Any]:
    monitor = get_node_health_monitor()
    return monitor.get_echelon_connectivity_status()


@router.post(
    "/resilience/simulate-blackout",
    summary="Simulate Comms Blackout",
    description="Artificially rolls back an outpost's last synced timestamp to simulate a prolonged EW blackout.",
)
def simulate_blackout(body: BlackoutSimulationRequest) -> Dict[str, Any]:
    monitor = get_node_health_monitor()
    rolled_back_ts = monitor.simulate_node_blackout(body.node_id, hours_ago=body.hours_ago)
    status_info = monitor.classify_status(rolled_back_ts)
    return {
        "status": "BLACKOUT_SIMULATION_ACTIVE",
        "node_id": body.node_id,
        "simulated_silence_hours": body.hours_ago,
        "last_synced_at": rolled_back_ts.isoformat(),
        "health_classification": status_info,
    }


@router.get(
    "/resilience/node-stock",
    summary="Query Node Stock Level",
    description="Queries current stock level for a node and SKU for live demo assertions.",
)
def get_node_stock(
    node_id: str = Query(..., examples=["DEPOT-KGL"]),
    sku: str = Query(default="DIESEL-WINTER-GRADE"),
) -> Dict[str, Any]:
    # Check in memory_store
    mapped_unit = "UNIT-FOB-BRAVO" if node_id == "DEPOT-KGL" else node_id
    mapped_sku = "FUEL-JP8-ARC" if "DIESEL" in sku or "FUEL" in sku else sku

    key = (mapped_unit, mapped_sku)
    entry = memory_store.stocks.get(key)
    current_qty = entry["current_quantity"] if entry else 5000

    return {
        "node_id": node_id,
        "sku": sku,
        "current_quantity": current_qty,
        "unit_of_measure": "LITERS" if "DIESEL" in sku or "FUEL" in sku else "UNITS",
    }
