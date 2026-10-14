"""
Military Ontology & Domain Taxonomy for Sena Aapurti (SIH26251).
Models Northern Command / Ladakh Theatre logistics:
  - Geographies & Echelon Nodes (Udhampur HQ -> Corps/Div -> Brigade -> Forward Outposts)
  - Geospatial Supply Corridors & High-Altitude Mountain Passes (Zoji La, Khardung La, Chang La)
  - Supply Classes (Class I Rations, Class III POL, Class V Munitions, Class VIII Medical Cold-Chain)
  - Multi-Modal Transport Fleet Assets (Heavy 4x4/6x6 Trucks, LSVs, Rotary-Wing Airlift)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class TheatreNodeSpec:
    node_id: str
    name: str
    echelon: str  # COMMAND_HQ | CORPS_DEPOT | BRIGADE_SUPPLY_POINT | FORWARD_OUTPOST
    sector: str
    elevation_m: int
    lat: float
    lon: float
    storage_capacity_tons: float
    baseline_troop_strength: int
    winter_cutoff_prone: bool


@dataclass(frozen=True)
class SupplyCorridorSpec:
    route_id: str
    origin_id: str
    destination_id: str
    distance_km: float
    terrain_type: str  # PAVED_HIGHWAY | HIGH_ALTITUDE_MOUNTAIN | GLACIATED_TRACK | AIR_CORRIDOR
    seasonal_pass_name: Optional[str]
    pass_elevation_m: int
    default_lead_time_hrs: float
    avalanche_vulnerability: float  # 0.0 to 1.0
    waypoints: List[Tuple[float, float]]  # [(lon, lat), ...] for PostGIS LineString(4326)


@dataclass(frozen=True)
class SupplyClassSKUSpec:
    sku: str
    item_name: str
    supply_class: str  # CLASS_I | CLASS_III | CLASS_V | CLASS_VIII
    category: str
    unit_of_measure: str
    unit_weight_kg: float
    per_capita_daily_rate: float  # Baseline consumption per soldier per day
    critical_safety_threshold: int
    shelf_life_days: int
    requires_cold_chain: bool
    min_temp_c: float
    max_temp_c: float


@dataclass(frozen=True)
class TransportFleetSpec:
    vehicle_type: str
    designation: str
    modality: str  # HEAVY_SURFACE | LIGHT_MOUNTAIN | ROTARY_WING_AIR
    payload_capacity_tons: float
    cruising_speed_kmh: float
    base_fuel_consumption_l_per_km: float
    uphill_snow_gradient_penalty: float  # Multiplier on fuel burn & speed reduction
    max_operating_altitude_m: int
    all_weather_capable: bool


# -----------------------------------------------------------------------------
# 1. NORTHERN COMMAND / LADAKH THEATRE NODES (EPSG:4326)
# -----------------------------------------------------------------------------
THEATRE_NODES: List[TheatreNodeSpec] = [
    TheatreNodeSpec(
        node_id="NODE-HQ-UDHAMPUR",
        name="Northern Command HQ & Theater Logistics Base (Udhampur)",
        echelon="COMMAND_HQ",
        sector="JAMMU-UDHAMPUR",
        elevation_m=756,
        lat=32.9160,
        lon=75.1416,
        storage_capacity_tons=25000.0,
        baseline_troop_strength=6500,
        winter_cutoff_prone=False,
    ),
    TheatreNodeSpec(
        node_id="NODE-DEPOT-SRINAGAR",
        name="15 Corps Staging Logistics Depot (Srinagar)",
        echelon="CORPS_DEPOT",
        sector="KASHMIR-VALLEY",
        elevation_m=1585,
        lat=34.0837,
        lon=74.7973,
        storage_capacity_tons=14000.0,
        baseline_troop_strength=4200,
        winter_cutoff_prone=False,
    ),
    TheatreNodeSpec(
        node_id="NODE-DEPOT-LEH",
        name="14 Corps High-Altitude Logistics Base (Leh)",
        echelon="CORPS_DEPOT",
        sector="CENTRAL-LADAKH",
        elevation_m=3524,
        lat=34.1526,
        lon=77.5771,
        storage_capacity_tons=18500.0,
        baseline_troop_strength=5000,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-BSP-DRAS",
        name="Dras Sector Brigade Supply Point",
        echelon="BRIGADE_SUPPLY_POINT",
        sector="DRAS-KARGIL",
        elevation_m=3300,
        lat=34.4275,
        lon=75.7556,
        storage_capacity_tons=3800.0,
        baseline_troop_strength=1800,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-BSP-KARGIL",
        name="Kargil Brigade Logistics Hub",
        echelon="BRIGADE_SUPPLY_POINT",
        sector="DRAS-KARGIL",
        elevation_m=2676,
        lat=34.5539,
        lon=76.1349,
        storage_capacity_tons=5200.0,
        baseline_troop_strength=2400,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-BSP-DISKIT",
        name="Nubra Valley Brigade Supply Point (Diskit)",
        echelon="BRIGADE_SUPPLY_POINT",
        sector="NUBRA-SIACHEN",
        elevation_m=3144,
        lat=34.5447,
        lon=77.5553,
        storage_capacity_tons=4100.0,
        baseline_troop_strength=1650,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-FOB-SIACHEN",
        name="Siachen Base Camp & Glacier Staging Post",
        echelon="FORWARD_OUTPOST",
        sector="SIACHEN-GLACIER",
        elevation_m=5400,
        lat=35.4215,
        lon=77.1025,
        storage_capacity_tons=1200.0,
        baseline_troop_strength=850,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-FOB-DBO",
        name="Daulat Beg Oldie (DBO) Sub-Sector North Outpost",
        echelon="FORWARD_OUTPOST",
        sector="SUB-SECTOR-NORTH",
        elevation_m=5065,
        lat=35.3964,
        lon=77.9258,
        storage_capacity_tons=1500.0,
        baseline_troop_strength=920,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-FOB-GALWAN",
        name="Galwan Valley Forward Tactical Staging Point",
        echelon="FORWARD_OUTPOST",
        sector="EASTERN-LADAKH",
        elevation_m=4750,
        lat=34.7611,
        lon=78.2039,
        storage_capacity_tons=980.0,
        baseline_troop_strength=780,
        winter_cutoff_prone=True,
    ),
    TheatreNodeSpec(
        node_id="NODE-FOB-NYOMA",
        name="Nyoma Advanced Landing Ground & Forward Base",
        echelon="FORWARD_OUTPOST",
        sector="SOUTHEAST-LADAKH",
        elevation_m=4180,
        lat=33.2044,
        lon=78.6478,
        storage_capacity_tons=2100.0,
        baseline_troop_strength=1100,
        winter_cutoff_prone=True,
    ),
]

NODE_MAP: Dict[str, TheatreNodeSpec] = {n.node_id: n for n in THEATRE_NODES}


# -----------------------------------------------------------------------------
# 2. GEOSPATIAL SUPPLY CORRIDORS & MOUNTAIN PASSES (LineString 4326)
# -----------------------------------------------------------------------------
SUPPLY_CORRIDORS: List[SupplyCorridorSpec] = [
    SupplyCorridorSpec(
        route_id="RTE-NH44-UDH-SGR",
        origin_id="NODE-HQ-UDHAMPUR",
        destination_id="NODE-DEPOT-SRINAGAR",
        distance_km=205.0,
        terrain_type="PAVED_HIGHWAY",
        seasonal_pass_name="Banihal Pass",
        pass_elevation_m=2832,
        default_lead_time_hrs=6.5,
        avalanche_vulnerability=0.30,
        waypoints=[(75.1416, 32.9160), (75.2010, 33.4350), (74.7973, 34.0837)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-NH1-SGR-DRAS",
        origin_id="NODE-DEPOT-SRINAGAR",
        destination_id="NODE-BSP-DRAS",
        distance_km=142.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Zoji La",
        pass_elevation_m=3528,
        default_lead_time_hrs=7.0,
        avalanche_vulnerability=0.88,
        waypoints=[(74.7973, 34.0837), (75.4697, 34.2785), (75.7556, 34.4275)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-NH1-DRAS-KGL",
        origin_id="NODE-BSP-DRAS",
        destination_id="NODE-BSP-KARGIL",
        distance_km=62.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Kharbu Axis",
        pass_elevation_m=2980,
        default_lead_time_hrs=2.5,
        avalanche_vulnerability=0.45,
        waypoints=[(75.7556, 34.4275), (75.9500, 34.4800), (76.1349, 34.5539)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-NH1-KGL-LEH",
        origin_id="NODE-BSP-KARGIL",
        destination_id="NODE-DEPOT-LEH",
        distance_km=216.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Fotu La",
        pass_elevation_m=4108,
        default_lead_time_hrs=8.5,
        avalanche_vulnerability=0.52,
        waypoints=[(76.1349, 34.5539), (76.7911, 34.2892), (77.5771, 34.1526)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-LEH-DISKIT",
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-BSP-DISKIT",
        distance_km=118.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Khardung La",
        pass_elevation_m=5359,
        default_lead_time_hrs=6.0,
        avalanche_vulnerability=0.92,
        waypoints=[(77.5771, 34.1526), (77.6047, 34.2787), (77.5553, 34.5447)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-DISKIT-SIACHEN",
        origin_id="NODE-BSP-DISKIT",
        destination_id="NODE-FOB-SIACHEN",
        distance_km=112.0,
        terrain_type="GLACIATED_TRACK",
        seasonal_pass_name="Nubra Glacier Axis",
        pass_elevation_m=5400,
        default_lead_time_hrs=7.5,
        avalanche_vulnerability=0.95,
        waypoints=[(77.5553, 34.5447), (77.3100, 34.9500), (77.1025, 35.4215)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-DSDBO-LEH-DBO",
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-FOB-DBO",
        distance_km=255.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Chang La & Shyok Axis",
        pass_elevation_m=5360,
        default_lead_time_hrs=12.5,
        avalanche_vulnerability=0.85,
        waypoints=[(77.5771, 34.1526), (77.9308, 34.0475), (78.1200, 34.7800), (77.9258, 35.3964)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-SHYOK-GALWAN",
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-FOB-GALWAN",
        distance_km=210.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Chang La",
        pass_elevation_m=5360,
        default_lead_time_hrs=10.5,
        avalanche_vulnerability=0.86,
        waypoints=[(77.5771, 34.1526), (77.9308, 34.0475), (78.2039, 34.7611)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-INDUS-LEH-NYOMA",
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-FOB-NYOMA",
        distance_km=185.0,
        terrain_type="HIGH_ALTITUDE_MOUNTAIN",
        seasonal_pass_name="Upshi-Mahe Indus Corridor",
        pass_elevation_m=4200,
        default_lead_time_hrs=6.5,
        avalanche_vulnerability=0.40,
        waypoints=[(77.5771, 34.1526), (78.0500, 33.6500), (78.6478, 33.2044)],
    ),
    SupplyCorridorSpec(
        route_id="RTE-AIR-LEH-SIACHEN",
        origin_id="NODE-DEPOT-LEH",
        destination_id="NODE-FOB-SIACHEN",
        distance_km=145.0,
        terrain_type="AIR_CORRIDOR",
        seasonal_pass_name="Siachen Rotary Airbridge",
        pass_elevation_m=6100,
        default_lead_time_hrs=1.2,
        avalanche_vulnerability=0.15,
        waypoints=[(77.5771, 34.1526), (77.1025, 35.4215)],
    ),
]


# -----------------------------------------------------------------------------
# 3. SUPPLY CLASSES & MILITARY INVENTORY CATALOG
# -----------------------------------------------------------------------------
SUPPLY_CATALOG: List[SupplyClassSKUSpec] = [
    # Class I — Rations & High-Altitude Nutrition
    SupplyClassSKUSpec(
        sku="CL1-MRE-WINTER-4500",
        item_name="Special Winter Survival MRE (4500 kcal High-Alt)",
        supply_class="CLASS_I",
        category="RATIONS",
        unit_of_measure="PACKS",
        unit_weight_kg=1.45,
        per_capita_daily_rate=1.2,
        critical_safety_threshold=1500,
        shelf_life_days=540,
        requires_cold_chain=False,
        min_temp_c=-40.0,
        max_temp_c=35.0,
    ),
    SupplyClassSKUSpec(
        sku="CL1-TIN-PROT-ration",
        item_name="Tinned High-Protein Combat Ration Crate",
        supply_class="CLASS_I",
        category="RATIONS",
        unit_of_measure="CRATES",
        unit_weight_kg=12.0,
        per_capita_daily_rate=0.15,
        critical_safety_threshold=400,
        shelf_life_days=730,
        requires_cold_chain=False,
        min_temp_c=-35.0,
        max_temp_c=40.0,
    ),
    SupplyClassSKUSpec(
        sku="CL1-SUPP-HALT-HYDR",
        item_name="High-Altitude Thermal Electrolyte & Calorie Supplement",
        supply_class="CLASS_I",
        category="RATIONS",
        unit_of_measure="BOXES",
        unit_weight_kg=2.5,
        per_capita_daily_rate=0.25,
        critical_safety_threshold=600,
        shelf_life_days=365,
        requires_cold_chain=False,
        min_temp_c=-30.0,
        max_temp_c=30.0,
    ),
    # Class III — Petroleum, Oils & Lubricants (POL)
    SupplyClassSKUSpec(
        sku="CL3-DHPP-W-ARCTIC",
        item_name="Extreme Low-Temp Winter Grade Diesel (-35C Pour Point)",
        supply_class="CLASS_III",
        category="POL",
        unit_of_measure="LITERS",
        unit_weight_kg=0.84,
        per_capita_daily_rate=3.8,
        critical_safety_threshold=12000,
        shelf_life_days=365,
        requires_cold_chain=False,
        min_temp_c=-45.0,
        max_temp_c=45.0,
    ),
    SupplyClassSKUSpec(
        sku="CL3-SKO-50-GLACIER",
        item_name="Superior Kerosene Oil (SKO-50 Bukhari Heating & Stove)",
        supply_class="CLASS_III",
        category="POL",
        unit_of_measure="LITERS",
        unit_weight_kg=0.81,
        per_capita_daily_rate=2.9,
        critical_safety_threshold=9000,
        shelf_life_days=540,
        requires_cold_chain=False,
        min_temp_c=-50.0,
        max_temp_c=45.0,
    ),
    SupplyClassSKUSpec(
        sku="CL3-ATF-JP8-HIGH",
        item_name="Aviation Turbine Fuel JP-8 (Rotary & Forward Helipad)",
        supply_class="CLASS_III",
        category="POL",
        unit_of_measure="LITERS",
        unit_weight_kg=0.80,
        per_capita_daily_rate=2.1,
        critical_safety_threshold=15000,
        shelf_life_days=365,
        requires_cold_chain=False,
        min_temp_c=-47.0,
        max_temp_c=40.0,
    ),
    # Class V — Ammunition & Munitions
    SupplyClassSKUSpec(
        sku="CL5-762-NATO-BALL",
        item_name="7.62x51mm NATO Ball Ammunition Crate",
        supply_class="CLASS_V",
        category="MUNITIONS",
        unit_of_measure="CRATES",
        unit_weight_kg=26.0,
        per_capita_daily_rate=0.06,
        critical_safety_threshold=350,
        shelf_life_days=1825,
        requires_cold_chain=False,
        min_temp_c=-45.0,
        max_temp_c=50.0,
    ),
    SupplyClassSKUSpec(
        sku="CL5-556-INSAS-BALL",
        item_name="5.56x45mm INSAS Rifle Ammunition Case",
        supply_class="CLASS_V",
        category="MUNITIONS",
        unit_of_measure="CRATES",
        unit_weight_kg=22.0,
        per_capita_daily_rate=0.08,
        critical_safety_threshold=450,
        shelf_life_days=1825,
        requires_cold_chain=False,
        min_temp_c=-45.0,
        max_temp_c=50.0,
    ),
    SupplyClassSKUSpec(
        sku="CL5-155MM-BOFORS-HE",
        item_name="155mm Extended-Range High-Explosive Artillery Projectile",
        supply_class="CLASS_V",
        category="MUNITIONS",
        unit_of_measure="ROUNDS",
        unit_weight_kg=43.5,
        per_capita_daily_rate=0.04,
        critical_safety_threshold=500,
        shelf_life_days=3650,
        requires_cold_chain=False,
        min_temp_c=-45.0,
        max_temp_c=50.0,
    ),
    SupplyClassSKUSpec(
        sku="CL5-81MM-MORTAR-HE",
        item_name="81mm High-Altitude Infantry Mortar Bomb",
        supply_class="CLASS_V",
        category="MUNITIONS",
        unit_of_measure="ROUNDS",
        unit_weight_kg=4.2,
        per_capita_daily_rate=0.05,
        critical_safety_threshold=400,
        shelf_life_days=2555,
        requires_cold_chain=False,
        min_temp_c=-45.0,
        max_temp_c=50.0,
    ),
    # Class VIII — Medical & Cold-Chain Life Support
    SupplyClassSKUSpec(
        sku="CL8-MED-HAPE-OXY",
        item_name="High-Altitude Pulmonary Edema (HAPE) & Hyperbaric Kit",
        supply_class="CLASS_VIII",
        category="MEDICAL",
        unit_of_measure="KITS",
        unit_weight_kg=6.8,
        per_capita_daily_rate=0.015,
        critical_safety_threshold=120,
        shelf_life_days=270,
        requires_cold_chain=True,
        min_temp_c=2.0,
        max_temp_c=8.0,
    ),
    SupplyClassSKUSpec(
        sku="CL8-PLASMA-TRAUMA-CC",
        item_name="Lyophilized Plasma & Cold-Chain Field Surgical Pack",
        supply_class="CLASS_VIII",
        category="MEDICAL",
        unit_of_measure="KITS",
        unit_weight_kg=4.5,
        per_capita_daily_rate=0.012,
        critical_safety_threshold=100,
        shelf_life_days=180,
        requires_cold_chain=True,
        min_temp_c=2.0,
        max_temp_c=6.0,
    ),
]

SKU_MAP: Dict[str, SupplyClassSKUSpec] = {s.sku: s for s in SUPPLY_CATALOG}


# -----------------------------------------------------------------------------
# 4. MULTI-MODAL TRANSPORT ASSETS & TACTICAL FLEET
# -----------------------------------------------------------------------------
TRANSPORT_FLEET: List[TransportFleetSpec] = [
    TransportFleetSpec(
        vehicle_type="STALLION_4X4",
        designation="Ashok Leyland Stallion 4x4 Heavy Tactical Truck",
        modality="HEAVY_SURFACE",
        payload_capacity_tons=7.5,
        cruising_speed_kmh=38.0,
        base_fuel_consumption_l_per_km=0.42,
        uphill_snow_gradient_penalty=1.65,
        max_operating_altitude_m=5400,
        all_weather_capable=False,
    ),
    TransportFleetSpec(
        vehicle_type="TATRA_T815_6X6",
        designation="BEML-Tatra T815 6x6 High-Mobility Heavy Transporter",
        modality="HEAVY_SURFACE",
        payload_capacity_tons=10.5,
        cruising_speed_kmh=32.0,
        base_fuel_consumption_l_per_km=0.58,
        uphill_snow_gradient_penalty=1.45,
        max_operating_altitude_m=5500,
        all_weather_capable=False,
    ),
    TransportFleetSpec(
        vehicle_type="MAHINDRA_ALSV",
        designation="Mahindra Armored Light Specialist Mountain Vehicle",
        modality="LIGHT_MOUNTAIN",
        payload_capacity_tons=1.6,
        cruising_speed_kmh=52.0,
        base_fuel_consumption_l_per_km=0.22,
        uphill_snow_gradient_penalty=1.35,
        max_operating_altitude_m=5600,
        all_weather_capable=False,
    ),
    TransportFleetSpec(
        vehicle_type="MARUTI_GYPSY_4WD",
        designation="Light Mountain Utility Reconnaissance & Courier 4WD",
        modality="LIGHT_MOUNTAIN",
        payload_capacity_tons=0.65,
        cruising_speed_kmh=55.0,
        base_fuel_consumption_l_per_km=0.14,
        uphill_snow_gradient_penalty=1.40,
        max_operating_altitude_m=5500,
        all_weather_capable=False,
    ),
    TransportFleetSpec(
        vehicle_type="ALH_DHRUV_MK3",
        designation="HAL ALH Dhruv Mk-III High-Altitude Utility Helicopter",
        modality="ROTARY_WING_AIR",
        payload_capacity_tons=1.5,
        cruising_speed_kmh=215.0,
        base_fuel_consumption_l_per_km=1.35,
        uphill_snow_gradient_penalty=1.18,
        max_operating_altitude_m=6500,
        all_weather_capable=True,
    ),
    TransportFleetSpec(
        vehicle_type="MI17_V5",
        designation="Mil Mi-17V5 Medium Twin-Turbine Transport Helicopter",
        modality="ROTARY_WING_AIR",
        payload_capacity_tons=4.0,
        cruising_speed_kmh=230.0,
        base_fuel_consumption_l_per_km=2.60,
        uphill_snow_gradient_penalty=1.15,
        max_operating_altitude_m=6000,
        all_weather_capable=True,
    ),
    TransportFleetSpec(
        vehicle_type="CH47F_CHINOOK",
        designation="Boeing CH-47F Chinook Heavy-Lift Tandem Rotor Airlifter",
        modality="ROTARY_WING_AIR",
        payload_capacity_tons=9.6,
        cruising_speed_kmh=270.0,
        base_fuel_consumption_l_per_km=3.85,
        uphill_snow_gradient_penalty=1.12,
        max_operating_altitude_m=6100,
        all_weather_capable=True,
    ),
]

FLEET_MAP: Dict[str, TransportFleetSpec] = {f.vehicle_type: f for f in TRANSPORT_FLEET}
