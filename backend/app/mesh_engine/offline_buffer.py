"""
Sena Aapurti — Edge Offline Event Buffer Utility
File: backend/app/mesh_engine/offline_buffer.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Simulates a rugged tactical edge terminal (e.g. Toughbook / Handheld Rugged Tablet)
buffering offline issuance transactions locally during EW blackout conditions.
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class OfflineEvent(BaseModel):
    """Single offline logistics transaction recorded on an air-gapped rugged terminal."""

    transaction_uuid: str = Field(..., description="Unique transaction idempotency key (UUID4)")
    origin_node_id: str = Field(..., description="Outpost/Depot ID where issuance occurred")
    seq_no: int = Field(..., ge=1, description="Monotonic client-side sequence counter")
    client_timestamp: float = Field(..., description="Epoch seconds when transaction occurred")
    sku: str = Field(..., description="Item SKU code")
    delta_qty: int = Field(..., description="Quantity delta (typically negative for issuance)")
    operator_id: str = Field(..., description="Rank and service ID of logistics officer")
    proof_hash: str = Field(..., description="SHA-256 cryptographic proof of transaction contents")

    @classmethod
    def create(
        cls,
        origin_node_id: str,
        seq_no: int,
        sku: str,
        delta_qty: int,
        operator_id: str = "SUBEDAR_LOG_OFFICER",
        client_timestamp: Optional[float] = None,
        transaction_uuid: Optional[str] = None,
    ) -> OfflineEvent:
        """Constructs an OfflineEvent and computes its cryptographic proof hash."""
        tx_uuid = transaction_uuid or str(uuid.uuid4())
        ts = client_timestamp if client_timestamp is not None else time.time()

        raw_material = f"{origin_node_id}:{seq_no}:{ts:.4f}:{sku}:{delta_qty}:{operator_id}:{tx_uuid}"
        proof_hash = hashlib.sha256(raw_material.encode("utf-8")).hexdigest()

        return cls(
            transaction_uuid=tx_uuid,
            origin_node_id=origin_node_id,
            seq_no=seq_no,
            client_timestamp=ts,
            sku=sku,
            delta_qty=delta_qty,
            operator_id=operator_id,
            proof_hash=proof_hash,
        )


class MeshSyncBatch(BaseModel):
    """Bundle of buffered offline events submitted when an uplink window opens."""

    node_id: str = Field(..., description="Transmitting node ID")
    batch_id: str = Field(..., description="Unique batch identifier")
    events: List[OfflineEvent] = Field(..., description="List of buffered offline events")


class OfflineBuffer:
    """
    Simulates local SQLite / flash storage on an air-gapped rugged edge terminal.
    Maintains a local monotonic sequence counter and queues offline logistics transactions.
    """

    def __init__(self, node_id: str = "DEPOT-KGL", start_seq: int = 100) -> None:
        self.node_id = node_id
        self.current_seq = start_seq
        self._queue: List[OfflineEvent] = []

    def record_issuance(
        self,
        sku: str,
        delta_qty: int,
        operator_id: str = "SUBEDAR_LOG_OFFICER",
        timestamp_offset_hours: float = 0.0,
    ) -> OfflineEvent:
        """
        Record a local issuance transaction (e.g. issuing winter fuel or ammo).
        Appends to local buffer queue.
        """
        self.current_seq += 1
        ts = time.time() - (timestamp_offset_hours * 3600.0)

        event = OfflineEvent.create(
            origin_node_id=self.node_id,
            seq_no=self.current_seq,
            sku=sku,
            delta_qty=delta_qty,
            operator_id=operator_id,
            client_timestamp=ts,
        )
        self._queue.append(event)
        return event

    def generate_sync_batch(self, batch_id: Optional[str] = None) -> MeshSyncBatch:
        """Package buffered events into a sync batch."""
        bid = batch_id or f"BATCH-{self.node_id}-{int(time.time())}"
        return MeshSyncBatch(
            node_id=self.node_id,
            batch_id=bid,
            events=list(self._queue),
        )

    def acknowledge_sync(self, batch_id: str) -> int:
        """Clear acknowledged events after successful uplink reconciliation."""
        count = len(self._queue)
        self._queue.clear()
        return count

    @property
    def pending_count(self) -> int:
        return len(self._queue)
