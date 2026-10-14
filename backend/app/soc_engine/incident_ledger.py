"""
Sena Aapurti — Incident Ledger & Device Quarantine Manager
File: backend/app/soc_engine/incident_ledger.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Responsibilities:
1. Immutably records cyber attacks into `security_incidents`.
2. Appends SHA-256 breach records into `tamper_proof_audit_ledger` (action='SECURITY_BREACH_INTERCEPTED').
3. Dynamically blacklists/quarantines compromised IoT transponders for 30 minutes.
4. Provides real-time threat summary metrics for Angular 19 SOC Radar dashboards.
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes_inventory import get_db_engine, memory_store

logger = logging.getLogger("sena_aapurti.soc.incident_ledger")

DEFAULT_QUARANTINE_MINUTES: int = 30


# ---------------------------------------------------------------------------
# PostgreSQL Schema Initialization
# ---------------------------------------------------------------------------
def _ensure_security_tables() -> None:
    """Ensure `security_incidents` table exists in PostgreSQL when available."""
    engine = get_db_engine()
    if engine is None:
        return
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS security_incidents (
                        incident_id VARCHAR(64) PRIMARY KEY,
                        device_id VARCHAR(64) NOT NULL,
                        threat_level VARCHAR(32) NOT NULL,
                        attack_type VARCHAR(64) NOT NULL,
                        payload_dump JSONB NOT NULL,
                        detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        quarantined BOOLEAN NOT NULL DEFAULT TRUE,
                        quarantine_until TIMESTAMPTZ,
                        action_taken VARCHAR(128) NOT NULL DEFAULT 'PAYLOAD_DROPPED_DEVICE_QUARANTINED',
                        details TEXT
                    );
                    CREATE INDEX IF NOT EXISTS idx_security_incidents_dev
                        ON security_incidents (device_id, detected_at);
                    """
                )
            )
    except Exception as exc:
        logger.debug("Table creation notice (security_incidents): %s", exc)


