import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes_inventory import get_db_engine, memory_store

logger = logging.getLogger("sena_aapurti.audit")

router = APIRouter(tags=["Cryptographic Audit Ledger"])


@router.get("/audit/verification", status_code=status.HTTP_200_OK)
def verify_audit_ledger_chain() -> Dict[str, Any]:
    """
    Iterates through the entire `tamper_proof_audit_ledger` chain from the Genesis block,
    mathematically recomputing each SHA-256 hash link:
        H_n = SHA256(H_{n-1} || action || actor_id || payload_hash || timestamp)
    and verifying `previous_hash` continuity for real-time SIH jury inspection.
    """
    engine = get_db_engine()
    blocks: List[Dict[str, Any]] = []
    storage_backend = "POSTGIS_CRYPTO_LEDGER"

    if engine is not None:
        try:
            with engine.connect() as conn:
                query = text(
                    """
                    SELECT
                        log_id,
                        previous_hash,
                        current_hash,
                        action,
                        actor_id,
                        payload_hash,
                        to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS canonical_ts
                    FROM tamper_proof_audit_ledger
                    ORDER BY log_id ASC;
                    """
                )
                rows = conn.execute(query).mappings().all()
                for row in rows:
                    blocks.append(
                        {
                            "log_id": int(row["log_id"]),
                            "previous_hash": row["previous_hash"].strip(),
                            "current_hash": row["current_hash"].strip(),
                            "action": row["action"],
                            "actor_id": row["actor_id"],
                            "payload_hash": row["payload_hash"].strip(),
                            "timestamp": row["canonical_ts"],
                        }
                    )
        except SQLAlchemyError as exc:
            logger.warning("PostGIS audit query fallback (%s)", exc)
            storage_backend = "RESILIENT_IN_MEMORY_TWIN"

    if not blocks:
        storage_backend = "RESILIENT_IN_MEMORY_TWIN"
        blocks = list(memory_store.ledger)

    chain_intact = True
    broken_links: List[Dict[str, Any]] = []
    expected_prev_hash = "0" * 64

    for block in blocks:
        raw_material = (
            f"{block['previous_hash']}"
            f"{block['action']}"
            f"{block['actor_id']}"
            f"{block['payload_hash']}"
            f"{block['timestamp']}"
        )
        recomputed_hash = hashlib.sha256(raw_material.encode("utf-8")).hexdigest()

        prev_match = block["previous_hash"] == expected_prev_hash
        self_match = block["current_hash"] == recomputed_hash

        if not prev_match or not self_match:
            chain_intact = False
            broken_links.append(
                {
                    "log_id": block["log_id"],
                    "expected_previous_hash": expected_prev_hash,
                    "actual_previous_hash": block["previous_hash"],
                    "recomputed_hash": recomputed_hash,
                    "stored_current_hash": block["current_hash"],
                }
            )

        expected_prev_hash = block["current_hash"]

    return {
        "ledger_status": "VERIFIED_IMMUTABLE" if chain_intact else "TAMPER_DETECTED_CRITICAL",
        "chain_integrity_valid": chain_intact,
        "storage_backend": storage_backend,
        "total_blocks_verified": len(blocks),
        "genesis_anchor": "0" * 64,
        "latest_block_hash": blocks[-1]["current_hash"] if blocks else None,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "anomalies": broken_links,
        "ledger_chain": blocks,
    }
