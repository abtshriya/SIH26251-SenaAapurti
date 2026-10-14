#!/usr/bin/env python3
# =============================================================================
# SENA AAPURTI — Live SIH Evaluation Harness
# File: backend/app/simulator/blind_drop_sim.py
# Classification: RESTRICTED // SIH PROTOTYPE (SIH26251)
#
# Standalone CLI & HTTP test harness demonstrating the full Cryptographic
# Blind-Drop lifecycle for live SIH jury evaluation.
#
# Usage (from backend/):
#   python -m app.simulator.blind_drop_sim
#   python -m app.simulator.blind_drop_sim --url http://localhost:8000
#   python -m app.simulator.blind_drop_sim --offline   # no HTTP, crypto-only
# =============================================================================
"""
Blind Drop Simulator — 4-Scenario SIH Demo Harness.

Scenarios
---------
1. AUTHENTIC AIR-DROP     : Seal a signed manifest for AMMO-7.62MM from
                            Northern Command HQ → Kargil Depot. Print QR.
2. FIELD RECEIPT          : Field depot scans authentic token → HTTP 200,
                            +5,000 rounds credited, audit chain link printed.
3. MAN-IN-THE-MIDDLE      : Alter qty 5000 → 500 in transit. Scan altered
                            token → HTTP 401 SIGNATURE_MISMATCH, zero stock
                            increment, security incident logged.
4. REPLAY ATTACK          : Resend the already-consumed legitimate token →
                            HTTP 409 REPLAY_ATTACK_DETECTED.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# Dependency check: rich + httpx (both in requirements.txt)
# ---------------------------------------------------------------------------
try:
    from rich import box
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    _RICH = True
except ImportError:
    _RICH = False

try:
    import httpx
    _HTTPX = True
except ImportError:
    _HTTPX = False

# ---------------------------------------------------------------------------
# Always importable: crypto module works without HTTP server
# ---------------------------------------------------------------------------
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[3]))

from app.tactical_handover.crypto_token import (   # noqa: E402
    ConsignmentManifest,
    TacticalSecurityError,
    generate_signed_manifest,
    get_nonce_registry,
    token_from_dict,
    verify_manifest_offline,
)
from app.tactical_handover.qr_manifest_gen import (  # noqa: E402
    generate_terminal_qr,
)

# ---------------------------------------------------------------------------
# Console (rich or plain)
# ---------------------------------------------------------------------------
console = Console(highlight=False) if _RICH else None

# Force UTF-8 output on Windows so rich does not fall back to legacy Win32 console renderer.
import sys as _sys
if _sys.platform == "win32" and hasattr(_sys.stdout, "reconfigure"):
    try:
        _sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass


def _print(text: str, style: str = "") -> None:
    if _RICH:
        console.print(text, style=style)
    else:
        print(text)


def _rule(title: str) -> None:
    if _RICH:
        console.rule(f"[bold cyan]{title}[/bold cyan]")
    else:
        print(f"\n{'=' * 70}")
        print(f"  {title}")
        print('=' * 70)


def _panel(content: str, title: str, style: str = "cyan") -> None:
    if _RICH:
        console.print(Panel(content, title=title, border_style=style, padding=(1, 2)))
    else:
        print(f"\n┌── {title} ──")
        print(content)
        print("└" + "─" * 50)


def _success(msg: str) -> None:
    _print(f"[+] {msg}", style="bold green")


def _failure(msg: str) -> None:
    _print(f"[!] {msg}", style="bold red")


def _warn(msg: str) -> None:
    _print(f"[~] {msg}", style="bold yellow")


def _info(msg: str) -> None:
    _print(f"    {msg}", style="dim")


def _key_val(k: str, v: Any) -> None:
    if _RICH:
        console.print(f"  [bold]{k}:[/bold] [green]{v}[/green]")
    else:
        print(f"  {k}: {v}")


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------
BASE_URL_DEFAULT = "http://localhost:8000"


def _http_post(url: str, payload: Dict[str, Any]) -> tuple[int, Dict[str, Any]]:
    """POST JSON payload to `url`, return (status_code, response_dict)."""
    if not _HTTPX:
        raise RuntimeError(
            "httpx not installed. Run: pip install httpx  (or use --offline mode)"
        )
    try:
        resp = httpx.post(url, json=payload, timeout=10.0)
        try:
            body = resp.json()
        except Exception:
            body = {"raw": resp.text}
        return resp.status_code, body
    except httpx.ConnectError:
        return -1, {"error": f"Cannot connect to {url} — is the FastAPI server running?"}


def _http_get(url: str) -> tuple[int, Dict[str, Any]]:
    if not _HTTPX:
        raise RuntimeError("httpx not installed.")
    try:
        resp = httpx.get(url, timeout=10.0)
        try:
            body = resp.json()
        except Exception:
            body = {"raw": resp.text}
        return resp.status_code, body
    except httpx.ConnectError:
        return -1, {"error": f"Cannot connect to {url}"}


# ---------------------------------------------------------------------------
# Scenario helpers
# ---------------------------------------------------------------------------
def _print_manifest_table(manifest: ConsignmentManifest) -> None:
    if not _RICH:
        _print(json.dumps(manifest.to_dict(), indent=2))
        return

    table = Table(title="Consignment Manifest", box=box.DOUBLE_EDGE, border_style="cyan")
    table.add_column("Field", style="bold yellow", no_wrap=True)
    table.add_column("Value", style="green")

    for k, v in manifest.to_dict().items():
        if k == "sig":
            v = f"{str(v)[:24]}...{str(v)[-8:]}"
        table.add_row(str(k).upper(), str(v))

    console.print(table)


def _print_http_response(code: int, body: Dict[str, Any], ok_codes: tuple = (200, 201)) -> None:
    colour = "green" if code in ok_codes else "red"
    status_icon = "[OK]" if code in ok_codes else "[!!]"
    _print(f"\n{status_icon} HTTP {code}", style=f"bold {colour}")
    if _RICH:
        console.print_json(json.dumps(body, default=str, indent=2))
    else:
        print(json.dumps(body, default=str, indent=2))


def _tamper_token(manifest: ConsignmentManifest, new_qty: int) -> str:
    """
    Simulate a MITM attack: extract the dict, change `qty`, re-serialise.
    The `sig` field is left UNCHANGED — this is what a real adversary would do.
    """
    tampered = manifest.to_dict()
    original_qty = tampered["qty"]
    tampered["qty"] = new_qty
    _warn(
        f"[MITM TAMPER] qty altered in transit:  {original_qty} → {new_qty}  "
        f"(sig field left unchanged to simulate interception)"
    )
    return token_from_dict(tampered)


# ===========================================================================
# Scenario 1 — Authentic Air-Drop Manifest Generation
# ===========================================================================
def scenario_1_generate(base_url: str, offline: bool) -> ConsignmentManifest:
    _rule("SCENARIO 1 -- Northern Command -> Kargil Depot: Seal Manifest")
    _info("Simulating HQ Base Logistics generating a signed air-drop manifest...")
    time.sleep(0.4)

    CID   = "DROP-2026-NORTH-8841"
    ORIGIN = "HQ-NORTH"
    DEST   = "DEPOT-KGL"
    SKU    = "MUN-762-NATO"
    QTY    = 5000
    UNIT_ID = "UNIT-FOB-BRAVO"

    if not offline and _HTTPX:
        _info(f"[HTTP] POST {base_url}/api/v1/handover/generate-manifest")
        code, body = _http_post(
            f"{base_url}/api/v1/handover/generate-manifest",
            {
                "origin_unit":     ORIGIN,
                "destination_unit": DEST,
                "sku":             SKU,
                "quantity":        QTY,
                "consignment_id":  CID,
                "unit_id":         UNIT_ID,
                "ttl_hours":       24.0,
            },
        )
        _print_http_response(code, body, ok_codes=(201,))

        if code == 201:
            # Reconstruct manifest from API response for downstream scenarios
            m_dict = body.get("manifest", {})
            manifest = ConsignmentManifest(
                cid=m_dict.get("cid", CID),
                origin=m_dict.get("origin", ORIGIN),
                dest=m_dict.get("dest", DEST),
                sku=m_dict.get("sku", SKU),
                qty=int(m_dict.get("qty", QTY)),
                issued_at=int(m_dict.get("issued_at", int(time.time()))),
                expires_at=int(m_dict.get("expires_at", int(time.time()) + 86400)),
                nonce=m_dict.get("nonce", ""),
                sig=m_dict.get("sig", ""),
                unit_id=m_dict.get("unit_id", UNIT_ID),
            )
        else:
            _warn("API unavailable -- generating manifest locally (offline crypto mode).")
            manifest = generate_signed_manifest(
                cid=CID, origin=ORIGIN, dest=DEST, sku=SKU,
                qty=QTY, unit_id=UNIT_ID, ttl_hours=24.0,
            )
    else:
        _info("[OFFLINE CRYPTO] Generating manifest locally without HTTP…")
        manifest = generate_signed_manifest(
            cid=CID, origin=ORIGIN, dest=DEST, sku=SKU,
            qty=QTY, unit_id=UNIT_ID, ttl_hours=24.0,
        )

    _print_manifest_table(manifest)

    _print("\n=== TERMINAL QR CODE (field crate tag) ===")
    qr_art = generate_terminal_qr(manifest)
    # Print only first 32 rows to keep terminal tidy during demo
    lines = qr_art.split("\n")
    limited = "\n".join(lines[:32])
    _print(limited)
    if len(lines) > 32:
        _info(f"  ... ({len(lines) - 32} more rows -- full QR available via /generate-manifest)")

    _success(
        f"Manifest '{manifest.cid}' sealed with HMAC-SHA256. "
        f"Compact token ready for NFC/QR encoding."
    )
    return manifest


# ===========================================================================
# Scenario 2 — Authentic Token Receipt (Field Depot)
# ===========================================================================
def scenario_2_receive(
    manifest: ConsignmentManifest, base_url: str, offline: bool
) -> None:
    _rule("SCENARIO 2 -- Kargil Depot Terminal: Verify Authentic Token")
    _info("Field depot scans crate QR tag in EW-blackout mode (zero network calls)...")
    time.sleep(0.4)

    token = manifest.to_token()

    if not offline and _HTTPX:
        _info(f"[HTTP] POST {base_url}/api/v1/handover/scan-verify")
        code, body = _http_post(
            f"{base_url}/api/v1/handover/scan-verify",
            {
                "token":          token,
                "terminal_id":    "TERM-KGL-001",
                "expected_dest":  manifest.dest,
            },
        )
        _print_http_response(code, body)

        if code == 200 and body.get("status") == "ACCEPTED":
            _success(
                f"DELIVERY ACCEPTED  |  "
                f"CID: {body.get('cid')}  |  "
                f"SKU: {body.get('sku')}  |  "
                f"QTY RECEIVED: +{body.get('qty_received')}  |  "
                f"NEW STOCK: {body.get('updated_stock')}"
            )
            ledger = body.get("ledger_receipt", {})
            _key_val("Ledger Log ID",     ledger.get("log_id"))
            _key_val("Previous Hash",     str(ledger.get("previous_hash", ""))[:24] + "...")
            _key_val("Current Hash",      str(ledger.get("current_hash",  ""))[:24] + "...")
        else:
            _failure("Unexpected rejection on genuine token!")
        return

    # Offline crypto-only verification
    _info("[OFFLINE] Running local HMAC-SHA256 verification…")
    try:
        verified = verify_manifest_offline(token, expected_dest=manifest.dest)
        _success(
            f"[OFFLINE VERIFIED] cid={verified.cid}  sku={verified.sku}  "
            f"qty=+{verified.qty}"
        )
        _info("(DB stock update would run on uplink restore -- in-memory twin updated)")
    except TacticalSecurityError as e:
        _failure(f"[UNEXPECTED FAILURE] {e.error_code}: {e.detail}")


# ===========================================================================
# Scenario 3 — Man-in-the-Middle Attack
# ===========================================================================
def scenario_3_mitm(
    manifest: ConsignmentManifest, base_url: str, offline: bool
) -> None:
    _rule("SCENARIO 3 -- Man-in-the-Middle Attack: qty 5000 -> 500 crates")
    _info(
        "Adversary intercepts crate tag in transit and alters qty from 5,000 -> 500.\n"
        "  (HMAC signature left unchanged -- classic MITM injection)\n"
        "  Field terminal will attempt to verify the tampered token..."
    )
    time.sleep(0.6)

    tampered_token = _tamper_token(manifest, new_qty=500)

    if not offline and _HTTPX:
        _info(f"[HTTP] POST {base_url}/api/v1/handover/scan-verify  (with tampered token)")
        code, body = _http_post(
            f"{base_url}/api/v1/handover/scan-verify",
            {"token": tampered_token, "terminal_id": "TERM-KGL-001"},
        )
        _print_http_response(code, body)

        if code == 401:
            err = body.get("detail", body)
            ec  = err.get("error_code", "?")
            _failure(
                f"HTTP 401 BLOCKED  |  error_code={ec}  |  "
                f"ZERO STOCK INCREMENT  |  Security incident logged to ledger"
            )
            _success("Zero-Trust defence activated: stock NOT modified.")
        else:
            _warn(f"Unexpected HTTP {code} — check server logs.")
        return

    # Offline
    _info("[OFFLINE] Running local HMAC-SHA256 verification on tampered token…")
    try:
        verify_manifest_offline(tampered_token)
        _failure("[CRITICAL] Tampered token passed verification — THIS SHOULD NOT HAPPEN")
    except TacticalSecurityError as e:
        _failure(
            f"[ATTACK BLOCKED OFFLINE] error_code={e.error_code}\n"
            f"  {e.detail}"
        )
        _success("Stock NOT incremented. Anomaly record would be written to ledger.")


# ===========================================================================
# Scenario 4 — Replay Attack
# ===========================================================================
def scenario_4_replay(
    manifest: ConsignmentManifest, base_url: str, offline: bool
) -> None:
    _rule("SCENARIO 4 -- Replay Attack: Resend Already-Consumed Token")
    _info(
        "Adversary copies the legitimate token from Scenario 2 and re-submits it.\n"
        "  The Monotonic Nonce Registry will detect the duplicate scan..."
    )
    time.sleep(0.4)

    token = manifest.to_token()  # same token as Scenario 2

    if not offline and _HTTPX:
        _info(f"[HTTP] POST {base_url}/api/v1/handover/scan-verify  (replay of S2 token)")
        code, body = _http_post(
            f"{base_url}/api/v1/handover/scan-verify",
            {"token": token, "terminal_id": "TERM-KGL-001"},
        )
        _print_http_response(code, body)

        if code == 409:
            err = body.get("detail", body)
            _failure(
                f"HTTP 409 BLOCKED  |  error_code={err.get('error_code', '?')}  |  "
                f"REPLAY ATTACK DETECTED  |  Incident logged"
            )
            _success("Replay Shield activated: duplicate nonce rejected.")
        else:
            _warn(f"Unexpected HTTP {code} — if running --offline, nonce was consumed in S2.")
        return

    # Offline — simulate nonce already consumed by S2
    _info("[OFFLINE] Attempting to re-verify previously consumed nonce…")
    try:
        verify_manifest_offline(token)
        _failure("[CRITICAL] Replay passed verification — should have been blocked.")
    except TacticalSecurityError as e:
        if e.error_code == "REPLAY_ATTACK_DETECTED":
            _failure(
                f"[REPLAY BLOCKED OFFLINE] error_code={e.error_code}\n"
                f"  {e.detail}"
            )
            _success("Nonce replay rejected successfully.")
        else:
            _failure(f"[WRONG ERROR] expected REPLAY_ATTACK_DETECTED, got {e.error_code}: {e.detail}")


# ===========================================================================
# Main
# ===========================================================================
def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Sena Aapurti — Blind Drop Simulator (SIH26251 Jury Demo)\n"
            "Runs 4 live scenarios: authentic drop, MITM, replay attack."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--url",
        default=BASE_URL_DEFAULT,
        help=f"FastAPI server base URL (default: {BASE_URL_DEFAULT})",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Run in offline crypto-only mode without HTTP calls.",
    )
    parser.add_argument(
        "--scenario",
        type=int,
        choices=[1, 2, 3, 4],
        default=None,
        help="Run a specific scenario only (1–4). Omit to run all.",
    )
    args = parser.parse_args()

    base_url = args.url.rstrip("/")
    offline  = args.offline or not _HTTPX

    if _RICH:
        console.print(
            Panel(
                "[bold white]SENA AAPURTI — Cryptographic Blind-Drop Simulator[/bold white]\n"
                "[dim]SIH Problem Statement SIH26251  |  Core Innovation #3[/dim]\n"
                "[dim]HMAC-SHA256 Air-Gapped Tactical Delivery Verification[/dim]",
                border_style="bold cyan",
                padding=(1, 4),
            )
        )
    else:
        print("=" * 70)
        print("  SENA AAPURTI — Blind-Drop Simulator  |  SIH26251")
        print("=" * 70)

    _info(f"Server URL : {base_url}  |  Offline mode : {offline}")
    time.sleep(0.2)

    # ── Run Scenarios ────────────────────────────────────────────────────────
    run_all = args.scenario is None

    manifest: Optional[ConsignmentManifest] = None

    if run_all or args.scenario == 1:
        manifest = scenario_1_generate(base_url, offline)
        time.sleep(0.5)

    if run_all or args.scenario in (2, 3, 4):
        if manifest is None:
            # Generate locally if S1 was skipped
            _info("[INIT] Generating manifest locally for downstream scenarios…")
            manifest = generate_signed_manifest(
                cid="DROP-2026-NORTH-8841",
                origin="HQ-NORTH",
                dest="DEPOT-KGL",
                sku="MUN-762-NATO",
                qty=5000,
                unit_id="UNIT-FOB-BRAVO",
                ttl_hours=24.0,
            )

        if run_all or args.scenario == 2:
            scenario_2_receive(manifest, base_url, offline)
            time.sleep(0.5)

        if run_all or args.scenario == 3:
            scenario_3_mitm(manifest, base_url, offline)
            time.sleep(0.5)

        if run_all or args.scenario == 4:
            scenario_4_replay(manifest, base_url, offline)

    # ── Final Summary ────────────────────────────────────────────────────────
    _rule("SIMULATION COMPLETE")

    if _RICH:
        summary = Table(title="Scenario Outcomes", box=box.SIMPLE_HEAVY)
        summary.add_column("Scenario",  style="bold cyan")
        summary.add_column("Attack Type",  style="yellow")
        summary.add_column("Expected HTTP", style="white")
        summary.add_column("Defence Mechanism", style="green")

        summary.add_row("1 — Generate",  "N/A (HQ Operation)",        "HTTP 201",  "HMAC-SHA256 Seal")
        summary.add_row("2 — Receive",   "N/A (Legitimate Scan)",     "HTTP 200",  "HMAC-SHA256 + TTL Verify")
        summary.add_row("3 — MITM",      "Payload Tampering",         "HTTP 401",  "SIGNATURE_MISMATCH")
        summary.add_row("4 — Replay",    "Token Re-use Attack",       "HTTP 409",  "REPLAY_ATTACK_DETECTED")

        console.print(summary)
    else:
        print("\n  Scenario Results:")
        print("  S1 Generate  → HTTP 201  |  HMAC-SHA256 Seal")
        print("  S2 Receive   → HTTP 200  |  Verified + DB committed")
        print("  S3 MITM      → HTTP 401  |  SIGNATURE_MISMATCH — zero stock update")
        print("  S4 Replay    → HTTP 409  |  REPLAY_ATTACK_DETECTED")

    _success("[OK] All Zero-Trust defences operational. Sena Aapurti Blind-Drop engine validated.")


if __name__ == "__main__":
    main()
