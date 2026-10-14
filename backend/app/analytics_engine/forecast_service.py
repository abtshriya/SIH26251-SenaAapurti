"""
Defense Logistics Forecast Service & Schema Adapter.
Aggregates Monte Carlo surge simulations with statutory WWR threshold evaluations,
formatting output strictly to the Angular 19 forecast view contract (forecast-view.component.ts).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.analytics_engine.combat_tempo_model import (
    CombatTempo,
    CombatTempoModel,
    TEMPO_MULTIPLIERS,
)
from app.analytics_engine.wwr_sentinel import (
    WWRSentinel,
    WWRRiskAssessment,
)

logger = logging.getLogger("sena_aapurti.analytics_engine.forecast_service")


class UnitProfile(BaseModel):
    unit_id: str
    canonical_name: str
    echelon: str
    troop_strength: int
    sector: str
    replenishment_lead_time_days: float


class SKUProfile(BaseModel):
    sku: str
    item_name: str
    supply_class: str
    unit_of_measure: str
    per_capita_daily_rate: float
    typical_stock_capacity: float


# Registry of Military Formations & Depots
KNOWN_UNITS: Dict[str, UnitProfile] = {
    "DEPOT-KGL": UnitProfile(
        unit_id="DEPOT-KGL",
        canonical_name="Kargil Brigade Logistics Hub (NODE-BSP-KARGIL)",
        echelon="BRIGADE_SUPPLY_POINT",
        troop_strength=2400,
        sector="DRAS-KARGIL",
        replenishment_lead_time_days=5.0,
    ),
    "DEPOT-LEH": UnitProfile(
        unit_id="DEPOT-LEH",
        canonical_name="14 Corps High-Altitude Logistics Base (NODE-DEPOT-LEH)",
        echelon="CORPS_DEPOT",
        troop_strength=5000,
        sector="CENTRAL-LADAKH",
        replenishment_lead_time_days=6.0,
    ),
    "DEPOT-DRAS": UnitProfile(
        unit_id="DEPOT-DRAS",
        canonical_name="Dras Sector Brigade Supply Point (NODE-BSP-DRAS)",
        echelon="BRIGADE_SUPPLY_POINT",
        troop_strength=1800,
        sector="DRAS-KARGIL",
        replenishment_lead_time_days=4.5,
    ),
    "DEPOT-DISKIT": UnitProfile(
        unit_id="DEPOT-DISKIT",
        canonical_name="Nubra Valley Staging Depot (NODE-BSP-DISKIT)",
        echelon="BRIGADE_SUPPLY_POINT",
        troop_strength=1650,
        sector="NUBRA-SIACHEN",
        replenishment_lead_time_days=5.5,
    ),
    "FOB-DBO": UnitProfile(
        unit_id="FOB-DBO",
        canonical_name="Daulat Beg Oldie Outpost (NODE-FOB-DBO)",
        echelon="FORWARD_OUTPOST",
        troop_strength=920,
        sector="SUB-SECTOR-NORTH",
        replenishment_lead_time_days=8.5,
    ),
    "FOB-SIACHEN": UnitProfile(
        unit_id="FOB-SIACHEN",
        canonical_name="Siachen Base Camp & Glacier Post (NODE-FOB-SIACHEN)",
        echelon="FORWARD_OUTPOST",
        troop_strength=850,
        sector="SIACHEN-GLACIER",
        replenishment_lead_time_days=7.0,
    ),
    "DEPOT-SGR": UnitProfile(
        unit_id="DEPOT-SGR",
        canonical_name="15 Corps Staging Depot Srinagar (NODE-DEPOT-SRINAGAR)",
        echelon="CORPS_DEPOT",
        troop_strength=4200,
        sector="KASHMIR-VALLEY",
        replenishment_lead_time_days=3.5,
    ),
    "DEPOT-UDH": UnitProfile(
        unit_id="DEPOT-UDH",
        canonical_name="Northern Command HQ Udhampur (NODE-HQ-UDHAMPUR)",
        echelon="COMMAND_HQ",
        troop_strength=6500,
        sector="JAMMU-UDHAMPUR",
        replenishment_lead_time_days=2.0,
    ),
}

# Unit alias mapper
UNIT_ALIASES: Dict[str, str] = {
    "DEPOT-KGL": "DEPOT-KGL",
    "NODE-BSP-KARGIL": "DEPOT-KGL",
    "KARGIL": "DEPOT-KGL",
    "DEPOT-LEH": "DEPOT-LEH",
    "NODE-DEPOT-LEH": "DEPOT-LEH",
    "LEH": "DEPOT-LEH",
    "DEPOT-DRAS": "DEPOT-DRAS",
    "NODE-BSP-DRAS": "DEPOT-DRAS",
    "DRAS": "DEPOT-DRAS",
    "DEPOT-DISKIT": "DEPOT-DISKIT",
    "NODE-BSP-DISKIT": "DEPOT-DISKIT",
    "DISKIT": "DEPOT-DISKIT",
    "FOB-DBO": "FOB-DBO",
    "NODE-FOB-DBO": "FOB-DBO",
    "DBO": "FOB-DBO",
    "FOB-SIACHEN": "FOB-SIACHEN",
    "NODE-FOB-SIACHEN": "FOB-SIACHEN",
    "SIACHEN": "FOB-SIACHEN",
    "DEPOT-SGR": "DEPOT-SGR",
    "NODE-DEPOT-SRINAGAR": "DEPOT-SGR",
    "SRINAGAR": "DEPOT-SGR",
    "DEPOT-UDH": "DEPOT-UDH",
    "NODE-HQ-UDHAMPUR": "DEPOT-UDH",
    "UDHAMPUR": "DEPOT-UDH",
}

# Registry of Supply Class SKUs
KNOWN_SKUS: Dict[str, SKUProfile] = {
    "AMMO-7.62MM": SKUProfile(
        sku="AMMO-7.62MM",
        item_name="7.62x51mm NATO Ball Ammunition Crate",
        supply_class="CLASS_V",
        unit_of_measure="CRATES",
        per_capita_daily_rate=0.183,  # Scales to ~440 crates/day for 2,400 troops
        typical_stock_capacity=12500.0,
    ),
    "AMMO-155MM": SKUProfile(
        sku="AMMO-155MM",
        item_name="155mm Bofors Extended-Range HE Projectile",
        supply_class="CLASS_V",
        unit_of_measure="ROUNDS",
        per_capita_daily_rate=0.045,
        typical_stock_capacity=4500.0,
    ),
    "AMMO-INSAS": SKUProfile(
        sku="AMMO-INSAS",
        item_name="5.56x45mm INSAS Rifle Ammunition Case",
        supply_class="CLASS_V",
        unit_of_measure="CRATES",
        per_capita_daily_rate=0.080,
        typical_stock_capacity=10000.0,
    ),
    "FUEL-DIESEL": SKUProfile(
        sku="FUEL-DIESEL",
        item_name="Arctic Grade Low-Temp Diesel (-35C Pour Point)",
        supply_class="CLASS_III",
        unit_of_measure="LITERS",
        per_capita_daily_rate=3.80,
        typical_stock_capacity=65000.0,
    ),
    "FUEL-SKO": SKUProfile(
        sku="FUEL-SKO",
        item_name="Superior Kerosene Oil (Heating Bukhari)",
        supply_class="CLASS_III",
        unit_of_measure="LITERS",
        per_capita_daily_rate=2.90,
        typical_stock_capacity=45000.0,
    ),
    "FUEL-ATF": SKUProfile(
        sku="FUEL-ATF",
        item_name="Aviation Turbine Fuel JP-8",
        supply_class="CLASS_III",
        unit_of_measure="LITERS",
        per_capita_daily_rate=2.10,
        typical_stock_capacity=35000.0,
    ),
    "RATIONS-MRE": SKUProfile(
        sku="RATIONS-MRE",
        item_name="Special Winter Survival MRE (4500 kcal)",
        supply_class="CLASS_I",
        unit_of_measure="PACKS",
        per_capita_daily_rate=1.20,
        typical_stock_capacity=22000.0,
    ),
    "MED-PLASMA": SKUProfile(
        sku="MED-PLASMA",
        item_name="Lyophilized Blood Plasma Trauma Pack",
        supply_class="CLASS_VIII",
        unit_of_measure="KITS",
        per_capita_daily_rate=0.015,
        typical_stock_capacity=2500.0,
    ),
}

# SKU alias mapper
SKU_ALIASES: Dict[str, str] = {
    "AMMO-7.62MM": "AMMO-7.62MM",
    "CL5-762-NATO-BALL": "AMMO-7.62MM",
    "7.62MM": "AMMO-7.62MM",
    "AMMO-155MM": "AMMO-155MM",
    "CL5-155MM-BOFORS-HE": "AMMO-155MM",
    "155MM": "AMMO-155MM",
    "AMMO-INSAS": "AMMO-INSAS",
    "CL5-556-INSAS-BALL": "AMMO-INSAS",
    "INSAS": "AMMO-INSAS",
    "FUEL-DIESEL": "FUEL-DIESEL",
    "CL3-DHPP-W-ARCTIC": "FUEL-DIESEL",
    "DIESEL": "FUEL-DIESEL",
    "FUEL-SKO": "FUEL-SKO",
    "CL3-SKO-50-GLACIER": "FUEL-SKO",
    "SKO": "FUEL-SKO",
    "FUEL-ATF": "FUEL-ATF",
    "CL3-ATF-JP8-HIGH": "FUEL-ATF",
    "ATF": "FUEL-ATF",
    "RATIONS-MRE": "RATIONS-MRE",
    "CL1-MRE-WINTER-4500": "RATIONS-MRE",
    "MRE": "RATIONS-MRE",
    "MED-PLASMA": "MED-PLASMA",
    "CL8-PLASMA-TRAUMA-CC": "MED-PLASMA",
    "PLASMA": "MED-PLASMA",
}


class ForecastService:
    """
    Core Forecast & Stress-Testing Service matching the Angular UI contract.
    """

    def __init__(self) -> None:
        self.simulator = CombatTempoModel(iterations=1000, seed=2026)

    def resolve_unit(self, unit_id: str) -> UnitProfile:
        clean = unit_id.strip().upper()
        target_id = UNIT_ALIASES.get(clean, clean)
        if target_id in KNOWN_UNITS:
            return KNOWN_UNITS[target_id]
        # Return sensible fallback unit
        return UnitProfile(
            unit_id=unit_id,
            canonical_name=f"Tactical Unit {unit_id}",
            echelon="BRIGADE_SUPPLY_POINT",
            troop_strength=2400,
            sector="NORTHERN-THEATER",
            replenishment_lead_time_days=5.0,
        )

    def resolve_sku(self, sku: str) -> SKUProfile:
        clean = sku.strip().upper()
        target_sku = SKU_ALIASES.get(clean, clean)
        if target_sku in KNOWN_SKUS:
            return KNOWN_SKUS[target_sku]
        # Fallback profile
        return SKUProfile(
            sku=sku,
            item_name=f"Tactical Stores SKU {sku}",
            supply_class="CLASS_V",
            unit_of_measure="UNITS",
            per_capita_daily_rate=0.15,
            typical_stock_capacity=10000.0,
        )

    def generate_forecast(
        self,
        unit_id: str = "DEPOT-KGL",
        sku: str = "AMMO-7.62MM",
        tempo: str = "PEACETIME",
        simulated_days: int = 14,
        override_current_stock: Optional[float] = None,
        override_capacity: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Produces the forecast payload strictly satisfying the Angular forecast-view contract:
        {
          "unit_id": "DEPOT-KGL",
          "sku": "AMMO-7.62MM",
          "tempo": "TACTICAL_CONFLICT",
          "current_stock": 12500,
          "wwr_threshold": 4375,
          "days_of_supply": 4.2,
          "wwr_breach_expected_in_days": 2.8,
          "replenishment_recommended": 15000,
          "preemptive_alert": true,
          "projection_series": [
            {"day": 1, "predicted_stock": 9800, "lower_bound": 9200, "upper_bound": 10400},
            ...
          ]
        }
        """
        unit = self.resolve_unit(unit_id)
        sku_profile = self.resolve_sku(sku)

        # Validate tempo enum
        clean_tempo_str = tempo.strip().upper()
        try:
            combat_tempo = CombatTempo(clean_tempo_str)
        except ValueError:
            combat_tempo = CombatTempo.PEACETIME

        capacity = override_capacity or sku_profile.typical_stock_capacity
        current_stock = override_current_stock or capacity

        # Baseline peacetime consumption = troop_strength * per_capita_daily_rate
        # For DEPOT-KGL + AMMO-7.62MM: 2,400 * 0.1833 = ~440 crates/day
        baseline_daily_consumption = round(unit.troop_strength * sku_profile.per_capita_daily_rate, 1)

        # Execute Monte Carlo surge simulation
        sim_result = self.simulator.simulate_depletion(
            current_stock=current_stock,
            baseline_daily_consumption=baseline_daily_consumption,
            supply_class=sku_profile.supply_class,
            tempo=combat_tempo,
            horizon_days=simulated_days,
        )

        # Evaluate statutory WWR risk
        risk = WWRSentinel.evaluate_wwr_risk(
            current_stock=current_stock,
            authorized_capacity=capacity,
            projection_series=sim_result.projection_series,
            lead_time_days=unit.replenishment_lead_time_days,
            daily_burn_rate=sim_result.daily_burn_mean,
        )

        # Build response strictly matching Angular forecast-view schema
        response: Dict[str, Any] = {
            "unit_id": unit.unit_id,
            "sku": sku_profile.sku,
            "tempo": combat_tempo.value,
            "current_stock": round(current_stock, 1) if current_stock % 1 != 0 else int(current_stock),
            "wwr_threshold": round(risk.wwr_threshold, 1) if risk.wwr_threshold % 1 != 0 else int(risk.wwr_threshold),
            "days_of_supply": risk.days_of_supply,
            "wwr_breach_expected_in_days": risk.wwr_breach_expected_in_days,
            "replenishment_recommended": round(risk.replenishment_recommended, 1) if risk.replenishment_recommended % 1 != 0 else int(risk.replenishment_recommended),
            "preemptive_alert": risk.preemptive_alert,
            "projection_series": [
                {
                    "day": pt.day,
                    "predicted_stock": round(pt.predicted_stock, 1) if pt.predicted_stock % 1 != 0 else int(pt.predicted_stock),
                    "lower_bound": round(pt.lower_bound, 1) if pt.lower_bound % 1 != 0 else int(pt.lower_bound),
                    "upper_bound": round(pt.upper_bound, 1) if pt.upper_bound % 1 != 0 else int(pt.upper_bound),
                }
                for pt in sim_result.projection_series
            ],
            # Extended metadata for UI drill-downs and audit logs
            "metadata": {
                "unit_name": unit.canonical_name,
                "sku_name": sku_profile.item_name,
                "supply_class": sku_profile.supply_class,
                "unit_of_measure": sku_profile.unit_of_measure,
                "authorized_capacity": capacity,
                "echelon_status": risk.current_echelon_band,
                "tactical_action_code": risk.tactical_action_code,
                "replenishment_lead_time_days": unit.replenishment_lead_time_days,
                "daily_burn_rate_mean": sim_result.daily_burn_mean,
                "surge_multiplier": sim_result.multiplier_applied,
                "commander_advisory": risk.commander_advisory,
            },
        }

        return response


# Process-wide singleton
_forecast_service_instance: Optional[ForecastService] = None


def get_forecast_service() -> ForecastService:
    global _forecast_service_instance
    if _forecast_service_instance is None:
        _forecast_service_instance = ForecastService()
    return _forecast_service_instance
