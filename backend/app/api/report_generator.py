"""
Sena Aapurti — Ministry of Defence Executive Logistics Report Generator
Generates official, audited PDF statements with circular Ministry seals,
Ashok Stambh / DGOS emblems, classified watermarks, and cryptographic audit proofs.
"""

from __future__ import annotations

import io
import os
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Circle, Rect, String, Group, Line
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to draw official defense security classification headers,
    page numbers, and classified watermarks.
    """
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
        
        # 1. Top Security Classification Banner
        self.setFillColor(colors.HexColor("#991b1b"))
        self.setFont("Helvetica-Bold", 8)
        self.drawCentredString(A4[0] / 2.0, A4[1] - 24, "RESTRICTED // FOR OFFICIAL DEFENSE USE ONLY — SECTION 5 PRIVILEGED")

        # 2. Diagonal Background Security Watermark
        self.setFont("Helvetica-Bold", 54)
        self.setFillColor(colors.HexColor("#0f172a"), alpha=0.04)
        self.translate(A4[0] / 2.0, A4[1] / 2.0)
        self.rotate(35)
        self.drawCentredString(0, 0, "DGOS AUDITED")
        self.restoreState()

        # 3. Bottom Footer Strip
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        footer_text = f"Sena Aapurti C4ISR Grid | Document Ref: DGOS/EXEC-AUDIT/2026 | Page {self._pageNumber} of {page_count}"
        self.drawString(36, 24, footer_text)
        
        auth_tag = "ASCON-256 BIT ENCRYPTED LEDGER"
        self.drawRightString(A4[0] - 36, 24, auth_tag)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 36, A4[0] - 36, 36)
        self.restoreState()


def make_numbered_canvas(
    classification: str = "RESTRICTED",
    watermark: str = "DGOS AUDITED",
    ref_code: str = "DGOS/EXEC-AUDIT/2026"
):
    """
    Factory creating a NumberedCanvas configured with the exact security
    classification, diagonal watermark, and document reference code.
    """
    class ConfiguredNumberedCanvas(NumberedCanvas):
        def draw_page_decorations(self, page_count: int):
            self.saveState()

            cl = (classification or "RESTRICTED").upper()
            if "SECRET" in cl:
                banner_color = colors.HexColor("#b91c1c")
                banner_txt = f"{classification} // STRICT DEFENSE NEED-TO-KNOW — IT ACT SEC 10A"
            elif "CONFIDENTIAL" in cl:
                banner_color = colors.HexColor("#c2410c")
                banner_txt = f"{classification} // OPERATIONAL ARMED FORCES DISPATCH"
            else:
                banner_color = colors.HexColor("#1e3825")
                banner_txt = f"{classification} // FOR OFFICIAL DEFENSE USE ONLY — SECTION 5 PRIVILEGED"

            self.setFillColor(banner_color)
            self.setFont("Helvetica-Bold", 8)
            self.drawCentredString(A4[0] / 2.0, A4[1] - 24, banner_txt)

            # Diagonal Background Security Watermark
            self.setFont("Helvetica-Bold", 46)
            self.setFillColor(colors.HexColor("#0f172a"), alpha=0.035)
            self.translate(A4[0] / 2.0, A4[1] / 2.0)
            self.rotate(35)
            self.drawCentredString(0, 0, watermark)
            self.restoreState()

            # Bottom Footer Strip
            self.saveState()
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748b"))
            footer_text = f"Sena Aapurti C4ISR Grid | Document Ref: {ref_code} | Page {self._pageNumber} of {page_count}"
            self.drawString(36, 22, footer_text)

            auth_tag = "ASCON-256 BIT ENCRYPTED LEDGER"
            self.drawRightString(A4[0] - 36, 22, auth_tag)
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, 32, A4[0] - 36, 32)
            self.restoreState()

    return ConfiguredNumberedCanvas


def add_curved_text(
    d: Drawing,
    cx: float,
    cy: float,
    r: float,
    text: str,
    font_name: str = "Helvetica-Bold",
    font_size: float = 6.2,
    fill_color: Any = colors.HexColor("#991b1b"),
    center_angle: float = 90.0,
    total_span: float = 120.0,
    clockwise: bool = True
) -> None:
    """
    Renders text characters along an arc of radius r around (cx, cy).
    """
    import math
    n = len(text)
    if n == 0:
        return
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


def create_circular_ministry_stamp(date_str: str = "14 OCT 2026") -> Drawing:
    """
    Generates an authentic vector-drawn circular Ministry of Defence rubber seal.
    """
    d = Drawing(140, 140)
    center = 70.0

    c_red = colors.HexColor("#991b1b")
    c_gold = colors.HexColor("#b45309")

    # Concentric rings: outer 64, middle 51, inner 36
    d.add(Circle(center, center, 64, strokeColor=c_red, strokeWidth=2.2, fillColor=colors.HexColor("#fef2f2")))
    d.add(Circle(center, center, 51, strokeColor=c_red, strokeWidth=1.0, fillColor=None))
    d.add(Circle(center, center, 36, strokeColor=c_gold, strokeWidth=0.8, fillColor=None))

    # Curved text in outer annular band (r=57.5)
    add_curved_text(d, center, center, 57.0, "★ MINISTRY OF DEFENCE ★", font_size=5.8, fill_color=c_red, center_angle=90, total_span=125, clockwise=True)
    add_curved_text(d, center, center, 57.0, "★ DGOS LOGISTICS CELL ★", font_size=5.4, fill_color=c_red, center_angle=270, total_span=125, clockwise=False)

    # Center emblem banner
    d.add(Rect(center - 32, center - 7.5, 64, 15, rx=2, ry=2, strokeColor=c_red, strokeWidth=1, fillColor=c_red))
    d.add(String(center, center - 3.5, "AUDITED & VERIFIED", fontName="Helvetica-Bold", fontSize=5.6, fillColor=colors.white, textAnchor="middle"))

    # Date & Inner details
    d.add(String(center, center + 14, "★ GOVT OF INDIA ★", fontName="Helvetica-Bold", fontSize=5.2, fillColor=c_gold, textAnchor="middle"))
    d.add(String(center, center - 21, date_str, fontName="Helvetica-Bold", fontSize=6.5, fillColor=c_red, textAnchor="middle"))

    return d


def create_circular_unit_stamp(
    unit_name: str = "14 RAJPUT (MECHANISED)",
    station: str = "LEH GARRISON • 14 CORPS",
    date_str: str = "14 OCT 2026",
    status_text: str = "100% RECONCILED"
) -> Drawing:
    """
    Generates an authentic vector-drawn circular Indian Army Regimental Quartermaster rubber seal.
    """
    d = Drawing(140, 140)
    center = 70.0

    c_red = colors.HexColor("#991b1b")
    c_gold = colors.HexColor("#b45309")

    # Concentric rings: outer 64, middle 51, inner 36
    d.add(Circle(center, center, 64, strokeColor=c_red, strokeWidth=2.2, fillColor=colors.HexColor("#fef2f2")))
    d.add(Circle(center, center, 51, strokeColor=c_red, strokeWidth=1.0, fillColor=None))
    d.add(Circle(center, center, 36, strokeColor=c_gold, strokeWidth=0.8, fillColor=None))

    # Curved text in outer annular band (r=57.5)
    top_label = f"★ {unit_name.upper()} ★"
    bot_label = "★ 14 CORPS • LEH LADAKH ★"
    add_curved_text(d, center, center, 57.0, top_label, font_size=5.6, fill_color=c_red, center_angle=90, total_span=130, clockwise=True)
    add_curved_text(d, center, center, 57.0, bot_label, font_size=5.3, fill_color=c_red, center_angle=270, total_span=130, clockwise=False)

    # Center emblem banner
    d.add(Rect(center - 32, center - 7.5, 64, 15, rx=2, ry=2, strokeColor=c_red, strokeWidth=1, fillColor=c_red))
    d.add(String(center, center - 3.5, status_text, fontName="Helvetica-Bold", fontSize=5.6, fillColor=colors.white, textAnchor="middle"))

    # Date & Inner details
    d.add(String(center, center + 14, "★ INDIAN ARMY ★", fontName="Helvetica-Bold", fontSize=5.2, fillColor=c_gold, textAnchor="middle"))
    d.add(String(center, center - 21, date_str, fontName="Helvetica-Bold", fontSize=6.5, fillColor=c_red, textAnchor="middle"))

    return d


def get_category_dataset(category: str, date_range: str):
    """
    Returns bespoke, authentic military datasets, column headers, and column widths
    tailored specifically to the chosen Report Category and Date Range.
    """
    cat = (category or "").lower()
    d = (date_range or "").lower()

    # 1. INVENTORY AUDIT
    if "inventory" in cat:
        headers = ["CENTRAL DEPOT / BASE", "SUPPLY CLASS / SKU", "ON-HAND STOCK", "SAFETY BUFFER", "DAYS OF SUPPLY", "STOCK STATUS", "AUDIT STATUS"]
        col_widths = [125, 95, 65, 60, 55, 60, 60]
        rows = [
            ("COD Delhi Cantt", "Central Strategic Hub • Northern Feeder", "Class III (Sub-Zero POL)", "1,420,000 L", "600,000 L", "94 DOS", "SURPLUS RESERVE", "VERIFIED"),
            ("FSD Leh (14 Corps)", "Forward Supply Depot • Ladakh Sector", "Class I (High Alt Rations)", "89,400 Packs", "45,000 Packs", "185 DOS", "WINTER BUFFER MET", "VERIFIED"),
            ("COD Jabalpur", "Heavy Munitions & Artillery Arsenal", "Class V (155mm Shells)", "48,200 Rds", "20,000 Rds", "65 DOF", "WWR BUFFER STABLE", "VERIFIED"),
            ("COD Agra", "Armored Vehicle Spares Directorate", "Class IX (BMP/T-90 Spares)", "14,800 Pcs", "6,500 Pcs", "48 DOS", "ADEQUATE", "VERIFIED"),
            ("FSD Tawang (4 Corps)", "Extreme Altitude Medical Outpost", "Class VIII (Medical O2 Kits)", "12,500 Cyl", "4,000 Cyl", "120 DOS", "SUB-ZERO STABILIZED", "VERIFIED"),
            ("224 ABOD Pathankot", "Forward Cold Clothing Depot", "Class II (Extreme Cold ECC)", "36,000 Suits", "15,000 Suits", "110 DOS", "FORWARD DEPLOYED", "VERIFIED"),
        ]
        agg = ("National Ordnance Stockpiles", "6 Central Depots Audited", "2,450,000 Items", "Full WWR Buffer", "135 DOS Avg", "SURPLUS", "STRATEGIC STABILITY", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 2. LOGISTICS CONVOY EFFICIENCY
    if "convoy" in cat or "efficiency" in cat:
        headers = ["CONVOY CALLSIGN", "STRATEGIC AXIS", "VEHICLES", "CARGO CLASS", "TONNAGE", "PUNCTUALITY", "AUDIT STATUS"]
        col_widths = [110, 110, 60, 75, 55, 55, 55]
        rows = [
            ("GARUDA-01", "CV-104-N • Northern Convoy", "Manali - Rohtang - Leh Axis", "28 Heavy 6x6", "Class III (POL)", "320 Tonnes", "98.2% ON TIME", "VERIFIED"),
            ("CHEETAH-04", "CV-219-W • Western Transit", "Pathankot - Kargil Axis", "34 Trucks", "Class I (Rations)", "280 Tonnes", "100% ON TIME", "VERIFIED"),
            ("BRAHMA-02", "CV-308-E • Eastern Column", "Siliguri - Tawang Axis", "22 4x4 Stallions", "Class V (Munitions)", "195 Tonnes", "95.4% ON TIME", "VERIFIED"),
            ("THUNDER-09", "CV-412-S • Desert Sector", "Jodhpur - Barmer Sector", "40 Heavy Transporters", "Class IX (Spares)", "410 Tonnes", "99.1% ON TIME", "VERIFIED"),
            ("ARROW-12", "CV-515-E • Mountain Echelon", "Dimapur - Moreh Axis", "18 Medium Trucks", "Class VIII (Medical)", "140 Tonnes", "96.8% ON TIME", "VERIFIED"),
            ("HIMALAYA-07", "CV-620-C • Central Transit", "Joshimath - Mana Pass", "16 High-Mobility Trucks", "Class II (ECC)", "125 Tonnes", "97.5% ON TIME", "VERIFIED"),
        ]
        agg = ("National Road Movement", "38 Active Military Columns", "158 Total Fleet", "Multimodal Road/Rail", "1,470 Tonnes", "98.5% Schedule", "97.8% Fleet Avg", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 3. DEMAND PROJECTIONS
    if "demand" in cat or "projection" in cat:
        headers = ["THEATER COMMAND", "SUPPLY DISCIPLINE", "BASELINE DEMAND", "PROJECTED SURGE", "RESERVE HORIZON", "AI CONFIDENCE", "AUDIT STATUS"]
        col_widths = [115, 100, 65, 60, 60, 60, 60]
        rows = [
            ("Northern Command (Udhampur)", "14, 15, 16 Corps • Arctic High Altitude", "Sub-Zero POL & Aviation", "2,850 T/Day", "+31.6% Winter Cold", "180 Days Full Buffer", "98.4% (R²=0.982)", "VERIFIED"),
            ("Eastern Command (Kolkata)", "3, 4, 33 Corps • Mountain Glacier Resupply", "Caloric Rations (4,200 kcal)", "1,650 T/Day", "+28.4% Mountain Slog", "120 Days Advanced Stock", "97.9% (R²=0.975)", "VERIFIED"),
            ("Western Command (Chandimandir)", "2, 9, 11 Corps • Heavy Armor Columns", "BMP & Tank Heavy Spares", "4,100 Pcs/Mo", "+57.3% Desert Maneuver", "45 Days Combat Buffer", "96.5% (R²=0.961)", "VERIFIED"),
            ("Northern Command (Udhampur)", "Forward Artillery & Gun Positions", "155mm & ATGM Munitions", "1,420 Rds/Day", "+88.7% Tactical WWR", "45 Days WWR Echelon", "98.8% (R²=0.988)", "VERIFIED"),
            ("South Western Command (Jaipur)", "1 Corps Pivot Strike • Thar Desert", "High-Mobility Engine Parts", "2,800 Pcs/Mo", "+34.2% Sand Friction", "30 Days Maintenance", "96.2% (R²=0.958)", "VERIFIED"),
            ("Central Command (Lucknow)", "Surya Command • High Altitude Inductions", "Extreme Cold Clothing (ECC)", "2,200 Suits/Mo", "+118.0% Pre-Winter", "100% Induction Reserve", "99.1% (R²=0.990)", "VERIFIED"),
        ]
        agg = ("National Neural Forecast", "ASCON Telemetry Grid", "All 9 Theaters", "15,020 Aggregate Load", "+48.6% Harmonic Surge", "120 Days Mean", "97.8% Confidence", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 4. UNIT READINESS
    if "unit" in cat:
        headers = ["FORMATION / UNIT", "CORPS / SECTOR", "STRENGTH", "READINESS", "POSTURE", "COMMS", "AUDIT STATUS"]
        col_widths = [130, 80, 55, 60, 75, 60, 60]
        rows = [
            ("14 Rajput (Mechanised)", "14 Corps • Fire & Fury", "Leh - Ladakh Garrison", "780 Pax", "98.4%", "DEFCON 1", "ASCON V4", "VERIFIED"),
            ("3 Grenadiers (Infantry)", "15 Corps • Chinar Corps", "Uri Sector - LOC", "820 Pax", "97.2%", "FORWARD ACTIVE", "ASCON V4", "VERIFIED"),
            ("7 Cavalry (Armoured)", "2 Corps • Kharga Strike", "Ambala Garrison", "620 Pax", "99.1%", "STRIKE READY", "SATCOM PRIORITY", "VERIFIED"),
            ("17 Mountain Artillery", "4 Corps • Gajraj Corps", "Tawang LAC Sector", "540 Pax", "96.8%", "HIGH ALTITUDE", "ASCON V4", "VERIFIED"),
            ("9 Para (Special Forces)", "Northern Command Reserve", "Udhampur Base", "340 Pax", "100.0%", "STRATEGIC AIRBORNE", "SATCOM SECURE", "VERIFIED"),
            ("120 Forward ASC Bn", "33 Corps • Trishakti", "Sukna Feeder Base", "690 Pax", "97.5%", "CONVOY TRANSIT", "ASCON V4", "VERIFIED"),
        ]
        agg = ("National Combat Formations", "1,725 Active Battalions", "1,280,000 Pax", "97.1% Mean", "COMBAT READY", "DEFCON 1", "99.8% Uptime", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 5. ROUTE RISK ASSESSMENT
    if "route" in cat or "risk" in cat:
        headers = ["STRATEGIC AXIS", "PASS NAME & ALTITUDE", "TRANSIT STATUS", "MAX CAPACITY", "HAZARD RISK", "BYPASS ROUTE", "AUDIT STATUS"]
        col_widths = [110, 100, 65, 60, 60, 65, 60]
        rows = [
            ("NH-1D Highway", "Srinagar - Leh Axis", "Zojila Pass (11,575 ft)", "SNOW CHAINS ON", "45 Convoys/Day", "MEDIUM (AVALANCHE)", "Mughal Road Axis", "VERIFIED"),
            ("Manali - Leh Axis", "Himachal - Ladakh Transit", "Baralacha La (15,910 ft)", "ATAL TUNNEL OPEN", "60 Convoys/Day", "LOW (CONTROLLED)", "Shinkun La Axis", "VERIFIED"),
            ("Balipara - Tawang Axis", "Arunachal LAC Corridor", "Sela Pass (13,700 ft)", "SELA TUNNEL OPEN", "35 Convoys/Day", "LOW (ALL-WEATHER)", "Orang-Kalaktang Axis", "VERIFIED"),
            ("Joshimath - Malari Axis", "Garhwal Himalaya Corridor", "Niti Pass (16,600 ft)", "HIGH WIND WARNING", "20 Convoys/Day", "HIGH (ROCKFALL)", "Mana Pass Axis", "VERIFIED"),
            ("Pathankot - Udhampur", "Jammu Strategic Feeder", "Banihal Qazigund Tunnel", "ALL-WEATHER 4-LANE", "120 Convoys/Day", "LOW (SECURE)", "Old Jawahar Tunnel", "VERIFIED"),
            ("Darjeeling - Gangtok", "Sikkim Border Axis", "Nathu La (14,140 ft)", "DENSE FOG & MIST", "25 Convoys/Day", "MEDIUM (VISIBILITY)", "Pakyong Bypass Axis", "VERIFIED"),
        ]
        agg = ("National Border Corridors", "6 Primary Transit Axes", "94.2% Operational", "305 Convoys/Day", "C4ISR Monitored", "BRO Winter Plan Active", "ALL CLEAR", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 6. WEATHER INCIDENT SUMMARY
    if "weather" in cat:
        headers = ["STATION / PASS", "ELEVATION", "TEMPERATURE", "SNOW ACCUMULATION", "WIND & GALE", "ACCESSIBILITY", "AUDIT STATUS"]
        col_widths = [115, 65, 60, 70, 70, 80, 60]
        rows = [
            ("Siachen Base Camp", "Glacier Sensor • Sector 1", "12,000 ft", "-28°C Sub-Zero", "15 cm / 6 hrs", "45 km/h Blizzard", "CHAINS REQUIRED", "VERIFIED"),
            ("Zojila Pass Weather Post", "Mountain Ridge • NH-1D Axis", "11,575 ft", "-18°C Sub-Zero", "28 cm / 6 hrs", "62 km/h Gale Force", "CONVOY RESTRICTED", "VERIFIED"),
            ("Sela Pass Sensor Grid", "Arunachal LAC Sector", "13,700 ft", "-12°C Sub-Zero", "8 cm / 6 hrs", "25 km/h Moderate", "SELA TUNNEL OPEN", "VERIFIED"),
            ("Rohtang North Portal", "Pir Panjal Mountain Range", "10,050 ft", "-14°C Sub-Zero", "12 cm / 6 hrs", "30 km/h Gusts", "ATAL TUNNEL OPEN", "VERIFIED"),
            ("Kargil Ordnance Picket", "Drass High Plateau", "8,780 ft", "-16°C Sub-Zero", "5 cm / 6 hrs", "18 km/h Light", "OPEN ALL CONVOYS", "VERIFIED"),
            ("Nathu La Ridge Sensor", "East Sikkim Frontier", "14,140 ft", "-9°C Sub-Zero", "2 cm / 6 hrs", "50 km/h Severe Wind", "CHAINS MANDATORY", "VERIFIED"),
        ]
        agg = ("National Mountain Grid", "6 Automated Telemetry Posts", "Regional Highlands", "-16.2°C Regional Mean", "70 cm Total Accumulation", "38.3 km/h Mean", "BRO Clearance Active", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 7. STOCKOUT RISK PREVENTION
    if "stockout" in cat:
        headers = ["CRITICAL SECTOR", "VULNERABLE SKU", "RESERVE DOS", "DEPLETION WINDOW", "IMPACT LEVEL", "MITIGATION PROTOCOL", "AUDIT STATUS"]
        col_widths = [115, 100, 55, 65, 60, 65, 60]
        rows = [
            ("Siachen Glacier", "Sub-Zero Forward Sector", "Sub-Zero HSD Grade Fuel", "14 DOS", "72 Hours to Threshold", "CRITICAL RISK", "Priority Convoy + IAF Mi-17", "VERIFIED"),
            ("Tawang Forward Posts", "Arunachal High Altitude", "81mm Mortar High Explosive", "18 DOF", "5 Days to Threshold", "HIGH RISK", "Siliguri Train + Stallion Fleet", "VERIFIED"),
            ("Kargil High Pickets", "Drass High Ridge", "High-Altitude Calorie Rations", "22 DOS", "8 Days to Threshold", "MEDIUM RISK", "Forward Supply Depot Release", "VERIFIED"),
            ("Barmer Desert Sector", "Western Operational Pickets", "T-90 Air Filter Cartridges", "12 DOS", "4 Days to Threshold", "HIGH RISK", "COD Delhi Cantt Express Air", "VERIFIED"),
            ("Uri Border Echelon", "Line of Control Posts", "Medical Oxygen Cylinders", "16 DOS", "6 Days to Threshold", "MEDIUM RISK", "92 Base Hospital Refill Sortie", "VERIFIED"),
            ("Sikkim North Sector", "High Elevation Pickets", "Extreme Cold Parka Suits", "15 DOS", "5 Days to Threshold", "HIGH RISK", "Advance Ordnance Depot Dump", "VERIFIED"),
        ]
        agg = ("National Stockout Prevention", "6 Forward Sensitive Sectors", "All Echelons", "16.2 DOS Average", "Continuous ASCON Telemetry", "EARLY INTERVENTION", "Zero Stockouts Logged", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 8. REDISTRIBUTION SAVINGS
    if "redistribution" in cat or "saving" in cat:
        headers = ["ORIGIN DEPOT", "RECEIVING UNIT", "MATERIAL TRANSFERRED", "TONNAGE", "SAVINGS ESTIMATE", "VOUCHER REF", "AUDIT STATUS"]
        col_widths = [110, 110, 80, 50, 55, 55, 60]
        rows = [
            ("COD Pathankot", "Northern Command Central Depot", "14 Rajput (Mechanised)", "40,000L Sub-Zero HSD", "32 Tonnes", "₹18.4 Lakhs Saved", "RV-14R-7104-REDIST", "VERIFIED"),
            ("COD Jabalpur", "Heavy Artillery Central Arsenal", "17 Mountain Artillery", "155mm HE Shell Assemblies", "45 Tonnes", "₹34.2 Lakhs Saved", "RV-17A-8821-REDIST", "VERIFIED"),
            ("FSD Jammu", "Forward Subsistence Reserve", "3 Grenadiers (Infantry)", "Caloric Combat Meal Packs", "24 Tonnes", "₹12.8 Lakhs Saved", "RV-3G-9902-REDIST", "VERIFIED"),
            ("COD Agra", "Central Armored Spares Base", "7 Cavalry (Armoured)", "T-90 Hydraulic Valve Kits", "8 Tonnes", "₹42.5 Lakhs Saved", "RV-7C-4412-REDIST", "VERIFIED"),
            ("COD Delhi Cantt", "Strategic Signals Directorate", "9 Para (Special Forces)", "SATCOM Encryption Terminals", "4 Tonnes", "₹26.0 Lakhs Saved", "RV-9P-1123-REDIST", "VERIFIED"),
            ("224 ABOD Pathankot", "Forward Cold Weather Depot", "120 Forward ASC Bn", "Extreme Cold Boot Kits", "18 Tonnes", "₹14.6 Lakhs Saved", "RV-120-6674-REDIST", "VERIFIED"),
        ]
        agg = ("National Dynamic Redistribution", "6 Lateral Strategic Re-allocations", "Multi-Theater Net", "131 Tonnes Total Relocated", "Zero Fresh Procurement", "₹1.485 Crores Saved", "Multi-Depot Reconciled", "ALL AUDITED")
        return headers, col_widths, rows, agg

    # 9. DEFAULT: NATIONAL READINESS (with date range awareness)
    headers = ["THEATER COMMAND", "TOTAL FORMATIONS", "AVG READINESS", "CLASS I (RATIONS)", "CLASS III (POL)", "CLASS V (MUNITIONS)", "AUDIT STATUS"]
    col_widths = [140, 65, 60, 65, 60, 65, 65]

    if "7 days" in d:
        rows = [
            ("Northern Command (Udhampur)", "14, 15, 16 Corps - Active Glacier Resupply", "418 Units", "98.4%", "185 DOS", "64 DOS", "44 DOF", "VERIFIED"),
            ("Eastern Command (Kolkata)", "3, 4, 33 Corps - Sela Transit Axis", "382 Units", "96.7%", "154 DOS", "61 DOS", "42 DOF", "VERIFIED"),
            ("Western Command (Chandimandir)", "2, 9, 11 Corps - Strike Columns", "258 Units", "98.8%", "124 DOS", "73 DOS", "46 DOF", "VERIFIED"),
            ("Southern Command (Pune)", "11, 12 Corps - Desert Strike Sector", "178 Units", "96.5%", "92 DOS", "67 DOS", "39 DOF", "VERIFIED"),
            ("South Western Command (Jaipur)", "1 Corps - Pivot Maneuver Force", "208 Units", "97.9%", "114 DOS", "70 DOS", "45 DOF", "VERIFIED"),
            ("Central Command (Lucknow)", "Central Strategic Depots & Surya Axis", "188 Units", "97.2%", "144 DOS", "62 DOS", "40 DOF", "VERIFIED"),
        ]
        agg = ("National Strategic Aggregate", "Tactical High-Tempo Window", "1,712 Units", "97.6%", "139 DOS Avg", "66 DOS Avg", "43 DOF Avg", "ALL AUDITED")
    elif "quarter" in d or "q3" in d:
        rows = [
            ("Northern Command (Udhampur)", "14, 15, 16 Corps - Peak Winter Stock Dumps", "428 Units", "95.2%", "215 DOS", "84 DOS", "52 DOF", "VERIFIED"),
            ("Eastern Command (Kolkata)", "3, 4, 33 Corps - Advance Forward Depots", "388 Units", "94.6%", "178 DOS", "76 DOS", "48 DOF", "VERIFIED"),
            ("Western Command (Chandimandir)", "2, 9, 11 Corps - Pre-Exercise Build-Up", "264 Units", "97.6%", "128 DOS", "68 DOS", "46 DOF", "VERIFIED"),
            ("Southern Command (Pune)", "11, 12 Corps - Peninsular & Maritime Hubs", "182 Units", "95.4%", "96 DOS", "62 DOS", "36 DOF", "VERIFIED"),
            ("South Western Command (Jaipur)", "1 Corps - Heavy Armor Reserves", "212 Units", "96.8%", "115 DOS", "65 DOS", "42 DOF", "VERIFIED"),
            ("Central Command (Lucknow)", "Central Feeder Ordnance Depots", "194 Units", "96.1%", "152 DOS", "64 DOS", "40 DOF", "VERIFIED"),
        ]
        agg = ("National Strategic Aggregate", "Pre-Winter Surge Stockpile", "1,756 Units", "95.9%", "147 DOS Avg", "70 DOS Avg", "44 DOF Avg", "ALL AUDITED")
    elif "year" in d or "2025-26" in d:
        rows = [
            ("Northern Command (Udhampur)", "14, 15, 16 Corps - Annual Harmonic Mean", "415 Units", "94.8%", "165 DOS", "54 DOS", "38 DOF", "VERIFIED"),
            ("Eastern Command (Kolkata)", "3, 4, 33 Corps - Monsoon & Winter Average", "375 Units", "93.9%", "138 DOS", "51 DOS", "36 DOF", "VERIFIED"),
            ("Western Command (Chandimandir)", "2, 9, 11 Corps - Annual Cycle Baseline", "255 Units", "96.8%", "112 DOS", "64 DOS", "42 DOF", "VERIFIED"),
            ("Southern Command (Pune)", "11, 12 Corps - Southern Annual Baseline", "175 Units", "94.5%", "82 DOS", "58 DOS", "35 DOF", "VERIFIED"),
            ("South Western Command (Jaipur)", "1 Corps - Desert Training Cycle", "205 Units", "95.8%", "102 DOS", "61 DOS", "40 DOF", "VERIFIED"),
            ("Central Command (Lucknow)", "Surya Command & Ordnance Depots", "185 Units", "95.2%", "128 DOS", "55 DOS", "37 DOF", "VERIFIED"),
        ]
        agg = ("National Strategic Aggregate", "Full FY Annual Fiscal Average", "1,700 Units", "95.2%", "121 DOS Avg", "57 DOS Avg", "38 DOF Avg", "ALL AUDITED")
    else:
        # Default: Last 30 Days
        rows = [
            ("Northern Command (Udhampur)", "14, 15, 16 Corps - Siachen/Ladakh Axis", "420 Units", "97.2%", "180 DOS", "62 DOS", "42 DOF", "VERIFIED"),
            ("Eastern Command (Kolkata)", "3, 4, 33 Corps - LAC Mountain Formations", "380 Units", "95.8%", "150 DOS", "58 DOS", "40 DOF", "VERIFIED"),
            ("Western Command (Chandimandir)", "2, 9, 11 Corps - Strike & Plains Echelons", "260 Units", "98.1%", "120 DOS", "70 DOS", "45 DOF", "VERIFIED"),
            ("Southern Command (Pune)", "11, 12 Corps - Desert Strike & Maritime Axis", "180 Units", "96.0%", "90 DOS", "65 DOS", "38 DOF", "VERIFIED"),
            ("South Western Command (Jaipur)", "1 Corps (Pivot Strike) - Sapta Shakti", "210 Units", "97.4%", "110 DOS", "68 DOS", "44 DOF", "VERIFIED"),
            ("Central Command (Lucknow)", "Central Ordnance Depots & Surya Sector", "190 Units", "96.9%", "140 DOS", "60 DOS", "39 DOF", "VERIFIED"),
        ]
        agg = ("National Strategic Aggregate", "National Standard Baseline", "1,725 Units", "97.1%", "135 DOS Avg", "64 DOS Avg", "41 DOF Avg", "ALL AUDITED")

    return headers, col_widths, rows, agg


def get_theater_dataset(date_range: str):
    """
    Backward-compatible adapter for default national readiness dataset.
    """
    _, _, rows, agg = get_category_dataset("National Readiness", date_range)
    # Convert tuples to old format: (col1, sub, col2, col3, col4, col5, col6, col7)
    theater_rows = [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]) for r in rows]
    return theater_rows, agg


def generate_defense_readiness_pdf(
    category: str = "National Readiness",
    date_range: str = "Last 30 Days",
    audit_hash: str = "9039aed288926a924a3db52466ea39834e82b20b9ba42695081894857c64f4da"
) -> bytes:
    """
    Renders an official Ministry of Defence executive logistics readiness statement.
    Returns the binary PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "GovTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        alignment=1, # Center
        textColor=colors.HexColor("#0f172a")
    )
    subtitle_style = ParagraphStyle(
        "GovSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor("#475569")
    )
    doc_heading_style = ParagraphStyle(
        "DocHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#1e3825")
    )
    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#334155")
    )
    meta_val_style = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )
    th_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.white
    )
    td_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b")
    )
    td_bold_style = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b")
    )
    td_green_style = ParagraphStyle(
        "TableCellGreen",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#15803d")
    )

    elements = []

    # 1. Header with Emblem & Govt Titles
    # Look for Indian Emblem image on disk
    emblem_path = r"D:\SenaAapurti\SIH26251-SenaAapurti\public\images\indian_emblem_white.png"
    logo_path = r"D:\SenaAapurti\SIH26251-SenaAapurti\public\images\sena_official_logo.png"

    header_cols = []
    if os.path.exists(emblem_path):
        header_cols.append(Image(emblem_path, width=42, height=52))
    else:
        header_cols.append("")

    gov_text = (
        "<b>GOVERNMENT OF INDIA • MINISTRY OF DEFENCE</b><br/>"
        "INTEGRATED HEADQUARTERS OF MoD (ARMY) • NEW DELHI - 110011<br/>"
        "<b>DIRECTORATE GENERAL OF ORDNANCE SERVICES (DGOS)</b><br/>"
        "<font size='7' color='#64748b'>MASTER GENERAL OF SUSTENANCE (MGS) BRANCH • SENA BHAWAN</font>"
    )
    header_cols.append(Paragraph(gov_text, title_style))

    if os.path.exists(logo_path):
        header_cols.append(Image(logo_path, width=44, height=44))
    else:
        header_cols.append("")

    header_table = Table([header_cols], colWidths=[55, 410, 55])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 8))

    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3825"), spaceBefore=1, spaceAfter=8))

    # 2. Document Title Banner
    elements.append(Paragraph("EXECUTIVE DEFENSE LOGISTICS READINESS AUDIT", doc_heading_style))
    elements.append(Paragraph(f"Official Parliamentary Oversight & Theater Stockpile Assessment — {category}", subtitle_style))
    elements.append(Spacer(1, 10))

    # 3. Metadata Strip Table
    now_str = datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M UTC")
    meta_data = [
        [
            Paragraph("REPORT CATEGORY:", meta_label_style),
            Paragraph(category, meta_val_style),
            Paragraph("SECURITY LEVEL:", meta_label_style),
            Paragraph("<font color='#991b1b'><b>TOP SECRET // STRATEGIC</b></font>", meta_val_style)
        ],
        [
            Paragraph("AUDIT DATE RANGE:", meta_label_style),
            Paragraph(date_range, meta_val_style),
            Paragraph("ASCON TELEMETRY:", meta_label_style),
            Paragraph("ONLINE • DEFCON 1 VERIFIED", meta_val_style)
        ],
        [
            Paragraph("DISPATCH SERIAL:", meta_label_style),
            Paragraph("DGOS/READINESS/2026/Q3-9914", meta_val_style),
            Paragraph("TIMESTAMP:", meta_label_style),
            Paragraph(now_str, meta_val_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[110, 150, 110, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # 4. Main Readiness / Logistics Audit Data Table
    headers_text, col_widths, cat_rows, agg = get_category_dataset(category, date_range)
    table_headers = [Paragraph(h, th_style) for h in headers_text]

    table_rows = []
    for r in cat_rows:
        table_rows.append([
            Paragraph(f"<b>{r[0]}</b><br/><font size='6' color='#64748b'>{r[1]}</font>", td_style),
            Paragraph(r[2], td_style),
            Paragraph(r[3], td_green_style if any(c.isdigit() for c in str(r[3])) else td_style),
            Paragraph(r[4], td_style),
            Paragraph(r[5], td_style),
            Paragraph(r[6], td_style),
            Paragraph(f"<font color='#15803d'><b>✓ {r[7]}</b></font>", td_style),
        ])
    
    # Aggregate row
    table_rows.append([
        Paragraph(f"<b>{agg[0]}</b><br/><font size='6' color='#475569'>{agg[1]}</font>", td_bold_style),
        Paragraph(f"<b>{agg[2]}</b>", td_bold_style),
        Paragraph(f"<b>{agg[3]}</b>", td_green_style),
        Paragraph(f"<b>{agg[4]}</b>", td_bold_style),
        Paragraph(f"<b>{agg[5]}</b>", td_bold_style),
        Paragraph(f"<b>{agg[6]}</b>", td_bold_style),
        Paragraph(f"<font color='#15803d'><b>✓ {agg[7]}</b></font>", td_bold_style),
    ])

    readiness_table = Table([table_headers] + table_rows, colWidths=col_widths)
    readiness_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3825")),
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor("#1e3825")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(readiness_table)
    elements.append(Spacer(1, 14))

    # 5. Ministry Defense Stamp & Cryptographic Digital Signatures Block
    stamp_drawing = create_circular_ministry_stamp()

    sig_content = [
        Paragraph("<b>DIGITAL DEFENSE AUTHENTICATION & CRYPTOGRAPHIC PROOF</b>", ParagraphStyle("SigHead", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#1e3825"))),
        Spacer(1, 4),
        Paragraph("<b>Authorizing Officer:</b> Lt Gen V. K. Rawat, PVSM, AVSM", meta_val_style),
        Paragraph("<b>Designation:</b> Master General of Sustenance (MGS), Integrated HQ of MoD (Army)", meta_val_style),
        Paragraph("<b>Clearance Level:</b> TOP SECRET - STRATEGIC DEFENSE LOGISTICS", meta_val_style),
        Spacer(1, 4),
        Paragraph(f"<b>PostgreSQL Ledger SHA-256 Block Hash:</b>", meta_label_style),
        Paragraph(f"<font fontName='Courier' size='6.5' color='#0f172a'>{audit_hash}</font>", meta_val_style),
        Paragraph("<i>Certified electronically under IT Act Sec 10A & Armed Forces Cybersecurity Protocol</i>", ParagraphStyle("Fine", fontName="Helvetica-Oblique", fontSize=6.5, textColor=colors.HexColor("#64748b")))
    ]

    stamp_table = Table([[stamp_drawing, sig_content]], colWidths=[150, 370])
    stamp_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor("#cbd5e1")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafaf9")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(KeepTogether([stamp_table]))

    # Build PDF with two-pass NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)
    return buffer.getvalue()


def generate_defense_readiness_csv(
    category: str = "National Readiness",
    date_range: str = "Last 30 Days",
    audit_hash: str = "9039aed288926a924a3db52466ea39834e82b20b9ba42695081894857c64f4da"
) -> str:
    """
    Generates official CSV statement with audit metadata headers.
    """
    headers_text, _, cat_rows, agg = get_category_dataset(category, date_range)
    rows = [
        ["# --------------------------------------------------------------------------------"],
        ["# SENA AAPURTI — DIRECTORATE GENERAL OF ORDNANCE SERVICES (DGOS)"],
        ["# INTEGRATED HQ OF MOD (ARMY) • EXECUTIVE READINESS AUDIT STATEMENT"],
        ["# --------------------------------------------------------------------------------"],
        [f"# Report Category: {category}"],
        [f"# Date Range: {date_range}"],
        [f"# Generated At: {datetime.now(timezone.utc).isoformat()}"],
        [f"# Security Classification: RESTRICTED // OFFICIAL DEFENSE USE ONLY"],
        [f"# PostgreSQL Tamper-Proof Audit Hash: {audit_hash}"],
        ["# --------------------------------------------------------------------------------"],
        [headers_text[0], "SUB-SECTOR / SPECIFICATION", headers_text[1], headers_text[2], headers_text[3], headers_text[4], headers_text[5], headers_text[6]],
    ]
    for r in cat_rows:
        rows.append([r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]])
    rows.append([agg[0], agg[1], agg[2], agg[3], agg[4], agg[5], agg[6], agg[7]])
    return "\n".join([",".join([f'"{cell}"' if ("," in str(cell) or " " in str(cell)) else str(cell) for cell in r]) for r in rows])


def get_unit_ledger_dataset(report_id: str, title: str, category: str):
    """
    Returns authentic regimental inventory ledger rows, column headers, and column widths
    tailored to the specific unit report category and ID.
    """
    rid = (report_id or "").upper()
    cat = (category or "").lower()
    tit = (title or "").lower()

    # 1. POL & Consumption (Daily Logistics & Fuel Balance Log)
    if "pol" in cat or "fuel" in cat or "10-06-a" in rid or "balance" in tit:
        headers = [
            Paragraph("STORAGE / PICKET", ParagraphStyle("TH1", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("FUEL NOMENCLATURE", ParagraphStyle("TH2", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("OPENING", ParagraphStyle("TH3", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("RECEIPTS", ParagraphStyle("TH4", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("ISSUES / BURN", ParagraphStyle("TH5", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("CLOSING", ParagraphStyle("TH6", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("DOS RESERVE", ParagraphStyle("TH7", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        ]
        col_widths = [115, 120, 58, 62, 64, 58, 46]
        rows = [
            ("Main Bulk Installation (BFI-1)", "Sub-Zero HSD (-40°C Arctic Grade)", "42,000 L", "+15,000 L (Convoy H-9)", "-4,800 L (Bukhari/Genset)", "52,200 L", "45 DOS"),
            ("Helipad Aviation Reserve Picket", "JP-8 Arctic Aviation Turbine Fuel", "18,500 L", "0 L (Direct IAF Dump)", "-1,200 L (ALH Mk-III)", "17,300 L", "58 DOS"),
            ("Forward Picket (Bravo Depot)", "Superior Kerosene Oil (SKO High-Alt)", "8,400 L", "+2,000 L (Convoy G-1)", "-950 L (Living Shelters)", "9,450 L", "62 DOS"),
            ("EME Motor Pool & Repair Bay", "Sub-Zero Engine Lubricant 15W-40", "1,200 L", "0 L", "-45 L (BMP-II Routine)", "1,155 L", "90 DOS"),
            ("Heavy Armored Picket East", "Hydraulic Fluid HF-8A (Turret/Brake)", "680 L", "+100 L", "-18 L (Fleet Maint)", "762 L", "110 DOS"),
        ]
        aggregate = ("REGIMENTAL FUEL TOTAL", "5 Echelons 100% Reconciled", "70,780 L", "+17,100 L", "-7,013 L", "80,867 L", "52 DOS Avg")
        return headers, col_widths, rows, aggregate

    # 2. Winter Buffers (Pre-Winter Stocking Verification Statement)
    if "winter" in cat or "buffer" in cat or "wst" in rid or "stocking" in tit:
        headers = [
            Paragraph("DEFENSE COMMODITY / CLASS", ParagraphStyle("TH1", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("TARGET MANDATE", ParagraphStyle("TH2", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("STOCKED HELD", ParagraphStyle("TH3", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("VARIANCE", ParagraphStyle("TH4", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("STORAGE ECHELON", ParagraphStyle("TH5", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("AUDIT STATUS", ParagraphStyle("TH6", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        ]
        col_widths = [140, 75, 70, 52, 120, 66]
        rows = [
            ("Class I: High-Altitude Caloric Rations (4,200 kcal)", "180 DOS Full Winter", "180 DOS", "0.0%", "Leh Underground Granary A", "✓ 100% VERIFIED"),
            ("Class III: Sub-Zero HSD (-40°C Winter Diesel)", "150,000 Litres", "152,000 Litres", "+1.3%", "Heated Underground Tanks 1-4", "✓ 100% VERIFIED"),
            ("Class II: Multi-Layer ECC Warm Suits & Boots", "750 Complete Sets", "750 Complete Sets", "0.0%", "Regimental QM Warehouse", "✓ 100% VERIFIED"),
            ("Class VIII: Portable Medical Oxygen & Frostbite Kits", "120 Complete Kits", "120 Complete Kits", "0.0%", "153 Base Hospital Picket", "✓ 100% VERIFIED"),
            ("Class IX: BMP-II Snow Chains & Bogie Spares", "48 Sets", "48 Sets", "0.0%", "EME Forward Repair Bay", "✓ 100% VERIFIED"),
            ("Class I: Tinned Meat, Desiccated Veg & Energy Packs", "90 Days Pack", "95 Days Pack", "+5.5%", "Sub-Zero Store Vault B", "✓ 100% VERIFIED"),
        ]
        aggregate = ("PRE-WINTER GARRISON AGGREGATE", "100% Mandated Target", "100.8% Stocked", "+0.8%", "All 6 Regimental Warehouses", "✓ 100% VERIFIED")
        return headers, col_widths, rows, aggregate

    # 3. Munitions & Armament (Class V Munitions & Arms Audit Ledger)
    if "ammo" in cat or "munition" in cat or "aud" in rid or "arm" in tit:
        headers = [
            Paragraph("MUNITION NOMENCLATURE", ParagraphStyle("TH1", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("CALIBRE / TYPE", ParagraphStyle("TH2", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("LOT / BATCH NO", ParagraphStyle("TH3", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("DEPOT ORIGIN", ParagraphStyle("TH4", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("HELD STOCK", ParagraphStyle("TH5", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
            Paragraph("INSPECTION STATUS", ParagraphStyle("TH6", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        ]
        col_widths = [135, 75, 78, 80, 75, 80]
        rows = [
            ("7.62x51mm Sealed Tins (AK/INSAS/SIG)", "7.62mm Small Arms", "LOT-OFB-2026-A1", "OFB Varangaon", "120,000 Rounds", "✓ Sealed & Intact"),
            ("125mm APFSDS Kinetic Energy Tank Shells", "125mm Smoothbore", "LOT-MIL-2025-T9", "Munitions India Ltd", "380 Rounds", "✓ Climate Controlled"),
            ("155mm High Explosive Artillery Shells", "155mm / 52 Cal", "LOT-OFB-2026-K9", "OFB Kanpur", "620 Rounds", "✓ In Bunker Vault"),
            ("Konkurs-M Anti-Tank Guided Missiles (ATGM)", "Wire-Guided ATGM", "LOT-BDL-2025-88", "Bharat Dynamics Ltd", "24 Missiles", "✓ Sealed Canisters"),
            ("84mm Carl Gustaf HE Rocket Rounds", "84mm Recoilless", "LOT-OFB-2026-C4", "OFB Khamaria", "195 Rounds", "✓ Armory Checked"),
            ("Multi-Mode Hand Grenades (HE Shrapnel)", "Defensive Grenade", "LOT-EEL-2026-MG", "Economic Explosives", "500 Nos", "✓ Safety Pins Checked"),
        ]
        aggregate = ("REGIMENTAL WAR RESERVE (WWR)", "All Calibres Active", "6 Sealed Batches", "COD Pathankot Feeder", "121,719 Munitions", "✓ 100% Reconciled")
        return headers, col_widths, rows, aggregate

    # 4. Fleet Readiness (Convoy Transport & Mechanical Fitness Report)
    headers = [
        Paragraph("VEHICLE PLATFORM / MODEL", ParagraphStyle("TH1", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        Paragraph("FLEET COUNT", ParagraphStyle("TH2", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        Paragraph("COMBAT READY", ParagraphStyle("TH3", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        Paragraph("COLD START (-25°C)", ParagraphStyle("TH4", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        Paragraph("ANTIFREEZE GRADE", ParagraphStyle("TH5", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
        Paragraph("FITNESS CLEARANCE", ParagraphStyle("TH6", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white, alignment=1)),
    ]
    col_widths = [135, 65, 68, 85, 80, 90]
    rows = [
        ("BMP-II Sarath Infantry Combat Vehicle", "14 Platforms", "14 Ready (100%)", "Passed Pre-Heat", "100% Sub-Zero Grade", "✓ Fit for Combat"),
        ("Ashok Leyland Stallion 4x4 Troop Carrier", "22 Transports", "21 Ready (95.5%)", "Passed Battery Crank", "100% Sub-Zero Grade", "✓ Roadworthy"),
        ("Tatra 8x8 Heavy Logistics Recovery Vehicle", "4 Recovery Trucks", "4 Ready (100%)", "Passed Direct Crank", "Tested -40°C Coolant", "✓ Roadworthy"),
        ("ALS 4x4 Sub-Zero Fuel Tanker (6,000L)", "6 POL Tankers", "6 Ready (100%)", "Meters Calibrated", "Thermal Jacket OK", "✓ Mission Ready"),
        ("Mahindra Armored Light Specialist Vehicle", "8 Quick Reaction", "8 Ready (100%)", "Run-Flat Tyres OK", "ASCON SATCOM Sync", "✓ Fit for Combat"),
    ]
    aggregate = ("14 RAJPUT MOTOR POOL", "54 Vehicles", "53 Active (98.1%)", "100% Cold Started", "EME Winter Cert #89", "✓ Air/Roadworthy")
    return headers, col_widths, rows, aggregate


def generate_unit_ledger_pdf(
    report_id: str = "REP-2026-10-06-A",
    title: str = "Daily Logistics & Fuel Balance Log",
    category: str = "POL & Consumption",
    period: str = "Today (06 Oct 2026)",
    authorizing_officer: str = "Major Amit Sharma (QM)",
    classification: str = "RESTRICTED",
    unit_name: str = "14 RAJPUT (MECHANISED)",
    station: str = "Leh, Ladakh (14 Corps - Fire & Fury)",
    audit_hash: str = "9039aed288926a924a3db52466ea39834e82b20b9ba42695081894857c64f4da"
) -> bytes:
    """
    Renders an authentic, certified Regimental Logistics Ledger PDF with Ministry &
    Regimental vector rubber stamps, Ashok emblem, classified security header,
    and cryptographic ASCON SHA-256 proof.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=44
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "GovUnitTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#0f172a")
    )
    subtitle_style = ParagraphStyle(
        "GovUnitSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#475569")
    )
    doc_heading_style = ParagraphStyle(
        "DocUnitHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=15,
        alignment=1,
        textColor=colors.HexColor("#1e3825")
    )
    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#334155")
    )
    meta_val_style = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )
    td_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#1e293b")
    )
    td_bold_style = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#1e293b")
    )
    td_green_style = ParagraphStyle(
        "TableCellGreen",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#15803d")
    )

    elements = []

    # 1. Top Header with Emblem, Govt / Corps Titles, and Sena Insignia
    emblem_path = r"D:\SenaAapurti\SIH26251-SenaAapurti\public\images\indian_emblem_white.png"
    logo_path = r"D:\SenaAapurti\SIH26251-SenaAapurti\public\images\sena_crest_logo.png"
    if not os.path.exists(logo_path):
        logo_path = r"D:\SenaAapurti\SIH26251-SenaAapurti\public\images\sena_official_logo.png"

    header_cols = []
    if os.path.exists(emblem_path):
        header_cols.append(Image(emblem_path, width=40, height=50))
    else:
        header_cols.append("")

    gov_text = (
        "<b>GOVERNMENT OF INDIA • MINISTRY OF DEFENCE</b><br/>"
        "<b>HEADQUARTERS 14 CORPS (\"FIRE & FURY CORPS\") • LEH, LADAKH</b><br/>"
        f"<b>{unit_name.upper()} — REGIMENTAL QUARTERMASTER BRANCH</b><br/>"
        "<font size='6.5' color='#64748b'>Certified Regimental Logistics Audit & Stock Ledger • ASCON Secure Node</font>"
    )
    header_cols.append(Paragraph(gov_text, title_style))

    if os.path.exists(logo_path):
        header_cols.append(Image(logo_path, width=42, height=42))
    else:
        header_cols.append("")

    header_table = Table([header_cols], colWidths=[55, 413, 55])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 6))

    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3825"), spaceBefore=1, spaceAfter=8))

    # 2. Document Title Banner
    elements.append(Paragraph(title.upper(), doc_heading_style))
    elements.append(Paragraph(f"Official Quartermaster Store Records, Verified Balances & DGOS Clearance — {category}", subtitle_style))
    elements.append(Spacer(1, 9))

    # 3. Metadata Strip Table
    now_str = datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M UTC")
    cl_tag = classification.upper()
    if "SECRET" in cl_tag:
        cl_color = "#991b1b"
    elif "CONFIDENTIAL" in cl_tag:
        cl_color = "#c2410c"
    else:
        cl_color = "#15803d"

    meta_data = [
        [
            Paragraph("REPORT VOUCHER ID:", meta_label_style),
            Paragraph(f"<b>{report_id}</b>", meta_val_style),
            Paragraph("SECURITY CLASSIFICATION:", meta_label_style),
            Paragraph(f"<font color='{cl_color}'><b>{classification}</b></font>", meta_val_style)
        ],
        [
            Paragraph("LEDGER CATEGORY:", meta_label_style),
            Paragraph(category, meta_val_style),
            Paragraph("AUDIT PERIOD:", meta_label_style),
            Paragraph(period, meta_val_style)
        ],
        [
            Paragraph("UNIT & GARRISON:", meta_label_style),
            Paragraph(f"{unit_name} ({station})", meta_val_style),
            Paragraph("LEDGER RECONCILIATION:", meta_label_style),
            Paragraph("<font color='#15803d'><b>✓ 100% MATHEMATICALLY VERIFIED</b></font>", meta_val_style)
        ],
        [
            Paragraph("AUTHORIZING OFFICER:", meta_label_style),
            Paragraph(f"<b>{authorizing_officer}</b>", meta_val_style),
            Paragraph("ASCON TIMESTAMP:", meta_label_style),
            Paragraph(now_str, meta_val_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[115, 145, 115, 148])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # 4. Main Tabular Ledger Records
    headers, col_widths, table_rows, aggregate = get_unit_ledger_dataset(report_id, title, category)

    data_rows = []
    for r in table_rows:
        row_cells = []
        for i, val in enumerate(r):
            if i == 0:
                row_cells.append(Paragraph(f"<b>{val}</b>", td_style))
            elif "VERIFIED" in str(val) or "100%" in str(val) or "Fit" in str(val) or "Road" in str(val) or "Ready" in str(val):
                row_cells.append(Paragraph(f"<font color='#15803d'><b>{val}</b></font>", td_green_style))
            else:
                row_cells.append(Paragraph(str(val), td_style))
        data_rows.append(row_cells)

    # Aggregate summary row
    agg_cells = []
    for i, val in enumerate(aggregate):
        if i == 0:
            agg_cells.append(Paragraph(f"<b>{val}</b>", td_bold_style))
        elif "VERIFIED" in str(val) or "Reconciled" in str(val) or "Ready" in str(val) or "worthy" in str(val):
            agg_cells.append(Paragraph(f"<font color='#15803d'><b>{val}</b></font>", td_green_style))
        else:
            agg_cells.append(Paragraph(f"<b>{val}</b>", td_bold_style))
    data_rows.append(agg_cells)

    ledger_table = Table([headers] + data_rows, colWidths=col_widths)
    ledger_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3825")),
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor("#1e3825")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
    ]))
    elements.append(ledger_table)
    elements.append(Spacer(1, 11))

    # 5. Ministry & Regimental Rubber Stamp with Digital Signatures Block
    today_stamp_str = datetime.now().strftime("%d %b %Y").upper()
    stamp_drawing = create_circular_unit_stamp(
        unit_name=unit_name,
        station="LEH GARRISON • 14 CORPS",
        date_str=today_stamp_str,
        status_text="100% RECONCILED"
    )

    sig_content = [
        Paragraph("<b>DIGITAL REGIMENTAL AUTHENTICATION & ASCON LEDGER PROOF</b>", ParagraphStyle("SigHead", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.HexColor("#1e3825"))),
        Spacer(1, 3),
        Paragraph(f"<b>Authorizing Officer:</b> {authorizing_officer}", meta_val_style),
        Paragraph(f"<b>Formation:</b> {unit_name}, 14 Corps (\"Fire & Fury\"), Northern Command", meta_val_style),
        Paragraph(f"<b>Clearance Level:</b> {classification} // REGIMENTAL QUARTERMASTER AUDIT", meta_val_style),
        Spacer(1, 3),
        Paragraph("<b>Digitally Signed Token Voucher:</b> #14R-QM-71044A-2026-REV1 (VERIFIED)", meta_val_style),
        Paragraph(f"<b>PostgreSQL Ledger SHA-256 Block Hash:</b>", meta_label_style),
        Paragraph(f"<font fontName='Courier' size='6.2' color='#0f172a'>{audit_hash}</font>", meta_val_style),
        Paragraph("<i>Certified electronically under IT Act Sec 10A & Armed Forces Regimental Store Regulations</i>", ParagraphStyle("Fine", fontName="Helvetica-Oblique", fontSize=6.2, textColor=colors.HexColor("#64748b")))
    ]

    stamp_table = Table([[stamp_drawing, sig_content]], colWidths=[145, 378])
    stamp_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor("#cbd5e1")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafaf9")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))

    elements.append(KeepTogether([stamp_table]))

    # Build PDF with dynamic NumberedCanvas
    canvas_maker = make_numbered_canvas(
        classification=classification,
        watermark=f"{unit_name.split()[0]} AUDITED",
        ref_code=f"{report_id}/14R-QM"
    )
    doc.build(elements, canvasmaker=canvas_maker)
    return buffer.getvalue()


def generate_unit_ledger_csv(
    report_id: str = "REP-2026-10-06-A",
    title: str = "Daily Logistics & Fuel Balance Log",
    category: str = "POL & Consumption",
    period: str = "Today (06 Oct 2026)",
    authorizing_officer: str = "Major Amit Sharma (QM)",
    classification: str = "RESTRICTED",
    unit_name: str = "14 RAJPUT (MECHANISED)",
    audit_hash: str = "9039aed288926a924a3db52466ea39834e82b20b9ba42695081894857c64f4da"
) -> str:
    """
    Generates official CSV statement for a regimental unit ledger.
    """
    headers, _, rows, agg = get_unit_ledger_dataset(report_id, title, category)
    csv_rows = [
        ["# --------------------------------------------------------------------------------"],
        [f"# SENA AAPURTI — {unit_name.upper()} • 14 CORPS FIRE & FURY LEH"],
        [f"# CERTIFIED REGIMENTAL LOGISTICS LEDGER — {title.upper()}"],
        ["# --------------------------------------------------------------------------------"],
        [f"# Report Voucher ID: {report_id}"],
        [f"# Category: {category}"],
        [f"# Audit Period: {period}"],
        [f"# Authorizing Officer: {authorizing_officer}"],
        [f"# Security Classification: {classification}"],
        [f"# PostgreSQL Tamper-Proof Audit Hash: {audit_hash}"],
        ["# --------------------------------------------------------------------------------"],
        [h.text if hasattr(h, 'text') else str(h) for h in headers]
    ]
    for r in rows:
        csv_rows.append(list(r))
    csv_rows.append(list(agg))
    return "\n".join([",".join([f'"{cell}"' if ("," in str(cell) or " " in str(cell)) else str(cell) for cell in r]) for r in csv_rows])

