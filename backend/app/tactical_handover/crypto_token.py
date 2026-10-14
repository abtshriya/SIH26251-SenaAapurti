# =============================================================================
# SENA AAPURTI — Cryptographic Token Engine
# File: backend/app/tactical_handover/crypto_token.py
# Classification: RESTRICTED // SIH PROTOTYPE (SIH26251)
#
# Implements HMAC-SHA256 signed consignment manifests for air-gapped
# tactical delivery verification in electronic-warfare blackout zones.
# =============================================================================
"""
Cryptographic Token Engine for Tactical Blind-Drop Manifests.

Design Principles:
  - HMAC-SHA256 over a deterministic canonical JSON string (keys sorted).
  - Temporal freshness enforced via `issued_at` / `expires_at` epoch windows.
  - Monotonic nonce registry (thread-safe in-memory set) eliminates replay.
  - `hmac.compare_digest` used throughout to prevent timing-oracle attacks.
  - Manifest serialised as compact JSON → Base64url (URL-safe, no padding) for
    NFC tag memory efficiency and QR code density minimisation.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, FrozenSet, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("sena_aapurti.tactical_handover.crypto")

# ---------------------------------------------------------------------------
# Tactical Symmetric Key — loaded from environment / config at startup.
# In production this is distributed via encrypted SINCGARS / HF radio burst.
# ---------------------------------------------------------------------------
_TACTICAL_KEY: bytes = settings.IOT_HMAC_SECRET.encode("utf-8")

# ---------------------------------------------------------------------------
# Security Error Codes (raised as TacticalSecurityError with these codes)
# ---------------------------------------------------------------------------
SIGNATURE_MISMATCH       = "SIGNATURE_MISMATCH"
TOKEN_EXPIRED            = "TOKEN_EXPIRED"
DESTINATION_MISMATCH     = "DESTINATION_MISMATCH"
REPLAY_ATTACK_DETECTED   = "REPLAY_ATTACK_DETECTED"
MALFORMED_TOKEN          = "MALFORMED_TOKEN"


# ---------------------------------------------------------------------------
# Custom Exception
# ---------------------------------------------------------------------------
class TacticalSecurityError(Exception):
    """
    Raised by `verify_manifest_offline` when any security invariant is
    violated.  The `error_code` attribute maps to one of the five constants
    above and is used directly in HTTP response bodies.
    """

    def __init__(self, error_code: str, detail: str) -> None:
        super().__init__(detail)
        self.error_code: str = error_code
        self.detail: str = detail

    def __repr__(self) -> str:  # pragma: no cover
        return f"TacticalSecurityError(code={self.error_code!r}, detail={self.detail!r})"


# ---------------------------------------------------------------------------
# Manifest Dataclass
# ---------------------------------------------------------------------------
@dataclass
class ConsignmentManifest:
    """
    Structured representation of a signed tactical air-drop manifest.

    Fields
    ------
    cid         : Globally unique consignment identifier  (e.g. DROP-2026-NORTH-8841)
    origin      : Dispatching node identifier             (e.g. HQ-NORTH)
    dest        : Receiving depot identifier              (e.g. DEPOT-KGL)
    sku         : NATO stock / item identifier            (e.g. AMMO-7.62MM)
    qty         : Integer quantity of items dispatched
    issued_at   : Unix epoch (UTC) when the manifest was sealed at HQ
    expires_at  : Unix epoch (UTC) after which the token is invalid (TTL)
    nonce       : UUID4 hex — unique per manifest, registered on scan
    sig         : Hex-encoded HMAC-SHA256 over the canonical payload
    unit_id     : Destination unit_id matching `units` table PK
    """

    cid:        str
    origin:     str
    dest:       str
    sku:        str
    qty:        int
    issued_at:  int
    expires_at: int
    nonce:      str
    sig:        str
    unit_id:    str = ""  # populated by caller for DB upsert alignment

    def to_dict(self) -> Dict[str, Any]:
        """Return manifest as a plain dict (includes sig)."""
        return {
            "cid":        self.cid,
            "origin":     self.origin,
            "dest":       self.dest,
            "sku":        self.sku,
            "qty":        self.qty,
            "issued_at":  self.issued_at,
            "expires_at": self.expires_at,
            "nonce":      self.nonce,
            "sig":        self.sig,
            "unit_id":    self.unit_id,
        }

    def to_token(self) -> str:
        """
        Serialise manifest to a compact Base64url string suitable for
        embedding in a QR code or NFC NDEF text record.
        """
        raw = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))
        return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")


# ---------------------------------------------------------------------------
# Thread-Safe Nonce Registry (in-process; survives for NONCE_TTL_SECONDS)
# ---------------------------------------------------------------------------
@dataclass
class _NonceRegistry:
    """
    Thread-safe monotonic nonce registry.

    Stores (nonce → scan_epoch) pairs.  Expired entries are evicted lazily
    on each call to `register_or_raise`.  Because field depots operate
    air-gapped, the registry may be small; in-memory is sufficient.
    """

    _ttl_seconds: int = field(default_factory=lambda: settings.NONCE_TTL_SECONDS)
    _seen: Dict[str, float] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def _evict(self, now: float) -> None:
        cutoff = now - self._ttl_seconds
        expired = [n for n, ts in self._seen.items() if ts < cutoff]
        for n in expired:
            del self._seen[n]

    def register_or_raise(self, nonce: str) -> None:
        """
        Register a nonce.  Raises TacticalSecurityError(REPLAY_ATTACK_DETECTED)
        if the nonce was previously registered and has not yet expired.
        """
        now = time.monotonic()
        with self._lock:
            self._evict(now)
            if nonce in self._seen:
                raise TacticalSecurityError(
                    error_code=REPLAY_ATTACK_DETECTED,
                    detail=(
                        f"Nonce '{nonce}' has already been consumed by a prior scan. "
                        "This token cannot be reused — possible replay attack."
                    ),
                )
            self._seen[nonce] = now

    @property
    def active_count(self) -> int:  # pragma: no cover
        with self._lock:
            return len(self._seen)


# Module-level singleton nonce registry
_nonce_registry = _NonceRegistry()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _canonical_bytes(payload: Dict[str, Any]) -> bytes:
    """
    Produce a deterministic UTF-8 byte sequence for HMAC computation.

    The `sig` field is EXCLUDED from the canonical form — the signature
    is computed over all other fields only.  Keys are sorted to eliminate
    ordering ambiguity across language implementations (Python dict, Java Map,
    Go struct), critical for field-terminal interoperability.
    """
    sign_payload = {k: v for k, v in payload.items() if k != "sig"}
    return json.dumps(sign_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _compute_hmac(payload: Dict[str, Any], key: bytes = _TACTICAL_KEY) -> str:
    """Return hex-encoded HMAC-SHA256 over the canonical payload bytes."""
    message = _canonical_bytes(payload)
    return hmac.new(key, message, hashlib.sha256).hexdigest()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate_signed_manifest(
    cid:      str,
    origin:   str,
    dest:     str,
    sku:      str,
    qty:      int,
    unit_id:  str = "",
    ttl_hours: float = 24.0,
    *,
    key: bytes = _TACTICAL_KEY,
) -> ConsignmentManifest:
    """
    Seal a new air-drop consignment manifest with HMAC-SHA256.

    Parameters
    ----------
    cid        : Unique consignment / mission identifier string.
    origin     : Originating logistics node (must match sender unit registry).
    dest       : Destination depot code (verified on receipt).
    sku        : NATO stock number / internal SKU.
    qty        : Quantity to be delivered (must be > 0).
    unit_id    : Optional destination `units.unit_id` PK for DB alignment.
    ttl_hours  : Validity window in hours from now (default 24 h).
    key        : Tactical symmetric key bytes (default = configured secret).

    Returns
    -------
    ConsignmentManifest with `.sig` populated and `.to_token()` available.

    Raises
    ------
    ValueError if `qty` ≤ 0.
    """
    if qty <= 0:
        raise ValueError(f"Manifest quantity must be > 0, got {qty!r}.")

    now_epoch  = int(time.time())
    expires_at = int(now_epoch + ttl_hours * 3600)
    nonce      = uuid.uuid4().hex  # cryptographically random, 32-char hex

    # Build unsigned payload dict (sig absent for canonical computation)
    unsigned: Dict[str, Any] = {
        "cid":        cid,
        "origin":     origin,
        "dest":       dest,
        "sku":        sku,
        "qty":        qty,
        "issued_at":  now_epoch,
        "expires_at": expires_at,
        "nonce":      nonce,
        "unit_id":    unit_id,
    }

    sig = _compute_hmac(unsigned, key=key)

    logger.info(
        "[MANIFEST SEALED] cid=%s  origin=%s  dest=%s  sku=%s  qty=%d  "
        "ttl_hours=%.1f  nonce=%s",
        cid, origin, dest, sku, qty, ttl_hours, nonce,
    )

    return ConsignmentManifest(
        cid=cid,
        origin=origin,
        dest=dest,
        sku=sku,
        qty=qty,
        issued_at=now_epoch,
        expires_at=expires_at,
        nonce=nonce,
        sig=sig,
        unit_id=unit_id,
    )


def verify_manifest_offline(
    token_or_dict: "str | Dict[str, Any]",
    *,
    expected_dest: Optional[str] = None,
    key: bytes = _TACTICAL_KEY,
    _now_override: Optional[int] = None,   # test-seam only
) -> ConsignmentManifest:
    """
    Fully air-gapped manifest verification — requires ZERO network calls.

    Verification pipeline (fail-fast, ordered by computational cost):
    ─────────────────────────────────────────────────────────────────
    1. Deserialise token (Base64url → JSON dict) and validate schema.
    2. Temporal Freshness Gate:
         issued_at  ≤  now  ≤  expires_at
       Raises TOKEN_EXPIRED if the delivery window has closed.
    3. HMAC-SHA256 Integrity Gate:
         hmac.compare_digest(stored_sig, recomputed_sig)
       Raises SIGNATURE_MISMATCH on any bit-level difference.
    4. Destination Mismatch Guard (optional):
         If `expected_dest` is provided, manifest.dest must match exactly.
       Raises DESTINATION_MISMATCH.
    5. Monotonic Nonce Replay Shield:
         Registers nonce in thread-safe registry; raises REPLAY_ATTACK_DETECTED
         if already consumed.  Nonce eviction after NONCE_TTL_SECONDS.

    Note: Replay check is performed LAST so that steps 1–4 fail fast on
    structurally invalid/expired tokens without polluting the nonce registry.

    Parameters
    ----------
    token_or_dict  : Either a Base64url compact token string (from QR/NFC) or
                     a plain dict (from HTTP body or in-memory pipeline).
    expected_dest  : If provided, enforces destination match.
    key            : Tactical symmetric key bytes.
    _now_override  : Inject a fixed Unix epoch for deterministic unit tests.

    Returns
    -------
    Validated and deserialised ConsignmentManifest.

    Raises
    ------
    TacticalSecurityError with a specific `error_code` on any violation.
    """
    # ── Step 1: Deserialise ─────────────────────────────────────────────────
    if isinstance(token_or_dict, str):
        try:
            raw_json = base64.urlsafe_b64decode(
                token_or_dict.encode("ascii") + b"=="  # re-pad for decode
            )
            payload: Dict[str, Any] = json.loads(raw_json)
        except Exception as exc:
            raise TacticalSecurityError(
                error_code=MALFORMED_TOKEN,
                detail=f"Cannot deserialise Base64url token: {exc}",
            ) from exc
    else:
        payload = dict(token_or_dict)

    required_fields = {"cid", "origin", "dest", "sku", "qty", "issued_at", "expires_at", "nonce", "sig"}
    missing = required_fields - payload.keys()
    if missing:
        raise TacticalSecurityError(
            error_code=MALFORMED_TOKEN,
            detail=f"Manifest missing required fields: {sorted(missing)}",
        )

    stored_sig: str = str(payload["sig"])

    # ── Step 2: Temporal Freshness ───────────────────────────────────────────
    now = _now_override if _now_override is not None else int(time.time())
    issued_at  = int(payload["issued_at"])
    expires_at = int(payload["expires_at"])

    if now < issued_at or now > expires_at:
        raise TacticalSecurityError(
            error_code=TOKEN_EXPIRED,
            detail=(
                f"Manifest validity window [{issued_at}, {expires_at}] does not "
                f"contain current epoch {now}. Token has expired or is from the future."
            ),
        )

    # ── Step 3: HMAC-SHA256 Integrity ────────────────────────────────────────
    expected_sig = _compute_hmac(payload, key=key)
    if not hmac.compare_digest(expected_sig.lower(), stored_sig.lower()):
        raise TacticalSecurityError(
            error_code=SIGNATURE_MISMATCH,
            detail=(
                "HMAC-SHA256 verification failed. Payload integrity compromised — "
                "possible man-in-the-middle tampering or key mismatch."
            ),
        )

    # ── Step 4: Destination Mismatch ─────────────────────────────────────────
    if expected_dest is not None:
        manifest_dest = str(payload.get("dest", ""))
        if not hmac.compare_digest(manifest_dest, expected_dest):
            raise TacticalSecurityError(
                error_code=DESTINATION_MISMATCH,
                detail=(
                    f"Manifest destination '{manifest_dest}' does not match "
                    f"this terminal's registered destination '{expected_dest}'."
                ),
            )

    # ── Step 5: Replay Attack Shield ─────────────────────────────────────────
    _nonce_registry.register_or_raise(str(payload["nonce"]))

    logger.info(
        "[MANIFEST VERIFIED] cid=%s  dest=%s  sku=%s  qty=%s  nonce=%s",
        payload.get("cid"), payload.get("dest"), payload.get("sku"),
        payload.get("qty"), payload.get("nonce"),
    )

    return ConsignmentManifest(
        cid=str(payload["cid"]),
        origin=str(payload.get("origin", "")),
        dest=str(payload["dest"]),
        sku=str(payload["sku"]),
        qty=int(payload["qty"]),
        issued_at=issued_at,
        expires_at=expires_at,
        nonce=str(payload["nonce"]),
        sig=stored_sig,
        unit_id=str(payload.get("unit_id", "")),
    )


def token_from_dict(payload: Dict[str, Any]) -> str:
    """
    Convenience helper: serialise an existing signed payload dict into
    a compact Base64url token string without re-signing.
    """
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")


def get_nonce_registry() -> _NonceRegistry:
    """Expose the module-level registry (used by tests and simulator)."""
    return _nonce_registry
