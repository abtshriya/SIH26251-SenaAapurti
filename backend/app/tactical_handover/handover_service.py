# =============================================================================
# SENA AAPURTI — Handover Service
# File: backend/app/tactical_handover/handover_service.py
# Classification: RESTRICTED // SIH PROTOTYPE (SIH26251)
#
# Core business-logic layer for offline tactical delivery processing:
#   - Atomic stock increment in unit_stocks (PostgreSQL)
#   - Requisition status transition to DELIVERED_AIR_GAPPED
#   - Immutable ledger entry in tamper_proof_audit_ledger
#   - Anomaly / tamper-alert logging on verification failure
#   - Resilient in-memory state twin when PostGIS is offline
# =============================================================================
"""
Handover Service: Atomic Receipt Processing & Ledger Chaining.

Architectural Guarantees
------------------------
1. All three DB operations (stock upsert, requisition update, ledger insert)
   execute inside a SINGLE SQLAlchemy `engine.begin()` transaction context.
   If any step raises, the entire transaction is rolled back atomically.

2. When PostGIS is unreachable (EW blackout convoy sync), the service
   falls through to the `InMemoryStateStore` twin imported from
   `routes_inventory` — maintaining state until uplink returns.

3. Anomaly records (tamper / replay) are committed to the audit ledger
   even on failure — a separate connection is used so the anomaly record
   is NOT rolled back with the main failed transaction.

4. Returned dicts match the Angular 19 frontend's `InventoryStatus` model
   and `AuditLedgerEntry` interface shapes so the dashboard syncs instantly
   upon uplink restoration.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.tactical_handover.crypto_token import (
    ConsignmentManifest,
    TacticalSecurityError,
    verify_manifest_offline,
)

logger = logging.getLogger("sena_aapurti.tactical_handover.service")

# ---------------------------------------------------------------------------
# Lazy import of shared DB infrastructure from routes_inventory
# (avoids circular imports — both live in app.api vs. app.tactical_handover)
# ---------------------------------------------------------------------------
def _get_db():  # type: ignore[return]
    """Deferred import to prevent circular dependency at module load."""
    from app.api.routes_inventory import get_db_engine, memory_store  # noqa: PLC0415
    return get_db_engine(), memory_store


# ---------------------------------------------------------------------------
# Audit Actor & Action Constants
# ---------------------------------------------------------------------------
ACTOR_NFC_SCANNER     = "TACTICAL_NFC_SCANNER"
ACTION_BLIND_DROP_OK  = "BLIND_DROP_HANDOVER_ACCEPTED"
ACTION_TAMPER_ALERT   = "BLIND_DROP_TAMPER_ALERT"
ACTION_REPLAY_ALERT   = "BLIND_DROP_REPLAY_DETECTED"
TRANSIT_STATUS        = "IN_TRANSIT"
DELIVERED_STATUS      = "DELIVERED_AIR_GAPPED"


# ---------------------------------------------------------------------------
# Helper: compute SHA-256 payload hash for ledger commitment
# ---------------------------------------------------------------------------
def _manifest_payload_hash(manifest: ConsignmentManifest) -> str:
    raw = json.dumps(manifest.to_dict(), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# DB: Ledger anomaly helper (uses its own connection so it doesn't roll back)
# ---------------------------------------------------------------------------
def _commit_anomaly_to_ledger(
    engine: Any,
    action: str,
    actor_id: str,
    payload_hash: str,
    mem_store: Any,
) -> Optional[Dict[str, Any]]:
    """
    Write a security anomaly record to the tamper_proof_audit_ledger.
    Uses a standalone connection so the insert is committed independently
    from (and not rolled back by) any failed main transaction.
    """
    if engine is not None:
        try:
            with engine.begin() as conn:
                row = (
                    conn.execute(
                        text(
                            """
                            INSERT INTO tamper_proof_audit_ledger
                                (action, actor_id, payload_hash)
                            VALUES (:action, :actor_id, :payload_hash)
                            RETURNING log_id, previous_hash, current_hash, timestamp;
                            """
                        ),
                        {"action": action, "actor_id": actor_id, "payload_hash": payload_hash},
                    )
                    .mappings()
                    .first()
                )
            return {
                "log_id":        int(row["log_id"]),
                "previous_hash": row["previous_hash"].strip(),
                "current_hash":  row["current_hash"].strip(),
                "timestamp":     row["timestamp"].isoformat(),
            }
        except SQLAlchemyError as exc:
            logger.error("[LEDGER ANOMALY WRITE FAILED] %s", exc)

    # In-memory fallback
    entry = mem_store.append_audit_log(
        action=action,
        actor_id=actor_id,
        payload_hash=payload_hash,
    )
    return {
        "log_id":        entry["log_id"],
        "previous_hash": entry["previous_hash"],
        "current_hash":  entry["current_hash"],
        "timestamp":     entry["timestamp"],
    }


# ---------------------------------------------------------------------------
# Core Service: process_scanned_token
# ---------------------------------------------------------------------------
def process_scanned_token(
    token: str,
    *,
    expected_dest: Optional[str] = None,
) -> Dict[str, Any]:
    """
    End-to-end air-gapped delivery receipt processor.

    Parameters
    ----------
    token          : Raw Base64url compact token string from QR scan / NFC read.
    expected_dest  : If provided, manifest.dest is verified to match this string.
                     Typically set to the receiving depot's registered identifier.

    Returns
    -------
    dict with keys:
      status          : "ACCEPTED" | "REJECTED_TAMPERED" | "REJECTED_REPLAY"
                        | "REJECTED_EXPIRED" | "REJECTED_DESTINATION_MISMATCH"
      cid             : Consignment ID
      sku             : Stock keeping unit
      qty_received    : Quantity accepted (0 on rejection)
      updated_stock   : New total for (dest_unit_id, sku) after increment
      ledger_receipt  : Audit chain link record
      security_detail : Human-readable verdict string
      synced_at       : ISO-8601 UTC timestamp of this processing event

    Raises
    ------
    Does NOT raise — all TacticalSecurityError cases are caught and converted
    to structured rejection payloads with security incident logs.
    """
    engine, mem_store = _get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    # ── Step 1: Cryptographic Verification ───────────────────────────────────
    try:
        manifest: ConsignmentManifest = verify_manifest_offline(
            token, expected_dest=expected_dest
        )
    except TacticalSecurityError as sec_err:
        logger.warning(
            "[SECURITY INCIDENT] error_code=%s  detail=%s",
            sec_err.error_code, sec_err.detail,
        )

        # Map error code to action label for audit log
        action_label = {
            "SIGNATURE_MISMATCH":     ACTION_TAMPER_ALERT,
            "TOKEN_EXPIRED":          ACTION_TAMPER_ALERT,
            "DESTINATION_MISMATCH":   ACTION_TAMPER_ALERT,
            "REPLAY_ATTACK_DETECTED": ACTION_REPLAY_ALERT,
            "MALFORMED_TOKEN":        ACTION_TAMPER_ALERT,
        }.get(sec_err.error_code, ACTION_TAMPER_ALERT)

        rejection_hash = hashlib.sha256(
            f"REJECTED:{sec_err.error_code}:{token[:64]}:{now_iso}".encode()
        ).hexdigest()

        ledger = _commit_anomaly_to_ledger(
            engine, action_label, ACTOR_NFC_SCANNER, rejection_hash, mem_store
        )

        status_code = {
            "SIGNATURE_MISMATCH":     "REJECTED_TAMPERED",
            "TOKEN_EXPIRED":          "REJECTED_EXPIRED",
            "DESTINATION_MISMATCH":   "REJECTED_DESTINATION_MISMATCH",
            "REPLAY_ATTACK_DETECTED": "REJECTED_REPLAY",
            "MALFORMED_TOKEN":        "REJECTED_TAMPERED",
        }.get(sec_err.error_code, "REJECTED_TAMPERED")

        return {
            "status":          status_code,
            "cid":             _safe_extract_cid(token),
            "sku":             None,
            "qty_received":    0,
            "updated_stock":   None,
            "ledger_receipt":  ledger,
            "security_detail": sec_err.detail,
            "error_code":      sec_err.error_code,
            "synced_at":       now_iso,
        }

    # ── Step 2: Atomic DB Transaction ────────────────────────────────────────
    payload_hash  = _manifest_payload_hash(manifest)
    unit_id       = manifest.unit_id or manifest.dest   # fallback to dest code
    new_stock_qty: Optional[int] = None

    if engine is not None:
        try:
            with engine.begin() as conn:
                # 2a. Increment unit_stocks atomically (UPSERT)
                result = conn.execute(
                    text(
                        """
                        INSERT INTO unit_stocks (unit_id, sku, current_quantity, last_sync_timestamp)
                        VALUES (:unit_id, :sku, :qty, NOW())
                        ON CONFLICT (unit_id, sku) DO UPDATE
                            SET current_quantity   = unit_stocks.current_quantity + EXCLUDED.current_quantity,
                                last_sync_timestamp = NOW()
                        RETURNING current_quantity;
                        """
                    ),
                    {"unit_id": unit_id, "sku": manifest.sku, "qty": manifest.qty},
                )
                row = result.mappings().first()
                if row:
                    new_stock_qty = int(row["current_quantity"])

                # 2b. Update matching IN_TRANSIT requisition → DELIVERED_AIR_GAPPED
                conn.execute(
                    text(
                        """
                        UPDATE requisitions
                        SET    status      = :new_status,
                               approved_at = NOW()
                        WHERE  unit_id = :unit_id
                          AND  sku     = :sku
                          AND  status  = :old_status;
                        """
                    ),
                    {
                        "new_status": DELIVERED_STATUS,
                        "old_status": TRANSIT_STATUS,
                        "unit_id":    unit_id,
                        "sku":        manifest.sku,
                    },
                )

                # 2c. Append immutable audit ledger entry
                ledger_row = (
                    conn.execute(
                        text(
                            """
                            INSERT INTO tamper_proof_audit_ledger
                                (action, actor_id, payload_hash)
                            VALUES (:action, :actor_id, :payload_hash)
                            RETURNING log_id, previous_hash, current_hash, timestamp;
                            """
                        ),
                        {
                            "action":       ACTION_BLIND_DROP_OK,
                            "actor_id":     ACTOR_NFC_SCANNER,
                            "payload_hash": payload_hash,
                        },
                    )
                    .mappings()
                    .first()
                )

            ledger_receipt = {
                "log_id":        int(ledger_row["log_id"]),
                "previous_hash": ledger_row["previous_hash"].strip(),
                "current_hash":  ledger_row["current_hash"].strip(),
                "payload_hash":  payload_hash,
                "timestamp":     ledger_row["timestamp"].isoformat(),
            }

            logger.info(
                "[HANDOVER ACCEPTED] cid=%s  unit=%s  sku=%s  qty=+%d  new_stock=%s  ledger=%d",
                manifest.cid, unit_id, manifest.sku, manifest.qty,
                new_stock_qty, ledger_receipt["log_id"],
            )

        except SQLAlchemyError as exc:
            logger.warning(
                "[DB WRITE ERROR] Falling back to in-memory twin. reason=%s", exc
            )
            engine = None  # trigger in-memory path below

    # ── In-Memory Fallback (PostGIS offline) ─────────────────────────────────
    if engine is None:
        key = (unit_id, manifest.sku)
        existing = mem_store.stocks.get(
            key, {"current_quantity": 0, "daily_burn_rate": 15.0, "last_sync_timestamp": ""}
        )
        existing["current_quantity"] += manifest.qty
        existing["last_sync_timestamp"] = now_iso
        mem_store.stocks[key] = existing
        new_stock_qty = existing["current_quantity"]

        ledger_entry = mem_store.append_audit_log(
            action=ACTION_BLIND_DROP_OK,
            actor_id=ACTOR_NFC_SCANNER,
            payload_hash=payload_hash,
        )
        ledger_receipt = {
            "log_id":        ledger_entry["log_id"],
            "previous_hash": ledger_entry["previous_hash"],
            "current_hash":  ledger_entry["current_hash"],
            "payload_hash":  payload_hash,
            "timestamp":     ledger_entry["timestamp"],
        }

        logger.info(
            "[HANDOVER ACCEPTED (IN-MEMORY)] cid=%s  unit=%s  sku=%s  qty=+%d  new_stock=%d",
            manifest.cid, unit_id, manifest.sku, manifest.qty, new_stock_qty,
        )

    return {
        "status":          "ACCEPTED",
        "cid":             manifest.cid,
        "origin":          manifest.origin,
        "dest":            manifest.dest,
        "sku":             manifest.sku,
        "qty_received":    manifest.qty,
        "updated_stock":   new_stock_qty,
        "ledger_receipt":  ledger_receipt,
        "security_detail": (
            f"HMAC-SHA256 verified. Manifest '{manifest.cid}' accepted at "
            f"'{manifest.dest}'. Stock incremented by {manifest.qty} units."
        ),
        "accepted_at_epoch": manifest.issued_at,
        "synced_at":          now_iso,
    }


# ---------------------------------------------------------------------------
# Helper: retrieve active consignments (IN_TRANSIT manifests)
# ---------------------------------------------------------------------------
def list_active_consignments() -> list[Dict[str, Any]]:
    """
    Return a list of in-transit drop manifests visible to the frontend.

    Queries `requisitions` table for rows with status='IN_TRANSIT'.
    Falls back to empty list when PostGIS is offline (forward terminal
    operates air-gapped with local state only).
    """
    engine, _ = _get_db()

    if engine is None:
        logger.debug("[CONSIGNMENTS] PostGIS offline — returning empty list.")
        return []

    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT
                        r.requisition_id,
                        r.unit_id,
                        r.sku,
                        r.requested_quantity,
                        r.priority,
                        r.status,
                        r.approved_by,
                        to_char(r.approved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS approved_at,
                        to_char(r.created_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                        u.name AS unit_name,
                        i.item_name
                    FROM requisitions r
                    JOIN units          u ON u.unit_id = r.unit_id
                    JOIN inventory_items i ON i.sku    = r.sku
                    WHERE r.status = :status
                    ORDER BY r.created_at DESC;
                    """
                ),
                {"status": TRANSIT_STATUS},
            ).mappings().all()

            return [
                {
                    "requisition_id":    row["requisition_id"],
                    "unit_id":           row["unit_id"],
                    "unit_name":         row["unit_name"],
                    "sku":               row["sku"],
                    "item_name":         row["item_name"],
                    "requested_quantity": int(row["requested_quantity"]),
                    "priority":          row["priority"],
                    "status":            row["status"],
                    "approved_by":       row["approved_by"],
                    "approved_at":       row["approved_at"],
                    "created_at":        row["created_at"],
                }
                for row in rows
            ]
    except SQLAlchemyError as exc:
        logger.warning("[CONSIGNMENTS QUERY FAILED] %s", exc)
        return []


# ---------------------------------------------------------------------------
# Internal: safe CID extraction from opaque token (best-effort, no secrets)
# ---------------------------------------------------------------------------
def _safe_extract_cid(token: str) -> Optional[str]:
    """
    Attempt to extract `cid` from a Base64url token without raising.
    Returns None if the token is malformed or lacks the `cid` field.
    """
    import base64  # noqa: PLC0415
    import json    # noqa: PLC0415
    try:
        raw = base64.urlsafe_b64decode(token.encode("ascii") + b"==")
        payload = json.loads(raw)
        return payload.get("cid")
    except Exception:  # noqa: BLE001
        return None
