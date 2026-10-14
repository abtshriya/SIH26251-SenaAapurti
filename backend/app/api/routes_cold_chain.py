"""
Sena Aapurti — Cold-Chain Medical Telemetry & Auto-Quarantine API Routes
File: backend/app/api/routes_cold_chain.py
Classification: RESTRICTED // DEFENSE MEDICAL OPERATIONS (SIH26251)

Endpoints:
- POST /api/v1/cold-chain/telemetry-log                 : Ingests container thermal/kinetic telemetry
- GET  /api/v1/cold-chain/container-status/{container_id} : Returns real-time thermal curves & diagnostics
- GET  /api/v1/cold-chain/quarantined-items             : Returns all compromised biological/medical stores
- GET  /api/v1/cold-chain/profiles                      : Returns thermal & shock specifications per medical SKU
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Path, status

from app.cold_chain_engine.cold_chain_service import (
    ColdChainTelemetryInput,
    get_cold_chain_service,
)
from app.cold_chain_engine.degradation_model import (
    SKU_COLD_CHAIN_PROFILES,
)
from app.cold_chain_engine.quarantine_manager import (
    get_quarantine_manager,
)

logger = logging.getLogger("sena_aapurti.cold_chain.routes")

router = APIRouter(tags=["Medical Cold-Chain & Kinetic Degradation Engine"])


@router.post(
    "/cold-chain/telemetry-log",
    status_code=status.HTTP_200_OK,
    summary="Ingest Medical Container Telemetry & Evaluate Degradation",
    description=(
        "Ingests real-time container thermal (°C), kinetic (G-force), and heater telemetry. "
        "Calculates cumulative thermal breach degree-hours and Arrhenius degradation. "
        "Autonomously triggers medical quarantine and replacement dispatch if viability falls below safe thresholds."
    ),
)
def ingest_medical_telemetry(payload: ColdChainTelemetryInput) -> Dict[str, Any]:
    service = get_cold_chain_service()
    result = service.ingest_telemetry(payload)
    return result


@router.get(
    "/cold-chain/container-status/{container_id}",
    summary="Query Real-Time Container Thermal Curve",
    description="Returns full temperature curve, battery levels, and telemetry diagnostics for a mobile medical container.",
)
def get_container_status(
    container_id: str = Path(..., description="Tactical medical container ID"),
) -> Dict[str, Any]:
    service = get_cold_chain_service()
    status_data = service.get_container_status(container_id)
    if status_data.get("status") == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medical container '{container_id}' has not emitted active telemetry.",
        )
    return status_data


@router.get(
    "/cold-chain/quarantined-items",
    summary="List Quarantined Compromised Medical Stores",
    description="Returns all Class VIII biological supplies removed from forward triage availability due to thermal or kinetic breaches.",
)
def list_quarantined_medical_items() -> Dict[str, Any]:
    qm = get_quarantine_manager()
    items = qm.get_quarantined_items()
    return {
        "total_quarantined_batches": len(items),
        "quarantined_items": items,
    }


@router.get(
    "/cold-chain/profiles",
    summary="Medical Cold Chain SKU Thermal Profiles",
    description="Returns storage boundaries and shock tolerances for Class VIII biologicals and lithium drone packs.",
)
def list_cold_chain_profiles() -> Dict[str, Any]:
    return {
        "profiles": {
            sku: prof.model_dump() for sku, prof in SKU_COLD_CHAIN_PROFILES.items()
        }
    }
