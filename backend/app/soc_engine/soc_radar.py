"""
Sena Aapurti — Tactical Sensor Spoofing Detection Engine (SOC Radar)
File: backend/app/soc_engine/soc_radar.py
Classification: RESTRICTED // DEFENSE OPERATIONS (SIH26251)

Multi-Layered Telemetry Validator:
1. Cryptographic HMAC-SHA256 signature verification over canonical payload keys.
2. Sliding-window nonce replay detection with clock drift bounds (|T_server - T_packet| <= 300s).
3. Kinematic impossibility & GPS velocity bounds analysis:
   Speed = Haversine(Point_A, Point_B) / Delta_t.
   Flags speeds > 70 km/h in mountainous theater as GPS_VELOCITY_SPOOFING.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple, Union

from pydantic import BaseModel, Field, field_validator

from app.core.config import settings


# ---------------------------------------------------------------------------
# Constants & Operational Limits
# ---------------------------------------------------------------------------
MAX_MOUNTAIN_SPEED_KMH: float = 70.0    # Mountain route limit for armored/tactical supply
MAX_CLOCK_SKEW_SECONDS: int = 300      # 5-minute allowable drift
DEFAULT_NONCE_TTL: int = 900           # 15-minute sliding replay window
EARTH_RADIUS_KM: float = 6371.0        # Mean Earth radius for Haversine


# ---------------------------------------------------------------------------
# Pydantic Sensor Telemetry Model
# ---------------------------------------------------------------------------
class SensorTelemetryPacket(BaseModel):
    """
    Standardized Tactical IoT Sensor Telemetry Packet.
    Originates from field RFID weighbridges, fuel tank sensors, or convoy transponders.
    """

    device_id: str = Field(..., examples=["RFID-LOC-KGL-01"], description="Physical IoT transponder/sensor ID")
    timestamp: Union[int, float] = Field(..., description="Epoch seconds when telemetry was captured at sensor")
    nonce: str = Field(..., min_length=8, description="Cryptographic unique token (UUID4)")
    unit_id: str = Field(..., examples=["DEPOT-KGL"], description="Destination or reporting operational unit ID")
    sku: str = Field(..., examples=["AMMO-7.62MM"], description="Item SKU code")
    delta_qty: int = Field(..., description="Quantity delta (+ for restock, - for field consumption)")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="WGS84 latitude coordinate")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="WGS84 longitude coordinate")
    signature: str = Field(..., min_length=16, description="HMAC-SHA256 hex digest over canonical payload")

    @field_validator("device_id", "unit_id", "sku", "nonce")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


# ---------------------------------------------------------------------------
# Security Anomaly Exception
# ---------------------------------------------------------------------------
class ThreatDetectedException(Exception):
    """
    Raised when SOC Radar detects an intrusion, tampering, replay, or kinematic anomaly.
    """

    def __init__(
        self,
        attack_type: str,
        error_code: str,
        severity: str,
        detail: str,
        http_status: int,
        device_id: str,
        payload_dump: Dict[str, Any],
    ) -> None:
        super().__init__(detail)
        self.attack_type = attack_type
        self.error_code = error_code
        self.severity = severity          # LOW, MEDIUM, HIGH, CRITICAL
        self.detail = detail
        self.http_status = http_status    # 401, 403, 409, 422
        self.device_id = device_id
        self.payload_dump = payload_dump
        self.detected_at = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "attack_type": self.attack_type,
            "severity": self.severity,
            "detail": self.detail,
            "device_id": self.device_id,
            "detected_at": self.detected_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Cryptographic Canonicalization & Signing Utilities
# ---------------------------------------------------------------------------
def canonicalize_packet_dict(data: Dict[str, Any]) -> bytes:
    """
    Produce a deterministic byte representation of telemetry keys (excluding 'signature').
    Uses sorted keys and uniform JSON separators to guarantee canonical evaluation.
    Floats are normalized to 6 decimal places to prevent platform precision differences.
    """
    canonical_dict: Dict[str, Any] = {}
    for k in sorted(data.keys()):
        if k == "signature":
            continue
        val = data[k]
        if isinstance(val, float):
            canonical_dict[k] = round(val, 6)
        else:
            canonical_dict[k] = val

    canonical_str = json.dumps(canonical_dict, sort_keys=True, separators=(",", ":"))
    return canonical_str.encode("utf-8")


def compute_payload_hash(data: Dict[str, Any]) -> str:
    """Compute SHA-256 digest of canonical payload for tamper-proof ledger linking."""
    return hashlib.sha256(canonicalize_packet_dict(data)).hexdigest()


def compute_hmac_signature(data: Dict[str, Any], secret_hex: str) -> str:
    """Compute HMAC-SHA256 signature for telemetry packet."""
    canonical_bytes = canonicalize_packet_dict(data)
    key_bytes = bytes.fromhex(secret_hex) if len(secret_hex) == 64 else secret_hex.encode("utf-8")
    return hmac.new(key_bytes, canonical_bytes, hashlib.sha256).hexdigest()


def get_device_secret(device_id: str) -> str:
    """
    Resolve node-specific pre-shared symmetrical secret.
    Falls back to global IOT_HMAC_SECRET if device not specifically provisioned.
    """
    return settings.DEVICE_REGISTRY_SECRETS.get(device_id, settings.IOT_HMAC_SECRET)


def generate_signed_telemetry(
    device_id: str = "RFID-LOC-KGL-01",
    unit_id: str = "DEPOT-KGL",
    sku: str = "AMMO-7.62MM",
    delta_qty: int = -20,
    latitude: float = 34.5539,
    longitude: float = 76.1320,
    secret_hex: Optional[str] = None,
    timestamp: Optional[Union[int, float]] = None,
    nonce: Optional[str] = None,
) -> SensorTelemetryPacket:
    """Helper to generate an authentically signed telemetry packet for tests and sensors."""
    import uuid

    ts = float(timestamp if timestamp is not None else time.time())
    nc = nonce or str(uuid.uuid4())
    secret = secret_hex or get_device_secret(device_id)

    raw_dict: Dict[str, Any] = {
        "device_id": device_id,
        "timestamp": ts,
        "nonce": nc,
        "unit_id": unit_id,
        "sku": sku,
        "delta_qty": delta_qty,
        "latitude": latitude,
        "longitude": longitude,
    }

    sig = compute_hmac_signature(raw_dict, secret)
    raw_dict["signature"] = sig
    return SensorTelemetryPacket(**raw_dict)


# ---------------------------------------------------------------------------
# Kinematic Math: Haversine Distance & Velocity
# ---------------------------------------------------------------------------
def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return EARTH_RADIUS_KM * c


# ---------------------------------------------------------------------------
# State Trackers: Nonce Sliding Window & Kinematic History
# ---------------------------------------------------------------------------
class _KinematicTracker:
    """Thread-safe location and velocity history tracker for edge transponders."""

    def __init__(self) -> None:
        self._history: Dict[str, Tuple[float, float, float]] = {}  # device_id -> (lat, lon, epoch_ts)
        self._lock = threading.RLock()

    def record_and_verify(
        self, device_id: str, lat: float, lon: float, ts: float, max_speed_kmh: float = MAX_MOUNTAIN_SPEED_KMH
    ) -> Tuple[bool, float, float]:
        """
        Calculates speed between consecutive fixes.
        Returns: (is_valid, calculated_speed_kmh, distance_km)
        Raises ThreatDetectedException if impossible velocity is observed.
        """
        with self._lock:
            last_fix = self._history.get(device_id)
            if last_fix is None:
                # First observation: record fix and pass
                self._history[device_id] = (lat, lon, ts)
                return True, 0.0, 0.0

            last_lat, last_lon, last_ts = last_fix
            delta_t_seconds = ts - last_ts
            dist_km = haversine_distance_km(last_lat, last_lon, lat, lon)

            # If telemetry is from the past or identical time with displacement:
            if delta_t_seconds <= 0.0:
                if dist_km > 0.05:  # Moved > 50m in 0 or negative time
                    raise ThreatDetectedException(
                        attack_type="GPS_VELOCITY_SPOOFING",
                        error_code="GPS_VELOCITY_SPOOFING",
                        severity="CRITICAL",
                        detail=(
                            f"Kinematic Teleportation Detected: Device displaced {dist_km:.2f} km "
                            f"in {delta_t_seconds:.1f}s (violates physical causal continuity)."
                        ),
                        http_status=422,
                        device_id=device_id,
                        payload_dump={"lat": lat, "lon": lon, "last_lat": last_lat, "last_lon": last_lon, "dt": delta_t_seconds},
                    )
                # Same position, zero speed
                return True, 0.0, dist_km

            speed_kmh = dist_km / (delta_t_seconds / 3600.0)

            if speed_kmh > max_speed_kmh:
                raise ThreatDetectedException(
                    attack_type="GPS_VELOCITY_SPOOFING",
                    error_code="GPS_VELOCITY_SPOOFING",
                    severity="CRITICAL",
                    detail=(
                        f"Impossible Kinematic Velocity: Calculated speed {speed_kmh:.1f} km/h "
                        f"exceeds {max_speed_kmh:.1f} km/h mountainous theater bound "
                        f"({dist_km:.2f} km traversed in {delta_t_seconds:.1f}s)."
                    ),
                    http_status=422,
                    device_id=device_id,
                    payload_dump={
                        "lat": lat,
                        "lon": lon,
                        "dist_km": round(dist_km, 3),
                        "delta_t_seconds": round(delta_t_seconds, 1),
                        "speed_kmh": round(speed_kmh, 1),
                        "max_allowed": max_speed_kmh,
                    },
                )

            # Valid motion: update tracking state
            self._history[device_id] = (lat, lon, ts)
            return True, speed_kmh, dist_km

    def reset_device(self, device_id: str) -> None:
        with self._lock:
            self._history.pop(device_id, None)

    def clear(self) -> None:
        with self._lock:
            self._history.clear()


class _NonceSlidingWindow:
    """Thread-safe nonce tracker with automatic eviction."""

    def __init__(self, ttl_seconds: int = DEFAULT_NONCE_TTL) -> None:
        self._ttl_seconds = ttl_seconds
        self._seen: Dict[str, float] = {}  # "device_id:nonce" -> epoch_ts
        self._lock = threading.RLock()

    def _evict(self, now: float) -> None:
        cutoff = now - self._ttl_seconds
        expired = [k for k, ts in self._seen.items() if ts < cutoff]
        for k in expired:
            del self._seen[k]

    def check_and_register(self, device_id: str, nonce: str, current_ts: float) -> None:
        with self._lock:
            self._evict(current_ts)
            key = f"{device_id}:{nonce}"
            if key in self._seen:
                raise ThreatDetectedException(
                    attack_type="REPLAY_ATTACK_DETECTED",
                    error_code="REPLAY_ATTACK_DETECTED",
                    severity="HIGH",
                    detail=(
                        f"Cryptographic Replay Detected: Nonce '{nonce}' has already been "
                        f"consumed for device '{device_id}' within sliding window."
                    ),
                    http_status=409,
                    device_id=device_id,
                    payload_dump={"nonce": nonce, "device_id": device_id},
                )
            self._seen[key] = current_ts

    def reset(self) -> None:
        with self._lock:
            self._seen.clear()


# ---------------------------------------------------------------------------
# SOC Radar Engine
# ---------------------------------------------------------------------------
class SOCRadarEngine:
    """
    Central Threat Evaluator for Tactical Edge Telemetry.
    Validates packets through cryptographic, temporal, and physical domain checks.
    """

    def __init__(self) -> None:
        self.kinematics = _KinematicTracker()
        self.replay_window = _NonceSlidingWindow(ttl_seconds=DEFAULT_NONCE_TTL)
        self._verified_packet_count: int = 0
        self._lock = threading.RLock()

    def evaluate_telemetry(
        self,
        packet: SensorTelemetryPacket,
        current_time: Optional[float] = None,
        quarantine_check_callback: Optional[Any] = None,
    ) -> Tuple[bool, str, float, float]:
        """
        Execute 4-Step Zero-Trust Security Pipeline:
        0. Device Quarantine Enforcement.
        1. HMAC-SHA256 Signature Verification.
        2. Cryptographic Nonce Sliding-Window Replay Check.
        3. Clock Skew Bounds Analysis (|T_server - T_packet| <= 300s).
        4. Kinematic Haversine Velocity Analysis (Speed <= 70 km/h).

        Returns: (is_valid, payload_hash, calculated_speed_kmh, distance_km)
        Raises: ThreatDetectedException on any violation.
        """
        now = current_time if current_time is not None else time.time()
        packet_dict = packet.model_dump()
        payload_hash = compute_payload_hash(packet_dict)

        # ── Step 0: Quarantine Gate ──────────────────────────────────────────
        if quarantine_check_callback:
            is_quarantined, until = quarantine_check_callback(packet.device_id)
            if is_quarantined:
                raise ThreatDetectedException(
                    attack_type="DEVICE_QUARANTINED",
                    error_code="DEVICE_QUARANTINED",
                    severity="CRITICAL",
                    detail=(
                        f"Device '{packet.device_id}' is blacklisted in active quarantine "
                        f"until {until} due to prior security breach."
                    ),
                    http_status=403,
                    device_id=packet.device_id,
                    payload_dump=packet_dict,
                )

        # ── Step A: HMAC Verification ────────────────────────────────────────
        secret = get_device_secret(packet.device_id)
        expected_sig = compute_hmac_signature(packet_dict, secret)

        if not hmac.compare_digest(expected_sig, packet.signature):
            raise ThreatDetectedException(
                attack_type="MITM_SIGNATURE_TAMPERING",
                error_code="MITM_SIGNATURE_TAMPERING",
                severity="CRITICAL",
                detail=(
                    f"Cryptographic HMAC Mismatch on device '{packet.device_id}'. "
                    f"Sensor payload compromised in transit — possible phantom depletion injection."
                ),
                http_status=401,
                device_id=packet.device_id,
                payload_dump=packet_dict,
            )

        # ── Step B: Replay Defense ───────────────────────────────────────────
        self.replay_window.check_and_register(packet.device_id, packet.nonce, now)

        # ── Step C: Clock Skew Check ─────────────────────────────────────────
        skew = abs(now - float(packet.timestamp))
        if skew > MAX_CLOCK_SKEW_SECONDS:
            raise ThreatDetectedException(
                attack_type="TIMESTAMP_DRIFT_EXPLOIT",
                error_code="TIMESTAMP_DRIFT_EXPLOIT",
                severity="MEDIUM",
                detail=(
                    f"Clock Skew Violation: Telemetry timestamp drift {skew:.1f}s exceeds "
                    f"maximum tolerance of {MAX_CLOCK_SKEW_SECONDS}s."
                ),
                http_status=401,
                device_id=packet.device_id,
                payload_dump={"packet_ts": packet.timestamp, "server_ts": now, "skew": skew},
            )

        # ── Step D: Kinematic Speed Analysis ─────────────────────────────────
        _, speed_kmh, dist_km = self.kinematics.record_and_verify(
            packet.device_id,
            packet.latitude,
            packet.longitude,
            float(packet.timestamp),
            max_speed_kmh=MAX_MOUNTAIN_SPEED_KMH,
        )

        with self._lock:
            self._verified_packet_count += 1

        return True, payload_hash, speed_kmh, dist_km

    @property
    def total_verified(self) -> int:
        with self._lock:
            return self._verified_packet_count

    def reset_state(self) -> None:
        """Reset state for tests."""
        self.kinematics.clear()
        self.replay_window.reset()
        with self._lock:
            self._verified_packet_count = 0


# Singleton Instance
_GLOBAL_SOC_RADAR = SOCRadarEngine()


def get_soc_radar() -> SOCRadarEngine:
    return _GLOBAL_SOC_RADAR
