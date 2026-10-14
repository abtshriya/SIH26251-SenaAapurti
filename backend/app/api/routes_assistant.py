import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.api.routes_inventory import memory_store

logger = logging.getLogger("sena_aapurti.assistant")

router = APIRouter(tags=["Jai Hind SenaAapurti Assistant"])

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User query or command")
    session_id: Optional[str] = Field(default="SENA-SESSION-DEFAULT")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AssistantChatResponse(BaseModel):
    response: str
    quick_replies: List[str]
    category: str
    status: str = "SUCCESS"
    timestamp: str
    tracking_data: Optional[Dict[str, Any]] = None


class TrackQueryRequest(BaseModel):
    identifier: str = Field(..., min_length=2, max_length=100)


# ---------------------------------------------------------------------------
# Knowledge Repositories & Data Lookups
# ---------------------------------------------------------------------------

KNOWN_CONVOYS: Dict[str, Dict[str, Any]] = {
    "CV-104-N": {
        "callsign": "GARUDA-01",
        "source": "COD Pathankot",
        "destination": "FSD Leh (14 Corps)",
        "route": "Manali - Rohtang - Atal Tunnel - Keylong - Sarchu",
        "cargo": "Class III (POL/Fuel) - 320 Tonnage",
        "status": "In-Transit",
        "eta": "4 hrs 15 mins",
        "escort": "Subedar R. P. Yadav (ASC)",
        "weather_flag": "Light snow flurry near Baralacha La pass (-14°C)",
        "last_checkpoint": "Keylong Staging Post (Passed at 13:00 hrs)",
    },
    "CV-209-E": {
        "callsign": "BRAHMAPUTRA-4",
        "source": "COD Narangi (Guwahati)",
        "destination": "Forward Base Tawang (4 Corps)",
        "route": "Bhalukpong - Bomdila - Sela Tunnel Axis",
        "cargo": "Class V (Ammunition) - 190 Tonnage",
        "status": "In-Transit",
        "eta": "2 hrs 40 mins",
        "escort": "Naib Subedar K. Gogoi (AOC)",
        "weather_flag": "Normal visibility through Sela Twin-Tube Tunnel",
        "last_checkpoint": "Sela Tunnel South Entry (Passed at 14:45 hrs)",
    },
    "CV-318-N": {
        "callsign": "HIMALAYA-9",
        "source": "21 Adv Base Depot (Udhampur)",
        "destination": "Drass-Kargil Brigade FSD",
        "route": "Jammu - Srinagar Bypass - Zojila Axis",
        "cargo": "Winter Stocking - 420 Tonnage",
        "status": "Rerouted via Nilgrath Bypass",
        "eta": "7 hrs 10 mins",
        "escort": "Major S. Nambiar (ASC)",
        "weather_flag": "Zojila upper pass temporarily restricted; transit continuing safely",
        "last_checkpoint": "Sonamarg Choke Point (Passed at 12:10 hrs)",
    },
    "CV-442-W": {
        "callsign": "CHETAK-2",
        "source": "COD Agra",
        "destination": "Desert Strike Depot (Jodhpur)",
        "route": "Agra - Jaipur - Jodhpur NH25 Express Corridor",
        "cargo": "Class IX (Spares) - 210 Tonnage",
        "status": "In-Transit",
        "eta": "1 hr 15 mins",
        "escort": "Havildar M. Rathore (EME)",
        "weather_flag": "Clear desert weather (38°C)",
        "last_checkpoint": "Jaipur Military Bypass (Passed at 12:00 hrs)",
    },
}

