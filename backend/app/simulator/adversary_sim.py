"""
Sena Aapurti — Adversary Simulation & Zero Trust Verification Harness
=====================================================================
Executes 4 live adversarial & operational scenarios against the FastAPI Zero Trust Gateway:
  1. Valid Edge Telemetry Transmission               -> Expected: HTTP 200 OK
  2. Man-in-the-Middle (MITM) Payload Tampering      -> Expected: HTTP 401 Unauthorized
  3. Replayed Captured Packet (Duplicate Nonce)      -> Expected: HTTP 409 Conflict
  4. High-Risk Requisition Approval without Step-Up  -> Expected: HTTP 403 Forbidden
     (+ Follow-up Verification of Cryptographic Audit Ledger Chain)

Usage:
  cd backend
  python -m app.simulator.adversary_sim
"""

import argparse
import hashlib
import hmac
import json
import sys
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

import httpx
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

DEFAULT_BASE_URL = "http://localhost:8000/api/v1"
DEFAULT_IOT_SECRET = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"


def sign_telemetry_payload(
    secret: str,
    device_id: str,
    unit_id: str,
    sku: str,
    reported_quantity: int,
    sequence_id: int,
    nonce: str,
    timestamp_iso: str,
) -> str:
    canonical = {
        "device_id": device_id,
        "nonce": nonce,
        "reported_quantity": reported_quantity,
        "sequence_id": sequence_id,
        "sku": sku,
        "timestamp": timestamp_iso,
        "unit_id": unit_id,
    }
    raw_bytes = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()


