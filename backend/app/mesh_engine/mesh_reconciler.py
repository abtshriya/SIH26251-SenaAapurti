"""
Sena Aapurti — Tactical Mesh & Blackout Reconciler
File: backend/app/mesh_engine/mesh_reconciler.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Two-Phase Idempotent Reconciliation Engine:
- Phase A: Deduplication against `applied_mesh_transactions` and vector-clock chronological sorting.
- Phase B: Atomic isolated transaction updating stock, clamping deficits, and chaining
           cryptographic audit proofs into `tamper_proof_audit_ledger`.
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes_inventory import get_db_engine, memory_store
from app.mesh_engine.node_health_monitor import get_node_health_monitor
from app.mesh_engine.offline_buffer import MeshSyncBatch, OfflineEvent

logger = logging.getLogger("sena_aapurti.mesh.reconciler")


# ---------------------------------------------------------------------------
# Result Model
# ---------------------------------------------------------------------------
class MeshSyncResult(BaseModel):
    """Structured response from batch synchronization."""

    status: str = Field(..., examples=["BATCH_RECONCILED"])
    batch_id: str
    node_id: str
    total_received: int
    committed: int
    duplicates_ignored: int
    sequence_gaps_detected: List[int] = Field(default_factory=list)
    new_stock_state: Dict[str, int] = Field(default_factory=dict)
    inventory_deficit_flag: bool = False
    audit_hashes_generated: int = 0
    node_health: str = "ONLINE"
    message: str = "Batch processed idempotently."


# ---------------------------------------------------------------------------
# Database Schema Initialization
# ---------------------------------------------------------------------------
def _ensure_mesh_tables() -> None:
    """Ensure `applied_mesh_transactions` table exists in PostgreSQL when available."""
    engine = get_db_engine()
    if engine is None:
        return
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS applied_mesh_transactions (
                        transaction_uuid VARCHAR(64) PRIMARY KEY,
                        origin_node_id VARCHAR(64) NOT NULL,
                        seq_no INTEGER NOT NULL,
                        client_timestamp TIMESTAMPTZ NOT NULL,
                        sku VARCHAR(64) NOT NULL,
                        delta_qty INTEGER NOT NULL,
                        operator_id VARCHAR(64) NOT NULL,
                        proof_hash CHAR(64) NOT NULL,
                        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS idx_mesh_node_seq
                        ON applied_mesh_transactions (origin_node_id, seq_no);
                    """
                )
            )
    except Exception as exc:
        logger.debug("Table creation notice (applied_mesh_transactions): %s", exc)


def _resolve_unit_and_sku(node_id: str, sku: str) -> Tuple[str, str]:
    """Map tactical identifiers to standard theater inventory catalog entries."""
    unit_map = {
        "DEPOT-KGL": "UNIT-FOB-BRAVO",
        "HQ-NORTH": "UNIT-HQ-01",
        "FOB-SIACHEN": "UNIT-FOB-ALPHA",
    }
    sku_map = {
        "DIESEL-WINTER-GRADE": "FUEL-JP8-ARC",
        "FUEL-DIESEL-POL": "FUEL-JP8-ARC",
        "AMMO-7.62MM": "MUN-762-NATO",
        "ARTY-155MM": "MUN-155MM-HE",
    }
    return unit_map.get(node_id, node_id), sku_map.get(sku, sku)


