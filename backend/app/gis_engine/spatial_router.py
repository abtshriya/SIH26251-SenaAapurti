"""
Tactical Spatial Router & Multi-Modal Dynamic Handoff Engine.
Constructs topological road & air corridor networks with NetworkX, evaluates mountain pass
blockages in real time, computes surface-to-air multimodal handoffs, and emits RFC-compliant GeoJSON.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple
import networkx as nx
from pydantic import BaseModel, Field

from app.gis_engine.air_drop_allocator import (
    AirDropAllocator,
    PartitionedManifest,
)
from app.gis_engine.terrain_weather_feed import (
    PassCondition,
    PassStatus,
    TerrainWeatherFeed,
    get_weather_feed,
)

logger = logging.getLogger("sena_aapurti.gis_engine.spatial_router")


class TheaterNode(BaseModel):
    node_id: str
    name: str
    echelon: str
    sector: str
    elevation_m: int
    lat: float
    lon: float
    helipad_capable: bool = False
    drop_zone_capable: bool = False


class RouteLegProperties(BaseModel):
    id: str
    name: str
    mode: str  # GROUND_CONVOY | AIR_DROP_CORRIDOR
    stroke: str
    color: str
    stroke_width: int = Field(default=4, alias="stroke-width")
    stroke_opacity: float = Field(default=0.9, alias="stroke-opacity")
    dash_array: Optional[str] = Field(default=None, alias="stroke-dasharray")
    distance_km: float
    transit_time_hrs: float
    status: str
    description: str


class TacticalSpatialRouter:
    """
    Military High-Altitude Multi-Modal Routing Engine.
    Employs NetworkX topological graphs to route ground convoys and aerial rotary corridors
    through forward operational sectors in Jammu & Kashmir and Ladakh.
    """

    def __init__(self, weather_feed: Optional[TerrainWeatherFeed] = None) -> None:
        self.weather_feed = weather_feed or get_weather_feed()
        self.air_allocator = AirDropAllocator()
        self.road_graph = nx.Graph()
        self.air_graph = nx.Graph()
        self.combined_graph = nx.Graph()
        self.nodes_registry: Dict[str, TheaterNode] = {}
        self._build_topological_graph()

    def _build_topological_graph(self) -> None:
        """Construct the high-altitude Northern Sector network nodes and multimodal edges."""
        # 1. Register Theater Nodes
        raw_nodes = [
            TheaterNode(
                node_id="NODE-HQ-UDHAMPUR",
                name="Northern Command HQ (Udhampur)",
                echelon="COMMAND_HQ",
                sector="JAMMU-UDHAMPUR",
                elevation_m=756,
                lat=32.9160,
                lon=75.1416,
                helipad_capable=True,
                drop_zone_capable=False,
            ),
            TheaterNode(
                node_id="NODE-DEPOT-SRINAGAR",
                name="15 Corps Staging Logistics Depot (Srinagar)",
                echelon="CORPS_DEPOT",
                sector="KASHMIR-VALLEY",
                elevation_m=1585,
                lat=34.0837,
                lon=74.7973,
                helipad_capable=True,
                drop_zone_capable=False,
            ),
            TheaterNode(
                node_id="NODE-BSP-DRAS",
                name="Dras Sector Brigade Supply Point",
                echelon="BRIGADE_SUPPLY_POINT",
                sector="DRAS-KARGIL",
                elevation_m=3300,
                lat=34.4275,
                lon=75.7556,
                helipad_capable=False,
                drop_zone_capable=False,
            ),
            TheaterNode(
                node_id="NODE-BSP-KARGIL",
                name="Kargil Brigade Logistics Hub",
                echelon="BRIGADE_SUPPLY_POINT",
                sector="DRAS-KARGIL",
                elevation_m=2676,
                lat=34.5539,
                lon=76.1349,
                helipad_capable=True,
                drop_zone_capable=False,
            ),
            TheaterNode(
                node_id="NODE-DEPOT-LEH",
                name="14 Corps High-Altitude Logistics Base (Leh)",
                echelon="CORPS_DEPOT",
                sector="CENTRAL-LADAKH",
                elevation_m=3524,
                lat=34.1526,
                lon=77.5771,
                helipad_capable=True,
                drop_zone_capable=False,
            ),
            TheaterNode(
                node_id="NODE-BSP-DISKIT",
                name="Nubra Valley Staging Helipad (Diskit)",
                echelon="BRIGADE_SUPPLY_POINT",
                sector="NUBRA-SIACHEN",
                elevation_m=3144,
                lat=34.5447,
                lon=77.5553,
                helipad_capable=True,
                drop_zone_capable=False,
            ),
            TheaterNode(
                node_id="NODE-FOB-SIACHEN",
                name="Siachen Base Camp & Glacier Staging Post",
                echelon="FORWARD_OUTPOST",
                sector="SIACHEN-GLACIER",
                elevation_m=5400,
                lat=35.4215,
                lon=77.1025,
                helipad_capable=True,
                drop_zone_capable=True,
            ),
            TheaterNode(
                node_id="NODE-FOB-DBO",
                name="Daulat Beg Oldie (DBO) Sub-Sector North Outpost",
                echelon="FORWARD_OUTPOST",
                sector="SUB-SECTOR-NORTH",
                elevation_m=5065,
                lat=35.3964,
                lon=77.9258,
                helipad_capable=True,
                drop_zone_capable=True,
            ),
            TheaterNode(
                node_id="NODE-FOB-GALWAN",
                name="Galwan Valley Forward Tactical Staging Point",
                echelon="FORWARD_OUTPOST",
                sector="EASTERN-LADAKH",
                elevation_m=4750,
                lat=34.7611,
                lon=78.2039,
                helipad_capable=True,
                drop_zone_capable=True,
            ),
            TheaterNode(
                node_id="NODE-FOB-NYOMA",
                name="Nyoma Advanced Landing Ground & Forward Base",
                echelon="FORWARD_OUTPOST",
                sector="SOUTHEAST-LADAKH",
                elevation_m=4180,
                lat=33.2044,
                lon=78.6478,
                helipad_capable=True,
                drop_zone_capable=True,
            ),
        ]

        for n in raw_nodes:
            self.nodes_registry[n.node_id] = n
            self.road_graph.add_node(n.node_id, **n.model_dump())
            self.air_graph.add_node(n.node_id, **n.model_dump())
            self.combined_graph.add_node(n.node_id, **n.model_dump())

        # 2. Register Surface Roads & Mountain Passes
        # Coordinates in standard GeoJSON [lon, lat] format
        surface_edges = [
            {
                "u": "NODE-HQ-UDHAMPUR",
                "v": "NODE-DEPOT-SRINAGAR",
                "edge_id": "RTE-NH44-UDH-SGR",
                "distance_km": 205.0,
                "lead_time_hrs": 6.5,
                "pass_name": "Banihal Pass",
                "max_vehicle_weight_tons": 35.0,
                "coords": [
                    [75.1416, 32.9160],
                    [75.2010, 33.4350],
                    [74.7973, 34.0837],
                ],
            },
            {
                "u": "NODE-DEPOT-SRINAGAR",
                "v": "NODE-BSP-DRAS",
                "edge_id": "RTE-NH1-SGR-DRAS",
                "distance_km": 142.0,
                "lead_time_hrs": 7.0,
                "pass_name": "Zoji La",
                "max_vehicle_weight_tons": 24.0,
                "coords": [
                    [74.7973, 34.0837],
                    [75.3100, 34.2100],
                    [75.4697, 34.2785],
                    [75.7556, 34.4275],
                ],
            },
            {
                "u": "NODE-BSP-DRAS",
                "v": "NODE-BSP-KARGIL",
                "edge_id": "RTE-NH1-DRAS-KGL",
                "distance_km": 62.0,
                "lead_time_hrs": 2.5,
                "pass_name": "Kharbu Axis",
                "max_vehicle_weight_tons": 30.0,
                "coords": [
                    [75.7556, 34.4275],
                    [75.9500, 34.4800],
                    [76.1349, 34.5539],
                ],
            },
            {
                "u": "NODE-BSP-KARGIL",
                "v": "NODE-DEPOT-LEH",
                "edge_id": "RTE-NH1-KGL-LEH",
                "distance_km": 216.0,
                "lead_time_hrs": 8.5,
                "pass_name": "Fotu La",
                "max_vehicle_weight_tons": 28.0,
                "coords": [
                    [76.1349, 34.5539],
                    [76.7911, 34.2892],
                    [77.1500, 34.2500],
                    [77.5771, 34.1526],
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-BSP-DISKIT",
                "edge_id": "RTE-LEH-DISKIT",
                "distance_km": 118.0,
                "lead_time_hrs": 6.0,
                "pass_name": "Khardung La",
                "max_vehicle_weight_tons": 18.0,
                "coords": [
                    [77.5771, 34.1526],
                    [77.5900, 34.2000],
                    [77.6047, 34.2787],
                    [77.5750, 34.4200],
                    [77.5553, 34.5447],
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-BSP-DISKIT",
                "edge_id": "RTE-LEH-DISKIT-WARILA",
                "distance_km": 148.0,
                "lead_time_hrs": 7.5,
                "pass_name": "Wari La",
                "max_vehicle_weight_tons": 16.0,
                "coords": [
                    [77.5771, 34.1526],
                    [77.7200, 34.0000],
                    [77.8200, 34.1950],
                    [77.7600, 34.4000],
                    [77.5553, 34.5447],
                ],
            },
            {
                "u": "NODE-BSP-DISKIT",
                "v": "NODE-FOB-SIACHEN",
                "edge_id": "RTE-DISKIT-SIACHEN",
                "distance_km": 112.0,
                "lead_time_hrs": 7.5,
                "pass_name": "Nubra Glacier Axis",
                "max_vehicle_weight_tons": 12.0,
                "coords": [
                    [77.5553, 34.5447],
                    [77.4500, 34.7500],
                    [77.3100, 34.9500],
                    [77.1025, 35.4215],
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-FOB-DBO",
                "edge_id": "RTE-DSDBO-LEH-DBO",
                "distance_km": 255.0,
                "lead_time_hrs": 12.5,
                "pass_name": "Chang La & Shyok Axis",
                "critical_passes": ["Chang La", "Khardung La"],
                "max_vehicle_weight_tons": 20.0,
                "coords": [
                    [77.5771, 34.1526],
                    [77.7500, 34.0800],
                    [77.9308, 34.0475],
                    [78.0800, 34.4000],
                    [78.1200, 34.7800],
                    [77.9258, 35.3964],
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-FOB-GALWAN",
                "edge_id": "RTE-SHYOK-GALWAN",
                "distance_km": 210.0,
                "lead_time_hrs": 10.5,
                "pass_name": "Chang La",
                "max_vehicle_weight_tons": 18.0,
                "coords": [
                    [77.5771, 34.1526],
                    [77.9308, 34.0475],
                    [78.0500, 34.4500],
                    [78.2039, 34.7611],
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-FOB-NYOMA",
                "edge_id": "RTE-INDUS-LEH-NYOMA",
                "distance_km": 185.0,
                "lead_time_hrs": 6.5,
                "pass_name": "Upshi-Mahe Indus Corridor",
                "max_vehicle_weight_tons": 32.0,
                "coords": [
                    [77.5771, 34.1526],
                    [77.8000, 33.9500],
                    [78.0500, 33.6500],
                    [78.6478, 33.2044],
                ],
            },
        ]

        for e in surface_edges:
            e["modality"] = "GROUND_CONVOY"
            self.road_graph.add_edge(e["u"], e["v"], key=e["edge_id"], **e)
            self.combined_graph.add_edge(e["u"], e["v"], key=e["edge_id"], **e)

        # 3. Register Tactical Aerial Corridors (Rotary Wing)
        air_corridors = [
            {
                "u": "NODE-BSP-DISKIT",
                "v": "NODE-FOB-DBO",
                "edge_id": "AIR-DISKIT-DBO",
                "distance_km": 115.0,
                "lead_time_hrs": 0.55,
                "ceiling_altitude_m": 5800,
                "helicopter_clearance": True,
                "corridor_name": "Shyok Valley Low-Level Aerial Insertion",
                "coords": [
                    [77.5553, 34.5447],  # Diskit Staging Helipad
                    [77.6800, 34.7200],  # Nubra-Shyok River Confluence WP1
                    [77.8200, 34.9800],  # Murgo Tactical Air Checkpoint WP2
                    [77.9100, 35.2200],  # Depsang Low-Level Ridge WP3
                    [77.9258, 35.3964],  # DBO Drop Zone DZ
                ],
            },
            {
                "u": "NODE-BSP-DISKIT",
                "v": "NODE-FOB-SIACHEN",
                "edge_id": "AIR-DISKIT-SIACHEN",
                "distance_km": 105.0,
                "lead_time_hrs": 0.50,
                "ceiling_altitude_m": 6000,
                "helicopter_clearance": True,
                "corridor_name": "Nubra-Warshi Rotary Airbridge",
                "coords": [
                    [77.5553, 34.5447],  # Diskit Helipad
                    [77.4200, 34.8600],  # Sasoma Air Corridor WP1
                    [77.2500, 35.1500],  # Warshi Valley Entry WP2
                    [77.1025, 35.4215],  # Siachen DZ
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-FOB-DBO",
                "edge_id": "AIR-LEH-DBO",
                "distance_km": 180.0,
                "lead_time_hrs": 0.85,
                "ceiling_altitude_m": 6200,
                "helicopter_clearance": True,
                "corridor_name": "Leh-Tangtse-DBO High-Altitude Strategic Air Corridor",
                "coords": [
                    [77.5771, 34.1526],  # Leh Airbase
                    [77.8500, 34.3000],  # Tangtse Aerial Transit WP1
                    [78.0500, 34.8500],  # Shyok Gorge Ingress WP2
                    [77.9258, 35.3964],  # DBO DZ
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-FOB-SIACHEN",
                "edge_id": "AIR-LEH-SIACHEN",
                "distance_km": 145.0,
                "lead_time_hrs": 0.70,
                "ceiling_altitude_m": 6300,
                "helicopter_clearance": True,
                "corridor_name": "Leh-North Pullu Tactical Airbridge",
                "coords": [
                    [77.5771, 34.1526],  # Leh Airbase
                    [77.6200, 34.4500],  # North Pullu Gap WP1
                    [77.3500, 34.9500],  # Nubra Low-Level Route WP2
                    [77.1025, 35.4215],  # Siachen DZ
                ],
            },
            {
                "u": "NODE-DEPOT-LEH",
                "v": "NODE-FOB-GALWAN",
                "edge_id": "AIR-LEH-GALWAN",
                "distance_km": 135.0,
                "lead_time_hrs": 0.65,
                "ceiling_altitude_m": 5800,
                "helicopter_clearance": True,
                "corridor_name": "Leh-Durbuk Tactical Ingress",
                "coords": [
                    [77.5771, 34.1526],  # Leh Airbase
                    [78.0500, 34.4000],  # Durbuk Waypoint
                    [78.2039, 34.7611],  # Galwan DZ
                ],
            },
            {
                "u": "NODE-BSP-KARGIL",
                "v": "NODE-DEPOT-LEH",
                "edge_id": "AIR-KGL-LEH",
                "distance_km": 200.0,
                "lead_time_hrs": 0.90,
                "ceiling_altitude_m": 5200,
                "helicopter_clearance": True,
                "corridor_name": "Kargil-Indus Aerial Highway",
                "coords": [
                    [76.1349, 34.5539],  # Kargil Helipad
                    [76.8500, 34.3500],  # Indus Canyon WP
                    [77.5771, 34.1526],  # Leh Airbase
                ],
            },
        ]

        for a in air_corridors:
            a["modality"] = "AIR_DROP_CORRIDOR"
            self.air_graph.add_edge(a["u"], a["v"], key=a["edge_id"], **a)
            self.combined_graph.add_edge(a["u"], a["v"], key=a["edge_id"], **a)

    def is_pass_open(self, pass_name: Optional[str]) -> bool:
        if not pass_name:
            return True
        condition = self.weather_feed.get_pass(pass_name)
        if condition is None:
            return True
        return condition.is_passable()

    def is_edge_passable(self, edge_data: Dict[str, Any]) -> bool:
        pname = edge_data.get("pass_name")
        if pname and not self.is_pass_open(pname):
            return False
        crit = edge_data.get("critical_passes", [])
        for cp in crit:
            if not self.is_pass_open(cp):
                return False
        return True

    def get_blocked_passes_on_route(self, path_nodes: List[str]) -> List[PassCondition]:
        """Finds any blocked passes along a sequence of connected nodes."""
        blocked = []
        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i + 1]
            if self.road_graph.has_edge(u, v):
                edge_data = self.road_graph[u][v]
                if not self.is_edge_passable(edge_data):
                    pname = edge_data.get("pass_name")
                    if pname:
                        cond = self.weather_feed.get_pass(pname)
                        if cond and cond not in blocked:
                            blocked.append(cond)
        return blocked

    def solve_route_plan(
        self,
        origin_id: str,
        destination_id: str,
        cargo_weight_kg: float = 13000.0,
    ) -> Dict[str, Any]:
        """
        Calculates optimal ground route or dynamic multi-modal surface-to-air handoff plan.
        Returns standard GeoJSON FeatureCollection directly consumable by Leaflet.
        """
        if origin_id not in self.nodes_registry:
            raise ValueError(f"Origin node '{origin_id}' not found in tactical topology.")
        if destination_id not in self.nodes_registry:
            raise ValueError(f"Destination node '{destination_id}' not found in tactical topology.")

        origin_node = self.nodes_registry[origin_id]
        dest_node = self.nodes_registry[destination_id]

        # 1. Build filtered road subgraph containing ONLY currently OPEN road edges
        open_road_graph = nx.Graph()
        for nid, data in self.road_graph.nodes(data=True):
            open_road_graph.add_node(nid, **data)

        active_blocked_passes: List[PassCondition] = []
        all_passes = self.weather_feed.get_all_passes()
        for p in all_passes.values():
            if not p.is_passable():
                active_blocked_passes.append(p)

        for u, v, data in self.road_graph.edges(data=True):
            if self.is_edge_passable(data):
                open_road_graph.add_edge(u, v, **data)

        # 2. Check if an all-surface route exists
        has_surface_route = nx.has_path(open_road_graph, origin_id, destination_id)

        if has_surface_route:
            # Standard least-cost ground route
            path_nodes = nx.shortest_path(
                open_road_graph,
                source=origin_id,
                target=destination_id,
                weight="lead_time_hrs",
            )
            return self._build_ground_route_plan(
                origin_node, dest_node, path_nodes, open_road_graph, cargo_weight_kg
            )

        # 3. Dynamic Rerouting Triggered: Multi-Modal Staging Helipad Handoff Required!
        logger.info(
            "Surface route severed between %s and %s. Engaging Multi-Modal Handoff Solver.",
            origin_id,
            destination_id,
        )
        return self._build_multimodal_handoff_plan(
            origin_node,
            dest_node,
            open_road_graph,
            cargo_weight_kg,
            active_blocked_passes,
        )

    def _build_ground_route_plan(
        self,
        origin: TheaterNode,
        destination: TheaterNode,
        path_nodes: List[str],
        graph: nx.Graph,
        cargo_weight_kg: float,
    ) -> Dict[str, Any]:
        """Constructs an all-ground convoy plan GeoJSON."""
        total_dist_km = 0.0
        total_lead_time_hrs = 0.0
        route_coords: List[List[float]] = []
        passes_traversed: List[str] = []

        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i + 1]
            edge_data = graph[u][v]
            total_dist_km += edge_data.get("distance_km", 0.0)
            total_lead_time_hrs += edge_data.get("lead_time_hrs", 0.0)
            coords = edge_data.get("coords", [])
            pname = edge_data.get("pass_name")
            if pname and pname not in passes_traversed:
                passes_traversed.append(pname)

            if not route_coords:
                route_coords.extend(coords)
            else:
                # Avoid duplicate stitch coordinate
                if coords and coords[0] == route_coords[-1]:
                    route_coords.extend(coords[1:])
                else:
                    route_coords.extend(coords)

        features: List[Dict[str, Any]] = [
            # Ground Convoy Route LineString
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": route_coords,
                },
                "properties": {
                    "id": "leg-1-ground-convoy",
                    "name": f"Surface Convoy: {origin.name} to {destination.name}",
                    "mode": "GROUND_CONVOY",
                    "stroke": "#2563EB",  # Tactical Blue
                    "stroke-width": 5,
                    "stroke-opacity": 0.85,
                    "color": "#2563EB",
                    "distance_km": round(total_dist_km, 1),
                    "transit_time_hrs": round(total_lead_time_hrs, 2),
                    "passes_traversed": passes_traversed,
                    "status": "NORMAL_SURFACE_CONVOY",
                    "description": "Uninterrupted ground transit via open tactical mountain passes.",
                },
            },
            # Origin Point
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [origin.lon, origin.lat],
                },
                "properties": {
                    "id": origin.node_id,
                    "name": origin.name,
                    "node_type": "ORIGIN_LOGISTICS_BASE",
                    "elevation_m": origin.elevation_m,
                    "marker-color": "#3B82F6",
                    "marker-symbol": "warehouse",
                },
            },
            # Destination Point
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [destination.lon, destination.lat],
                },
                "properties": {
                    "id": destination.node_id,
                    "name": destination.name,
                    "node_type": "DESTINATION_OUTPOST",
                    "elevation_m": destination.elevation_m,
                    "marker-color": "#10B981",
                    "marker-symbol": "flag",
                },
            },
        ]

        # Top-level GeoJSON FeatureCollection
        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "plan_id": f"SMP-SURFACE-{origin.node_id[-3:]}-{destination.node_id[-3:]}",
                "status": "ALL_SURFACE_PASSES_CLEAR",
                "mode": "ALL_SURFACE_CONVOY",
                "origin_id": origin.node_id,
                "origin_name": origin.name,
                "destination_id": destination.node_id,
                "destination_name": destination.name,
                "total_distance_km": round(total_dist_km, 1),
                "total_lead_time_hrs": round(total_lead_time_hrs, 2),
                "cargo_weight_kg": cargo_weight_kg,
                "disruption_active": False,
                "tactical_advisory": (
                    f"All high-altitude mountain passes ({', '.join(passes_traversed)}) report OPEN clearance. "
                    f"Deploying standard surface convoy carrying {cargo_weight_kg:,.0f} kg stores directly to {destination.name}."
                ),
            },
        }

    def _build_multimodal_handoff_plan(
        self,
        origin: TheaterNode,
        destination: TheaterNode,
        open_road_graph: nx.Graph,
        cargo_weight_kg: float,
        active_blocked_passes: List[PassCondition],
    ) -> Dict[str, Any]:
        """
        Calculates optimal multi-modal staging helipad handoff when surface transit is blocked.
        Generates Leg 1 (Surface LineString) + Leg 2 (Rotary Aerial LineString) + Air-Drop Allocation.
        """
        # Find candidate helipads reachable by surface road from origin
        candidate_helipads: List[TheaterNode] = []
        for nid, node in self.nodes_registry.items():
            if node.helipad_capable:
                if nx.has_path(open_road_graph, origin.node_id, nid):
                    # Check if air graph connects this helipad to destination
                    if self.air_graph.has_edge(nid, destination.node_id) or nid == destination.node_id:
                        candidate_helipads.append(node)

        if not candidate_helipads:
            # If no forward helipad reachable, Leh or origin itself acts as tactical airbase
            fallback = self.nodes_registry.get("NODE-DEPOT-LEH", origin)
            candidate_helipads.append(fallback)

        # Select the best staging helipad:
        # Prefer helipad that maximizes ground advance towards destination (closest aerial distance to destination)
        def score_helipad(h: TheaterNode) -> Tuple[float, float]:
            surface_time = (
                nx.shortest_path_length(
                    open_road_graph, origin.node_id, h.node_id, weight="lead_time_hrs"
                )
                if nx.has_path(open_road_graph, origin.node_id, h.node_id)
                else 999.0
            )
            # Aerial distance to destination
            if self.air_graph.has_edge(h.node_id, destination.node_id):
                air_dist = self.air_graph[h.node_id][destination.node_id].get("distance_km", 200.0)
            else:
                air_dist = 250.0
            # Minimize air distance (forward staging), then total time
            return (air_dist, surface_time)

        candidate_helipads.sort(key=score_helipad)
        staging_helipad = candidate_helipads[0]

        # 1. Compute Leg 1 (Surface Convoy to Staging Helipad)
        leg1_dist = 0.0
        leg1_time = 0.0
        leg1_coords: List[List[float]] = []
        leg1_passes: List[str] = []

        if origin.node_id == staging_helipad.node_id:
            # Already at helipad (e.g., origin is Leh base with helipad)
            leg1_coords = [[origin.lon, origin.lat], [origin.lon, origin.lat]]
            leg1_dist = 0.0
            leg1_time = 0.0
        else:
            path_nodes = nx.shortest_path(
                open_road_graph,
                source=origin.node_id,
                target=staging_helipad.node_id,
                weight="lead_time_hrs",
            )
            for i in range(len(path_nodes) - 1):
                u, v = path_nodes[i], path_nodes[i + 1]
                edge_data = open_road_graph[u][v]
                leg1_dist += edge_data.get("distance_km", 0.0)
                leg1_time += edge_data.get("lead_time_hrs", 0.0)
                coords = edge_data.get("coords", [])
                pname = edge_data.get("pass_name")
                if pname and pname not in leg1_passes:
                    leg1_passes.append(pname)

                if not leg1_coords:
                    leg1_coords.extend(coords)
                else:
                    if coords and coords[0] == leg1_coords[-1]:
                        leg1_coords.extend(coords[1:])
                    else:
                        leg1_coords.extend(coords)

        # 2. Compute Leg 2 (Tactical Air Corridor from Helipad to Destination)
        if self.air_graph.has_edge(staging_helipad.node_id, destination.node_id):
            air_edge = self.air_graph[staging_helipad.node_id][destination.node_id]
            leg2_dist = air_edge.get("distance_km", 115.0)
            leg2_time = air_edge.get("lead_time_hrs", 0.55)
            leg2_coords = air_edge.get("coords", [
                [staging_helipad.lon, staging_helipad.lat],
                [destination.lon, destination.lat],
            ])
            corridor_name = air_edge.get("corridor_name", "Tactical Rotary Air Corridor")
        else:
            # Direct aerial line with simulated tactical waypoints
            leg2_dist = 120.0
            leg2_time = 0.60
            mid_lon = (staging_helipad.lon + destination.lon) / 2 + 0.05
            mid_lat = (staging_helipad.lat + destination.lat) / 2
            leg2_coords = [
                [staging_helipad.lon, staging_helipad.lat],
                [mid_lon, mid_lat],
                [destination.lon, destination.lat],
            ]
            corridor_name = "Forward Mountain Aerial Transit Corridor"

        # 3. Partition Cargo into Rotary Wing Air Sorties
        partitioned_manifest = self.air_allocator.allocate(
            total_cargo_weight_kg=cargo_weight_kg,
            destination_elevation_m=destination.elevation_m,
            flight_distance_km=leg2_dist,
            staging_helipad_id=staging_helipad.node_id,
            drop_zone_id=destination.node_id,
        )

        # 4. Construct Dual-Layer GeoJSON Features
        features: List[Dict[str, Any]] = [
            # Leg 1: Surface Convoy LineString
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": leg1_coords,
                },
                "properties": {
                    "id": "leg-1-ground-convoy",
                    "name": f"Leg 1 (Surface Convoy): {origin.name} -> {staging_helipad.name}",
                    "mode": "GROUND_CONVOY",
                    "stroke": "#2563EB",  # Blue
                    "stroke-width": 5,
                    "stroke-opacity": 0.85,
                    "color": "#2563EB",
                    "distance_km": round(leg1_dist, 1),
                    "transit_time_hrs": round(leg1_time, 2),
                    "passes_traversed": leg1_passes,
                    "status": "OPERATIONAL_BYPASS_ENGAGED",
                    "description": (
                        f"Surface convoy transiting via accessible axis ({', '.join(leg1_passes) or 'direct'}) "
                        f"up to forward staging helipad."
                    ),
                },
            },
            # Leg 2: Tactical Rotary Air Corridor LineString
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": leg2_coords,
                },
                "properties": {
                    "id": "leg-2-air-drop-corridor",
                    "name": f"Leg 2 (Tactical Air Corridor): {staging_helipad.name} -> {destination.name}",
                    "mode": "AIR_DROP_CORRIDOR",
                    "stroke": "#DC2626",  # Red
                    "stroke-width": 5,
                    "stroke-opacity": 0.95,
                    "stroke-dasharray": "8, 8",
                    "dashArray": "8, 8",
                    "color": "#DC2626",
                    "distance_km": round(leg2_dist, 1),
                    "transit_time_hrs": round(leg2_time, 2),
                    "corridor_designation": corridor_name,
                    "status": "AIR_DROP_SORTIES_ACTIVE",
                    "sorties_count": partitioned_manifest.total_sorties_count,
                    "description": (
                        f"Low-level terrain masking aerial insertion. Dispatched "
                        f"{', '.join(f'{count}x {key}' for key, count in partitioned_manifest.sorties_summary.items())}."
                    ),
                },
            },
            # Origin Point
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [origin.lon, origin.lat],
                },
                "properties": {
                    "id": origin.node_id,
                    "name": origin.name,
                    "node_type": "ORIGIN_LOGISTICS_BASE",
                    "elevation_m": origin.elevation_m,
                    "marker-color": "#3B82F6",
                    "marker-symbol": "warehouse",
                },
            },
            # Multi-Modal Handoff Point (Staging Helipad)
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [staging_helipad.lon, staging_helipad.lat],
                },
                "properties": {
                    "id": staging_helipad.node_id,
                    "name": f"Multi-Modal Handoff Point: {staging_helipad.name}",
                    "node_type": "STAGING_HELIPAD",
                    "elevation_m": staging_helipad.elevation_m,
                    "marker-color": "#EAB308",  # Amber / Gold
                    "marker-symbol": "heliport",
                    "action": "TRANSFER_CARGO_SURFACE_TO_ROTARY_WING",
                    "description": "Ground convoy payload unpackaged and cross-loaded onto rotary-wing airframes.",
                },
            },
            # Destination Drop Zone Target
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [destination.lon, destination.lat],
                },
                "properties": {
                    "id": destination.node_id,
                    "name": f"Forward Drop Zone: {destination.name}",
                    "node_type": "TACTICAL_DROP_ZONE",
                    "elevation_m": destination.elevation_m,
                    "marker-color": "#10B981",  # Green
                    "marker-symbol": "flag",
                    "action": "AERIAL_RECEIPT_STORES",
                    "elevation_restriction": f"AMSL {destination.elevation_m}m",
                },
            },
        ]

        # Add Blocked Pass Hazard Points
        for bp in active_blocked_passes:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [bp.lon, bp.lat],
                },
                "properties": {
                    "id": f"hazard-pass-{bp.pass_name.lower().replace(' ', '-')}",
                    "name": f"AVALANCHE HAZARD RED: {bp.pass_name}",
                    "node_type": "PASS_BLOCKAGE",
                    "elevation_m": bp.elevation_m,
                    "marker-color": "#EF4444",
                    "status": "IMPASSABLE",
                    "cause": bp.cause,
                    "avalanche_hazard_grade": bp.avalanche_hazard_grade.value,
                    "temp_c": bp.temp_c,
                    "wind_speed_kmh": bp.wind_speed_kmh,
                },
            })

        total_distance = leg1_dist + leg2_dist
        total_lead_time = leg1_time + leg2_time

        blocked_names = [bp.pass_name for bp in active_blocked_passes]
        sorties_text = ", ".join(
            f"{count}x {key}" for key, count in partitioned_manifest.sorties_summary.items()
        )

        tactical_advisory = (
            f"Pass Blockage Detected on [{', '.join(blocked_names)}]. Dynamic multi-modal rerouting active: "
            f"Convoy rerouted via Leg 1 surface axis to {staging_helipad.name} ({leg1_dist:.1f} km, {leg1_time:.1f} hrs). "
            f"Cargo split into {partitioned_manifest.total_sorties_count} rotary-wing sorties ({sorties_text}) "
            f"for Leg 2 low-level air drop to {destination.name} ({leg2_dist:.1f} km, {leg2_time:.2f} hrs). "
            f"Altitude ceiling limits strictly enforced for {destination.elevation_m}m AMSL."
        )

        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "plan_id": f"MMP-AIR-HANDOFF-{staging_helipad.node_id[-6:]}-{destination.node_id[-3:]}",
                "status": "MULTI_MODAL_AIR_HANDOFF_ACTIVATED",
                "mode": "MULTI_MODAL_AIR_HANDOFF",
                "origin_id": origin.node_id,
                "origin_name": origin.name,
                "destination_id": destination.node_id,
                "destination_name": destination.name,
                "handoff_staging_helipad_id": staging_helipad.node_id,
                "handoff_staging_helipad_name": staging_helipad.name,
                "total_distance_km": round(total_distance, 1),
                "total_lead_time_hrs": round(total_lead_time, 2),
                "cargo_weight_kg": cargo_weight_kg,
                "disruption_active": True,
                "blocked_passes": [bp.model_dump() for bp in active_blocked_passes],
                "leg1_surface": {
                    "mode": "GROUND_CONVOY",
                    "origin": origin.name,
                    "destination": staging_helipad.name,
                    "distance_km": round(leg1_dist, 1),
                    "transit_time_hrs": round(leg1_time, 2),
                    "passes_traversed": leg1_passes,
                },
                "leg2_air_corridor": {
                    "mode": "AIR_DROP_CORRIDOR",
                    "origin": staging_helipad.name,
                    "destination": destination.name,
                    "distance_km": round(leg2_dist, 1),
                    "flight_time_hrs": round(leg2_time, 2),
                    "corridor_name": corridor_name,
                },
                "air_drop_manifest": partitioned_manifest.model_dump(),
                "tactical_advisory": tactical_advisory,
            },
        }


# Process-wide singleton
_spatial_router_instance: Optional[TacticalSpatialRouter] = None


def get_spatial_router() -> TacticalSpatialRouter:
    global _spatial_router_instance
    if _spatial_router_instance is None:
        _spatial_router_instance = TacticalSpatialRouter()
    return _spatial_router_instance
