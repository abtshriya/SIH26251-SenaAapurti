import hashlib
import hmac
import json
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import jwt
from fastapi import Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings


class TelemetryEnvelope(BaseModel):
    """Signed IoT Edge Sensor Telemetry Payload."""

    device_id: str = Field(..., examples=["SENSOR-FOB-ALPHA-01"])
    unit_id: str = Field(..., examples=["UNIT-FOB-ALPHA"])
    sku: str = Field(..., examples=["MUN-155MM-HE"])
    reported_quantity: int = Field(..., ge=0, examples=[440])
    sequence_id: int = Field(..., ge=1, examples=[1001])
    nonce: str = Field(..., min_length=8, max_length=128, examples=["nonce-alpha-998123"])
    timestamp: datetime = Field(
        ..., description="ISO-8601 UTC timestamp from edge cryptographic clock"
    )
    signature: str = Field(
        ...,
        min_length=64,
        max_length=64,
        description="Hex-encoded HMAC-SHA256 signature over canonical telemetry fields",
    )


class ReplayAttackShield:
    """
    Thread-safe sliding-window Nonce & Monotonic Sequence tracker.
    Protects edge telemetry ingestion from packet capture & replay attacks.
    """

    def __init__(self, ttl_seconds: int = 900) -> None:
        self._ttl_seconds = ttl_seconds
        self._seen_nonces: Dict[str, float] = {}
        self._device_sequences: Dict[str, int] = {}
        self._lock = threading.Lock()

    def _evict_expired(self, now_epoch: float) -> None:
        cutoff = now_epoch - self._ttl_seconds
        expired = [n for n, ts in self._seen_nonces.items() if ts < cutoff]
        for nonce in expired:
            del self._seen_nonces[nonce]

    def verify_and_register(
        self, device_id: str, nonce: str, sequence_id: int, now_epoch: float
    ) -> None:
        with self._lock:
            self._evict_expired(now_epoch)

            composite_nonce = f"{device_id}:{nonce}"
            if composite_nonce in self._seen_nonces:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error_code": "REPLAY_ATTACK_DETECTED",
                        "message": f"Duplicate cryptographic nonce '{nonce}' rejected for device '{device_id}'.",
                        "zero_trust_policy": "SLIDING_WINDOW_NONCE_SHIELD",
                    },
                )

            last_seq = self._device_sequences.get(device_id)
            if last_seq is not None and sequence_id <= last_seq:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error_code": "MONOTONIC_SEQUENCE_VIOLATION",
                        "message": (
                            f"Out-of-order or replayed sequence_id={sequence_id} "
                            f"(last committed sequence_id={last_seq}) for device '{device_id}'."
                        ),
                        "zero_trust_policy": "MONOTONIC_SEQUENCE_ENFORCEMENT",
                    },
                )

            self._seen_nonces[composite_nonce] = now_epoch
            self._device_sequences[device_id] = sequence_id


replay_shield = ReplayAttackShield(ttl_seconds=settings.NONCE_TTL_SECONDS)


def canonicalize_telemetry_payload(
    device_id: str,
    unit_id: str,
    sku: str,
    reported_quantity: int,
    sequence_id: int,
    nonce: str,
    timestamp_iso: str,
) -> bytes:
    """
    Produces a deterministic, canonical byte representation of telemetry fields
    for HMAC-SHA256 signing and verification.
    """
    canonical_dict = {
        "device_id": device_id,
        "nonce": nonce,
        "reported_quantity": reported_quantity,
        "sequence_id": sequence_id,
        "sku": sku,
        "timestamp": timestamp_iso,
        "unit_id": unit_id,
    }
    return json.dumps(canonical_dict, sort_keys=True, separators=(",", ":")).encode("utf-8")


def compute_telemetry_hmac(
    secret_key: str,
    device_id: str,
    unit_id: str,
    sku: str,
    reported_quantity: int,
    sequence_id: int,
    nonce: str,
    timestamp_iso: str,
) -> str:
    """Computes hex-encoded HMAC-SHA256 over canonical telemetry fields."""
    message = canonicalize_telemetry_payload(
        device_id=device_id,
        unit_id=unit_id,
        sku=sku,
        reported_quantity=reported_quantity,
        sequence_id=sequence_id,
        nonce=nonce,
        timestamp_iso=timestamp_iso,
    )
    return hmac.new(secret_key.encode("utf-8"), message, hashlib.sha256).hexdigest()


