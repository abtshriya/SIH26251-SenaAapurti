"""
Generates the official, high-quality defense publications for Sena Aapurti:
1. SenaAapurti_User_Manual_v4.8.pdf (Comprehensive Operational Manual)
2. Tactical_Quick_Start_Guide.pdf (Tactical Field Terminal Setup Card)
3. Technical_Architecture_Whitepaper.pdf (Technical Architecture & API Whitepaper)
"""

import os
import shutil
import hashlib
from typing import Any, Dict, List, Optional
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Circle, Rect, String, Group, Line
from reportlab.pdfgen import canvas
import math

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        # Top Banner
        self.setFillColor(colors.HexColor("#1b382b"))
        self.setFont("Helvetica-Bold", 7.5)
        self.drawCentredString(A4[0] / 2.0, A4[1] - 22, getattr(self, 'classification_text', "RESTRICTED // FOR OFFICIAL DEFENSE USE ONLY — SECTION 5 PRIVILEGED"))

        # Subtle watermark on subsequent pages
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 42)
            self.setFillColor(colors.HexColor("#0f172a"), alpha=0.03)
            self.translate(A4[0] / 2.0, A4[1] / 2.0)
            self.rotate(35)
            self.drawCentredString(0, 0, getattr(self, 'watermark_text', "SENAAAPURTI OFFICIAL"))
            self.restoreState()
            self.saveState()

        # Bottom Footer
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        doc_ref = getattr(self, 'doc_ref', "DGOS/TECH/2026")
        footer_text = f"Sena Aapurti C4ISR Grid | Document Ref: {doc_ref} | Page {self._pageNumber} of {page_count}"
        self.drawString(36, 18, footer_text)
        auth_tag = "ASCON-128a ENCRYPTED // GOVT OF INDIA"
        self.drawRightString(A4[0] - 36, 18, auth_tag)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 28, A4[0] - 36, 28)
        self.restoreState()

def create_canvas_factory(classification: str, watermark: str, doc_ref: str):
    class CustomNumberedCanvas(NumberedCanvas):
        pass
    CustomNumberedCanvas.classification_text = classification
    CustomNumberedCanvas.watermark_text = watermark
    CustomNumberedCanvas.doc_ref = doc_ref
    return CustomNumberedCanvas

def add_curved_text(d: Drawing, cx: float, cy: float, r: float, text: str, font_name: str = "Helvetica-Bold", font_size: float = 4.2, fill_color: Any = colors.HexColor("#991b1b"), center_angle: float = 90.0, total_span: float = 120.0, clockwise: bool = True):
    n = len(text)
    if n == 0: return
    step = total_span / max(1, n - 1)
    start_angle = center_angle + (total_span / 2.0 if clockwise else -total_span / 2.0)
    for i, ch in enumerate(text):
        ang = start_angle - i * step if clockwise else start_angle + i * step
        rad = math.radians(ang)
        x = cx + r * math.cos(rad)
        y = cy + r * math.sin(rad)
        rot = ang - 90.0 if clockwise else ang + 90.0
        g = Group()
        g.translate(x, y)
        g.rotate(rot)
        g.add(String(0, -font_size / 3.0, ch, fontName=font_name, fontSize=font_size, fillColor=fill_color, textAnchor="middle"))
        d.add(g)

def create_circular_ministry_stamp(date_str: str = "OCT 2026") -> Drawing:
    d = Drawing(84, 84)
    center = 42.0
    c_red = colors.HexColor("#991b1b")
    c_gold = colors.HexColor("#b45309")
    d.add(Circle(center, center, 40, strokeColor=c_red, strokeWidth=1.5, fillColor=colors.HexColor("#fef2f2")))
    d.add(Circle(center, center, 32, strokeColor=c_red, strokeWidth=0.6, fillColor=None))
    d.add(Circle(center, center, 22, strokeColor=c_gold, strokeWidth=0.6, fillColor=None))
    add_curved_text(d, center, center, 35.5, "★ MINISTRY OF DEFENCE ★", font_size=4.0, fill_color=c_red, center_angle=90, total_span=125, clockwise=True)
    add_curved_text(d, center, center, 35.5, "★ DGOS LOGISTICS CELL ★", font_size=3.8, fill_color=c_red, center_angle=270, total_span=125, clockwise=False)
    d.add(Rect(center - 20, center - 4.5, 40, 9, rx=1.5, ry=1.5, strokeColor=c_red, strokeWidth=0.6, fillColor=c_red))
    d.add(String(center, center - 2.2, "APPROVED & ISSUED", fontName="Helvetica-Bold", fontSize=3.8, fillColor=colors.white, textAnchor="middle"))
    d.add(String(center, center + 7.5, "★ GOVT OF INDIA ★", fontName="Helvetica-Bold", fontSize=3.4, fillColor=c_gold, textAnchor="middle"))
    d.add(String(center, center - 12.5, date_str, fontName="Helvetica-Bold", fontSize=4.2, fillColor=c_red, textAnchor="middle"))
    return d

