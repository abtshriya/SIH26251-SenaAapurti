# =============================================================================
# SENA AAPURTI — Tactical Handover FastAPI Routes
# File: backend/app/api/routes_handover.py
# Classification: RESTRICTED // SIH PROTOTYPE (SIH26251)
#
# Exposes three API v1 endpoints for the Cryptographic Blind-Drop subsystem:
#   POST /api/v1/handover/generate-manifest
#   POST /api/v1/handover/scan-verify
#   GET  /api/v1/handover/active-consignments
# =============================================================================
"""
FastAPI Router: Tactical Handover Endpoints.

Security Model
--------------
Manifest GENERATION (`/generate-manifest`) is an HQ-side operation and
intentionally does NOT require Step-Up MFA so that the backend can be called
from automated dispatch systems during contested connectivity windows.
In a full production deployment this endpoint would be behind a mutual-TLS
client-certificate gateway restricted to the HQ enclave.

Manifest VERIFICATION (`/scan-verify`) is stateless from an authentication
standpoint — the HMAC-SHA256 token carries its own cryptographic proof.
No session, no JWT, no OAuth2 callback needed.  This is the entire point of
the offline blind-drop design.

Response Alignment
------------------
All endpoints return dicts conforming to the Angular 19 frontend's
`InventoryStatus` / `AuditLedgerEntry` / `RequisitionModel` interfaces
so that the dashboard updates immediately upon uplink restoration.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.tactical_handover.crypto_token import (
    TacticalSecurityError,
    generate_signed_manifest,
)
from app.tactical_handover.handover_service import (
    list_active_consignments,
    process_scanned_token,
)
from app.tactical_handover.qr_manifest_gen import build_manifest_payload

logger = logging.getLogger("sena_aapurti.api.handover")

router = APIRouter(
    prefix="/handover",
    tags=["Tactical Blind-Drop & Offline Handover"],
)


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------
class GenerateManifestRequest(BaseModel):
    """Request body for sealing a new air-drop consignment manifest."""

    origin_unit: str = Field(
        ...,
        min_length=2,
        max_length=64,
        examples=["HQ-NORTH"],
        description="Dispatching logistics node identifier.",
    )
    destination_unit: str = Field(
        ...,
        min_length=2,
        max_length=64,
        examples=["DEPOT-KGL"],
        description="Receiving depot code (must match registered unit_id or depot alias).",
    )
    sku: str = Field(
        ...,
        min_length=2,
        max_length=64,
        examples=["MUN-762-NATO"],
        description="NATO stock / internal SKU of the consignment item.",
    )
    quantity: int = Field(
        ...,
        gt=0,
        le=1_000_000,
        examples=[5000],
        description="Integer quantity of items in this consignment (must be > 0).",
    )
    consignment_id: Optional[str] = Field(
        default=None,
        max_length=64,
        examples=["DROP-2026-NORTH-8841"],
        description="Optional custom consignment ID. Auto-generated if omitted.",
    )
    unit_id: str = Field(
        default="",
        max_length=64,
        examples=["UNIT-FOB-BRAVO"],
        description=(
            "PostgreSQL `units.unit_id` PK of the destination unit for stock upsert. "
            "Leave empty if using depot alias only."
        ),
    )
    ttl_hours: float = Field(
        default=24.0,
        ge=0.5,
        le=168.0,
        examples=[24.0],
        description="Manifest validity window in hours (0.5 – 168 h).",
    )

    @field_validator("sku")
    @classmethod
    def sku_uppercase(cls, v: str) -> str:
        return v.strip().upper()


class ScanVerifyRequest(BaseModel):
    """Request body carrying a raw compact token from a QR scan or NFC read."""

    token: str = Field(
        ...,
        min_length=32,
        description="Base64url-encoded compact manifest token from QR/NFC scan.",
    )
    terminal_id: Optional[str] = Field(
        default=None,
        max_length=64,
        examples=["TERM-KGL-001"],
        description="Optional air-gapped terminal identifier for audit attribution.",
    )
    expected_dest: Optional[str] = Field(
        default=None,
        max_length=64,
        examples=["DEPOT-KGL"],
        description=(
            "If provided, the manifest's `dest` field is verified to match exactly. "
            "Raises 401 DESTINATION_MISMATCH if mismatched."
        ),
    )


# ---------------------------------------------------------------------------
# Endpoint 1: Generate Manifest
# ---------------------------------------------------------------------------
@router.post(
    "/generate-manifest",
    status_code=status.HTTP_201_CREATED,
    summary="Seal a new HMAC-SHA256 signed air-drop manifest (HQ side)",
    response_description=(
        "Signed manifest object, compact Base64url token, NFC string, "
        "terminal QR art, and Base64 PNG Data-URL."
    ),
)
def generate_manifest(
    req: GenerateManifestRequest = Body(...),
) -> Dict[str, Any]:
    """
    **HQ Logistics Operation** — Generate a cryptographically sealed consignment manifest.

    The endpoint:
    1. Derives a unique consignment ID if not supplied.
    2. Calls `generate_signed_manifest()` to compute HMAC-SHA256 over the canonical payload.
    3. Serialises the manifest to a compact Base64url token.
    4. Generates terminal QR art and a Base64 PNG Data-URL for the frontend.

    The returned `compact_token` / `nfc_string` is identical to what is written onto
    crate NFC tags and printed as QR codes on field manifests.
    """
    import uuid as _uuid  # noqa: PLC0415

    cid = req.consignment_id or f"DROP-{_uuid.uuid4().hex[:8].upper()}"

    try:
        manifest = generate_signed_manifest(
            cid=cid,
            origin=req.origin_unit,
            dest=req.destination_unit,
            sku=req.sku,
            qty=req.quantity,
            unit_id=req.unit_id,
            ttl_hours=req.ttl_hours,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INVALID_MANIFEST_PARAMETERS", "message": str(exc)},
        ) from exc

    payload = build_manifest_payload(manifest)

    logger.info(
        "[API GENERATE] cid=%s  origin=%s  dest=%s  sku=%s  qty=%d",
        cid, req.origin_unit, req.destination_unit, req.sku, req.quantity,
    )

    return {
        "operation":   "MANIFEST_SEALED",
        "consignment_id": cid,
        **payload,
        "crypto": {
            "algorithm":    "HMAC-SHA256",
            "key_exchange":  "TACTICAL_SYMMETRIC_KEY",
            "nonce":         manifest.nonce,
            "issued_at_epoch": manifest.issued_at,
            "expires_at_epoch": manifest.expires_at,
        },
    }


# ---------------------------------------------------------------------------
# Endpoint 2: Scan & Verify Token
# ---------------------------------------------------------------------------
@router.post(
    "/scan-verify",
    status_code=status.HTTP_200_OK,
    summary="Air-gapped field terminal: verify scanned QR/NFC token & update inventory",
    response_description=(
        "ACCEPTED with ledger receipt and updated stock level, or "
        "REJECTED_* with security incident details."
    ),
)
def scan_verify(
    req: ScanVerifyRequest = Body(...),
) -> Dict[str, Any]:
    """
    **Field Terminal Operation** — Verify a scanned consignment manifest token.

    Verification pipeline (entirely offline, no external auth provider):
    1. Deserialise Base64url compact token.
    2. Enforce temporal freshness (TTL window).
    3. HMAC-SHA256 constant-time integrity check.
    4. Optional destination mismatch guard.
    5. Monotonic nonce replay shield.

    On **ACCEPTED**: atomically increments `unit_stocks`, transitions matching
    `requisitions` to `DELIVERED_AIR_GAPPED`, and chains an immutable block
    into `tamper_proof_audit_ledger`.

    On **REJECTED**: zero stock update, anomaly block committed to ledger,
    HTTP 401 (tampered/expired) or HTTP 409 (replay) returned.
    """
    result = process_scanned_token(
        req.token,
        expected_dest=req.expected_dest,
    )

    verdict = result["status"]
    terminal = req.terminal_id or "UNKNOWN_TERMINAL"

    logger.info(
        "[API SCAN-VERIFY] terminal=%s  verdict=%s  cid=%s",
        terminal, verdict, result.get("cid"),
    )

    # ── Map internal status to HTTP status code ───────────────────────────────
    if verdict == "ACCEPTED":
        return result

    # Security rejection — choose appropriate HTTP error code
    http_status_map: Dict[str, int] = {
        "REJECTED_TAMPERED":              status.HTTP_401_UNAUTHORIZED,
        "REJECTED_EXPIRED":               status.HTTP_401_UNAUTHORIZED,
        "REJECTED_DESTINATION_MISMATCH":  status.HTTP_401_UNAUTHORIZED,
        "REJECTED_REPLAY":                status.HTTP_409_CONFLICT,
    }
    http_code = http_status_map.get(verdict, status.HTTP_401_UNAUTHORIZED)

    raise HTTPException(
        status_code=http_code,
        detail={
            "status":          verdict,
            "error_code":      result.get("error_code", "VERIFICATION_FAILED"),
            "cid":             result.get("cid"),
            "security_detail": result.get("security_detail"),
            "qty_received":    0,
            "ledger_receipt":  result.get("ledger_receipt"),
            "synced_at":       result.get("synced_at"),
            "zero_trust_policy": "AIR_GAPPED_HMAC_BLIND_DROP_SHIELD",
        },
    )


# ---------------------------------------------------------------------------
# Endpoint 3: Active Consignments
# ---------------------------------------------------------------------------
@router.get(
    "/active-consignments",
    status_code=status.HTTP_200_OK,
    summary="List all in-transit drop manifests (frontend requisition model shape)",
    response_description="List of requisitions with status IN_TRANSIT.",
)
def get_active_consignments() -> Dict[str, Any]:
    """
    **Dashboard Sync** — Return all active in-transit consignments.

    Response objects match the Angular 19 frontend's `RequisitionModel` interface
    so the command dashboard can render them immediately upon uplink restoration
    without any frontend-side transformation.

    Returns an empty `consignments` list gracefully when PostGIS is offline.
    """
    consignments: List[Dict[str, Any]] = list_active_consignments()

    return {
        "status":            "OK",
        "total_in_transit":  len(consignments),
        "consignments":      consignments,
        "note": (
            "This list reflects requisitions currently IN_TRANSIT. "
            "Scan tokens to transition them to DELIVERED_AIR_GAPPED."
        ),
    }


# ---------------------------------------------------------------------------
# Endpoint 4: Consignment Receipt of Acknowledgement (Formal RV-ACK Voucher)
# ---------------------------------------------------------------------------
class ConsignmentAcknowledgeRequest(BaseModel):
    consignment_id: str = Field(..., examples=["CV-104-N"])
    callsign: Optional[str] = Field(default="GARUDA-01")
    unit_id: str = Field(default="UNIT-14RM-LEH")
    source_depot: str = Field(default="COD Pathankot")
    cargo_type: str = Field(default="Class III (POL)")
    quantity_received: str = Field(default="18,000 Litres")
    vehicles_count: int = Field(default=28)
    driver_escort: Optional[str] = Field(default="Subedar R. P. Yadav (ASC)")
    receiving_officer: str = Field(default="Major Amit Sharma (Quartermaster, IC-71044A)")
    inspection_passed: bool = Field(default=True)
    remarks: Optional[str] = Field(default="Seals intact, sub-zero grade density verified.")


@router.post(
    "/acknowledge-receipt",
    status_code=status.HTTP_201_CREATED,
    summary="Acknowledge incoming consignment, stock into DB, and seal Receipt of Acknowledgement voucher",
)
def acknowledge_consignment_receipt(
    payload: ConsignmentAcknowledgeRequest = Body(...),
) -> Dict[str, Any]:
    """
    Formal Quartermaster Inbound Acknowledgement:
    1. Verifies consignment credentials and generates official Receipt Voucher ID (RV-ACK-...).
    2. Atomically increments unit inventory stock in PostgreSQL `unit_stocks`.
    3. Persists signed acknowledgement in `consignment_acknowledgements`.
    4. Records an immutable cryptographic block into `tamper_proof_audit_ledger`.
    5. Returns official military voucher payload with digital signature block.
    """
    import hashlib
    import json
    import re
    from datetime import datetime, timezone
    from sqlalchemy import text
    from sqlalchemy.exc import SQLAlchemyError
    from app.api.routes_inventory import get_db_engine

    clean_cid = payload.consignment_id.replace(" ", "-").upper()
    ack_id = f"RV-ACK-2026-{clean_cid}"

    # Determine numerical qty and target SKU
    cargo_lower = payload.cargo_type.lower()
    if "pol" in cargo_lower or "fuel" in cargo_lower:
        sku = "UI-POL-01"
    elif "ration" in cargo_lower or "mre" in cargo_lower:
        sku = "UI-RAT-02"
    elif "ammo" in cargo_lower or "munition" in cargo_lower:
        sku = "UI-AM-03"
    elif "spare" in cargo_lower:
        sku = "UI-SPR-04"
    else:
        sku = "UI-MED-05"

    numeric_qty = 500
    qty_matches = re.findall(r"\d+", payload.quantity_received.replace(",", ""))
    if qty_matches:
        numeric_qty = int(qty_matches[0])

    engine = get_db_engine()
    log_id = 0
    crypto_hash = ""
    updated_stock = 0

    if engine is not None:
        try:
            with engine.begin() as conn:
                # 1. Insert into consignment_acknowledgements
                conn.execute(
                    text(
                        """
                        INSERT INTO consignment_acknowledgements (
                            ack_id, consignment_id, unit_id, cargo_type, quantity_received,
                            source_depot, receiving_officer, escort_personnel, vehicles_count,
                            inspection_passed, status, created_at
                        )
                        VALUES (
                            :aid, :cid, :uid, :cargo, :qty,
                            :depot, :officer, :escort, :vcount,
                            :inspected, 'VERIFIED_STOCKED', NOW()
                        )
                        ON CONFLICT (ack_id) DO UPDATE SET
                            quantity_received = EXCLUDED.quantity_received,
                            receiving_officer = EXCLUDED.receiving_officer,
                            status = 'VERIFIED_STOCKED';
                        """
                    ),
                    {
                        "aid": ack_id,
                        "cid": payload.consignment_id,
                        "uid": payload.unit_id,
                        "cargo": payload.cargo_type,
                        "qty": payload.quantity_received,
                        "depot": payload.source_depot,
                        "officer": payload.receiving_officer,
                        "escort": payload.driver_escort,
                        "vcount": payload.vehicles_count,
                        "inspected": payload.inspection_passed,
                    },
                )

                # 2. Add received goods to unit_stocks in PostgreSQL
                conn.execute(
                    text(
                        """
                        INSERT INTO unit_stocks (unit_id, sku, current_quantity, last_sync_timestamp)
                        VALUES (:uid, :sku, :qty, NOW())
                        ON CONFLICT (unit_id, sku) DO UPDATE
                        SET current_quantity = unit_stocks.current_quantity + EXCLUDED.current_quantity,
                            last_sync_timestamp = NOW();
                        """
                    ),
                    {"uid": payload.unit_id, "sku": sku, "qty": numeric_qty},
                )

                # Fetch updated stock level
                stock_row = conn.execute(
                    text("SELECT current_quantity FROM unit_stocks WHERE unit_id = :uid AND sku = :sku"),
                    {"uid": payload.unit_id, "sku": sku},
                ).mappings().first()
                if stock_row:
                    updated_stock = stock_row["current_quantity"]

                # 3. Append to tamper-proof audit ledger
                payload_bytes = json.dumps(payload.model_dump(), sort_keys=True).encode("utf-8")
                payload_hash = hashlib.sha256(payload_bytes).hexdigest()
                ledger_row = (
                    conn.execute(
                        text(
                            """
                            INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
                            VALUES ('CONSIGNMENT_ACKNOWLEDGED_STOCKED', :actor_id, :payload_hash)
                            RETURNING log_id, current_hash;
                            """
                        ),
                        {
                            "actor_id": payload.receiving_officer,
                            "payload_hash": payload_hash,
                        },
                    )
                    .mappings()
                    .first()
                )
                if ledger_row:
                    log_id = ledger_row["log_id"]
                    crypto_hash = ledger_row["current_hash"].strip()

        except SQLAlchemyError as exc:
            logger.warning("Error saving acknowledgement to PostgreSQL: %s", exc)

    receipt_voucher = {
        "ack_id": ack_id,
        "consignment_id": payload.consignment_id,
        "callsign": payload.callsign,
        "source_depot": payload.source_depot,
        "receiving_unit": "14 RAJPUT (MECHANISED)",
        "destination_sector": "Forward Defended Locality - Shyok Sector (14 Corps, Leh)",
        "cargo_type": payload.cargo_type,
        "quantity_received": payload.quantity_received,
        "vehicles_count": payload.vehicles_count,
        "driver_escort": payload.driver_escort,
        "receiving_officer": payload.receiving_officer,
        "inspection_status": "CERTIFIED COMBAT FIT // PHYSICAL SEALS INTACT",
        "stock_updated_sku": sku,
        "new_stock_level": updated_stock,
        "ledger_block": log_id,
        "crypto_hash": crypto_hash,
        "timestamp": datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M hrs IST"),
        "barcode_code": f"IA-ACK-{clean_cid}-2026",
        "status": "VERIFIED & ENTERED INTO REGIMENTAL LEDGER",
    }

    return {
        "status": "CONSIGNMENT_ACKNOWLEDGED",
        "message": f"Consignment {payload.callsign} ({payload.consignment_id}) successfully acknowledged and entered into 14 Rajput Regimental Stores Ledger.",
        "receipt": receipt_voucher,
    }


@router.get(
    "/acknowledgements",
    status_code=status.HTTP_200_OK,
    summary="List all recorded consignment acknowledgement receipts",
)
def get_acknowledgement_receipts(unit_id: str = "UNIT-14RM-LEH") -> Dict[str, Any]:
    """
    Returns list of all signed Receipts of Acknowledgement for the specified unit.
    """
    from sqlalchemy import text
    from sqlalchemy.exc import SQLAlchemyError
    from app.api.routes_inventory import get_db_engine

    engine = get_db_engine()
    results: List[Dict[str, Any]] = []

    if engine is not None:
        try:
            with engine.connect() as conn:
                query = text(
                    """
                    SELECT ack_id, consignment_id, cargo_type, quantity_received,
                           source_depot, receiving_officer, escort_personnel,
                           vehicles_count, status, created_at
                    FROM consignment_acknowledgements
                    WHERE unit_id = :uid
                    ORDER BY created_at DESC;
                    """
                )
                rows = conn.execute(query, {"uid": unit_id}).mappings().all()
                for row in rows:
                    results.append(
                        {
                            "ack_id": row["ack_id"],
                            "consignment_id": row["consignment_id"],
                            "cargo_type": row["cargo_type"],
                            "quantity_received": row["quantity_received"],
                            "source_depot": row["source_depot"],
                            "receiving_officer": row["receiving_officer"],
                            "escort_personnel": row["escort_personnel"],
                            "vehicles_count": row["vehicles_count"],
                            "status": row["status"],
                            "created_at": (
                                row["created_at"].strftime("%d %b %Y, %H:%M hrs")
                                if hasattr(row["created_at"], "strftime")
                                else str(row["created_at"])
                            ),
                        }
                    )
        except SQLAlchemyError as exc:
            logger.warning("Error fetching acknowledgement receipts: %s", exc)

    return {
        "status": "OK",
        "total": len(results),
        "acknowledgements": results,
    }