def verify_telemetry_security(envelope: TelemetryEnvelope) -> str:
    """
    Enforces the 3-tier Zero Trust Telemetry Gateway checks:
    1. Clock Skew Rejection (drift > 300 seconds -> 401/400)
    2. Constant-Time HMAC-SHA256 Payload Integrity Verification (-> 401 Unauthorized)
    3. Sliding-Window Nonce & Monotonic Sequence Replay Shield (-> 409 Conflict)

    Returns the SHA-256 payload hash for commitment to the tamper-proof audit ledger.
    """
    now_utc = datetime.now(timezone.utc)
    pkt_ts = envelope.timestamp
    if pkt_ts.tzinfo is None:
        pkt_ts = pkt_ts.replace(tzinfo=timezone.utc)
    else:
        pkt_ts = pkt_ts.astimezone(timezone.utc)

    # 1. Clock Skew Verification
    clock_drift = abs((now_utc - pkt_ts).total_seconds())
    if clock_drift > settings.MAX_CLOCK_SKEW_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "CLOCK_SKEW_EXCEEDED",
                "message": (
                    f"Telemetry timestamp drift ({clock_drift:.1f}s) exceeds maximum "
                    f"allowed threshold ({settings.MAX_CLOCK_SKEW_SECONDS}s)."
                ),
                "zero_trust_policy": "TEMPORAL_WINDOW_ENFORCEMENT",
            },
        )

    # 2. Pre-shared Device Secret Lookup & HMAC-SHA256 Verification
    device_secret = settings.DEVICE_REGISTRY_SECRETS.get(
        envelope.device_id, settings.IOT_HMAC_SECRET
    )
    timestamp_iso = pkt_ts.strftime("%Y-%m-%dT%H:%M:%SZ")
    expected_mac = compute_telemetry_hmac(
        secret_key=device_secret,
        device_id=envelope.device_id,
        unit_id=envelope.unit_id,
        sku=envelope.sku,
        reported_quantity=envelope.reported_quantity,
        sequence_id=envelope.sequence_id,
        nonce=envelope.nonce,
        timestamp_iso=timestamp_iso,
    )

    if not hmac.compare_digest(expected_mac.lower(), envelope.signature.lower()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "HMAC_SIGNATURE_MISMATCH",
                "message": "Cryptographic HMAC-SHA256 verification failed. Possible MITM payload tampering.",
                "zero_trust_policy": "HMAC_SHA256_INTEGRITY_GATE",
            },
        )

    # 3. Replay-Attack Shield (Nonce & Monotonic Sequence Check)
    replay_shield.verify_and_register(
        device_id=envelope.device_id,
        nonce=envelope.nonce,
        sequence_id=envelope.sequence_id,
        now_epoch=now_utc.timestamp(),
    )

    canonical_bytes = canonicalize_telemetry_payload(
        device_id=envelope.device_id,
        unit_id=envelope.unit_id,
        sku=envelope.sku,
        reported_quantity=envelope.reported_quantity,
        sequence_id=envelope.sequence_id,
        nonce=envelope.nonce,
        timestamp_iso=timestamp_iso,
    )
    return hashlib.sha256(canonical_bytes).hexdigest()


async def require_step_up_mfa(
    x_stepup_token: Optional[str] = Header(default=None, alias="X-StepUp-Token"),
) -> Dict[str, Any]:
    """
    FastAPI Dependency enforcing Hardware Step-Up MFA (`X-StepUp-Token`)
    for high-impact command actions (e.g., emergency munition requisition approvals).
    Accepts either the configured hardware token secret or a signed Step-Up JWT.
    """
    if not x_stepup_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "STEP_UP_MFA_REQUIRED",
                "message": "High-impact requisition approval requires hardware Step-Up MFA header 'X-StepUp-Token'.",
                "zero_trust_policy": "STEP_UP_MFA_ENFORCEMENT",
            },
        )

    # Direct hardware OTP / pre-shared YubiKey challenge verification
    if hmac.compare_digest(x_stepup_token, settings.STEP_UP_MFA_SECRET):
        return {
            "mfa_verified": True,
            "method": "HARDWARE_YUBIKEY_TOKEN",
            "actor_clearance": "LEVEL_4_COMMANDER",
        }

    # Fallback: Signed JWT with mfa_step_up == True
    try:
        decoded = jwt.decode(
            x_stepup_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if decoded.get("mfa_step_up") is True:
            return {
                "mfa_verified": True,
                "method": "STEP_UP_SIGNED_JWT",
                "actor_clearance": decoded.get("clearance", "LEVEL_4_COMMANDER"),
            }
    except jwt.PyJWTError:
        pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "error_code": "STEP_UP_MFA_REQUIRED",
            "message": "Invalid or expired 'X-StepUp-Token' credential presented for Step-Up MFA challenge.",
            "zero_trust_policy": "STEP_UP_MFA_ENFORCEMENT",
        },
    )