def create_circular_unit_stamp(unit_name: str = "14 CORPS LEH", date_str: str = "OCT 2026") -> Drawing:
    d = Drawing(84, 84)
    center = 42.0
    c_green = colors.HexColor("#1b382b")
    c_gold = colors.HexColor("#ca8a04")
    d.add(Circle(center, center, 40, strokeColor=c_green, strokeWidth=1.5, fillColor=colors.HexColor("#f0fdf4")))
    d.add(Circle(center, center, 32, strokeColor=c_green, strokeWidth=0.6, fillColor=None))
    d.add(Circle(center, center, 22, strokeColor=c_gold, strokeWidth=0.6, fillColor=None))
    add_curved_text(d, center, center, 35.5, f"★ {unit_name} ★", font_size=4.0, fill_color=c_green, center_angle=90, total_span=125, clockwise=True)
    add_curved_text(d, center, center, 35.5, "★ FIELD LOGISTICS ★", font_size=3.8, fill_color=c_green, center_angle=270, total_span=125, clockwise=False)
    d.add(Rect(center - 20, center - 4.5, 40, 9, rx=1.5, ry=1.5, strokeColor=c_green, strokeWidth=0.6, fillColor=c_green))
    d.add(String(center, center - 2.2, "AUTHENTICATED", fontName="Helvetica-Bold", fontSize=3.8, fillColor=colors.white, textAnchor="middle"))
    d.add(String(center, center + 7.5, "★ INDIAN ARMY ★", fontName="Helvetica-Bold", fontSize=3.4, fillColor=c_gold, textAnchor="middle"))
    d.add(String(center, center - 12.5, date_str, fontName="Helvetica-Bold", fontSize=4.2, fillColor=c_green, textAnchor="middle"))
    return d