KNOWN_INDENTS: Dict[str, Dict[str, Any]] = {
    "IND-2026-9041": {
        "unit": "14 RAJPUT (MECHANISED)",
        "item": "Sub-Zero High Speed Diesel (Winter Grade -40°C)",
        "quantity": "18,000 Litres",
        "urgency": "Operational Priority 1",
        "status": "Approved by DGOS (Dispatched via Convoy GARUDA-01)",
        "destination": "FDL Leh Sector",
        "expected_delivery": "Within 24 Hours",
    },
    "IND-2026-9042": {
        "unit": "14 RAJPUT (MECHANISED)",
        "item": "BMP-II Track Pins & Cold-Start Batteries",
        "quantity": "48 Sets",
        "urgency": "Routine",
        "status": "Dispatched from COD Agra",
        "destination": "EME Field Workshop (Leh)",
        "expected_delivery": "In Transit",
    },
    "IND-2026-9043": {
        "unit": "3 PARA (SPECIAL FORCES)",
        "item": "Glacier Multi-layer Suits & High-Altitude Rations",
        "quantity": "320 Kits",
        "urgency": "Operational Priority 1",
        "status": "Pending HQ Verification & Sign-off",
        "destination": "Partapur Base Camp",
        "expected_delivery": "Awaiting Approval",
    },
    "IND-2026-9044": {
        "unit": "19 ARTILLERY REGIMENT",
        "item": "155mm Extended Range Bi-Modular Charge Systems",
        "quantity": "450 Rounds",
        "urgency": "Operational Priority 1",
        "status": "Under DGOS Verification",
        "destination": "Drass High Altitude Gun Positions",
        "expected_delivery": "Scheduled for Dispatch",
    },
    "REQ-SIACHEN-2026-009": {
        "unit": "UNIT-FOB-ALPHA",
        "item": "155mm High-Explosive Artillery Shell",
        "quantity": "600 Rounds",
        "urgency": "FLASH_OVERRIDE",
        "status": "APPROVED_DISPATCHED (MFA Verified)",
        "destination": "Forward Base Siachen-Alpha",
        "expected_delivery": "Under Priority Convoy Transit",
    },
}

CLASSIFIED_KEYWORDS = [
    "classified", "secret", "secret code", "strike plan", "strike", "nuclear", "war plan",
    "troop movement", "troop deployment", "deployment", "grid coordinates", "coordinates",
    "latitude", "longitude", "password hash", "private key", "ammo secret", "offensive operation",
    "attack plan", "raw coordinates", "covert", "intelligence asset", "special ops", "special ops mission",
    "warhead", "missile target", "tactical operation"
]

RECRUITMENT_KEYWORDS = [
    "recruitment", "join indian army", "rally", "eligibility age",
    "physical test", "written exam", "nda", "cds", "agniveer", "soldier gd",
    "medical fitness", "officer entry"
]

PENSION_WELFARE_KEYWORDS = [
    "pension", "echs", "sparsh", "canteen", "csd", "ex-servicemen", "gratuity"
]


