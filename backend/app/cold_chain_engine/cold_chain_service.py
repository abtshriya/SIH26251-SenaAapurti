"""
Sena Aapurti — Cold-Chain IoT Stream Service
File: backend/app/cold_chain_engine/cold_chain_service.py
Classification: RESTRICTED // DEFENSE MEDICAL OPERATIONS (SIH26251)

Coordinates IoT telemetry ingestion, real-time thermal curve buffers,
degradation evaluations, and autonomous medical quarantine triggers.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.cold_chain_engine.degradation_model import (
    ContainerTelemetryLog,
    DegradationAssessment,
    evaluate_telemetry_batch,
    get_profile_for_sku,
)
from app.cold_chain_engine.quarantine_manager import get_quarantine_manager

logger = logging.getLogger("sena_aapurti.cold_chain.service")


# ---------------------------------------------------------------------------
# Telemetry Ingest Request Model
# ---------------------------------------------------------------------------
class ColdChainTelemetryInput(BaseModel):
    container_id: str = Field(..., examples=["CONT-CHOPPER-MED-04"])
    consignment_id: str = Field(..., examples=["REQ-MED-SIACHEN-2026"])
    sku: str = Field(..., examples=["MED-HAPE-AMP"])
    current_temp: float = Field(..., description="Internal payload chamber temperature in °C")
    target_min_temp: Optional[float] = None
    target_max_temp: Optional[float] = None
    ambient_temp: float = Field(default=-25.0, description="External mountain pass temperature in °C")
    g_force: float = Field(default=1.2, description="Peak accelerometer G-force reading")
    heater_active: bool = Field(default=True, description="Internal active Peltier heater status")
    battery_pct: float = Field(default=92.0, description="Thermal battery remaining percentage")
    door_open: bool = Field(default=False)
    quantity: int = Field(default=250, description="Units in transit inside this thermal pack")
    destination_node: str = Field(default="UNIT-FOB-ALPHA", description="Receiving outpost")
    timestamp: Optional[float] = None


class ContainerState:
    """Stateful tracker for an active thermal medical transport container."""

    def __init__(self, container_id: str) -> None:
        self.container_id = container_id
        self.telemetry_history: List[ContainerTelemetryLog] = []
        self.battery_pct: float = 95.0
        self.is_quarantined: bool = False
        self.quarantine_details: Optional[Dict[str, Any]] = None


class ColdChainService:
    """Service handling multi-container cold chain streams and stock lifecycle hooks."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._containers: Dict[str, ContainerState] = {}

    def ingest_telemetry(self, data: ColdChainTelemetryInput) -> Dict[str, Any]:
        """
        Process single telemetry ping:
        1. Append to container's time-series curve.
        2. Evaluate degradation model across buffered readings.
        3. If breach triggers quarantine, lock stock and fire replacement indent.
        """
        with self._lock:
            cid = data.container_id
            if cid not in self._containers:
                self._containers[cid] = ContainerState(cid)

            container = self._containers[cid]
            container.battery_pct = data.battery_pct

            now_ts = data.timestamp if data.timestamp is not None else time.time()
            reading = ContainerTelemetryLog(
                container_id=cid,
                timestamp=now_ts,
                current_temp=data.current_temp,
                ambient_temp=data.ambient_temp,
                g_force=data.g_force,
                door_open=data.door_open,
                heater_active=data.heater_active,
            )
            container.telemetry_history.append(reading)
            if len(container.telemetry_history) > 100:
                container.telemetry_history.pop(0)

            # Evaluate cumulative degradation across history
            assessment = evaluate_telemetry_batch(
                sku=data.sku,
                telemetry_logs=container.telemetry_history,
            )

            quarantine_result: Optional[Dict[str, Any]] = None

            # Autonomous Triage Quarantine Trigger
            if assessment.quarantine_mandatory and not container.is_quarantined:
                container.is_quarantined = True
                qm = get_quarantine_manager()
                quarantine_result = qm.execute_quarantine(
                    consignment_id=data.consignment_id,
                    container_id=data.container_id,
                    sku=data.sku,
                    node_id=data.destination_node,
                    quantity_to_quarantine=data.quantity,
                    assessment=assessment,
                )
                container.quarantine_details = quarantine_result
                logger.warning(
                    "[COLD CHAIN AUTONOMOUS TRIAGE] Container '%s' breached! Locked %d units into quarantine.",
                    data.container_id,
                    data.quantity,
                )
            elif container.is_quarantined:
                quarantine_result = container.quarantine_details

            return {
                "container_id": data.container_id,
                "consignment_id": data.consignment_id,
                "sku": data.sku,
                "current_temp": data.current_temp,
                "ambient_temp": data.ambient_temp,
                "heater_active": data.heater_active,
                "battery_pct": data.battery_pct,
                "g_force": data.g_force,
                "viability_score": assessment.viability_score,
                "condition_status": assessment.condition_status,
                "quarantine_triggered": container.is_quarantined,
                "breach_type": assessment.breach_type,
                "freeze_exposure_minutes": assessment.freeze_exposure_minutes,
                "heat_exposure_minutes": assessment.heat_exposure_minutes,
                "peak_temp": assessment.peak_temp,
                "min_temp": assessment.min_temp,
                "quarantine_event": quarantine_result,
                "action_summary": assessment.explanation,
            }

    def get_container_status(self, container_id: str) -> Dict[str, Any]:
        """Fetch real-time thermal curve and diagnostics for a container."""
        with self._lock:
            container = self._containers.get(container_id)
            if not container:
                return {
                    "container_id": container_id,
                    "status": "NOT_FOUND",
                    "telemetry_points": 0,
                    "curve": [],
                }

            curve = [
                {
                    "timestamp": r.timestamp,
                    "internal_temp": r.current_temp,
                    "ambient_temp": r.ambient_temp,
                    "g_force": r.g_force,
                    "heater_active": r.heater_active,
                }
                for r in container.telemetry_history
            ]

            latest = container.telemetry_history[-1] if container.telemetry_history else None
            return {
                "container_id": container_id,
                "status": "ACTIVE",
                "battery_pct": container.battery_pct,
                "is_quarantined": container.is_quarantined,
                "quarantine_details": container.quarantine_details,
                "latest_temp": latest.current_temp if latest else 0.0,
                "latest_g_force": latest.g_force if latest else 0.0,
                "telemetry_points": len(curve),
                "thermal_curve": curve,
            }

    def reset_state(self) -> None:
        """Reset state for tests."""
        with self._lock:
            self._containers.clear()


# Singleton Instance
_GLOBAL_COLD_CHAIN_SERVICE = ColdChainService()


def get_cold_chain_service() -> ColdChainService:
    return _GLOBAL_COLD_CHAIN_SERVICE