def get_base_styles():
    ss = getSampleStyleSheet()
    styles = {
        'CoverTitle': ParagraphStyle('CoverTitle', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#16281e'), alignment=1),
        'CoverSubtitle': ParagraphStyle('CoverSubtitle', fontName='Helvetica', fontSize=10.5, leading=14, textColor=colors.HexColor('#ea580c'), alignment=1),
        'CoverMeta': ParagraphStyle('CoverMeta', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#475569'), alignment=1),
        'SectionHeading': ParagraphStyle('SectionHeading', fontName='Helvetica-Bold', fontSize=11.5, leading=15, textColor=colors.HexColor('#16281e'), spaceBefore=8, spaceAfter=4),
        'SubSectionHeading': ParagraphStyle('SubSectionHeading', fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=colors.HexColor('#0f766e'), spaceBefore=6, spaceAfter=3),
        'Body': ParagraphStyle('Body', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#1e293b'), spaceAfter=4),
        'BodyBold': ParagraphStyle('BodyBold', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.HexColor('#0f172a'), spaceAfter=2),
        'Callout': ParagraphStyle('Callout', fontName='Helvetica', fontSize=7.8, leading=11, textColor=colors.HexColor('#1e3a8a')),
        'TableHead': ParagraphStyle('TableHead', fontName='Helvetica-Bold', fontSize=7.2, leading=9, textColor=colors.white, alignment=1),
        'TableCell': ParagraphStyle('TableCell', fontName='Helvetica', fontSize=7, leading=9, textColor=colors.HexColor('#0f172a')),
        'TableCellBold': ParagraphStyle('TableCellBold', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.HexColor('#0f172a')),
        'TableCellStatus': ParagraphStyle('TableCellStatus', fontName='Helvetica-Bold', fontSize=6.8, leading=8.5, textColor=colors.HexColor('#15803d'), alignment=1),
        'CodeSnippet': ParagraphStyle('CodeSnippet', fontName='Courier', fontSize=7, leading=9, textColor=colors.HexColor('#0f172a')),
    }
    return styles

# =========================================================================
# 1. USER MANUAL GENERATION (Clean 2-Page Executive Manual)
# =========================================================================
def generate_user_manual(output_path: str):
    canvas_factory = create_canvas_factory(
        classification="RESTRICTED // ARMED FORCES LOGISTICS DIRECTIVE",
        watermark="DGOS RESTRICTED",
        doc_ref="DGOS/MANUAL/2026/V4.8"
    )
    doc = SimpleDocTemplate(
        output_path, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=34, bottomMargin=32
    )
    styles = get_base_styles()
    story = []

    # --- PAGE 1 ---
    banner_data = [
        [Paragraph("<b>INTEGRATED DEFENCE STAFF • DIRECTORATE GENERAL OF ORDNANCE SERVICES (DGOS)</b>", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1))],
        [Paragraph("MINISTRY OF DEFENCE • GOVERNMENT OF INDIA • NEW DELHI", ParagraphStyle('B2', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#fde047'), alignment=1))]
    ]
    t_banner = Table(banner_data, colWidths=[523])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#16281e')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 10))

    story.append(Paragraph("SENAAAPURTI SYSTEM COMPREHENSIVE MANUAL", styles['CoverTitle']))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Tactical AI & Zero-Trust Logistics Operating Doctrine • Release v4.8", styles['CoverSubtitle']))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Standard Operating Procedure for Command Headquarters, Forward Supply Depots & Field Battalions</b>", styles['CoverMeta']))
    story.append(Spacer(1, 8))

    # Executive Metadata Box
    meta_data = [
        [Paragraph("<b>Document ID:</b>", styles['BodyBold']), Paragraph("MOD-DGOS/MANUAL/2026/V4.8", styles['Body']),
         Paragraph("<b>Effective Date:</b>", styles['BodyBold']), Paragraph("15 October 2026", styles['Body'])],
        [Paragraph("<b>Classification:</b>", styles['BodyBold']), Paragraph("<font color='#991b1b'><b>RESTRICTED (SECTION 5)</b></font>", styles['Body']),
         Paragraph("<b>Target Units:</b>", styles['BodyBold']), Paragraph("All Corps, CODs, FSDs, ASC Battalions", styles['Body'])],
        [Paragraph("<b>Crypto Baseline:</b>", styles['BodyBold']), Paragraph("ASCON-128a + Merkle-Sealed Ledger", styles['Body']),
         Paragraph("<b>Mobile Terminal:</b>", styles['BodyBold']), Paragraph("Android APK v3.4.1 (Ruggedized Client)", styles['Body'])],
    ]
    t_meta = Table(meta_data, colWidths=[105, 160, 105, 153])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.7, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.4, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # Executive Mandate Callout
    summary_text = (
        "<b>EXECUTIVE OPERATIONAL MANDATE:</b> SenaAapurti is the Zero-Trust Military Logistics Decision-Support System "
        "for the Indian Armed Forces. It unifies real-time C4ISR inventory visibility, hybrid AI demand forecasting, "
        "multi-modal extreme-weather route routing, Arrhenius cold-chain degradation monitoring, and ASCON-encrypted "
        "blind-drop custody handovers across Northern and Eastern Theatres."
    )
    t_summary = Table([[Paragraph(summary_text, styles['Callout'])]], colWidths=[523])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#3b82f6')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 8))

    # Chapter 1: Strategic Supplies Table
    story.append(Paragraph("1. System Architecture & High-Altitude Supply Classification", styles['SectionHeading']))
    story.append(Paragraph(
        "SenaAapurti categorizes defense inventories into strategic classes mapped to operational buffers and Days of Supply (DOS) minimums:", styles['Body']
    ))

    supplies_table_data = [
        [Paragraph("CLASS", styles['TableHead']), Paragraph("NOMENCLATURE", styles['TableHead']), Paragraph("STRATEGIC BUFFER", styles['TableHead']), Paragraph("CRITICAL DOS", styles['TableHead']), Paragraph("PRIMARY DEPOT", styles['TableHead']), Paragraph("AUDIT STATUS", styles['TableHead'])],
        [Paragraph("<b>Class I</b>", styles['TableCellBold']), Paragraph("High Altitude Rations / MREs", styles['TableCell']), Paragraph("45,000 Packs", styles['TableCell']), Paragraph("&lt; 21 Days", styles['TableCellBold']), Paragraph("FSD Leh (14 Corps)", styles['TableCell']), Paragraph("VERIFIED", styles['TableCellStatus'])],
        [Paragraph("<b>Class II</b>", styles['TableCellBold']), Paragraph("Extreme Cold Weather Clothing (ECC)", styles['TableCell']), Paragraph("15,000 Suits", styles['TableCell']), Paragraph("&lt; 30 Days", styles['TableCellBold']), Paragraph("224 ABOD Pathankot", styles['TableCell']), Paragraph("VERIFIED", styles['TableCellStatus'])],
        [Paragraph("<b>Class III</b>", styles['TableCellBold']), Paragraph("Sub-Zero POL (High-Pour Kerosene)", styles['TableCell']), Paragraph("600,000 L", styles['TableCell']), Paragraph("&lt; 14 Days", styles['TableCellBold']), Paragraph("COD Delhi / Leh Hub", styles['TableCell']), Paragraph("VERIFIED", styles['TableCellStatus'])],
        [Paragraph("<b>Class V</b>", styles['TableCellBold']), Paragraph("Munitions & 155mm Artillery Shells", styles['TableCell']), Paragraph("20,000 Rounds", styles['TableCell']), Paragraph("&lt; 45 Days", styles['TableCellBold']), Paragraph("COD Jabalpur Arsenal", styles['TableCell']), Paragraph("VERIFIED", styles['TableCellStatus'])],
        [Paragraph("<b>Class VIII</b>", styles['TableCellBold']), Paragraph("Medical O2 & Blood Plasma Units", styles['TableCell']), Paragraph("4,000 Units", styles['TableCell']), Paragraph("&lt; 10 Days", styles['TableCellBold']), Paragraph("FSD Tawang (4 Corps)", styles['TableCell']), Paragraph("VERIFIED", styles['TableCellStatus'])],
        [Paragraph("<b>Class IX</b>", styles['TableCellBold']), Paragraph("BMP-II / T-90 Armored Spares", styles['TableCell']), Paragraph("6,500 Units", styles['TableCell']), Paragraph("&lt; 20 Days", styles['TableCellBold']), Paragraph("COD Agra Armored Depot", styles['TableCell']), Paragraph("VERIFIED", styles['TableCellStatus'])],
    ]
    t_supplies = Table(supplies_table_data, colWidths=[55, 140, 85, 75, 95, 73])
    t_supplies.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1b382b')),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_supplies)
    story.append(Spacer(1, 8))

    # Chapter 2: Winter Stocking Protocols
    story.append(Paragraph("2. Winter Stocking Protocols & Mountain Pass Closure Windows", styles['SectionHeading']))
    story.append(Paragraph(
        "For Ladakh and Siachen sectors, surface logistic lines are cut off by heavy snowfall between November and May. "
        "SenaAapurti enforces strict pre-winter cutoffs:", styles['Body']
    ))

    winter_data = [
        [Paragraph("PASS / AXIS", styles['TableHead']), Paragraph("ALTITUDE", styles['TableHead']), Paragraph("CUTOFF DATE", styles['TableHead']), Paragraph("TARGET FSD", styles['TableHead']), Paragraph("STATUS", styles['TableHead'])],
        [Paragraph("<b>Zojila Pass (NH-1D)</b>", styles['TableCellBold']), Paragraph("11,575 ft", styles['TableCell']), Paragraph("15 November", styles['TableCell']), Paragraph("FSD Kargil / Leh", styles['TableCell']), Paragraph("98.4% STOCKED", styles['TableCellStatus'])],
        [Paragraph("<b>Khardung La Axis</b>", styles['TableCellBold']), Paragraph("17,582 ft", styles['TableCell']), Paragraph("20 November", styles['TableCell']), Paragraph("Nubra / Siachen Base", styles['TableCell']), Paragraph("100% BUFFER MET", styles['TableCellStatus'])],
        [Paragraph("<b>Rohtang / Shinku La</b>", styles['TableCellBold']), Paragraph("16,580 ft", styles['TableCell']), Paragraph("05 November", styles['TableCell']), Paragraph("Nimmu Forward Hub", styles['TableCell']), Paragraph("96.2% STOCKED", styles['TableCellStatus'])],
        [Paragraph("<b>Sela Pass (Tawang)</b>", styles['TableCellBold']), Paragraph("13,700 ft", styles['TableCell']), Paragraph("30 November", styles['TableCell']), Paragraph("FSD Tawang / 4 Corps", styles['TableCell']), Paragraph("100% BUFFER MET", styles['TableCellStatus'])],
    ]
    t_winter = Table(winter_data, colWidths=[130, 70, 90, 130, 103])
    t_winter.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0fdf4')])
    ]))
    story.append(t_winter)

    # --- PAGE 2 ---
    story.append(PageBreak())

    # Chapter 3: Aerial Logistics
    story.append(Paragraph("3. Multi-Modal Aerial Logistics & Cold-Chain Monitoring", styles['SectionHeading']))
    story.append(Paragraph(
        "When passes are closed, the Air-Drop Allocator engine coordinates transport aircraft and rotary wings "
        "to deliver critical supplies. Sensitive biologicals and vaccines are tracked via Arrhenius thermal degradation models:", styles['Body']
    ))

    air_data = [
        [Paragraph("AIRCRAFT", styles['TableHead']), Paragraph("PAYLOAD", styles['TableHead']), Paragraph("DROP CEILING", styles['TableHead']), Paragraph("SUITABILITY", styles['TableHead']), Paragraph("MISSION PROFILE", styles['TableHead'])],
        [Paragraph("<b>C-130J Super Hercules</b>", styles['TableCellBold']), Paragraph("19,000 kg", styles['TableCell']), Paragraph("28,000 ft", styles['TableCell']), Paragraph("Heavy Munitions / POL", styles['TableCell']), Paragraph("Leh & Thoise Strategic Drops", styles['TableCell'])],
        [Paragraph("<b>IL-76 Gajraj</b>", styles['TableCellBold']), Paragraph("42,000 kg", styles['TableCell']), Paragraph("25,000 ft", styles['TableCell']), Paragraph("Bulk Heavy Hardware", styles['TableCell']), Paragraph("Airlanded at Leh AFB", styles['TableCell'])],
        [Paragraph("<b>Mi-17V5 Rotary</b>", styles['TableCellBold']), Paragraph("4,000 kg", styles['TableCell']), Paragraph("19,000 ft", styles['TableCell']), Paragraph("Tactical Forward Drops", styles['TableCell']), Paragraph("FOB High Altitude Helipads", styles['TableCell'])],
        [Paragraph("<b>ALH Dhruv / Cheetah</b>", styles['TableCellBold']), Paragraph("1,000 kg / Slung", styles['TableCell']), Paragraph("21,000 ft", styles['TableCell']), Paragraph("Medical O2 / Critical Kits", styles['TableCell']), Paragraph("Siachen Glacier Forward Posts", styles['TableCell'])],
    ]
    t_air = Table(air_data, colWidths=[110, 75, 75, 120, 143])
    t_air.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#eff6ff')])
    ]))
    story.append(t_air)
    story.append(Spacer(1, 8))

    # Chapter 4: Android Field Client Operations
    story.append(Paragraph("4. Ruggedized Android Field Terminal Client (APK v3.4.1)", styles['SectionHeading']))
    story.append(Paragraph(
        "The SenaAapurti Field Terminal APK enables forward quartermasters to scan assets offline, verify cryptographic "
        "tokens via ASCON-128a, and synchronize bidirectionally with the central database when satellite connectivity is restored:", styles['Body']
    ))

    apk_steps = [
        [Paragraph("<b>STEP</b>", styles['TableHead']), Paragraph("OPERATIONAL PROCEDURE", styles['TableHead']), Paragraph("CRYPTOGRAPHIC VERIFICATION", styles['TableHead'])],
        [Paragraph("<b>01</b>", styles['TableCellBold']), Paragraph("Launch SenaAapurti APK on handheld tablet terminal. Authenticate using Service Biometric PIN.", styles['TableCell']), Paragraph("ECDSA P-256 session token validated against local TPM enclave.", styles['TableCell'])],
        [Paragraph("<b>02</b>", styles['TableCellBold']), Paragraph("Select 'Depot Inward' or 'Dispatch Store' mode. Aim hardware optical scanner at high-density Mil-QR.", styles['TableCell']), Paragraph("Barcode payload decrypted and cross-verified against SHA-256 manifest.", styles['TableCell'])],
        [Paragraph("<b>03</b>", styles['TableCellBold']), Paragraph("For Blind-Drop unattended handover, scan physical drop crate within GPS geofenced coordinates.", styles['TableCell']), Paragraph("Dual-custody token signed; automatic geofence radius match (&lt; 25m).", styles['TableCell'])],
        [Paragraph("<b>04</b>", styles['TableCellBold']), Paragraph("In communication blackout, record transactions locally in encrypted SQLite store. Mesh Reconciler syncs on reconnect.", styles['TableCell']), Paragraph("Conflict-free Merkle CRDT ensures zero duplicate records or tampering.", styles['TableCell'])],
    ]
    t_apk = Table(apk_steps, colWidths=[40, 265, 218])
    t_apk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#b45309')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fffbeb')])
    ]))
    story.append(t_apk)
    story.append(Spacer(1, 10))

    # Chapter 5: Directorate Authorization & Signatures
    story.append(Paragraph("5. Official Directorate Authorization & Audit Stamps", styles['SectionHeading']))
    story.append(Paragraph(
        "This manual is officially sanctioned under the authority of the Master General of Ordnance and the "
        "Director General of Ordnance Services for immediate theatre-wide implementation.", styles['Body']
    ))
    story.append(Spacer(1, 4))

    stamp_mod = create_circular_ministry_stamp("15 OCT 2026")
    stamp_unit = create_circular_unit_stamp("14 CORPS LEH", "15 OCT 2026")

    sig_data = [
        [
            stamp_mod,
            Paragraph(
                "<b>APPROVED & DIGITALLY SIGNED</b><br/>"
                "<b>Lt. Gen. R. K. Sharma, PVSM, AVSM</b><br/>"
                "Director General of Ordnance Services (DGOS)<br/>"
                "Army Headquarters, New Delhi<br/>"
                "<i>Certificate: ASCON-SHA256: 7f89b4e10c2...</i>", styles['Body']
            ),
            stamp_unit,
            Paragraph(
                "<b>OPERATIONALIZED & AUDITED</b><br/>"
                "<b>Brig. S. Sengupta, VSM</b><br/>"
                "Brigadier ASC / Ordnance (14 Corps)<br/>"
                "Leh Garrison, Ladakh Sector<br/>"
                "<i>Ledger Block: #10492 | Status: ACTIVE</i>", styles['Body']
            )
        ]
    ]
    t_sig = Table(sig_data, colWidths=[90, 165, 90, 178])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 0.7, colors.HexColor('#94a3b8')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sig)

    doc.build(story, canvasmaker=canvas_factory)
    print(f"[OK] Generated User Manual: {output_path}")

