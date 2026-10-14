"""
Sena Aapurti — SOC Security Radar & Threat Feed API Routes
File: backend/app/api/routes_security_soc.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Endpoints:
- POST /api/v1/telemetry/ingest-secure : Multi-layered Zero Trust sensor ingestion
- GET  /api/v1/soc/threat-summary      : Real-time threat radar summary for dashboard
- GET  /api/v1/soc/incidents           : Paginated incident ledger for alert feeds
- POST /api/v1/soc/quarantine/lift     : Administrative quarantine release
- GET  /api/v1/soc/radar-status        : Real-time engine health and radar diagnostics
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.soc_engine.incident_ledger import get_incident_ledger
from app.soc_engine.soc_radar import (
    SensorTelemetryPacket,
    ThreatDetectedException,
    get_soc_radar,
)
from app.soc_engine.telemetry_sanitizer import sanitize_and_ingest_telemetry

logger = logging.getLogger("sena_aapurti.soc.routes")

router = APIRouter(tags=["SOC Threat Radar & Telemetry Guard"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
class QuarantineLiftRequest(BaseModel):
    device_id: str = Field(..., description="IoT Device ID to un-quarantine")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post(
    "/telemetry/ingest-secure",
    status_code=status.HTTP_200_OK,
    summary="Secure Sensor Telemetry Ingestion (Zero-Trust Guard)",
    description=(
        "Validates telemetry across cryptographic HMAC-SHA256, sliding-window replay, "
        "clock skew, and kinematic mountain road velocity bounds. "
        "Guarantees Zero Database Drift on tampering."
    ),
)
@router.post(
    "/soc/ingest-secure",
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def ingest_secure_telemetry(packet: SensorTelemetryPacket) -> Dict[str, Any]:
    """
    Ingests and validates sensor telemetry.
    Returns HTTP 200 on success.
    Returns HTTP 401 on MITM or Clock Skew, HTTP 409 on Replay, HTTP 422 on Kinematic Spoofing,
    and HTTP 403 on Quarantined devices.
    """
    try:
        result = sanitize_and_ingest_telemetry(packet)
        return result
    except ThreatDetectedException as threat:
        raise HTTPException(
            status_code=threat.http_status,
            detail={
                "status": "REJECTED_SECURITY_INTERCEPT",
                "attack_type": threat.attack_type,
                "error_code": threat.error_code,
                "severity": threat.severity,
                "device_id": threat.device_id,
                "detail": threat.detail,
                "detected_at": threat.detected_at.isoformat(),
                "action_taken": "PAYLOAD_DROPPED_DEVICE_QUARANTINED",
                "zero_drift_guarantee": "NO_DATABASE_RECORDS_MODIFIED",
            },
        )


@router.get(
    "/soc/threat-summary",
    summary="SOC Security Radar Threat Summary",
    description="Returns aggregate blocked attack metrics and active alerts for dashboard display.",
)
def get_soc_threat_summary() -> Dict[str, Any]:
    ledger = get_incident_ledger()
    return ledger.get_threat_summary()


@router.get(
    "/soc/incidents",
    summary="Paginated Security Incident Ledger",
    description="Returns paginated incident records matching dashboard alert feeds.",
)
def get_soc_incidents(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> Dict[str, Any]:
    ledger = get_incident_ledger()
    return ledger.get_incidents(limit=limit, offset=offset)


@router.post(
    "/soc/quarantine/lift",
    summary="Lift Device Quarantine",
    description="Administratively remove an IoT device ID from active quarantine blacklist.",
)
def lift_device_quarantine(body: QuarantineLiftRequest) -> Dict[str, Any]:
    ledger = get_incident_ledger()
    success = ledger.lift_quarantine(body.device_id)
    if not success:
        return {
            "status": "NOT_IN_QUARANTINE",
            "message": f"Device '{body.device_id}' was not found in active quarantine.",
            "device_id": body.device_id,
        }
    return {
        "status": "QUARANTINE_LIFTED",
        "message": f"Quarantine lifted for device '{body.device_id}'. Telemetry reception restored.",
        "device_id": body.device_id,
    }


@router.get(
    "/soc/radar-status",
    summary="SOC Radar Engine Diagnostic Status",
    description="Returns operational state of the kinematic radar and replay defense subsystems.",
)
def get_radar_status() -> Dict[str, Any]:
    radar = get_soc_radar()
    ledger = get_incident_ledger()
    return {
        "radar_service": "SENA_AAPURTI_SOC_RADAR",
        "posture": "DEFCON_2_ZERO_TRUST",
        "max_mountain_speed_kmh": 70.0,
        "max_clock_skew_seconds": 300,
        "total_verified_packets": radar.total_verified,
        "active_quarantined_count": len(ledger.get_quarantined_devices()),
        "quarantined_devices": ledger.get_quarantined_devices(),
    }
