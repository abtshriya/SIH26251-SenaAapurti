"""
Sena Aapurti — Outpost Connectivity & Node Health Monitor
File: backend/app/mesh_engine/node_health_monitor.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Calculates node freshness and degraded status:
- FRESH / ONLINE      : Synchronized within the last 15 minutes (< 0.25 hrs).
- DEGRADED_CACHED     : Synchronized 15 minutes to 6 hours ago (forecasts penalised).
- BLACKOUT_STALE      : Disconnected > 6 hours (total blackout, requires batch reconciliation).
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes_inventory import get_db_engine, memory_store

logger = logging.getLogger("sena_aapurti.mesh.health")

FRESH_THRESHOLD_MINUTES: float = 15.0
DEGRADED_THRESHOLD_HOURS: float = 6.0


class NodeHealthMonitor:
    """Tracks and classifies connectivity health across military outposts and logistics hubs."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        # In-memory node sync timestamps: node_id -> datetime (UTC)
        self._node_sync_timestamps: Dict[str, datetime] = {
            "UNIT-HQ-01": datetime.now(timezone.utc),
            "UNIT-FOB-ALPHA": datetime.now(timezone.utc),
            "UNIT-FOB-BRAVO": datetime.now(timezone.utc),
            "DEPOT-KGL": datetime.now(timezone.utc),
            "OUTPOST-GALWAN-04": datetime.now(timezone.utc) - timedelta(hours=18),
            "OUTPOST-DAULAT-BEG": datetime.now(timezone.utc) - timedelta(hours=36),
        }

    def record_node_sync(self, node_id: str, timestamp: Optional[datetime] = None) -> datetime:
        """Mark a node as synchronized with current UTC time."""
        with self._lock:
            ts = timestamp or datetime.now(timezone.utc)
            self._node_sync_timestamps[node_id] = ts
            return ts

    def simulate_node_blackout(self, node_id: str, hours_ago: float = 72.0) -> datetime:
        """Simulate an outage by rolling back a node's last synced timestamp."""
        with self._lock:
            ts = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
            self._node_sync_timestamps[node_id] = ts
            logger.warning("[MESH] Simulated %s-hour blackout for node '%s'", hours_ago, node_id)
            return ts

    def classify_status(self, last_synced_at: datetime, now: Optional[datetime] = None) -> Dict[str, Any]:
        """Classify a node's connectivity status based on elapsed time."""
        current_time = now or datetime.now(timezone.utc)
        elapsed_seconds = max(0.0, (current_time - last_synced_at).total_seconds())
        elapsed_hours = elapsed_seconds / 3600.0
        elapsed_minutes = elapsed_seconds / 60.0

        if elapsed_minutes < FRESH_THRESHOLD_MINUTES:
            badge = "ONLINE"
            health_mode = "FRESH"
            confidence_penalty = 0.0
        elif elapsed_hours <= DEGRADED_THRESHOLD_HOURS:
            badge = "DEGRADED"
            health_mode = "DEGRADED_CACHED"
            confidence_penalty = 0.15
        else:
            badge = "BLACKOUT"
            health_mode = "BLACKOUT_STALE"
            confidence_penalty = 0.45

        return {
            "health_mode": health_mode,
            "badge": badge,
            "unreconciled_hours": round(elapsed_hours, 2),
            "unreconciled_minutes": round(elapsed_minutes, 1),
            "confidence_penalty": confidence_penalty,
            "last_synced_at": last_synced_at.isoformat(),
        }

    def get_echelon_connectivity_status(self) -> Dict[str, Any]:
        """
        Generate complete status matrix across all tactical units in theater.
        Matches frontend telemetry tables and command dashboard expectations.
        """
        with self._lock:
            now = datetime.now(timezone.utc)
            nodes_status: List[Dict[str, Any]] = []

            # 1. Pull from DB if available
            engine = get_db_engine()
            db_sync_map: Dict[str, datetime] = {}
            if engine is not None:
                try:
                    with engine.connect() as conn:
                        rows = conn.execute(
                            text("SELECT unit_id, MAX(last_sync_timestamp) AS max_sync FROM unit_stocks GROUP BY unit_id")
                        ).mappings().all()
                        for r in rows:
                            if r["max_sync"]:
                                db_sync_map[r["unit_id"]] = r["max_sync"]
                except SQLAlchemyError as exc:
                    logger.debug("DB unit sync read fallback: %s", exc)

            # Known unit metadata
            unit_meta = {
                "UNIT-HQ-01": {"name": "Northern Command HQ (Udhampur)", "echelon": "COMMAND_HQ", "sector": "NORTHERN-COMMAND"},
                "UNIT-FOB-ALPHA": {"name": "Forward Base Siachen-Alpha", "echelon": "FORWARD_BASE", "sector": "LADAKH-SECTOR"},
                "UNIT-FOB-BRAVO": {"name": "Forward Base Kargil-Bravo", "echelon": "FORWARD_BASE", "sector": "DRASS-SECTOR"},
                "DEPOT-KGL": {"name": "Forward Logistics Depot Kargil", "echelon": "TACTICAL_DEPOT", "sector": "DRASS-SECTOR"},
                "OUTPOST-GALWAN-04": {"name": "Galwan Patrol Post 04", "echelon": "RIDGE_OUTPOST", "sector": "EASTERN-LADAKH"},
                "OUTPOST-DAULAT-BEG": {"name": "Daulat Beg Oldie Logistics Hub", "echelon": "AIRHEAD_DEPOT", "sector": "SUB-SECTOR-NORTH"},
            }

            online_cnt = 0
            degraded_cnt = 0
            blackout_cnt = 0

            for node_id, meta in unit_meta.items():
                last_ts = db_sync_map.get(node_id) or self._node_sync_timestamps.get(node_id, now)
                classification = self.classify_status(last_ts, now=now)

                badge = classification["badge"]
                if badge == "ONLINE":
                    online_cnt += 1
                elif badge == "DEGRADED":
                    degraded_cnt += 1
                else:
                    blackout_cnt += 1

                nodes_status.append({
                    "node_id": node_id,
                    "name": meta["name"],
                    "echelon": meta["echelon"],
                    "sector": meta["sector"],
                    **classification,
                })

            total_nodes = len(nodes_status)
            network_score = round(((online_cnt + (degraded_cnt * 0.5)) / max(1, total_nodes)) * 100.0, 1)

            return {
                "theater": "NORTHERN-THEATER-TACTICAL-MESH",
                "timestamp": now.isoformat(),
                "total_nodes": total_nodes,
                "online_count": online_cnt,
                "degraded_count": degraded_cnt,
                "blackout_count": blackout_cnt,
                "network_health_score_pct": network_score,
                "nodes": nodes_status,
            }


# Singleton Instance
_GLOBAL_HEALTH_MONITOR = NodeHealthMonitor()


def get_node_health_monitor() -> NodeHealthMonitor:
    return _GLOBAL_HEALTH_MONITOR