# =========================================================================
# 2. QUICK START GUIDE GENERATION (Crisp 1-Page Tactical Card)
# =========================================================================
def generate_quick_start_guide(output_path: str):
    canvas_factory = create_canvas_factory(
        classification="RESTRICTED // TACTICAL FIELD TERMINAL QUICK REFERENCE CARD",
        watermark="TACTICAL QUICK-START",
        doc_ref="MOD/TAC-QSK/2026-F"
    )
    doc = SimpleDocTemplate(
        output_path, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=34, bottomMargin=32
    )
    styles = get_base_styles()
    story = []

    # Quick Card Header
    banner_data = [
        [Paragraph("<b>HQ NORTHERN COMMAND • TACTICAL COMMUNICATIONS & LOGISTICS DIRECTORY</b>", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white, alignment=1))],
        [Paragraph("FIELD LOGISTICIAN QUICK START ACTION CARD • FORWARD TERMINAL SETUP", ParagraphStyle('B2', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#f97316'), alignment=1))]
    ]
    t_banner = Table(banner_data, colWidths=[523])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 8))

    story.append(Paragraph("TACTICAL FIELD TERMINAL (TFT) SETUP GUIDE", styles['CoverTitle']))
    story.append(Paragraph("Ruggedized Tablet Setup, ASCON Satellite Transponder Pairing & APK Deployment", styles['CoverSubtitle']))
    story.append(Spacer(1, 6))

    # Emergency Card Notice
    notice_text = (
        "<b>FIELD DEPLOYMENT DIRECTIVE:</b> Carry this laminated card during convoy operations, forward supply dumps, "
        "and blind-drop aerial collection zones. If device is compromised or in imminent capture danger, initiate "
        "the <b>ZEROIZE SEQUENCE</b> detailed in Section 6 below."
    )
    t_notice = Table([[Paragraph(notice_text, styles['Callout'])]], colWidths=[523])
    t_notice.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff7ed')),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#ea580c')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_notice)
    story.append(Spacer(1, 8))

    # Step-by-Step Tactical Instructions
    steps_data = [
        [Paragraph("STAGE", styles['TableHead']), Paragraph("TACTICAL ACTION & CHECKLIST", styles['TableHead']), Paragraph("TERMINAL SCREEN INDICATOR", styles['TableHead'])],
        [
            Paragraph("<b>STEP 1<br/>Hardware Boot</b>", styles['TableCellBold']),
            Paragraph(
                "• Unpack IP68 ruggedized Android field tablet.<br/>"
                "• Press and hold Power + Security Step-Up button for 3 seconds.<br/>"
                "• Confirm Knox Secure Enclave green LED pulses twice.", styles['TableCell']
            ),
            Paragraph("<font color='#0f766e'><b>'ENCLAVE INTEGRITY: OK'</b></font><br/>Firmware Hash Matched", styles['TableCellBold'])
        ],
        [
            Paragraph("<b>STEP 2<br/>APK Launch</b>", styles['TableCellBold']),
            Paragraph(
                "• Tap <b>SenaAapurti Field Client v3.4.1</b> icon.<br/>"
                "• Enter Military Personnel ID (e.g., <i>AR-QM-14C-409</i>).<br/>"
                "• Authenticate via fingerprint sensor or offline 6-digit OTP token.", styles['TableCell']
            ),
            Paragraph("<font color='#15803d'><b>'IDENTITY AUTHENTICATED'</b></font><br/>Role: Forward Quartermaster", styles['TableCellStatus'])
        ],
        [
            Paragraph("<b>STEP 3<br/>Transponder Link</b>", styles['TableCellBold']),
            Paragraph(
                "• Power on ASCON-128a tactical satellite transponder or VHF radio mesh node.<br/>"
                "• On tablet, toggle <i>Tactical Mesh</i> in the top-right status bar.<br/>"
                "• Confirm pairing code matches transponder LCD display.", styles['TableCell']
            ),
            Paragraph("<font color='#2563eb'><b>'MESH PAIRED: 4 NODES'</b></font><br/>Latency: 42ms | Signal: -68 dBm", styles['TableCellBold'])
        ],
        [
            Paragraph("<b>STEP 4<br/>Scanning Asset</b>", styles['TableCellBold']),
            Paragraph(
                "• Position laser scanner 15-30cm from barcode or QR label on cargo crate.<br/>"
                "• Terminal auto-extracts Batch ID, Expiry, Supply Class and Tamper Seal.<br/>"
                "• Press <i>'Confirm Receipt'</i> to append cryptographic block to ledger.", styles['TableCell']
            ),
            Paragraph("<font color='#15803d'><b>'CRATE 100% RECONCILED'</b></font><br/>Cryptographic Signature Signed", styles['TableCellStatus'])
        ],
        [
            Paragraph("<b>STEP 5<br/>Blind-Drop Collection</b>", styles['TableCellBold']),
            Paragraph(
                "• Approach designated geofenced grid coordinate (within 25m radius).<br/>"
                "• Scan crate NFC tag; terminal automatically compares GPS fix.<br/>"
                "• Once verified, custody status flips from 'IN TRANSIT' to 'DELIVERED'.", styles['TableCell']
            ),
            Paragraph("<font color='#7c3aed'><b>'GEO-CUSTODY UNLOCKED'</b></font><br/>Dual-Custody Key Released", styles['TableCellBold'])
        ],
        [
            Paragraph("<b>STEP 6<br/>EMERGENCY ZEROIZE</b>", styles['TableCellBold']),
            Paragraph(
                "• <b>IN CASE OF IMMINENT CAPTURE:</b> Triple-press red recessed button.<br/>"
                "• Enter Master Eradication Code: <b>#999*000#</b>.<br/>"
                "• Terminal wipes AES/ASCON keys and sanitizes flash memory.", styles['TableCell']
            ),
            Paragraph("<font color='#b91c1c'><b>'ZEROIZE COMPLETED'</b></font><br/>Cryptographic Core Destroyed", styles['TableCellBold'])
        ],
    ]

    t_steps = Table(steps_data, colWidths=[80, 290, 153])
    t_steps.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_steps)
    story.append(Spacer(1, 8))

    # Field Codes & Radio Signals Box
    codes_data = [
        [Paragraph("<b>TACTICAL VHF / ASCON FREQUENCIES</b>", styles['TableHead']), Paragraph("<b>BATTERY LIFE OPTIMIZATION</b>", styles['TableHead'])],
        [
            Paragraph("• Primary Tactical Mesh: <b>142.850 MHz</b> (FM)<br/>• Secondary Satellite Uplink: <b>1.625 GHz</b> (L-Band)<br/>• Emergency Distress Beacon: <b>406.025 MHz</b>", styles['TableCell']),
            Paragraph("• Active Scanning: 14.5 hours continuous<br/>• Cold-Temperature Mode (-20°C): Keep internal heater active<br/>• Rapid USB-C Solar Charging: 45 min to 80%", styles['TableCell'])
        ]
    ]
    t_codes = Table(codes_data, colWidths=[261, 262])
    t_codes.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f1f5f9')),
    ]))
    story.append(t_codes)
    story.append(Spacer(1, 8))

    # Bottom Seal & Quartermaster Block (No overlap)
    stamp = create_circular_unit_stamp("LEH TACTICAL SECTOR", "OCT 2026")
    bottom_data = [
        [
            stamp,
            Paragraph(
                "<b>OFFICIAL TACTICAL FIELD REFERENCE CARD</b><br/>"
                "Issued by: Directorate of Army Tactical Communications & DGOS<br/>"
                "Handheld Device Serial: <i>TAB-MIL-2026-X7</i> | Firmware: <i>v3.4.1-STABLE</i><br/>"
                "SHA-256 APK Hash: <code>c849bf01a34d98e72049e6b52a48df...</code>", styles['Body']
            )
        ]
    ]
    t_bot = Table(bottom_data, colWidths=[95, 428])
    t_bot.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fafaf9')),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_bot)

    doc.build(story, canvasmaker=canvas_factory)
    print(f"[OK] Generated Quick Start Guide: {output_path}")

