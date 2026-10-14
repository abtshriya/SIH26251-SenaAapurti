"""
FastAPI Routes for Combat Tempo Stress-Testing & War-Reserve Echeloning Engine.
Exposes endpoints consumed by the Angular 19 forecast view (forecast-view.component.ts)
with zero UI breakage.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.analytics_engine.combat_tempo_model import (
    CombatTempo,
    TEMPO_MULTIPLIERS,
    TEMPO_VOLATILITY,
)
from app.analytics_engine.forecast_service import (
    KNOWN_SKUS,
    KNOWN_UNITS,
    get_forecast_service,
)
from app.analytics_engine.wwr_sentinel import WWRSentinel

logger = logging.getLogger("sena_aapurti.api.forecast")

router = APIRouter(prefix="/forecast", tags=["Combat Tempo & WWR Analytics"])


class StressTestRequest(BaseModel):
    """Payload to trigger dynamic combat tempo stress-testing."""

    unit_id: str = Field(default="DEPOT-KGL", description="Target military depot or forward formation")
    sku: Optional[str] = Field(default="AMMO-7.62MM", description="Supply SKU (e.g., AMMO-7.62MM, FUEL-DIESEL, RATIONS-MRE)")
    tempo: str = Field(
        default="TACTICAL_CONFLICT",
        description="Combat tempo: PEACETIME, HEIGHTENED_VIGIL, TACTICAL_CONFLICT, FULL_SCALE_MOBILIZATION",
    )
    simulated_days: Optional[int] = Field(default=14, ge=1, le=90, description="Forward projection horizon in days")
    current_stock: Optional[float] = Field(default=None, description="Current stock override (optional)")
    override_capacity: Optional[float] = Field(default=None, description="Authorized capacity override (optional)")


@router.get("/projections", status_code=status.HTTP_200_OK)
def get_forecast_projections(
    unit_id: str = Query(
        default="DEPOT-KGL",
        description="Military unit/depot identifier (e.g. DEPOT-KGL, DEPOT-LEH, FOB-DBO)",
    ),
    sku: str = Query(
        default="AMMO-7.62MM",
        description="Supply SKU (e.g. AMMO-7.62MM, FUEL-DIESEL, RATIONS-MRE, MED-PLASMA)",
    ),
    tempo: str = Query(
        default="PEACETIME",
        description="Operational tempo: PEACETIME, HEIGHTENED_VIGIL, TACTICAL_CONFLICT, FULL_SCALE_MOBILIZATION",
    ),
    simulated_days: int = Query(
        default=14,
        ge=1,
        le=90,
        description="Number of projection days",
    ),
) -> Dict[str, Any]:
    """
    Returns time-series projection curves and Days of Supply strictly conforming to
    Angular forecast-view.component.ts contract.
    """
    service = get_forecast_service()
    try:
        forecast = service.generate_forecast(
            unit_id=unit_id,
            sku=sku,
            tempo=tempo,
            simulated_days=simulated_days,
        )
        return forecast
    except Exception as e:
        logger.exception("Forecast projection error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast generation failed: {str(e)}",
        )


@router.post("/stress-test", status_code=status.HTTP_200_OK)
def stress_test_combat_tempo(payload: StressTestRequest) -> Dict[str, Any]:
    """
    Simulates a dynamic operational tempo shift on the fly:
    Calculates surge depletion curves, detects exact day to WWR breach,
    and returns automated pre-emptive replenishment recommendations.
    """
    service = get_forecast_service()
    try:
        sku = payload.sku or "AMMO-7.62MM"
        forecast = service.generate_forecast(
            unit_id=payload.unit_id,
            sku=sku,
            tempo=payload.tempo,
            simulated_days=payload.simulated_days or 14,
            override_current_stock=payload.current_stock,
            override_capacity=payload.override_capacity,
        )
        return forecast
    except Exception as e:
        logger.exception("Combat tempo stress-testing failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stress-testing calculation failed: {str(e)}",
        )


@router.get("/tempos", status_code=status.HTTP_200_OK)
def list_combat_tempos() -> List[Dict[str, Any]]:
    """
    Returns available operational combat tempos and their non-linear surge multipliers.
    """
    result = []
    for tempo in CombatTempo:
        result.append({
            "tempo": tempo.value,
            "multipliers": TEMPO_MULTIPLIERS.get(tempo, {}),
            "volatility": TEMPO_VOLATILITY.get(tempo, {}),
        })
    return result


@router.get("/skus", status_code=status.HTTP_200_OK)
def list_available_skus() -> List[Dict[str, Any]]:
    """
    Returns catalog SKUs with their baseline consumption parameters and capacities.
    """
    return [sku.model_dump() for sku in KNOWN_SKUS.values()]


@router.get("/units", status_code=status.HTTP_200_OK)
def list_monitored_units() -> List[Dict[str, Any]]:
    """
    Returns forward military units with their troop strengths and replenishment lead times.
    """
    return [unit.model_dump() for unit in KNOWN_UNITS.values()]