# ---------------------------------------------------------------------------
# Assistant Logic Core
# ---------------------------------------------------------------------------
def process_assistant_query(query: str, context: Optional[Dict[str, Any]] = None) -> AssistantChatResponse:
    cleaned = query.strip()
    lower = cleaned.lower()
    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. SECURITY PROTOCOL CHECK: Intercept classified or operational requests
    for kw in CLASSIFIED_KEYWORDS:
        if kw in lower:
            msg = (
                "Jai Hind.\n\n"
                "**SECURITY PROTOCOL ENFORCEMENT - ACCESS RESTRICTED**\n\n"
                "• In strict compliance with Indian Army Information Security and Defense Operational Protocols, "
                "queries concerning classified tactical movements, tactical deployments, operational grid references, "
                "or restricted command credentials cannot be displayed or queried on this open logistics portal.\n"
                "• All tactical operational plans and classified movements are exclusively processed via encrypted "
                "**ASCON C4ISR terminals** under the Directorate General of Military Operations (DGMO).\n\n"
                "Please restrict queries to authorized defense supply chain, depot inventory, and consignment tracking matters."
            )
            return AssistantChatResponse(
                response=msg,
                quick_replies=["Check Requisition Status", "New Indent", "Depot Contact", "Vendor Portal Support"],
                category="SECURITY_RESTRICTED",
                status="RESTRICTED",
                timestamp=now_ts,
            )

    # 2. OUT-OF-BOUNDS REDIRECTION: Indian Army Recruitment
    for kw in RECRUITMENT_KEYWORDS:
        if kw in lower:
            msg = (
                "Jai Hind.\n\n"
                "**NOTICE: REDIRECTION TO RECRUITMENT DIRECTORATE**\n\n"
                "• Sena Aapurti is the dedicated logistics, inventory, and supply chain portal of the Indian Army.\n"
                "• For all queries regarding recruitment rallies, eligibility criteria, Agniveer selection, "
                "and officer entries (NDA/CDS/TES/TGC), please visit the official recruitment portal:\n\n"
                "  - **Official Portal**: [Join Indian Army (joinindianarmy.nic.in)](https://joinindianarmy.nic.in)\n"
                "  - **Recruiting Directorate Helpdesk**: 011-26173215 / 011-26175473\n\n"
                "How may I assist you with military supplies or depot requisitions?"
            )
            return AssistantChatResponse(
                response=msg,
                quick_replies=["Check Requisition Status", "New Indent", "Depot Contact", "Vendor Portal Support"],
                category="OUT_OF_SCOPE_RECRUITMENT",
                status="SUCCESS",
                timestamp=now_ts,
            )

    # 3. OUT-OF-BOUNDS REDIRECTION: Pension & CSD Welfare
    for kw in PENSION_WELFARE_KEYWORDS:
        if kw in lower:
            msg = (
                "Jai Hind.\n\n"
                "**NOTICE: REDIRECTION TO WELFARE & PENSION BRANCH**\n\n"
                "• For Ex-Servicemen welfare, ECHS health scheme, or pension settlements, please contact:\n"
                "  1. **SPARSH Defense Pension Portal**: https://sparsh.defencepension.gov.in (Toll-Free: 1800-180-5325)\n"
                "  2. **ECHS Central Organisation**: South Block, New Delhi\n"
                "  3. **CSD Smart Card Helpdesk**: https://afd.csdindia.gov.in\n\n"
                "For logistics and ordnance support, feel free to use the quick options below."
            )
            return AssistantChatResponse(
                response=msg,
                quick_replies=["Check Requisition Status", "New Indent", "Depot Contact", "Vendor Portal Support"],
                category="OUT_OF_SCOPE_WELFARE",
                status="SUCCESS",
                timestamp=now_ts,
            )

    # 4. TRACKING BY IDENTIFIER (Indent ID or Convoy ID)
    # Check for direct match or regex search
    indent_matches = re.findall(r"(?:IND-\d{4}-\d{4}|REQ-[A-Z0-9\-]+)", cleaned, re.IGNORECASE)
    convoy_matches = re.findall(r"CV-\d{3}-[A-Z]", cleaned, re.IGNORECASE)

    if indent_matches or ("indent" in lower and any(k.lower() in lower for k in KNOWN_INDENTS)):
        matched_id = indent_matches[0].upper() if indent_matches else next(k for k in KNOWN_INDENTS if k.lower() in lower)
        data = KNOWN_INDENTS.get(matched_id)
        if data:
            msg = (
                f"Jai Hind.\n\n"
                f"**REQUISITION CONSIGNMENT REPORT: {matched_id}**\n\n"
                f"• **Requesting Unit**: {data['unit']}\n"
                f"• **Stores Description**: {data['item']}\n"
                f"• **Indented Quantity**: {data['quantity']}\n"
                f"• **Operational Urgency**: {data['urgency']}\n"
                f"• **Consignment Status**: {data['status']}\n"
                f"• **Destination Axis**: {data['destination']}\n"
                f"• **Projected Sustenance ETA**: {data['expected_delivery']}\n\n"
                f"**Next Action Guidance**:\n"
                f"1. To confirm digital handover upon receipt, upload the cryptographically signed IAFZ-2026 receipt voucher.\n"
                f"2. For priority escalations, contact the DGOS Movement Control Room."
            )
            return AssistantChatResponse(
                response=msg,
                quick_replies=["Track Another Indent", "New Indent", "Depot Contact", "Return to Menu"],
                category="TRACKING_INDENT",
                status="SUCCESS",
                timestamp=now_ts,
                tracking_data=data,
            )

    if convoy_matches or ("convoy" in lower and any(k.lower() in lower for k in KNOWN_CONVOYS)):
        matched_id = convoy_matches[0].upper() if convoy_matches else next(k for k in KNOWN_CONVOYS if k.lower() in lower)
        data = KNOWN_CONVOYS.get(matched_id)
        if data:
            msg = (
                f"Jai Hind.\n\n"
                f"**CONVOY TELEMETRY STATUS: {matched_id} ({data['callsign']})**\n\n"
                f"• **Dispatch Depot**: {data['source']}\n"
                f"• **Destination FSD**: {data['destination']}\n"
                f"• **Transit Corridor**: {data['route']}\n"
                f"• **Stores Carried**: {data['cargo']}\n"
                f"• **Movement Status**: {data['status']}\n"
                f"• **Estimated Time of Arrival (ETA)**: {data['eta']}\n"
                f"• **Convoy Escort In-Charge**: {data['escort']}\n"
                f"• **Last Verified Checkpoint**: {data['last_checkpoint']}\n"
                f"• **Weather & Terrain Advisory**: {data['weather_flag']}\n\n"
                f"**Operational Note**: All vehicles are continuously monitored via encrypted satellite transponders."
            )
            return AssistantChatResponse(
                response=msg,
                quick_replies=["Track Convoy", "Check Requisition Status", "Depot Contact", "Return to Menu"],
                category="TRACKING_CONVOY",
                status="SUCCESS",
                timestamp=now_ts,
                tracking_data=data,
            )

    # 5. SPECIFIC CAPABILITY: Check Requisition Status
    if any(k in lower for k in ["check requisition", "track requisition", "requisition status", "track indent", "check indent", "indent status"]):
        msg = (
            "Jai Hind.\n\n"
            "**SUPPLY REQUISITION TRACKING DESK**\n\n"
            "To track a consignment or indent voucher, please provide or select a reference ID:\n\n"
            "• **Sample Active Indents**:\n"
            "  - `IND-2026-9041` : Winter POL Fuel (14 Rajput / Leh)\n"
            "  - `IND-2026-9042` : BMP-II Spares & Tracks (COD Agra)\n"
            "  - `IND-2026-9043` : Glacier Survival Kits (3 PARA SF / Siachen)\n"
            "  - `IND-2026-9044` : 155mm Artillery Munitions (19 Arty / Drass)\n\n"
            "You can type the exact Indent ID or select from the quick options below."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["IND-2026-9041", "IND-2026-9042", "IND-2026-9043", "IND-2026-9044", "New Indent"],
            category="REQUISITION_MENU",
            status="SUCCESS",
            timestamp=now_ts,
        )

    # 6. SPECIFIC CAPABILITY: New Indent Filing / Submission
    if any(k in lower for k in ["new indent", "create indent", "file indent", "raise indent", "request supply", "supply requisition"]):
        msg = (
            "Jai Hind.\n\n"
            "**PROCEDURE: FILING A NEW DEFENSE REQUISITION (INDENT)**\n\n"
            "To raise an authorized supply indent for forward replenishment, execute the following numbered steps:\n\n"
            "1. **Authenticate**: Log in to the **Unit Portal** using your Army Service Number and registered credentials.\n"
            "2. **Select Supply Class**:\n"
            "   - **Class I**: Combat Rations & Fresh Supplies (3500 kcal/pack)\n"
            "   - **Class III**: Sub-Zero High Speed Diesel (POL / Aviation Fuel)\n"
            "   - **Class V**: Munitions & Artillery Charges (UBL Replenishment)\n"
            "   - **Class IX**: Vehicle Spares, BMP Overhaul Assemblies & EME kits\n"
            "   - **Special Stores**: Extreme Cold Climate (ECC) Clothing & Medical Kits\n"
            "3. **Complete Digital Voucher IAFZ-2026**: Specify item SKU, required quantity, operational justification, and desired delivery date.\n"
            "4. **Sign & Transmit**: Apply your Regimental Quartermaster / OC digital token to submit into the DGOS predictive dispatch queue.\n\n"
            "Would you like guidance on a specific supply class or priority tier?"
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["Class I (Rations)", "Class III (Fuel)", "Class V (Munitions)", "Class IX (Spares)", "Unit Portal Login"],
            category="PROCEDURE_INDENT",
            status="SUCCESS",
            timestamp=now_ts,
        )

    # 7. SPECIFIC CAPABILITY: Dispatch & Tracking Overview
    if any(k in lower for k in ["dispatch", "convoy tracking", "tracking", "consignment", "transit"]):
        msg = (
            "Jai Hind.\n\n"
            "**CONVOY & CONSIGNMENT TRACKING NETWORK**\n\n"
            "The Indian Army Logistics Fleet is actively synchronizing high-altitude and strategic corridors:\n\n"
            "• **Active Monitored Convoys**:\n"
            "  - `CV-104-N` (**GARUDA-01**): COD Pathankot ➔ FSD Leh (POL / Fuel)\n"
            "  - `CV-209-E` (**BRAHMAPUTRA-4**): COD Narangi ➔ Tawang (Class V Ammo)\n"
            "  - `CV-318-N` (**HIMALAYA-9**): 21 ABD Udhampur ➔ Drass (Winter Stocking)\n"
            "  - `CV-442-W` (**CHETAK-2**): COD Agra ➔ Jodhpur (Class IX Spares)\n\n"
            "Select any convoy ID or enter a voucher number to inspect live telemetry and transit status."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["CV-104-N (Leh POL)", "CV-209-E (Tawang Ammo)", "CV-318-N (Drass Stock)", "Check Requisition Status"],
            category="DISPATCH_TRACKING",
            status="SUCCESS",
            timestamp=now_ts,
        )

    # 8. SPECIFIC CAPABILITY: Depot Directory & Contacts
    if any(k in lower for k in ["depot", "cod", "contact", "phone", "helpline", "control room"]):
        msg = (
            "Jai Hind.\n\n"
            "**CENTRAL ORDNANCE DEPOTS (COD) & CONTROL ROOM DIRECTORY**\n\n"
            "• **24x7 Army HQ Logistics Ops Room**:\n"
            "  - Toll-Free: 1800-11-SENA (7362)\n"
            "  - ASCON Extension: Node 4481 / 4482\n"
            "  - Email: `support.senaaapurti@nic.in`\n\n"
            "• **Strategic Depots**:\n"
            "  - **COD Pathankot**: Northern Theater Forward Holding Depot\n"
            "  - **COD Narangi (Guwahati)**: Eastern Command Principal Logistics Railhead\n"
            "  - **COD Jabalpur**: National Munitions & Heavy Armament Repository\n"
            "  - **COD Agra**: Vehicle Spares & Armoured Maintenance Park\n"
            "  - **21 ABD Udhampur**: Advance Base Depot for J&K & Ladakh sectors\n\n"
            "For urgent operational inquiries, contact the respective Command Movement Control Officer."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["Check Requisition Status", "New Indent", "Vendor Portal Support", "Command Portal"],
            category="DEPOT_DIRECTORY",
            status="SUCCESS",
            timestamp=now_ts,
        )

    # 9. SPECIFIC CAPABILITY: Verification, Vendor Registration & Portal Access Support
    if any(k in lower for k in ["vendor", "gem", "registration", "login", "password", "access", "mfa", "token", "verification"]):
        msg = (
            "Jai Hind.\n\n"
            "**VERIFICATION & PORTAL ACCESS SUPPORT**\n\n"
            "Guidance for authorized defense personnel and registered commercial defense vendors:\n\n"
            "• **Defense Vendor Registration (GeM Defense Window)**:\n"
            "  1. Register on the Government e-Marketplace (GeM) Defense Portal (`gem.gov.in`).\n  2. Obtain OEM/Vendor Certification through DGQA (Directorate General of Quality Assurance).\n  3. Submit GSTIN, PAN, and Industrial Security Clearances to the DGOS Vendor Desk.\n\n"
            "• **Officer & Quartermaster Portal Login Issues**:\n"
            "  1. Ensure you are accessing via authorized ASCON intranet or VPN Gateway.\n  2. For Step-Up MFA authorization, verify your registered hardware YubiKey or military OTP token.\n  3. If your account is locked after 3 failed attempts, contact the Cyber Security Helpdesk at Node 4481.\n\n"
            "Select an option below for immediate procedural assistance."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["Reset Password / Access", "Vendor Documentation", "Check Requisition Status", "Depot Contact"],
            category="ACCESS_SUPPORT",
            status="SUCCESS",
            timestamp=now_ts,
        )

    # 10. SPECIFIC CLASSES (Class I, III, V, IX)
    if any(k in lower for k in ["class i", "rations", "mre", "food"]):
        msg = (
            "Jai Hind.\n\n"
            "**CLASS I STORES: COMBAT RATIONS & HIGH-ALTITUDE SUSTENANCE**\n\n"
            "• **Standard Issue**: Ready-to-Eat Combat Meal Packs (3500 kcal daily thermal allowance).\n"
            "• **Winter Stocking**: 180-day pre-positioned emergency shelf life in high-altitude pickets.\n"
            "• **Requisition Protocol**: Filed via Unit Portal with Quartermaster signature on Form IAFZ-2026.\n"
            "• **Current Northern Reserve**: 1,240,000 Packs available across COD Pathankot and FSD Leh."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["New Indent", "Check Requisition Status", "Class III (Fuel)", "Depot Contact"],
            category="STORES_CLASS_I",
            status="SUCCESS",
            timestamp=now_ts,
        )

    if any(k in lower for k in ["class iii", "pol", "fuel", "diesel", "aviation"]):
        msg = (
            "Jai Hind.\n\n"
            "**CLASS III STORES: PETROLEUM, OIL & LUBRICANTS (POL)**\n\n"
            "• **Sub-Zero High Speed Diesel (Grade -40°C)**: Anti-waxing formulation engineered for Ladakh and Siachen.\n"
            "• **Aviation Turbine Fuel (JP-8 Arctic Grade)**: Dedicated for Mi-17V5, ALH Dhruv, and C-130J resupply sorties.\n"
            "• **Buffer Status**: 4,850,000 Litres active reserve across Northern Command reserves.\n"
            "• **Emergency Convoy**: Convoy `CV-104-N` is presently transporting 320 tonnes of Sub-Zero POL to Leh."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["Track Convoy CV-104-N", "New Indent", "Check Requisition Status", "Depot Contact"],
            category="STORES_CLASS_III",
            status="SUCCESS",
            timestamp=now_ts,
        )

    if any(k in lower for k in ["class v", "munitions", "ammunition", "ammo", "rounds"]):
        msg = (
            "Jai Hind.\n\n"
            "**CLASS V STORES: MUNITIONS & WEAPON SUSTENANCE**\n\n"
            "• **Unit Basic Load (UBL)**: Automated replenishment threshold enforced at 85% readiness.\n"
            "• **Tracked Ordnance**: 155mm Dhanush/K9 Vajra HE artillery rounds, 7.62mm NATO ammunition, and bi-modular charges.\n"
            "• **Strict Protocol**: Class V allocation requires Step-Up MFA cryptographic approval from the approving Colonel/Brigadier.\n"
            "• **Current Dispatches**: Convoy `CV-209-E` en route to Eastern Command forward base Tawang."
        )
        return AssistantChatResponse(
            response=msg,
            quick_replies=["Track Convoy CV-209-E", "Check Requisition Status", "New Indent", "Depot Contact"],
            category="STORES_CLASS_V",
            status="SUCCESS",
            timestamp=now_ts,
        )

    # 11. DEFAULT GREETING / GENERAL INQUIRY (Default fallback with screenshot persona)
    msg = (
        "Jai Hind.\n\n"
        "I'm **SenaAapurti Assistant**, and I'm here to answer any questions you may have about "
        "Indian Army logistics, defense supply requisitions, consignment tracking, and inventory support.\n\n"
        "How can I assist you today?"
    )
    return AssistantChatResponse(
        response=msg,
        quick_replies=["Check Requisition Status", "New Indent", "Depot Contact", "Vendor Portal Support"],
        category="GENERAL_ASSISTANCE",
        status="SUCCESS",
        timestamp=now_ts,
    )


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@router.post("/assistant/chat", response_model=AssistantChatResponse, status_code=status.HTTP_200_OK)
def assistant_chat(payload: AssistantChatRequest) -> AssistantChatResponse:
    """
    Virtual Assistant dialogue endpoint providing disciplined, secure military
    logistics, requisition guidance, tracking updates, and quick actions.
    """
    logger.info("Assistant query received: '%s'", payload.message[:80])
    return process_assistant_query(payload.message, payload.context)