# =========================================================================
# 3. TECHNICAL ARCHITECTURE WHITEPAPER GENERATION (Clean 2-Page Whitepaper)
# =========================================================================
def generate_technical_whitepaper(output_path: str):
    canvas_factory = create_canvas_factory(
        classification="RESTRICTED // ARMY CYBER LOGISTICS & DEFENCE R&D",
        watermark="DRDO // DGOS ARCHITECTURE",
        doc_ref="DRDO-DGOS/WHITE-PAPER/ARCH-2026"
    )
    doc = SimpleDocTemplate(
        output_path, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=34, bottomMargin=32
    )
    styles = get_base_styles()
    story = []

    # --- PAGE 1 ---
    banner_data = [
        [Paragraph("<b>DEFENCE RESEARCH & DEVELOPMENT ORGANISATION • ARMY CYBER LOGISTICS WING</b>", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1))],
        [Paragraph("TECHNICAL ARCHITECTURE & PROTOCOL SPECIFICATION WHITEPAPER", ParagraphStyle('B2', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#6ee7b7'), alignment=1))]
    ]
    t_banner = Table(banner_data, colWidths=[523])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#064e3b')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 10))

    story.append(Paragraph("SENAAAPURTI: ZERO-TRUST C4ISR ARCHITECTURE", styles['CoverTitle']))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Cryptographic Protocols, AI Predictive Forecasting, Real-Time Mesh & Ledger Schema", styles['CoverSubtitle']))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Technical Whitepaper & API Standard v4.8 • Smart India Hackathon</b>", styles['CoverMeta']))
    story.append(Spacer(1, 8))

    # Architecture Overview Callout
    intro_p = (
        "<b>SYSTEM SPECIFICATION ABSTRACT:</b> This technical document specifies the end-to-end cryptographic and "
        "computational architecture of SenaAapurti. Designed for resilient logistics across contested electronic warfare "
        "environments, the platform combines ASCON-128a authenticated encryption, hybrid neural demand forecasting, "
        "terrain-weighted convex-hull multi-modal routing, and a Byzantine-resilient PostgreSQL distributed ledger."
    )
    t_intro = Table([[Paragraph(intro_p, styles['Callout'])]], colWidths=[523])
    t_intro.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#059669')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_intro)
    story.append(Spacer(1, 8))

    # Section 1: Cryptographic Stack
    story.append(Paragraph("1. Cryptographic Security & Zero-Trust Protocol Stack", styles['SectionHeading']))
    story.append(Paragraph(
        "SenaAapurti eliminates perimeter assumptions by requiring micro-segmentation, mutual TLS, and lightweight NIST-standardized cryptography:", styles['Body']
    ))

    crypto_specs = [
        [Paragraph("SECURITY PRIMITIVE", styles['TableHead']), Paragraph("ALGORITHM / CIPHER SUITE", styles['TableHead']), Paragraph("IMPLEMENTATION ROLE", styles['TableHead']), Paragraph("PERFORMANCE BENCHMARK", styles['TableHead'])],
        [Paragraph("<b>Lightweight AEAD</b>", styles['TableCellBold']), Paragraph("ASCON-128a (NIST LWC Standard)", styles['TableCell']), Paragraph("Telemetry payload encryption on satellite/VHF transponders", styles['TableCell']), Paragraph("0.42 ms / 1 KB frame on ARM-v8", styles['TableCell'])],
        [Paragraph("<b>Public Key Handshake</b>", styles['TableCellBold']), Paragraph("ECDSA P-256 (NIST Curve)", styles['TableCell']), Paragraph("Blind-drop dual-custody authorization tokens", styles['TableCell']), Paragraph("1.8 ms sign, 2.4 ms verify", styles['TableCell'])],
        [Paragraph("<b>Ledger Integrity</b>", styles['TableCellBold']), Paragraph("SHA-256 + Merkle Tree Roots", styles['TableCell']), Paragraph("Tamper-proof audit logs & transaction block chaining", styles['TableCell']), Paragraph("100% deterministic cryptographic audit", styles['TableCell'])],
        [Paragraph("<b>Step-Up 2FA</b>", styles['TableCellBold']), Paragraph("Time-Based OTP (RFC 6238) + Biometrics", styles['TableCell']), Paragraph("Command crisis overrides & weapon allocation commands", styles['TableCell']), Paragraph("Sub-second token validation", styles['TableCell'])],
    ]
    t_crypto = Table(crypto_specs, colWidths=[100, 140, 173, 110])
    t_crypto.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#064e3b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0fdf4')])
    ]))
    story.append(t_crypto)
    story.append(Spacer(1, 8))

    # Section 2: AI Forecasting & Arrhenius Math Models
    story.append(Paragraph("2. Mathematical Formulations & Predictive Analytics", styles['SectionHeading']))
    story.append(Paragraph(
        "The analytical core incorporates statistical physics and machine learning models for mission planning:", styles['Body']
    ))

    math_box = (
        "<b>A. Arrhenius Shelf-Life Thermal Degradation Model (Vaccines & Blood Plasma):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>k = A • exp(-E<sub>a</sub> / (R • T))</b><br/>"
        "Where <i>k</i> is the rate constant of potency loss, <i>E<sub>a</sub></i> = 83.14 kJ/mol, and <i>T</i> is Kelvin temperature.<br/>"
        "Accumulated thermal degradation is integrated continuously over telemetry streams:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>D<sub>accum</sub> = &int; k(T(t)) dt</b> &nbsp;&nbsp;&rarr;&nbsp;&nbsp; Remaining Life = 100% - D<sub>accum</sub><br/><br/>"
        "<b>B. Hybrid Neural Demand Forecasting:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Y_forecast(t+h) = w<sub>1</sub> • LSTM(X<sub>t</sub>) + w<sub>2</sub> • Prophet(t) + &Sigma; &beta;<sub>i</sub> • Z<sub>weather,i</sub></b><br/>"
        "Where extreme climate covariates (avalanche risk, snow depth, pass accessibility) adjust future replenishment lead times."
    )
    t_math = Table([[Paragraph(math_box, styles['Body'])]], colWidths=[523])
    t_math.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.7, colors.HexColor('#94a3b8')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_math)

    # --- PAGE 2 ---
    story.append(PageBreak())

    # Section 3: RESTful API Specifications
    story.append(Paragraph("3. Zero-Trust RESTful Microservices & API Gateway", styles['SectionHeading']))
    story.append(Paragraph(
        "All client applications (Angular Web Portal, Android Field Terminal APK, IoT Telemetry Hubs) "
        "communicate via FastAPI endpoints governed by strict RBAC and Bearer token headers:", styles['Body']
    ))

    api_specs = [
        [Paragraph("METHOD & ENDPOINT", styles['TableHead']), Paragraph("FUNCTION & DATA ACCESS", styles['TableHead']), Paragraph("ENCRYPTION / AUTH", styles['TableHead'])],
        [Paragraph("<code>POST /api/v1/auth/verify-stepup</code>", styles['TableCellBold']), Paragraph("Validates elevated biometrics/OTP for classified action dispatch", styles['TableCell']), Paragraph("ECDSA Signature + JWT", styles['TableCell'])],
        [Paragraph("<code>GET /api/v1/inventory/status</code>", styles['TableCellBold']), Paragraph("Fetches theatre-wide supply depots, Days of Supply & buffer levels", styles['TableCell']), Paragraph("Role: Command / QM", styles['TableCell'])],
        [Paragraph("<code>POST /api/v1/handover/blind-drop/issue</code>", styles['TableCellBold']), Paragraph("Issues geofenced cryptotoken for remote unmanned cargo delivery", styles['TableCell']), Paragraph("ASCON-128a + P-256 Dual Sign", styles['TableCell'])],
        [Paragraph("<code>POST /api/v1/resilience/mesh/reconcile</code>", styles['TableCellBold']), Paragraph("Synchronizes offline transactions buffered during blackout", styles['TableCell']), Paragraph("CRDT Merkle Reconciliation", styles['TableCell'])],
        [Paragraph("<code>GET /api/v1/cold-chain/live-telemetry</code>", styles['TableCellBold']), Paragraph("Streams real-time thermal sensor readings & Arrhenius decay status", styles['TableCell']), Paragraph("AES-GCM / TLS 1.3", styles['TableCell'])],
        [Paragraph("<code>GET /api/v1/reports/export-pdf</code>", styles['TableCellBold']), Paragraph("Generates official, stamped MoD logistics audit statement", styles['TableCell']), Paragraph("ReportLab Vector Stamped", styles['TableCell'])],
    ]
    t_api = Table(api_specs, colWidths=[165, 230, 128])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#064e3b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_api)
    story.append(Spacer(1, 8))

    # Section 4: Database Schema & Merkle Audit Proof
    story.append(Paragraph("4. PostgreSQL Ledger & Merkle Audit Trail Architecture", styles['SectionHeading']))
    story.append(Paragraph(
        "SenaAapurti stores critical logistics state in a relational schema synchronized with an immutable Merkle hash tree. "
        "Every depot transfer, cold-chain anomaly, and commander override produces a cryptographically sealed block:", styles['Body']
    ))

    schema_box = (
        "<b>Core PostgreSQL Table Definitions:</b><br/>"
        "• <code>supplies</code>: <code>id (UUID), depot_id, sku, supply_class, on_hand, safety_buffer, dos, status</code><br/>"
        "• <code>cold_chain_telemetry</code>: <code>id, pallet_id, temp_c, humidity_rh, mkt_c, remaining_potency_pct, timestamp</code><br/>"
        "• <code>handover_tokens</code>: <code>token_id, mission_id, geo_lat, geo_lng, release_radius_m, dual_key_hash, state</code><br/>"
        "• <code>audit_ledger</code>: <code>block_height, prev_hash, merkle_root, tx_count, signature, created_at</code><br/>"
        "<br/>"
        "<b>Current Ledger State:</b> Height: <b>#10492</b> | Root Hash: <b>0x8f43a91b2c4e67d...</b> | Byzantine Fault Tolerance: <b>Active</b>"
    )
    t_schema = Table([[Paragraph(schema_box, styles['Body'])]], colWidths=[523])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.7, colors.HexColor('#94a3b8')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_schema)
    story.append(Spacer(1, 10))

    # Signatures & Seals (No overlap)
    stamp_drdo = create_circular_ministry_stamp("OCT 2026")
    stamp_soc = create_circular_unit_stamp("CYBER LOGISTICS", "OCT 2026")

    sig_data = [
        [
            stamp_drdo,
            Paragraph(
                "<b>RESEARCH & SYSTEM VALIDATION</b><br/>"
                "<b>Dr. P. V. Ramakrishnan, Sc. 'G'</b><br/>"
                "Director of Defence Software & Cryptography<br/>"
                "Defence R&D Organisation (DRDO)<br/>"
                "<i>Cryptographic Spec: ASCON-128a (Compliant)</i>", styles['Body']
            ),
            stamp_soc,
            Paragraph(
                "<b>ARMY CYBER INTEGRATION APPROVAL</b><br/>"
                "<b>Col. M. Vikramaditya</b><br/>"
                "Chief Information Warfare Officer<br/>"
                "Army Cyber Group • C4ISR Operations<br/>"
                "<i>Zero-Trust Architecture: 100% Certified</i>", styles['Body']
            )
        ]
    ]
    t_sig = Table(sig_data, colWidths=[90, 165, 90, 178])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 0.7, colors.HexColor('#94a3b8')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sig)

    doc.build(story, canvasmaker=canvas_factory)
    print(f"[OK] Generated Technical Whitepaper: {output_path}")

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    public_downloads = os.path.join(root_dir, "..", "SIH26251-SenaAapurti", "public", "downloads")
    public_root = os.path.join(root_dir, "..", "SIH26251-SenaAapurti", "public")
    os.makedirs(public_downloads, exist_ok=True)

    manual_pdf = os.path.join(public_downloads, "SenaAapurti_User_Manual_v4.8.pdf")
    quick_pdf = os.path.join(public_downloads, "Tactical_Quick_Start_Guide.pdf")
    whitepaper_pdf = os.path.join(public_downloads, "Technical_Architecture_Whitepaper.pdf")

    generate_user_manual(manual_pdf)
    generate_quick_start_guide(quick_pdf)
    generate_technical_whitepaper(whitepaper_pdf)

    # Also copy to public root for fallback
    shutil.copy(manual_pdf, os.path.join(public_root, "SenaAapurti_User_Manual_v4.8.pdf"))
    shutil.copy(quick_pdf, os.path.join(public_root, "Tactical_Quick_Start_Guide.pdf"))
    shutil.copy(whitepaper_pdf, os.path.join(public_root, "Technical_Architecture_Whitepaper.pdf"))
    print("[OK] Copied PDFs to public root.")

    # Locate APK
    apk_candidates = [
        os.path.join(root_dir, "..", "SenaAapurti-FieldClient-v3.4.1.apk"),
        os.path.join(root_dir, "..", "android-field-client", "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    ]
    apk_src = None
    for cand in apk_candidates:
        if os.path.exists(cand):
            apk_src = cand
            break

    if apk_src:
        apk_dest1 = os.path.join(public_downloads, "SenaAapurti_Field_v3.4.apk")
        apk_dest2 = os.path.join(public_downloads, "SenaAapurti-FieldClient-v3.4.1.apk")
        apk_root1 = os.path.join(public_root, "SenaAapurti_Field_v3.4.apk")
        apk_root2 = os.path.join(public_root, "SenaAapurti-FieldClient-v3.4.1.apk")

        shutil.copy(apk_src, apk_dest1)
        shutil.copy(apk_src, apk_dest2)
        shutil.copy(apk_src, apk_root1)
        shutil.copy(apk_src, apk_root2)
        print(f"[OK] Successfully copied APK ({os.path.getsize(apk_src)} bytes) to public/downloads and public root.")
    else:
        print("[WARN] Could not find APK source file!")

if __name__ == "__main__":
    main()
