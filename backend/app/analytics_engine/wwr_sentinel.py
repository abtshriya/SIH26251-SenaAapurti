"""
War Wastage Reserve (WWR) Sentinel & Pre-Emptive Breach Detector.
Enforces multi-echelon statutory boundaries:
  - Operating Stock: 60% - 100% of Authorized Capacity
  - Safety Buffer: 35% - 60% of Authorized Capacity
  - War Wastage Reserve (WWR): 0% - 35% of Authorized Capacity (Sacred Stock Buffer - Red Flag)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.analytics_engine.combat_tempo_model import ProjectionPoint

logger = logging.getLogger("sena_aapurti.analytics_engine.wwr_sentinel")


class EchelonBand(BaseModel):
    name: str
    lower_pct: float
    upper_pct: float
    threshold_value: float
    status_label: str
    color_code: str


class WWRRiskAssessment(BaseModel):
    current_stock: float
    authorized_capacity: float
    wwr_threshold: float
    safety_buffer_threshold: float
    current_echelon_band: str
    days_of_supply: float
    wwr_breach_expected_in_days: Optional[float]
    lead_time_days: float
    preemptive_alert: bool
    replenishment_recommended: float
    tactical_action_code: str
    commander_advisory: str


class WWRSentinel:
    """
    Statutory War Wastage Reserve (WWR) Guardian.
    Detects impending breaches before forward pickets consume into sacred war reserves.
    """

    OPERATING_MIN_PCT: float = 0.60  # 60% to 100%
    SAFETY_BUFFER_MIN_PCT: float = 0.35  # 35% to 60%
    WWR_MAX_PCT: float = 0.35  # 0% to 35% (WWR sacred buffer)

    @classmethod
    def get_echelon_bands(cls, authorized_capacity: float) -> List[EchelonBand]:
        return [
            EchelonBand(
                name="OPERATING_STOCK",
                lower_pct=0.60,
                upper_pct=1.00,
                threshold_value=round(authorized_capacity * 0.60, 1),
                status_label="GREEN - Normal Military Operations",
                color_code="#10B981",
            ),
            EchelonBand(
                name="SAFETY_BUFFER",
                lower_pct=0.35,
                upper_pct=0.60,
                threshold_value=round(authorized_capacity * 0.35, 1),
                status_label="YELLOW - Supply Buffer Engaged",
                color_code="#F59E0B",
            ),
            EchelonBand(
                name="WAR_WASTAGE_RESERVE",
                lower_pct=0.00,
                upper_pct=0.35,
                threshold_value=round(authorized_capacity * 0.35, 1),
                status_label="RED - Statutory War Reserve (Corps Clearance Required)",
                color_code="#EF4444",
            ),
        ]

    @classmethod
    def evaluate_wwr_risk(
        cls,
        current_stock: float,
        authorized_capacity: float,
        projection_series: List[ProjectionPoint],
        lead_time_days: float = 4.5,
        daily_burn_rate: Optional[float] = None,
    ) -> WWRRiskAssessment:
        """
        Analyzes the trajectory of projected stock vs the 35% WWR barrier.
        Triggers pre-emptive replenishment if Days to Breach <= Replenishment Lead Time.
        """
        if authorized_capacity <= 0:
            authorized_capacity = max(current_stock, 1000.0)

        wwr_threshold = round(authorized_capacity * cls.SAFETY_BUFFER_MIN_PCT, 1)
        safety_buffer_threshold = round(authorized_capacity * cls.OPERATING_MIN_PCT, 1)

        # Current status band
        stock_ratio = current_stock / authorized_capacity
        if stock_ratio >= cls.OPERATING_MIN_PCT:
            current_band = "OPERATING_STOCK"
        elif stock_ratio >= cls.SAFETY_BUFFER_MIN_PCT:
            current_band = "SAFETY_BUFFER"
        else:
            current_band = "WAR_WASTAGE_RESERVE_BREACHED"

        # Determine Days to WWR Breach using linear interpolation along median projection
        wwr_breach_days: Optional[float] = None

        if current_stock <= wwr_threshold:
            wwr_breach_days = 0.0
        else:
            prev_stock = current_stock
            prev_day = 0.0

            for point in projection_series:
                curr_stock = point.predicted_stock
                curr_day = float(point.day)

                if curr_stock <= wwr_threshold:
                    # Linear interpolation between prev and curr
                    drop = prev_stock - curr_stock
                    if drop > 0:
                        fraction = (prev_stock - wwr_threshold) / drop
                        wwr_breach_days = round(prev_day + fraction, 1)
                    else:
                        wwr_breach_days = curr_day
                    break

                prev_stock = curr_stock
                prev_day = curr_day

        # Total Days of Supply (until stock reaches zero)
        days_of_supply: float = 999.0
        if projection_series:
            # Check when predicted_stock hits 0
            zero_hit = False
            prev_stock = current_stock
            prev_day = 0.0
            for point in projection_series:
                curr_stock = point.predicted_stock
                curr_day = float(point.day)
                if curr_stock <= 0:
                    drop = prev_stock - curr_stock
                    if drop > 0:
                        fraction = prev_stock / drop
                        days_of_supply = round(prev_day + fraction, 1)
                    else:
                        days_of_supply = curr_day
                    zero_hit = True
                    break
                prev_stock = curr_stock
                prev_day = curr_day

            if not zero_hit:
                # Extrapolate from burn rate if given
                if daily_burn_rate and daily_burn_rate > 0:
                    days_of_supply = round(current_stock / daily_burn_rate, 1)
                else:
                    days_of_supply = round(float(projection_series[-1].day) * 1.5, 1)

        # Pre-emptive replenishment condition:
        # If (Days to WWR Breach <= Lead Time to Replenish), an emergency alert MUST fire!
        preemptive_alert = False
        if wwr_breach_days is not None:
            preemptive_alert = wwr_breach_days <= lead_time_days
        elif days_of_supply <= lead_time_days:
            preemptive_alert = True

        # Calculate recommended replenishment quantity to return to 100% authorized capacity
        # Deficit to 100% capacity + anticipated consumption during transit
        deficit = max(0.0, authorized_capacity - current_stock)
        burn = daily_burn_rate or (current_stock / max(days_of_supply, 1.0))
        transit_consumption = burn * lead_time_days
        raw_replenishment = deficit + transit_consumption

        # Round up to clean pallet/crate increments (e.g. 500s or 1000s)
        if raw_replenishment > 5000:
            replenishment_recommended = float(int((raw_replenishment + 999) // 1000) * 1000)
        else:
            replenishment_recommended = float(int((raw_replenishment + 99) // 100) * 100)

        if replenishment_recommended <= 0:
            replenishment_recommended = round(authorized_capacity * 0.40, 1)

        # Tactical action determination
        if current_band == "WAR_WASTAGE_RESERVE_BREACHED":
            tactical_action_code = "IMMEDIATE_CORPS_COMMANDER_CLEARANCE_REQUIRED"
            advisory = (
                f"CRITICAL RED ALERT: Unit current stock ({current_stock:,.0f}) is inside War Wastage Reserves "
                f"(WWR ceiling: {wwr_threshold:,.0f}). Immediate replenishment of {replenishment_recommended:,.0f} units "
                f"must be dispatched via aerial priority."
            )
        elif preemptive_alert:
            tactical_action_code = "HIGH_PRIORITY_PREEMPTIVE_ORDER"
            advisory = (
                f"PRE-EMPTIVE DEFENSE TRIGGER: Stock will breach sacred WWR threshold ({wwr_threshold:,.0f}) "
                f"in {wwr_breach_days} days. Lead time is {lead_time_days:.1f} days. "
                f"Dispatching replenishment of {replenishment_recommended:,.0f} units before breach occurs."
            )
        elif current_band == "SAFETY_BUFFER":
            tactical_action_code = "ROUTINE_BUFFER_MONITOR"
            advisory = (
                f"Formations operating within safety buffer ({current_stock:,.0f} units). "
                f"WWR breach projected in {wwr_breach_days if wwr_breach_days else '>30'} days."
            )
        else:
            tactical_action_code = "NORMAL_OPERATIONAL_POSTURE"
            advisory = (
                f"Formations fully stocked at operating level ({stock_ratio * 100:.1f}% capacity). "
                f"All war reserves intact."
            )

        return WWRRiskAssessment(
            current_stock=current_stock,
            authorized_capacity=authorized_capacity,
            wwr_threshold=wwr_threshold,
            safety_buffer_threshold=safety_buffer_threshold,
            current_echelon_band=current_band,
            days_of_supply=days_of_supply,
            wwr_breach_expected_in_days=wwr_breach_days,
            lead_time_days=lead_time_days,
            preemptive_alert=preemptive_alert,
            replenishment_recommended=replenishment_recommended,
            tactical_action_code=tactical_action_code,
            commander_advisory=advisory,
        )
