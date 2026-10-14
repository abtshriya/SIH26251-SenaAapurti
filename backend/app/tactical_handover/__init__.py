# =============================================================================
# SENA AAPURTI — Tactical Handover Package
# Classification: RESTRICTED // SIH PROTOTYPE (SIH26251)
# Module: Cryptographic Blind Drops & Offline Tactical Delivery Handover
# =============================================================================
"""
Tactical Handover Module (SIH26251 - Core Innovation #3)

Implements air-gapped HMAC-SHA256 signed consignment manifests for
forward-area logistics delivery verification without network connectivity.

Sub-modules:
  - crypto_token    : HMAC-SHA256 manifest signing & offline verification
  - qr_manifest_gen : QR code and NFC token generation from signed manifests
  - handover_service: Atomic stock upsert & audit chain ledger integration
"""
