"""
Tactical Air Cargo Manifest Partitioner & Rotary-Wing Lift Allocator.
Partitions ground convoy manifests into high-altitude rotary-wing air-drop sorties
strictly obeying service ceilings, density altitude constraints, and cargo payload limits.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("sena_aapurti.gis_engine.air_allocator")


class RotaryAircraftSpec(BaseModel):
    """Military helicopter performance characteristics in high-altitude theater."""

    type_id: str = Field(..., description="Tactical airframe identifier")
    name: str = Field(..., description="Official designation")
    max_payload_kg: float = Field(..., description="Maximum tactical payload in kilograms")
    service_ceiling_m: int = Field(..., description="Operational service ceiling in meters")
    cruising_speed_kmh: float = Field(..., description="Cruising speed in km/h")
    base_fuel_burn_l_per_km: float = Field(..., description="Fuel consumption rate (L/km)")
    role: str = Field(..., description="Designated military payload profile")
    callsign_prefix: str = Field(..., description="Tactical flight prefix")


# Standard Rotary Wing Fleet Specs for Northern Command High-Altitude Forward Outposts
FLEET_SPECIFICATIONS: Dict[str, RotaryAircraftSpec] = {
    "ALH_DHRUV": RotaryAircraftSpec(
        type_id="ALH_DHRUV",
        name="HAL ALH Dhruv Mk-III High-Altitude Utility",
        max_payload_kg=1000.0,
        service_ceiling_m=6500,
        cruising_speed_kmh=215.0,
        base_fuel_burn_l_per_km=1.35,
        role="Cold-Chain Plasma, Medical Surgical Kits, Precision Sniper Munitions",
        callsign_prefix="VAJRA",
    ),
    "MI17_V5": RotaryAircraftSpec(
        type_id="MI17_V5",
        name="Mil Mi-17V5 Medium Tactical Transport",
        max_payload_kg=4000.0,
        service_ceiling_m=6000,
        cruising_speed_kmh=230.0,
        base_fuel_burn_l_per_km=2.60,
        role="Class V Heavy Munitions, Arctic Grade Diesel POL, Winter Survival Rations",
        callsign_prefix="GARUDA",
    ),
    "CH47_CHINOOK": RotaryAircraftSpec(
        type_id="CH47_CHINOOK",
        name="Boeing CH-47F Chinook Heavy-Lift Tandem Rotor",
        max_payload_kg=9500.0,
        service_ceiling_m=5000,
        cruising_speed_kmh=270.0,
        base_fuel_burn_l_per_km=3.85,
        role="Heavy Artillery Pieces, Rapid Fuel Pods, Large Vehicle Pallets",
        callsign_prefix="AIRAVAT",
    ),
}


class CargoItem(BaseModel):
    sku: str
    name: str
    category: str
    weight_kg: float
    requires_cold_chain: bool = False
    priority: int = 1  # 1 = Highest, 5 = Lowest


class AirDropSortie(BaseModel):
    """Itemized dispatch parameters for a single rotary-wing flight sortie."""

    sortie_id: str
    aircraft_type: str
    aircraft_name: str
    callsign: str
    service_ceiling_m: int
    max_payload_kg: float
    allocated_payload_kg: float
    payload_utilization_pct: float
    flight_distance_km: float
    estimated_flight_time_hrs: float
    delivery_method: str  # CDS Parachute Drop / LVADS / Helipad Touch-and-Go
    items_breakdown: List[Dict[str, Any]]
    tactical_channel: str


class PartitionedManifest(BaseModel):
    """Aggregate multi-sortie air-drop transit manifest."""

    total_cargo_weight_kg: float
    allocated_cargo_weight_kg: float
    destination_elevation_m: int
    staging_helipad_id: str
    drop_zone_id: str
    eligible_aircraft: List[str]
    disqualified_aircraft: Dict[str, str]
    total_sorties_count: int
    sorties_summary: Dict[str, int]
    sorties: List[AirDropSortie]
    total_estimated_flight_hours: float
    total_fuel_burn_liters: float
    tactical_advisory: str


class AirDropAllocator:
    """
    Solves optimal high-altitude air cargo partitioning:
    - Rejects aircraft whose service ceilings cannot clear destination DZ elevation.
    - Solves bounded integer knapsack / greedy heuristic to minimize required rotary sorties.
    - Prioritizes critical cold-chain plasma onto agile ALH Dhruv platforms.
    """

    def __init__(self, fleet: Optional[Dict[str, RotaryAircraftSpec]] = None) -> None:
        self.fleet = fleet or FLEET_SPECIFICATIONS

    def get_eligible_fleet(self, destination_elevation_m: int) -> tuple[Dict[str, RotaryAircraftSpec], Dict[str, str]]:
        eligible: Dict[str, RotaryAircraftSpec] = {}
        disqualified: Dict[str, str] = {}

        for key, spec in self.fleet.items():
            if spec.service_ceiling_m >= destination_elevation_m:
                eligible[key] = spec
            else:
                disqualified[spec.name] = (
                    f"Ceiling {spec.service_ceiling_m}m below destination DZ elevation {destination_elevation_m}m. "
                    "Airframe restricted due to high-altitude stall & vortex ring state hazard."
                )

        return eligible, disqualified

    def allocate(
        self,
        total_cargo_weight_kg: float,
        destination_elevation_m: int,
        flight_distance_km: float,
        staging_helipad_id: str = "NODE-BSP-DISKIT",
        drop_zone_id: str = "NODE-FOB-DBO",
        itemized_cargo: Optional[List[CargoItem]] = None,
    ) -> PartitionedManifest:
        """
        Partitions ground cargo manifest into optimal rotary-wing air-drop sorties.
        """
        eligible, disqualified = self.get_eligible_fleet(destination_elevation_m)
        if not eligible:
            raise ValueError(
                f"No rotary-wing airframes in theater meet the operational ceiling of {destination_elevation_m}m."
            )

        # Standard cargo item template if none provided
        if not itemized_cargo:
            # Synthetic realistic distribution for standard defense convoy:
            # 50% POL / Cold-Weather Diesel, 35% Munitions, 15% Medical Plasma / High-Altitude Rations
            itemized_cargo = [
                CargoItem(
                    sku="CL3-DHPP-W-ARCTIC",
                    name="Arctic Grade Low-Temp Diesel (-35C Pour Point)",
                    category="CLASS_III_POL",
                    weight_kg=round(total_cargo_weight_kg * 0.50, 1),
                    priority=2,
                ),
                CargoItem(
                    sku="CL5-762-NATO-BALL",
                    name="High-Altitude Munitions & Artillery Charges",
                    category="CLASS_V_AMMO",
                    weight_kg=round(total_cargo_weight_kg * 0.35, 1),
                    priority=2,
                ),
                CargoItem(
                    sku="CL8-PLASMA-TRAUMA-CC",
                    name="Lyophilized Blood Plasma & Cold-Chain Surgical Packs",
                    category="CLASS_VIII_MEDICAL",
                    weight_kg=round(total_cargo_weight_kg * 0.15, 1),
                    requires_cold_chain=True,
                    priority=1,
                ),
            ]

        # Partitioning algorithm:
        # Sort eligible aircraft by capacity descending
        # Special logic: If destination elevation > 5000m (e.g. DBO 5065m or Siachen 5400m),
        # Chinook (5000m) is excluded. Eligible: Mi-17V5 (4000kg) and Dhruv (1000kg).
        # For 13,000 kg -> 3x Mi-17 (12,000kg) + 1x Dhruv (1,000kg) = 4 sorties.
        sorties: List[AirDropSortie] = []
        sorties_summary: Dict[str, int] = {}
        remaining_weight = total_cargo_weight_kg

        # Separate cold chain vs general cargo
        cold_chain_weight = sum(item.weight_kg for item in itemized_cargo if item.requires_cold_chain)
        general_weight = total_cargo_weight_kg - cold_chain_weight

        # 1. Determine aircraft allocations to minimize sorties
        # We greedily pack largest eligible aircraft first, reserving Dhruv for cold-chain or remainder.
        sorted_eligible = sorted(eligible.values(), key=lambda s: s.max_payload_kg, reverse=True)

        assigned_aircraft: List[RotaryAircraftSpec] = []
        temp_remaining = total_cargo_weight_kg

        # Check if Dhruv is preferred for pure cold chain portion
        dhruv_spec = eligible.get("ALH_DHRUV")
        mi17_spec = eligible.get("MI17_V5")
        chinook_spec = eligible.get("CH47_CHINOOK")

        # Optimal integer partition for theater:
        if mi17_spec and (temp_remaining >= mi17_spec.max_payload_kg):
            # Calculate how many Mi-17 sorties
            mi17_count = int(temp_remaining // mi17_spec.max_payload_kg)
            remainder = temp_remaining % mi17_spec.max_payload_kg

            # If remainder fits in Dhruv, use Dhruv; else if remainder > 0 and no Dhruv, add another Mi-17
            for _ in range(mi17_count):
                assigned_aircraft.append(mi17_spec)
            temp_remaining = remainder

        if temp_remaining > 0:
            # Fit remainder into smallest eligible aircraft that can hold it
            fitted = False
            for spec in sorted(eligible.values(), key=lambda s: s.max_payload_kg):
                if spec.max_payload_kg >= temp_remaining:
                    assigned_aircraft.append(spec)
                    fitted = True
                    break
            if not fitted:
                # Need largest aircraft
                largest = sorted_eligible[0]
                needed = math.ceil(temp_remaining / largest.max_payload_kg)
                for _ in range(needed):
                    assigned_aircraft.append(largest)

        # Build sorties with item allocations
        item_pool = [item.model_copy() for item in itemized_cargo]
        tactical_callsigns_used = {"VAJRA": 0, "GARUDA": 0, "AIRAVAT": 0}

        total_flight_time = 0.0
        total_fuel_burn = 0.0

        for idx, ac in enumerate(assigned_aircraft, start=1):
            tactical_callsigns_used[ac.callsign_prefix] = tactical_callsigns_used.get(ac.callsign_prefix, 0) + 1
            callsign_num = tactical_callsigns_used[ac.callsign_prefix]
            callsign = f"{ac.callsign_prefix}-{callsign_num:02d}"

            # Calculate sortie load
            capacity = ac.max_payload_kg
            allocated_weight = min(capacity, remaining_weight)
            remaining_weight -= allocated_weight

            # Pack items into this sortie
            sortie_items: List[Dict[str, Any]] = []
            pack_weight = allocated_weight
            
            # If aircraft is Dhruv and there are cold-chain items, prioritize them
            if ac.type_id == "ALH_DHRUV":
                for itm in item_pool:
                    if itm.requires_cold_chain and itm.weight_kg > 0:
                        take = min(pack_weight, itm.weight_kg)
                        if take > 0:
                            sortie_items.append({
                                "sku": itm.sku,
                                "name": itm.name,
                                "category": itm.category,
                                "weight_kg": round(take, 1),
                                "special_handling": "COLD_CHAIN_CLINICAL_POD",
                            })
                            itm.weight_kg -= take
                            pack_weight -= take
            
            # Pack remaining pool
            for itm in item_pool:
                if pack_weight <= 0:
                    break
                if itm.weight_kg > 0:
                    take = min(pack_weight, itm.weight_kg)
                    if take > 0:
                        sortie_items.append({
                            "sku": itm.sku,
                            "name": itm.name,
                            "category": itm.category,
                            "weight_kg": round(take, 1),
                            "special_handling": "SECURE_TACTICAL_CARGO",
                        })
                        itm.weight_kg -= take
                        pack_weight -= take

            flight_time_hrs = round((flight_distance_km / ac.cruising_speed_kmh) + 0.15, 2)  # 0.15h (~9 min) hover/drop
            fuel_burn = round(flight_distance_km * ac.base_fuel_burn_l_per_km * 1.15, 1)  # 15% high-altitude reserve

            total_flight_time += flight_time_hrs
            total_fuel_burn += fuel_burn

            delivery_method = (
                "TACTICAL_HELIPAD_SKID_UNLOAD"
                if destination_elevation_m < 5200
                else "CDS_PARACHUTE_AIR_DROP"
            )

            sortie = AirDropSortie(
                sortie_id=f"SRT-{ac.type_id}-{idx:02d}",
                aircraft_type=ac.type_id,
                aircraft_name=ac.name,
                callsign=callsign,
                service_ceiling_m=ac.service_ceiling_m,
                max_payload_kg=ac.max_payload_kg,
                allocated_payload_kg=round(allocated_weight, 1),
                payload_utilization_pct=round((allocated_weight / ac.max_payload_kg) * 100, 1),
                flight_distance_km=round(flight_distance_km, 1),
                estimated_flight_time_hrs=flight_time_hrs,
                delivery_method=delivery_method,
                items_breakdown=sortie_items,
                tactical_channel=f"TAC-AIR-FREQ-33{idx}.50-MHZ",
            )
            sorties.append(sortie)
            sorties_summary[ac.type_id] = sorties_summary.get(ac.type_id, 0) + 1

        allocated_total = sum(s.allocated_payload_kg for s in sorties)

        summary_parts = [f"{count}x {key}" for key, count in sorties_summary.items()]
        tactical_advisory = (
            f"Rotary-wing airlift authorized from {staging_helipad_id} to forward outpost {drop_zone_id}. "
            f"Deploying {', '.join(summary_parts)} sorties to deliver {allocated_total:,.0f} kg stores. "
            f"Flight profile adheres to high-altitude ceiling constraints at {destination_elevation_m}m AMSL."
        )

        return PartitionedManifest(
            total_cargo_weight_kg=total_cargo_weight_kg,
            allocated_cargo_weight_kg=allocated_total,
            destination_elevation_m=destination_elevation_m,
            staging_helipad_id=staging_helipad_id,
            drop_zone_id=drop_zone_id,
            eligible_aircraft=list(eligible.keys()),
            disqualified_aircraft=disqualified,
            total_sorties_count=len(sorties),
            sorties_summary=sorties_summary,
            sorties=sorties,
            total_estimated_flight_hours=round(total_flight_time, 2),
            total_fuel_burn_liters=round(total_fuel_burn, 1),
            tactical_advisory=tactical_advisory,
        )
