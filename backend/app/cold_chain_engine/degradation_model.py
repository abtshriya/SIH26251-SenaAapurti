"""
Sena Aapurti — Cold-Chain Medical & Shelf-Life Kinetic/Thermal Degradation Model
File: backend/app/cold_chain_engine/degradation_model.py
Classification: RESTRICTED // DEFENSE MEDICAL OPERATIONS (SIH26251)

Mathematical modeling of high-altitude freeze-thaw shock, thermal spikes,
and rough terrain kinetic vibration on Class VIII combat medical stores and drone lithium cells.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# SKU Thermal & Kinetic Profiles
# ---------------------------------------------------------------------------
class ColdChainProfile(BaseModel):
    sku: str
    item_name: str
    target_min_temp: float
    target_max_temp: float
    critical_freeze_temp: float
    critical_heat_temp: float
    max_freeze_exposure_seconds: float   # Max seconds before severe denaturing
    max_heat_exposure_seconds: float     # Max seconds before biological degradation
    max_kinetic_g: float                 # G-force spike threshold causing glass ampoule fractures
    freeze_penalty_rate: float           # Viability loss per minute frozen
    heat_penalty_rate: float             # Viability loss per minute overheated
    shock_penalty_per_spike: float       # Viability loss per G-force spike above limit


SKU_COLD_CHAIN_PROFILES: Dict[str, ColdChainProfile] = {
    "MED-HAPE-AMP": ColdChainProfile(
        sku="MED-HAPE-AMP",
        item_name="High-Altitude Pulmonary Edema (HAPE) Injection Ampoules",
        target_min_temp=2.0,
        target_max_temp=8.0,
        critical_freeze_temp=0.0,
        critical_heat_temp=15.0,
        max_freeze_exposure_seconds=1800.0,  # 30 mins
        max_heat_exposure_seconds=3600.0,    # 60 mins
        max_kinetic_g=4.0,                   # Fragile glass ampoules
        freeze_penalty_rate=0.75,            # Rapid crystallization loss
        heat_penalty_rate=0.50,
        shock_penalty_per_spike=8.0,
    ),
    "MED-BLOOD-PLASMA": ColdChainProfile(
        sku="MED-BLOOD-PLASMA",
        item_name="Whole Blood & Lyophilized Combat Plasma Packs",
        target_min_temp=-18.0,
        target_max_temp=-4.0,
        critical_freeze_temp=-40.0,
        critical_heat_temp=-2.0,
        max_freeze_exposure_seconds=7200.0,
        max_heat_exposure_seconds=900.0,     # 15 mins thaw threshold
        max_kinetic_g=3.5,
        freeze_penalty_rate=0.20,
        heat_penalty_rate=2.50,              # Thaw causes rapid hemolysis
        shock_penalty_per_spike=10.0,
    ),
    "BATT-DRONE-COLD": ColdChainProfile(
        sku="BATT-DRONE-COLD",
        item_name="High-Altitude Tactical Drone Li-Po Battery Packs",
        target_min_temp=-15.0,
        target_max_temp=25.0,
        critical_freeze_temp=-35.0,
        critical_heat_temp=45.0,
        max_freeze_exposure_seconds=3600.0,
        max_heat_exposure_seconds=1800.0,
        max_kinetic_g=6.0,
        freeze_penalty_rate=0.45,            # Capacity drop
        heat_penalty_rate=1.20,
        shock_penalty_per_spike=5.0,
    ),
    "MED-IFAK-TRAUMA": ColdChainProfile(
        sku="MED-IFAK-TRAUMA",
        item_name="Combat Trauma & Hypothermia Kit (Morphine/Saline)",
        target_min_temp=2.0,
        target_max_temp=25.0,
        critical_freeze_temp=-5.0,
        critical_heat_temp=35.0,
        max_freeze_exposure_seconds=3600.0,
        max_heat_exposure_seconds=7200.0,
        max_kinetic_g=5.0,
        freeze_penalty_rate=0.40,
        heat_penalty_rate=0.30,
        shock_penalty_per_spike=6.0,
    ),
}

DEFAULT_PROFILE = SKU_COLD_CHAIN_PROFILES["MED-HAPE-AMP"]


def get_profile_for_sku(sku: str) -> ColdChainProfile:
    """Resolve specific profile or return default medical profile."""
    for key, prof in SKU_COLD_CHAIN_PROFILES.items():
        if key.lower() in sku.lower():
            return prof
    return DEFAULT_PROFILE


# ---------------------------------------------------------------------------
# Telemetry Log & Degradation Evaluation
# ---------------------------------------------------------------------------
class ContainerTelemetryLog(BaseModel):
    container_id: str
    timestamp: float
    current_temp: float
    ambient_temp: float = -20.0
    g_force: float = 1.2
    humidity_pct: float = 45.0
    door_open: bool = False
    heater_active: bool = True


class DegradationAssessment(BaseModel):
    sku: str
    viability_score: int                   # 0 to 100
    condition_status: str                  # USABLE, NEEDS_INSPECTION, COMPROMISED_QUARANTINE
    quarantine_mandatory: bool
    breach_type: Optional[str] = None     # FREEZE_SHOCK, THERMAL_SPIKE, KINETIC_VIBRATION, MULTI_STRESS
    freeze_exposure_minutes: float
    heat_exposure_minutes: float
    peak_g_force: float
    peak_temp: float
    min_temp: float
    thermal_degree_hours: float
    explanation: str


def evaluate_telemetry_batch(
    sku: str,
    telemetry_logs: List[ContainerTelemetryLog],
    initial_viability: int = 100,
) -> DegradationAssessment:
    """
    Evaluates an environmental time-series batch against Arrhenius and kinetic tolerance curves.
    Calculates cumulative thermal breach degree-hours and G-force spikes.
    """
    profile = get_profile_for_sku(sku)

    if not telemetry_logs:
        return DegradationAssessment(
            sku=sku,
            viability_score=initial_viability,
            condition_status="USABLE",
            quarantine_mandatory=False,
            freeze_exposure_minutes=0.0,
            heat_exposure_minutes=0.0,
            peak_g_force=0.0,
            peak_temp=profile.target_max_temp,
            min_temp=profile.target_min_temp,
            thermal_degree_hours=0.0,
            explanation="Nominal conditions. No exposure anomalies recorded.",
        )

    # Sort chronologically
    sorted_logs = sorted(telemetry_logs, key=lambda x: x.timestamp)

    total_freeze_seconds: float = 0.0
    total_heat_seconds: float = 0.0
    thermal_degree_hours: float = 0.0
    shock_spikes_count: int = 0
    max_g: float = 0.0
    peak_temp = sorted_logs[0].current_temp
    min_temp = sorted_logs[0].current_temp

    freeze_penalty: float = 0.0
    heat_penalty: float = 0.0
    shock_penalty: float = 0.0

    for i in range(len(sorted_logs)):
        log = sorted_logs[i]
        t = log.current_temp
        g = log.g_force

        peak_temp = max(peak_temp, t)
        min_temp = min(min_temp, t)
        max_g = max(max_g, g)

        # Estimate delta t to previous sample (default 60s if single sample)
        if i > 0:
            dt = max(1.0, sorted_logs[i].timestamp - sorted_logs[i - 1].timestamp)
        else:
            dt = 60.0

        dt_hours = dt / 3600.0
        dt_minutes = dt / 60.0

        # Freeze check
        if t < profile.critical_freeze_temp:
            total_freeze_seconds += dt
            excess_freeze = profile.critical_freeze_temp - t
            thermal_degree_hours += excess_freeze * dt_hours
            freeze_penalty += excess_freeze * (profile.freeze_penalty_rate * dt_minutes)

        # Heat check
        elif t > profile.critical_heat_temp:
            total_heat_seconds += dt
            excess_heat = t - profile.critical_heat_temp
            thermal_degree_hours += excess_heat * dt_hours
            heat_penalty += excess_heat * (profile.heat_penalty_rate * dt_minutes)

        # Kinetic shock check
        if g > profile.max_kinetic_g:
            shock_spikes_count += 1
            excess_g = g - profile.max_kinetic_g
            shock_penalty += excess_g * profile.shock_penalty_per_spike

    total_penalty = freeze_penalty + heat_penalty + shock_penalty
    viability = max(0, min(100, int(round(initial_viability - total_penalty))))

    freeze_mins = round(total_freeze_seconds / 60.0, 1)
    heat_mins = round(total_heat_seconds / 60.0, 1)

    # Classify condition
    breach_types: List[str] = []
    if freeze_mins > (profile.max_freeze_exposure_seconds / 60.0) or freeze_penalty > 15:
        breach_types.append("FREEZE_SHOCK")
    if heat_mins > (profile.max_heat_exposure_seconds / 60.0) or heat_penalty > 15:
        breach_types.append("THERMAL_SPIKE")
    if shock_spikes_count > 0 and shock_penalty > 15:
        breach_types.append("KINETIC_VIBRATION")

    breach_type_str = "_AND_".join(breach_types) if breach_types else None

    quarantine_mandatory = viability < 70 or total_freeze_seconds > profile.max_freeze_exposure_seconds
    if quarantine_mandatory:
        condition_status = "COMPROMISED_QUARANTINE"
        explanation = (
            f"CRITICAL MEDICAL BREACH: Viability dropped to {viability}%. "
            f"Exposed to {min_temp:.1f}°C for {freeze_mins}m (Limit: {profile.max_freeze_exposure_seconds/60:.0f}m). "
            f"Proteins denatured/crystallized. Supplies quarantined to prevent combat casualty mortality."
        )
    elif viability < 90:
        condition_status = "NEEDS_INSPECTION"
        explanation = f"Moderate thermal or kinetic stress. Viability at {viability}%. Field triage inspection required."
    else:
        condition_status = "USABLE"
        explanation = f"Nominal conditions maintained. Viability at {viability}%. Safe for surgical combat administration."

    return DegradationAssessment(
        sku=sku,
        viability_score=viability,
        condition_status=condition_status,
        quarantine_mandatory=quarantine_mandatory,
        breach_type=breach_type_str,
        freeze_exposure_minutes=freeze_mins,
        heat_exposure_minutes=heat_mins,
        peak_g_force=round(max_g, 2),
        peak_temp=round(peak_temp, 2),
        min_temp=round(min_temp, 2),
        thermal_degree_hours=round(thermal_degree_hours, 2),
        explanation=explanation,
    )