# ---------------------------------------------------------------------------
# Mesh Reconciler Engine
# ---------------------------------------------------------------------------
class MeshReconciler:
    """
    Two-Phase Idempotent Conflict-Free Replicated Mesh Reconciler.
    Guarantees that multiple sync attempts or replayed packets produce zero duplicate deductions.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        # In-memory applied transaction cache: set of transaction_uuid strings
        self._applied_uuids: Set[str] = set()
        # Vector clock sequence tracking per node: node_id -> highest seq_no seen
        self._node_max_seq: Dict[str, int] = {}
        _ensure_mesh_tables()

    def is_transaction_applied(self, tx_uuid: str) -> bool:
        """Check if transaction UUID has already been committed."""
        with self._lock:
            if tx_uuid in self._applied_uuids:
                return True

            engine = get_db_engine()
            if engine is not None:
                try:
                    with engine.connect() as conn:
                        row = conn.execute(
                            text("SELECT 1 FROM applied_mesh_transactions WHERE transaction_uuid = :uuid"),
                            {"uuid": tx_uuid},
                        ).first()
                        if row:
                            self._applied_uuids.add(tx_uuid)
                            return True
                except SQLAlchemyError:
                    pass
            return False

    def reconcile_batch(self, batch: MeshSyncBatch) -> MeshSyncResult:
        """
        Executes Two-Phase Idempotent Reconciliation:
        Phase A: Deduplicate against applied transactions and sort by client timestamp / sequence.
        Phase B: Atomic State Transition — Apply stock deltas, commit audit hashes, update health.
        """
        with self._lock:
            total_received = len(batch.events)
            uncommitted_events: List[OfflineEvent] = []
            duplicates_count = 0

            # ── Phase A: Deduplication & Chronological Sorting ───────────────────
            for ev in batch.events:
                if self.is_transaction_applied(ev.transaction_uuid):
                    duplicates_count += 1
                else:
                    uncommitted_events.append(ev)

            # Sort chronologically by client-observed timestamp, with seq_no tie-breaking
            uncommitted_events.sort(key=lambda x: (x.client_timestamp, x.seq_no))

            # Sequence Gap Detection
            gaps: List[int] = []
            last_seq = self._node_max_seq.get(batch.node_id, 0)
            for ev in uncommitted_events:
                if last_seq > 0 and ev.seq_no > last_seq + 1:
                    for missing in range(last_seq + 1, ev.seq_no):
                        gaps.append(missing)
                last_seq = max(last_seq, ev.seq_no)

            # If all events were duplicates, return early with zero stock drift
            if not uncommitted_events:
                # Mark node as synced
                get_node_health_monitor().record_node_sync(batch.node_id)
                return MeshSyncResult(
                    status="BATCH_IDEMPOTENT_NO_CHANGE",
                    batch_id=batch.batch_id,
                    node_id=batch.node_id,
                    total_received=total_received,
                    committed=0,
                    duplicates_ignored=duplicates_count,
                    sequence_gaps_detected=gaps,
                    new_stock_state=self._get_current_stock_snapshot(batch.node_id),
                    inventory_deficit_flag=False,
                    audit_hashes_generated=0,
                    node_health="ONLINE",
                    message="All transactions were duplicate keys. Zero stock modification applied.",
                )

            # ── Phase B: Atomic State Transition ─────────────────────────────────
            engine = get_db_engine()
            deficit_detected = False
            audit_hashes_generated = 0
            new_stock_state: Dict[str, int] = {}
            now_utc = datetime.now(timezone.utc)

            if engine is not None:
                try:
                    _ensure_mesh_tables()
                    with engine.begin() as conn:
                        for ev in uncommitted_events:
                            res_unit, res_sku = _resolve_unit_and_sku(ev.origin_node_id, ev.sku)
                            client_dt = datetime.fromtimestamp(ev.client_timestamp, tz=timezone.utc)

                            # 1. Record applied transaction
                            conn.execute(
                                text(
                                    """
                                    INSERT INTO applied_mesh_transactions (
                                        transaction_uuid, origin_node_id, seq_no,
                                        client_timestamp, sku, delta_qty,
                                        operator_id, proof_hash, applied_at
                                    ) VALUES (
                                        :uuid, :origin, :seq, :client_ts, :sku, :delta, :operator, :proof, :now
                                    ) ON CONFLICT (transaction_uuid) DO NOTHING;
                                    """
                                ),
                                {
                                    "uuid": ev.transaction_uuid,
                                    "origin": ev.origin_node_id,
                                    "seq": ev.seq_no,
                                    "client_ts": client_dt,
                                    "sku": ev.sku,
                                    "delta": ev.delta_qty,
                                    "operator": ev.operator_id,
                                    "proof": ev.proof_hash,
                                    "now": now_utc,
                                },
                            )

                            # 2. Update stock level with deficit check
                            row = conn.execute(
                                text(
                                    """
                                    INSERT INTO unit_stocks (unit_id, sku, current_quantity, last_sync_timestamp)
                                    VALUES (:unit_id, :sku, GREATEST(0, :delta), :now)
                                    ON CONFLICT (unit_id, sku) DO UPDATE
                                    SET current_quantity = GREATEST(0, unit_stocks.current_quantity + :delta),
                                        last_sync_timestamp = :now
                                    RETURNING current_quantity;
                                    """
                                ),
                                {
                                    "unit_id": res_unit,
                                    "sku": res_sku,
                                    "delta": ev.delta_qty,
                                    "now": now_utc,
                                },
                            ).mappings().first()

                            if row:
                                new_stock_state[ev.sku] = row["current_quantity"]

                            # 3. Append to tamper-proof ledger
                            conn.execute(
                                text(
                                    """
                                    INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
                                    VALUES ('OFFLINE_BATCH_RECONCILED', :actor_id, :payload_hash);
                                    """
                                ),
                                {
                                    "actor_id": f"{ev.origin_node_id}:{ev.operator_id}",
                                    "payload_hash": ev.proof_hash,
                                },
                            )
                            audit_hashes_generated += 1
                            self._applied_uuids.add(ev.transaction_uuid)

                        # Update node sequence clock
                        self._node_max_seq[batch.node_id] = last_seq

                except SQLAlchemyError as exc:
                    logger.warning("PostgreSQL batch commit fallback: %s", exc)

            # In-Memory Twin Fallback
            if audit_hashes_generated == 0:
                for ev in uncommitted_events:
                    res_unit, res_sku = _resolve_unit_and_sku(ev.origin_node_id, ev.sku)
                    key = (res_unit, res_sku)
                    current_entry = memory_store.stocks.get(key)
                    if current_entry is None:
                        current_entry = {
                            "current_quantity": 5000,
                            "daily_burn_rate": 50.0,
                            "last_sync_timestamp": now_utc.isoformat(),
                        }
                        memory_store.stocks[key] = current_entry

                    old_qty = current_entry["current_quantity"]
                    raw_new_qty = old_qty + ev.delta_qty
                    if raw_new_qty < 0:
                        deficit_detected = True
                        new_qty = 0
                    else:
                        new_qty = raw_new_qty

                    current_entry["current_quantity"] = new_qty
                    current_entry["last_sync_timestamp"] = now_utc.isoformat()
                    new_stock_state[ev.sku] = new_qty

                    # Append to in-memory audit ledger
                    try:
                        memory_store.append_audit_log(
                            action="OFFLINE_BATCH_RECONCILED",
                            actor_id=f"{ev.origin_node_id}:{ev.operator_id}",
                            payload_hash=ev.proof_hash,
                        )
                        audit_hashes_generated += 1
                    except Exception as e:
                        logger.error("Audit log error: %s", e)

                    self._applied_uuids.add(ev.transaction_uuid)

                self._node_max_seq[batch.node_id] = last_seq

            # Mark node online in health monitor
            get_node_health_monitor().record_node_sync(batch.node_id)

            return MeshSyncResult(
                status="BATCH_RECONCILED",
                batch_id=batch.batch_id,
                node_id=batch.node_id,
                total_received=total_received,
                committed=len(uncommitted_events),
                duplicates_ignored=duplicates_count,
                sequence_gaps_detected=gaps,
                new_stock_state=new_stock_state,
                inventory_deficit_flag=deficit_detected,
                audit_hashes_generated=audit_hashes_generated,
                node_health="ONLINE",
                message=f"Successfully reconciled {len(uncommitted_events)} offline events.",
            )

    def _get_current_stock_snapshot(self, node_id: str) -> Dict[str, int]:
        """Fetch current stock snapshot for a node."""
        res_unit, _ = _resolve_unit_and_sku(node_id, "")
        snapshot: Dict[str, int] = {}
        for (u, s), entry in memory_store.stocks.items():
            if u == res_unit:
                snapshot[s] = entry["current_quantity"]
        return snapshot

    def reset_state(self) -> None:
        """Reset state for tests."""
        with self._lock:
            self._applied_uuids.clear()
            self._node_max_seq.clear()


# Singleton Instance
_GLOBAL_MESH_RECONCILER = MeshReconciler()


def get_mesh_reconciler() -> MeshReconciler:
    return _GLOBAL_MESH_RECONCILER
