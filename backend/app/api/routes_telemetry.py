import logging
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes_inventory import get_db_engine, memory_store
from app.core.security import TelemetryEnvelope, verify_telemetry_security

logger = logging.getLogger("sena_aapurti.telemetry")

router = APIRouter(tags=["Zero Trust Telemetry Ingestion"])


@router.post("/telemetry/secure-ingest", status_code=status.HTTP_200_OK)
def secure_telemetry_ingest(envelope: TelemetryEnvelope) -> Dict[str, Any]:
    """
    Zero Trust Edge Telemetry Ingestion Gateway:
    1. Rejects clock drift > 300s (HTTP 401).
    2. Verifies constant-time HMAC-SHA256 signature (HTTP 401).
    3. Rejects replayed nonces or non-monotonic sequence numbers (HTTP 409).
    4. Idempotently updates `unit_stocks` and appends a cryptographic block to `tamper_proof_audit_ledger`.
    """
    payload_hash = verify_telemetry_security(envelope)
    engine = get_db_engine()

    if engine is not None:
        try:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        INSERT INTO unit_stocks (unit_id, sku, current_quantity, last_sync_timestamp)
                        VALUES (:unit_id, :sku, :qty, :ts)
                        ON CONFLICT (unit_id, sku) DO UPDATE
                        SET current_quantity = EXCLUDED.current_quantity,
                            last_sync_timestamp = EXCLUDED.last_sync_timestamp;
                        """
                    ),
                    {
                        "unit_id": envelope.unit_id,
                        "sku": envelope.sku,
                        "qty": envelope.reported_quantity,
                        "ts": envelope.timestamp,
                    },
                )

                ledger_row = (
                    conn.execute(
                        text(
                            """
                            INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
                            VALUES ('IOT_TELEMETRY_SYNC', :actor_id, :payload_hash)
                            RETURNING log_id, previous_hash, current_hash, timestamp;
                            """
                        ),
                        {
                            "actor_id": envelope.device_id,
                            "payload_hash": payload_hash,
                        },
                    )
                    .mappings()
                    .first()
                )

                return {
                    "status": "TELEMETRY_COMMITTED",
                    "zero_trust_verification": {
                        "hmac_sha256": "VERIFIED",
                        "replay_shield_nonce": envelope.nonce,
                        "sequence_id": envelope.sequence_id,
                        "clock_skew_check": "PASSED",
                    },
                    "updated_stock": {
                        "unit_id": envelope.unit_id,
                        "sku": envelope.sku,
                        "reported_quantity": envelope.reported_quantity,
                    },
                    "ledger_receipt": {
                        "log_id": ledger_row["log_id"],
                        "previous_hash": ledger_row["previous_hash"].strip(),
                        "current_hash": ledger_row["current_hash"].strip(),
                        "payload_hash": payload_hash,
                        "timestamp": ledger_row["timestamp"].isoformat(),
                    },
                }
        except SQLAlchemyError as exc:
            logger.warning("PostGIS telemetry commit fallback (%s)", exc)

    # Resilient in-memory fallback execution
    if envelope.unit_id not in memory_store.units or envelope.sku not in memory_store.items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unit '{envelope.unit_id}' or SKU '{envelope.sku}' not registered in theatre catalog.",
        )

    key = (envelope.unit_id, envelope.sku)
    stock_entry = memory_store.stocks.get(
        key,
        {"current_quantity": 0, "daily_burn_rate": 35.0, "last_sync_timestamp": ""},
    )
    stock_entry["current_quantity"] = envelope.reported_quantity
    stock_entry["last_sync_timestamp"] = datetime.now(timezone.utc).isoformat()
    memory_store.stocks[key] = stock_entry

    ledger_entry = memory_store.append_audit_log(
        action="IOT_TELEMETRY_SYNC",
        actor_id=envelope.device_id,
        payload_hash=payload_hash,
    )

    return {
        "status": "TELEMETRY_COMMITTED",
        "zero_trust_verification": {
            "hmac_sha256": "VERIFIED",
            "replay_shield_nonce": envelope.nonce,
            "sequence_id": envelope.sequence_id,
            "clock_skew_check": "PASSED",
        },
        "updated_stock": {
            "unit_id": envelope.unit_id,
            "sku": envelope.sku,
            "reported_quantity": envelope.reported_quantity,
        },
        "ledger_receipt": {
            "log_id": ledger_entry["log_id"],
            "previous_hash": ledger_entry["previous_hash"],
            "current_hash": ledger_entry["current_hash"],
            "payload_hash": payload_hash,
            "timestamp": ledger_entry["timestamp"],
        },
    }