@router.get("/assistant/quick-actions", status_code=status.HTTP_200_OK)
def get_quick_actions() -> Dict[str, Any]:
    """
    Returns initial menu suggestions and quick reply pills for the assistant.
    """
    return {
        "status": "OPERATIONAL",
        "greeting": "Jai Hind. I'm SenaAapurti Assistant. How can I assist your logistics needs today?",
        "categories": [
            {
                "title": "Supply Requisitions",
                "options": ["Check Requisition Status", "New Indent", "Class I (Rations)", "Class III (Fuel)", "Class V (Munitions)"],
            },
            {
                "title": "Dispatch & Tracking",
                "options": ["Track Convoy CV-104-N", "Track Convoy CV-209-E", "Track Convoy CV-318-N", "Depot Transfers"],
            },
            {
                "title": "Depot & Access Support",
                "options": ["Depot Contact", "Vendor Portal Support", "Login / Password Help", "Standard Forms IAFZ-2026"],
            },
        ],
        "default_quick_replies": [
            "Check Requisition Status",
            "New Indent",
            "Depot Contact",
            "Vendor Portal Support",
        ],
    }


@router.post("/assistant/track", status_code=status.HTTP_200_OK)
def quick_track(payload: TrackQueryRequest) -> Dict[str, Any]:
    """
    Direct identifier lookup for indents or convoy tracking.
    """
    query = payload.identifier.strip().upper()
    if query in KNOWN_INDENTS:
        return {
            "type": "INDENT",
            "identifier": query,
            "found": True,
            "data": KNOWN_INDENTS[query],
        }
    if query in KNOWN_CONVOYS:
        return {
            "type": "CONVOY",
            "identifier": query,
            "found": True,
            "data": KNOWN_CONVOYS[query],
        }
    return {
        "type": "UNKNOWN",
        "identifier": query,
        "found": False,
        "message": f"Identifier '{query}' not found in active theater ledger. Please check reference number.",
    }
