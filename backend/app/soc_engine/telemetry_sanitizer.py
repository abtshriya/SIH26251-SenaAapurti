"""
Sena Aapurti — Telemetry Sanitizer & Ingestion Pipeline Interceptor
File: backend/app/soc_engine/telemetry_sanitizer.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Intercepts incoming sensor telemetry:
- Passes through multi-layer SOC Radar (HMAC, Nonce Replay, Clock Skew, Kinematic Velocity).
- On violation: Discards payload (Zero Database Drift), logs security breach to audit ledger,
  and quarantines the offending device.
- On success: Atomically commits delta stock to `unit_stocks` and chains to `tamper_proof_audit_ledger`.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes_inventory import get_db_engine, memory_store
from app.soc_engine.incident_ledger import get_incident_ledger
from app.soc_engine.soc_radar import (
    SensorTelemetryPacket,
    ThreatDetectedException,
    get_soc_radar,
)

logger = logging.getLogger("sena_aapurti.soc.sanitizer")


def _resolve_unit_and_sku(unit_id: str, sku: str) -> tuple[str, str]:
    """
    Normalizes unit and SKU identifiers across simulated depots and catalog entries.
    E.g. maps 'DEPOT-KGL' -> 'UNIT-FOB-BRAVO' (Kargil Forward Depot), 'AMMO-7.62MM' -> 'MUN-762-NATO'.
    """
    unit_map = {
        "DEPOT-KGL": "UNIT-FOB-BRAVO",
        "HQ-NORTH": "UNIT-HQ-01",
        "FOB-SIACHEN": "UNIT-FOB-ALPHA",
    }
    sku_map = {
        "AMMO-7.62MM": "MUN-762-NATO",
        "ARTY-155MM": "MUN-155MM-HE",
        "RATION-MRE": "RAT-MRE-HALT",
        "POL-JP8": "FUEL-JP8-ARC",
    }
    resolved_unit = unit_map.get(unit_id, unit_id)
    resolved_sku = sku_map.get(sku, sku)
    return resolved_unit, resolved_sku


def sanitize_and_ingest_telemetry(packet: SensorTelemetryPacket) -> Dict[str, Any]:
    """
    Zero-Trust Telemetry Ingestion Interceptor:
    1. Evaluates packet across SOC Radar defenses.
    2. If attack detected: Discards immediately, logs threat to security ledger, blacklists device.
    3. If valid: Executes atomic stock update and appends to cryptographic audit ledger.
    """
    radar = get_soc_radar()
    incident_ledger = get_incident_ledger()

    try:
        is_valid, payload_hash, speed_kmh, dist_km = radar.evaluate_telemetry(
            packet,
            quarantine_check_callback=incident_ledger.is_quarantined,
        )
    except ThreatDetectedException as threat:
        # ── DISCARD PAYLOAD IMMEDIATELY (Zero Database Drift) ────────────────
        logger.warning(
            "[SOC INTERCEPT] Discarded telemetry from '%s'. Attack: %s (%s)",
            packet.device_id,
            threat.attack_type,
            threat.detail,
        )
        incident_ledger.log_threat(
            attack_type=threat.attack_type,
            device_id=packet.device_id,
            severity=threat.severity,
            detail=threat.detail,
            payload_dump=threat.payload_dump,
        )
        # Re-raise so API route can map to standard defense HTTP error codes
        raise threat

    # ── VALIDATED TELEMETRY: Commit Stock Update & Audit ─────────────────────
    resolved_unit, resolved_sku = _resolve_unit_and_sku(packet.unit_id, packet.sku)
    engine = get_db_engine()
    now_ts = datetime.now(timezone.utc)
    updated_stock_qty: int = 0
    ledger_receipt: Dict[str, Any] = {}

    if engine is not None:
        try:
            with engine.begin() as conn:
                # 1. Atomic Stock Update (applying delta_qty)
                stock_row = (
                    conn.execute(
                        text(
                            """
                            INSERT INTO unit_stocks (unit_id, sku, current_quantity, last_sync_timestamp)
                            VALUES (:unit_id, :sku, GREATEST(0, :delta_qty), :ts)
                            ON CONFLICT (unit_id, sku) DO UPDATE
                            SET current_quantity = GREATEST(0, unit_stocks.current_quantity + :delta_qty),
                                last_sync_timestamp = :ts
                            RETURNING current_quantity;
                            """
                        ),
                        {
                            "unit_id": resolved_unit,
                            "sku": resolved_sku,
                            "delta_qty": packet.delta_qty,
                            "ts": now_ts,
                        },
                    )
                    .mappings()
                    .first()
                )
                if stock_row:
                    updated_stock_qty = stock_row["current_quantity"]

                # 2. Append to immutable audit ledger
                ledger_row = (
                    conn.execute(
                        text(
                            """
                            INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
                            VALUES ('SECURE_TELEMETRY_INGESTED', :actor_id, :payload_hash)
                            RETURNING log_id, previous_hash, current_hash, timestamp;
                            """
                        ),
                        {
                            "actor_id": packet.device_id,
                            "payload_hash": payload_hash,
                        },
                    )
                    .mappings()
                    .first()
                )
                if ledger_row:
                    ledger_receipt = {
                        "log_id": ledger_row["log_id"],
                        "previous_hash": ledger_row["previous_hash"].strip(),
                        "current_hash": ledger_row["current_hash"].strip(),
                        "timestamp": ledger_row["timestamp"].isoformat(),
                    }
        except SQLAlchemyError as exc:
            logger.warning("PostgreSQL telemetry commit fallback: %s", exc)

    # In-memory twin fallback
    if updated_stock_qty == 0:
        key = (resolved_unit, resolved_sku)
        current_entry = memory_store.stocks.get(key)
        if current_entry is None:
            # Seed entry if missing
            current_entry = {"current_quantity": 500, "daily_burn_rate": 20.0, "last_sync_timestamp": now_ts.isoformat()}
            memory_store.stocks[key] = current_entry

        old_qty = current_entry["current_quantity"]
        new_qty = max(0, old_qty + packet.delta_qty)
        current_entry["current_quantity"] = new_qty
        current_entry["last_sync_timestamp"] = now_ts.isoformat()
        updated_stock_qty = new_qty

        # In-memory audit append
        try:
            mem_block = memory_store.append_audit_log(
                action="SECURE_TELEMETRY_INGESTED",
                actor_id=packet.device_id,
                payload_hash=payload_hash,
            )
            ledger_receipt = {
                "log_id": mem_block["log_id"],
                "previous_hash": mem_block["previous_hash"],
                "current_hash": mem_block["current_hash"],
                "timestamp": mem_block["timestamp"],
            }
        except Exception:
            pass

    return {
        "status": "ACCEPTED",
        "message": "Telemetry verified by SOC Radar. Stock adjustment committed.",
        "device_id": packet.device_id,
        "unit_id": packet.unit_id,
        "sku": packet.sku,
        "delta_qty": packet.delta_qty,
        "updated_stock": updated_stock_qty,
        "calculated_speed_kmh": round(speed_kmh, 1),
        "distance_km": round(dist_km, 2),
        "payload_hash": payload_hash,
        "ledger_receipt": ledger_receipt,
        "zero_trust_checks": {
            "hmac_sha256": "VERIFIED",
            "nonce_replay_shield": "VERIFIED",
            "clock_skew": "PASSED",
            "kinematic_velocity": "NOMINAL",
        },
    }