def run_simulation(base_url: str) -> int:
    console.print(
        Panel.fit(
            "[bold cyan]SENA AAPURTI — ZERO TRUST ADVERSARY SIMULATION HARNESS[/bold cyan]\n"
            "[dim]Testing Cryptographic Telemetry Gate, Replay Shield & Step-Up MFA Enforcement[/dim]",
            border_style="cyan",
        )
    )

    results_table = Table(
        title="Zero Trust Security Gate — Live Verification Matrix",
        show_header=True,
        header_style="bold magenta",
    )
    results_table.add_column("#", justify="center", style="bold")
    results_table.add_column("Scenario", style="white")
    results_table.add_column("Attack / Vector", style="yellow")
    results_table.add_column("Expected HTTP", justify="center")
    results_table.add_column("Actual HTTP", justify="center")
    results_table.add_column("Gate Verdict", justify="center")

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    shared_nonce = f"nonce-siachen-{uuid.uuid4().hex[:12]}"
    device_id = "SENSOR-FOB-ALPHA-01"
    unit_id = "UNIT-FOB-ALPHA"
    sku = "MUN-155MM-HE"
    valid_qty = 460
    seq_id = int(datetime.now(timezone.utc).timestamp())

    valid_signature = sign_telemetry_payload(
        secret=DEFAULT_IOT_SECRET,
        device_id=device_id,
        unit_id=unit_id,
        sku=sku,
        reported_quantity=valid_qty,
        sequence_id=seq_id,
        nonce=shared_nonce,
        timestamp_iso=now_iso,
    )

    valid_packet: Dict[str, Any] = {
        "device_id": device_id,
        "unit_id": unit_id,
        "sku": sku,
        "reported_quantity": valid_qty,
        "sequence_id": seq_id,
        "nonce": shared_nonce,
        "timestamp": now_iso,
        "signature": valid_signature,
    }

    all_passed = True

    with httpx.Client(base_url=base_url, timeout=10.0) as client:
        # ---------------------------------------------------------------------
        # SCENARIO 1: Valid Telemetry Transmission (200 OK)
        # ---------------------------------------------------------------------
        resp1 = client.post("/telemetry/secure-ingest", json=valid_packet)
        passed1 = resp1.status_code == 200
        all_passed &= passed1
        results_table.add_row(
            "1",
            "Legitimate Edge Sensor Sync",
            "Valid HMAC-SHA256 + Fresh Nonce",
            "200 OK",
            f"{resp1.status_code}",
            "[bold green]PASS (COMMITTED)[/bold green]"
            if passed1
            else "[bold red]FAIL[/bold red]",
        )

        # ---------------------------------------------------------------------
        # SCENARIO 2: MITM Payload Tampering / Signature Mismatch (401)
        # ---------------------------------------------------------------------
        tampered_packet = dict(valid_packet)
        tampered_packet["nonce"] = f"nonce-mitm-{uuid.uuid4().hex[:8]}"
        tampered_packet["sequence_id"] = seq_id + 1
        # Adversary inflates reported artillery shell stock from 460 -> 9999 without knowing HMAC key
        tampered_packet["reported_quantity"] = 9999

        resp2 = client.post("/telemetry/secure-ingest", json=tampered_packet)
        passed2 = resp2.status_code == 401
        all_passed &= passed2
        results_table.add_row(
            "2",
            "MITM Payload Tampering",
            "Modified quantity (460 -> 9999) w/o HMAC key",
            "401 Unauthorized",
            f"{resp2.status_code}",
            "[bold green]PASS (BLOCKED)[/bold green]"
            if passed2
            else "[bold red]FAIL[/bold red]",
        )

        # ---------------------------------------------------------------------
        # SCENARIO 3: Replayed Captured Packet (409 Conflict)
        # ---------------------------------------------------------------------
        resp3 = client.post("/telemetry/secure-ingest", json=valid_packet)
        passed3 = resp3.status_code == 409
        all_passed &= passed3
        results_table.add_row(
            "3",
            "Replay Attack (Captured Packet)",
            f"Re-transmitting captured nonce '{shared_nonce}'",
            "409 Conflict",
            f"{resp3.status_code}",
            "[bold green]PASS (BLOCKED)[/bold green]"
            if passed3
            else "[bold red]FAIL[/bold red]",
        )

        # ---------------------------------------------------------------------
        # SCENARIO 4: High-Risk Requisition Approval Without Step-Up MFA (403)
        # ---------------------------------------------------------------------
        req_payload = {
            "requisition_id": f"REQ-ALPHA-{uuid.uuid4().hex[:6].upper()}",
            "unit_id": "UNIT-FOB-ALPHA",
            "sku": "MUN-155MM-HE",
            "approved_quantity": 500,
            "approving_officer_id": "UNVERIFIED-SESSION-ACTOR",
            "priority": "FLASH_OVERRIDE",
        }
        resp4 = client.post("/requisitions/approve", json=req_payload)
        body4 = resp4.json() if resp4.headers.get("content-type", "").startswith("application/json") else {}
        error_code4 = body4.get("detail", {}).get("error_code", "")
        passed4 = resp4.status_code == 403 and error_code4 == "STEP_UP_MFA_REQUIRED"
        all_passed &= passed4
        results_table.add_row(
            "4",
            "Unauthenticated Requisition Approval",
            "Missing 'X-StepUp-Token' MFA Header",
            "403 Forbidden (STEP_UP_MFA_REQUIRED)",
            f"{resp4.status_code} ({error_code4})",
            "[bold green]PASS (CHALLENGED)[/bold green]"
            if passed4
            else "[bold red]FAIL[/bold red]",
        )

        console.print(results_table)

        # Verify Cryptographic Ledger Integrity
        audit_resp = client.get("/audit/verification")
        if audit_resp.status_code == 200:
            audit_data = audit_resp.json()
            console.print(
                Panel(
                    f"[bold green]Ledger Status:[/bold green] {audit_data.get('ledger_status')}\n"
                    f"[bold]Blocks Verified:[/bold] {audit_data.get('total_blocks_verified')}\n"
                    f"[bold]Latest Block SHA-256:[/bold] [cyan]{audit_data.get('latest_block_hash')}[/cyan]",
                    title="Tamper-Evident Audit Ledger Inspection",
                    border_style="green" if audit_data.get("chain_integrity_valid") else "red",
                )
            )

    return 0 if all_passed else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sena Aapurti Adversary Test Harness")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Base API v1 URL of the running Sena Aapurti backend",
    )
    args = parser.parse_args()
    try:
        sys.exit(run_simulation(args.base_url))
    except httpx.ConnectError:
        console.print(
            "[bold red]Connection Error:[/bold red] Unable to reach backend at "
            f"[underline]{args.base_url}[/underline]. Start FastAPI first with:\n"
            "  [bold yellow]uvicorn app.main:app --host 0.0.0.0 --port 8000[/bold yellow]"
        )
        sys.exit(2)