# ---------------------------------------------------------------------------
# Incident Ledger & Quarantine Manager
# ---------------------------------------------------------------------------
class IncidentLedger:
    """
    Thread-safe SOC incident ledger and device quarantine coordinator.
    Synchronizes seamlessly between live PostgreSQL and in-memory fallback.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        # In-memory stores
        self._in_memory_incidents: List[Dict[str, Any]] = []
        # device_id -> quarantine_expiry_datetime (UTC)
        self._quarantined_devices: Dict[str, datetime] = {}
        _ensure_security_tables()

    # ── Quarantine Controls ──────────────────────────────────────────────────
    def quarantine_device(self, device_id: str, minutes: int = DEFAULT_QUARANTINE_MINUTES) -> datetime:
        """Place a device into quarantine until now + minutes."""
        with self._lock:
            expiry = datetime.now(timezone.utc) + timedelta(minutes=minutes)
            self._quarantined_devices[device_id] = expiry
            logger.warning("[SOC] Device '%s' quarantined until %s", device_id, expiry.isoformat())
            return expiry

    def is_quarantined(self, device_id: str) -> Tuple[bool, Optional[str]]:
        """Check whether a device is under active quarantine."""
        with self._lock:
            expiry = self._quarantined_devices.get(device_id)
            if not expiry:
                return False, None
            now = datetime.now(timezone.utc)
            if now < expiry:
                return True, expiry.isoformat()
            # Quarantine expired
            del self._quarantined_devices[device_id]
            return False, None

    def lift_quarantine(self, device_id: str) -> bool:
        """Administratively remove a device from quarantine."""
        with self._lock:
            if device_id in self._quarantined_devices:
                del self._quarantined_devices[device_id]
                logger.info("[SOC] Quarantine lifted for device '%s'", device_id)
                return True
            return False

    def get_quarantined_devices(self) -> List[str]:
        """Return list of actively quarantined device IDs."""
        with self._lock:
            now = datetime.now(timezone.utc)
            active = [dev for dev, exp in self._quarantined_devices.items() if exp > now]
            return active

    # ── Log Threat ───────────────────────────────────────────────────────────
    def log_threat(
        self,
        attack_type: str,
        device_id: str,
        severity: str,
        detail: str,
        payload_dump: Dict[str, Any],
        quarantine_minutes: int = DEFAULT_QUARANTINE_MINUTES,
    ) -> Dict[str, Any]:
        """
        Record security breach into:
        1. `security_incidents` table.
        2. Append cryptographic block into `tamper_proof_audit_ledger` (action='SECURITY_BREACH_INTERCEPTED').
        3. Quarantine device for specified duration.
        """
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        detected_at = datetime.now(timezone.utc)
        quarantine_until = self.quarantine_device(device_id, minutes=quarantine_minutes)
        action_taken = "PAYLOAD_DROPPED_DEVICE_QUARANTINED"

        # Deterministic hash of breach event for immutable audit chaining
        raw_material = f"{incident_id}:{attack_type}:{device_id}:{detected_at.isoformat()}:{json.dumps(payload_dump, sort_keys=True)}"
        breach_hash = hashlib.sha256(raw_material.encode("utf-8")).hexdigest()

        incident_record = {
            "incident_id": incident_id,
            "device_id": device_id,
            "threat_level": severity,
            "attack_type": attack_type,
            "payload_dump": payload_dump,
            "detected_at": detected_at.isoformat(),
            "quarantined": True,
            "quarantine_until": quarantine_until.isoformat(),
            "action_taken": action_taken,
            "details": detail,
            "breach_hash": breach_hash,
        }

        # 1. In-memory record (instant access for UI radar)
        with self._lock:
            self._in_memory_incidents.insert(0, incident_record)
            if len(self._in_memory_incidents) > 500:
                self._in_memory_incidents.pop()

        # 2. In-memory audit ledger append
        try:
            memory_store.append_audit_log(
                action="SECURITY_BREACH_INTERCEPTED",
                actor_id=device_id,
                payload_hash=breach_hash,
            )
        except Exception:
            pass

        # 3. PostgreSQL persistence (if available)
        engine = get_db_engine()
        ledger_receipt: Optional[Dict[str, Any]] = None

        if engine is not None:
            try:
                _ensure_security_tables()
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO security_incidents (
                                incident_id, device_id, threat_level, attack_type,
                                payload_dump, detected_at, quarantined, quarantine_until,
                                action_taken, details
                            ) VALUES (
                                :incident_id, :device_id, :threat_level, :attack_type,
                                :payload_dump, :detected_at, :quarantined, :quarantine_until,
                                :action_taken, :details
                            )
                            """
                        ),
                        {
                            "incident_id": incident_id,
                            "device_id": device_id,
                            "threat_level": severity,
                            "attack_type": attack_type,
                            "payload_dump": json.dumps(payload_dump),
                            "detected_at": detected_at,
                            "quarantined": True,
                            "quarantine_until": quarantine_until,
                            "action_taken": action_taken,
                            "details": detail,
                        },
                    )

                    row = (
                        conn.execute(
                            text(
                                """
                                INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
                                VALUES ('SECURITY_BREACH_INTERCEPTED', :actor_id, :payload_hash)
                                RETURNING log_id, previous_hash, current_hash, timestamp;
                                """
                            ),
                            {
                                "actor_id": device_id,
                                "payload_hash": breach_hash,
                            },
                        )
                        .mappings()
                        .first()
                    )

                    if row:
                        ledger_receipt = {
                            "log_id": row["log_id"],
                            "previous_hash": row["previous_hash"].strip(),
                            "current_hash": row["current_hash"].strip(),
                            "timestamp": row["timestamp"].isoformat(),
                        }
            except SQLAlchemyError as exc:
                logger.warning("PostgreSQL incident commit fallback: %s", exc)

        incident_record["ledger_receipt"] = ledger_receipt
        return incident_record

    # ── SOC Dashboard Queries ────────────────────────────────────────────────
    def get_threat_summary(self) -> Dict[str, Any]:
        """
        Summary metrics for frontend dashboard components.
        Matches Angular command-dashboard and telemetry-view expectations.
        """
        with self._lock:
            quarantined = self.get_quarantined_devices()
            active_alerts = [
                {
                    "incident_id": inc["incident_id"],
                    "attack_type": inc["attack_type"],
                    "device_id": inc["device_id"],
                    "timestamp": inc["detected_at"],
                    "severity": inc["threat_level"],
                    "action_taken": inc["action_taken"],
                    "details": inc["details"],
                }
                for inc in self._in_memory_incidents[:10]
            ]
            return {
                "total_threats_blocked": len(self._in_memory_incidents),
                "quarantined_devices": quarantined,
                "active_alerts": active_alerts,
                "radar_status": "OPERATIONAL",
                "defense_posture": "DEFCON_2_ZERO_TRUST",
            }

    def get_incidents(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Retrieve paginated list of security incidents."""
        with self._lock:
            total = len(self._in_memory_incidents)
            items = self._in_memory_incidents[offset : offset + limit]
            return {
                "total": total,
                "limit": limit,
                "offset": offset,
                "incidents": items,
            }

    def reset_state(self) -> None:
        """Reset state for tests."""
        with self._lock:
            self._in_memory_incidents.clear()
            self._quarantined_devices.clear()


# Singleton Instance
_GLOBAL_INCIDENT_LEDGER = IncidentLedger()


def get_incident_ledger() -> IncidentLedger:
    return _GLOBAL_INCIDENT_LEDGER
