import { Injectable, signal } from '@angular/core';
import { ALL_INDIAN_ARMY_UNITS } from '../data/indian-army-commands-database';

export interface ConvoyItem {
  id: string;
  callsign: string;
  source: string;
  destination: string;
  route: string;
  vehiclesCount: number;
  cargoType: 'Class I (Rations)' | 'Class III (POL/Fuel)' | 'Class V (Ammunition)' | 'Class IX (Spares)' | 'Winter Stocking';
  tonnage: number;
  status: 'In-Transit' | 'Delayed' | 'Rerouted' | 'Arrived' | 'High-Altitude Hold';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Severe';
  eta: string;
  driverEscort: string;
  departureTime: string;
  delayHours: number;
  gpsCoordinates: { lat: number; lng: number };
  weatherAlert?: string;
  checkpoints?: { name: string; time: string; passed: boolean }[];
}

export interface UnitIndent {
  id: string;
  unitName: string;
  category: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Ammo)' | 'Class IX (Spares)' | 'ECC / Winter Clothing';
  itemDescription: string;
  requestedQty: string;
  urgency: 'Routine' | 'Operational Priority 1' | 'SOS Emergency';
  dateCreated: string;
  requiredBy: string;
  reason?: string;
  status: 'Pending HQ Approval' | 'Approved by DGOS' | 'Dispatched from COD' | 'Delivered' | 'Rejected';
  remarks?: string;
}

export interface StrategicAlert {
  id: string;
  theater: string;
  sector: string;
  type: 'Weather Risk' | 'Demand Surge' | 'Stock Critical' | 'Convoy Bottleneck' | 'Route Disruption';
  severity: 'Critical' | 'High' | 'Medium' | 'Informational';
  headline: string;
  details: string;
  affectedUnit: string;
  affectedSupply: string;
  recommendedAction: string;
  timestamp: string;
  contributingFactors?: string[];
  aiExplanation?: string;
  alternativeActions?: string[];
  expectedImpact?: string;
}

export interface UnitNetworkItem {
  id: string;
  name: string;
  type: 'Infantry' | 'Mechanised' | 'Armoured' | 'Artillery' | 'Air Defence' | 'Engineers' | 'Signals' | 'Special Forces' | 'Aviation' | 'Ordnance' | 'ASC' | 'EME';
  region: string;
  location: string;
  personnel: number;
  readiness: number;
  inventoryHealth: 'Healthy' | 'Warning' | 'Critical';
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  pendingRequests: number;
  onlineStatus: 'Online' | 'Offline' | 'SATCOM Only';
  dos: number;
  commander: string;
}

export interface InventoryItem {
  id: string;
  item: string;
  category: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Munitions)' | 'Class IX (Spares)' | 'Medical & Special';
  totalQuantity: string;
  allocated: string;
  available: string;
  safetyStock: string;
  daysOfSupply: number;
  stockoutRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  status: 'Adequate' | 'Surplus' | 'Depleted' | 'Critical';
  location: string;
}

export interface WeatherStationData {
  location: string;
  passName: string;
  elevation: string;
  temperature: string;
  rainfallSnow: string;
  windSpeed: string;
  visibility: string;
  alert: string;
  accessibility: 'Open' | 'Chains Required' | 'Convoy Restriced' | 'Closed Due to Avalanche';
  riskScore: number;
  alternativeRoute?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  // Live Convoys Signal
  convoys = signal<ConvoyItem[]>([
    {
      id: 'CV-104-N',
      callsign: 'GARUDA-01',
      source: 'COD Pathankot',
      destination: 'FSD Leh (14 Corps)',
      route: 'Manali - Rohtang - Atal Tunnel - Keylong - Sarchu',
      vehiclesCount: 28,
      cargoType: 'Class III (POL/Fuel)',
      tonnage: 320,
      status: 'In-Transit',
      riskLevel: 'Medium',
      eta: '4 hrs 15 mins',
      departureTime: '04:30 hrs',
      delayHours: 0.5,
      driverEscort: 'Subedar R. P. Yadav (ASC)',
      gpsCoordinates: { lat: 32.55, lng: 77.21 },
      weatherAlert: 'Light snow flurry near Baralacha La pass (-14°C)',
      checkpoints: [
        { name: 'Pathankot Transit Camp', time: '04:30 hrs', passed: true },
        { name: 'Manali North Portal', time: '09:15 hrs', passed: true },
        { name: 'Keylong Staging Post', time: '13:00 hrs', passed: true },
        { name: 'Sarchu Military Outpost', time: '17:30 hrs', passed: false },
        { name: 'Leh Central Supply Depot', time: '21:45 hrs', passed: false }
      ]
    },
    {
      id: 'CV-209-E',
      callsign: 'BRAHMAPUTRA-4',
      source: 'COD Narangi (Guwahati)',
      destination: 'Forward Base Tawang (4 Corps)',
      route: 'Bhalukpong - Bomdila - Sela Tunnel Axis',
      vehiclesCount: 16,
      cargoType: 'Class V (Ammunition)',
      tonnage: 190,
      status: 'In-Transit',
      riskLevel: 'Low',
      eta: '2 hrs 40 mins',
      departureTime: '06:00 hrs',
      delayHours: 0,
      driverEscort: 'Naib Subedar K. Gogoi (AOC)',
      gpsCoordinates: { lat: 27.58, lng: 91.86 },
      checkpoints: [
        { name: 'Guwahati Logistics Railhead', time: '06:00 hrs', passed: true },
        { name: 'Bomdila Ordnance Staging Base', time: '11:20 hrs', passed: true },
        { name: 'Sela Tunnel South Entry', time: '14:45 hrs', passed: true },
        { name: 'Tawang Forward Brigade Store', time: '17:25 hrs', passed: false }
      ]
    },
    {
      id: 'CV-318-N',
      callsign: 'HIMALAYA-9',
      source: '21 Adv Base Depot (Udhampur)',
      destination: 'Drass-Kargil Brigade FSD',
      route: 'Jammu - Srinagar Bypass - Zojila Axis',
      vehiclesCount: 34,
      cargoType: 'Winter Stocking',
      tonnage: 420,
      status: 'Rerouted',
      riskLevel: 'High',
      eta: '7 hrs 10 mins',
      departureTime: '03:15 hrs',
      delayHours: 2.5,
      driverEscort: 'Major S. Nambiar (ASC)',
      gpsCoordinates: { lat: 34.28, lng: 75.32 },
      weatherAlert: 'Zojila upper pass closed due to fresh snow drift; rerouted via Nilgrath bypass',
      checkpoints: [
        { name: 'Udhampur Main Yard', time: '03:15 hrs', passed: true },
        { name: 'Banihal Transit Depot', time: '07:45 hrs', passed: true },
        { name: 'Sonamarg Choke Point', time: '12:10 hrs', passed: true },
        { name: 'Zojila Bypass Tunnel Portal', time: '15:30 hrs', passed: false },
        { name: 'Drass Brigade Yard', time: '19:40 hrs', passed: false }
      ]
    },
    {
      id: 'CV-442-W',
      callsign: 'CHETAK-2',
      source: 'COD Agra',
      destination: 'Desert Strike Depot (Jodhpur)',
      route: 'Agra - Jaipur - Jodhpur NH25 Express Corridor',
      vehiclesCount: 22,
      cargoType: 'Class IX (Spares)',
      tonnage: 210,
      status: 'In-Transit',
      riskLevel: 'Low',
      eta: '1 hr 15 mins',
      departureTime: '08:00 hrs',
      delayHours: 0,
      driverEscort: 'Havildar M. Rathore (EME)',
      gpsCoordinates: { lat: 26.28, lng: 73.02 },
      checkpoints: [
        { name: 'COD Agra Central Spares Bay', time: '08:00 hrs', passed: true },
        { name: 'Jaipur Military Bypass', time: '12:00 hrs', passed: true },
        { name: 'Jodhpur EME Field Workshop', time: '15:15 hrs', passed: false }
      ]
    },
    {
      id: 'CV-505-S',
      callsign: 'TRISHUL-8',
      source: 'COD Jabalpur',
      destination: 'Secunderabad Staging Hub',
      route: 'Jabalpur - Nagpur - Hyderabad Corridor',
      vehiclesCount: 18,
      cargoType: 'Class V (Ammunition)',
      tonnage: 280,
      status: 'In-Transit',
      riskLevel: 'Low',
      eta: '3 hrs 50 mins',
      departureTime: '05:30 hrs',
      delayHours: 0,
      driverEscort: 'Subedar G. Reddy (AOC)',
      gpsCoordinates: { lat: 18.52, lng: 78.48 }
    }
  ]);

  // Comprehensive National Unit Network across all Commands of India
  unitNetwork = signal<UnitNetworkItem[]>(
    ALL_INDIAN_ARMY_UNITS.map(u => ({
      id: u.id,
      name: u.name,
      type: u.type,
      region: u.command,
      location: `${u.station} • ${u.sector}`,
      personnel: u.personnel,
      readiness: u.readiness,
      inventoryHealth: u.inventoryHealth,
      riskLevel: u.riskLevel,
      pendingRequests: u.activeIndents,
      onlineStatus: u.onlineStatus,
      dos: u.daysOfSupply,
      commander: u.commanderRankName || u.officerName
    }))
  );

  // National Inventory Catalog
  inventoryCatalog = signal<InventoryItem[]>([
    {
      id: 'INV-POL-01',
      item: 'Sub-Zero High Speed Diesel (Grade -40°C)',
      category: 'Class III (POL)',
      totalQuantity: '4,850,000 Litres',
      allocated: '3,820,000 Litres',
      available: '1,030,000 Litres',
      safetyStock: '750,000 Litres',
      daysOfSupply: 62,
      stockoutRisk: 'Low',
      status: 'Adequate',
      location: 'Northern Command POL Reserves'
    },
    {
      id: 'INV-RAT-02',
      item: 'High Altitude High-Calorie Ration Packs (MRE)',
      category: 'Class I (Rations)',
      totalQuantity: '1,240,000 Packs',
      allocated: '950,000 Packs',
      available: '290,000 Packs',
      safetyStock: '180,000 Packs',
      daysOfSupply: 78,
      stockoutRisk: 'Low',
      status: 'Adequate',
      location: 'COD Pathankot & COD Narangi'
    },
    {
      id: 'INV-AM-03',
      item: '155mm Dhanush / K9 Vajra HE Ammunition',
      category: 'Class V (Munitions)',
      totalQuantity: '98,000 Rounds',
      allocated: '72,000 Rounds',
      available: '26,000 Rounds',
      safetyStock: '15,000 Rounds',
      daysOfSupply: 42,
      stockoutRisk: 'Low',
      status: 'Adequate',
      location: 'COD Jabalpur Central Munitions'
    },
    {
      id: 'INV-SPR-04',
      item: 'BMP-II Infantry Combat Vehicle Tracks & Pins',
      category: 'Class IX (Spares)',
      totalQuantity: '4,200 Sets',
      allocated: '3,650 Sets',
      available: '550 Sets',
      safetyStock: '600 Sets',
      daysOfSupply: 26,
      stockoutRisk: 'Moderate',
      status: 'Depleted',
      location: 'COD Agra Central Spares Bay'
    },
    {
      id: 'INV-CLO-05',
      item: 'Extreme Cold Climate (ECC) Multilayer Suits',
      category: 'Medical & Special',
      totalQuantity: '65,000 Suits',
      allocated: '58,000 Suits',
      available: '7,000 Suits',
      safetyStock: '5,000 Suits',
      daysOfSupply: 55,
      stockoutRisk: 'Low',
      status: 'Adequate',
      location: '21 Base Depot Udhampur'
    },
    {
      id: 'INV-MED-06',
      item: 'Cold Injury Plasma Packs & Antidotes',
      category: 'Medical & Special',
      totalQuantity: '32,000 Kits',
      allocated: '24,000 Kits',
      available: '8,000 Kits',
      safetyStock: '4,000 Kits',
      daysOfSupply: 80,
      stockoutRisk: 'Low',
      status: 'Adequate',
      location: 'Base Hospital Leh & Guwahati'
    },
    {
      id: 'INV-AV-07',
      item: 'Aviation Turbine Fuel (ATF Grade JP-8)',
      category: 'Class III (POL)',
      totalQuantity: '2,900,000 Litres',
      allocated: '2,400,000 Litres',
      available: '500,000 Litres',
      safetyStock: '400,000 Litres',
      daysOfSupply: 45,
      stockoutRisk: 'Low',
      status: 'Adequate',
      location: 'Leh & Thoise Forward Airfields'
    }
  ]);

  // Strategic Alerts
  alerts = signal<StrategicAlert[]>([
    {
      id: 'ALT-881',
      theater: 'Northern Command',
      sector: 'Ladakh - Siachen Axis',
      type: 'Weather Risk',
      severity: 'Critical',
      headline: 'Severe Cold Wave Forecast (-34°C) along Siachen - DBO Highway',
      details: 'Satellite radar indicates 140 km/h blizzard winds starting in 36 hours. Road transit over Khardung La will be closed for at least 48 hours.',
      affectedUnit: '3 PARA (SF) & 14 RAJPUT',
      affectedSupply: 'Class III Winter Sub-Zero POL & Fresh Medical Plasma',
      recommendedAction: 'Preposition 18,000L sub-zero POL and 300 emergency medical plasma packs to Partapur & Shyok forward nodes via Convoy GARUDA-01 immediately.',
      timestamp: 'Today 08:30 hrs',
      contributingFactors: [
        'Western disturbance atmospheric depression',
        'Drop in nighttime temperature to -34°C',
        'Avalanche warning Grade 4 issued by DGRE'
      ],
      aiExplanation: 'Neural predictive network trained on 15-year seasonal weather logs projects a 92% likelihood of a 3-day road blockage. Prepositioning today avoids expensive IAF emergency sorties.',
      alternativeActions: [
        'Place IAF Mi-17V5 helicopters on standby at Thoise',
        'Hold resupply and draw down existing 48-day buffer'
      ],
      expectedImpact: 'Maintains 100% operational readiness with zero risk of freeze-induced vehicle immobilizations.'
    },
    {
      id: 'ALT-882',
      theater: 'Eastern Command',
      sector: 'Tawang Sector (Arunachal)',
      type: 'Demand Surge',
      severity: 'High',
      headline: 'Predicted 28% Surge in Class I Rations & Winter Heating Fuel',
      details: 'AI consumption prediction models detect early onset of mountain frost and deployment expansion along LAC border pickets.',
      affectedUnit: '8 GARHWAL RIFLES',
      affectedSupply: 'Class I Rations & Kerosene Fuel',
      recommendedAction: 'Augment Narangi-Tawang convoy frequency from bi-weekly to tri-weekly. Dispatch additional 40 tonnes dry rations.',
      timestamp: 'Today 10:15 hrs',
      contributingFactors: [
        'Pre-winter troop movement reinforcement',
        'Early snowfall predicted over Sela Pass'
      ],
      aiExplanation: 'Machine learning demand regression model flags high correlation between localized frost reports and caloric intake surges (+400 kcal/soldier/day).',
      alternativeActions: [
        'Redistribute excess reserve from Bomdila staging base',
        'Authorize local civilian emergency procurement'
      ],
      expectedImpact: 'Eliminates potential 14-day stock deficiency before Sela pass winter restrictions.'
    },
    {
      id: 'ALT-883',
      theater: 'Western Command',
      sector: 'Desert Sector (Rajasthan)',
      type: 'Stock Critical',
      severity: 'Medium',
      headline: 'T-90 Tank Air Filtration Spares Reached Re-Order Threshold',
      details: 'Intense sandstorm operations accelerated filtration element wear to 84% of monthly buffer at 2 Armoured Regiment.',
      affectedUnit: '2 ARMOURED REGIMENT',
      affectedSupply: 'Class IX T-90 High-Dust Filtration Assemblies',
      recommendedAction: 'Trigger automatic release order from COD Jabalpur for 120 filter assemblies via Convoy CHETAK-2.',
      timestamp: 'Today 12:45 hrs',
      contributingFactors: [
        'High-density sandstorm exposure during desert combat exercises',
        'Standard filter service life degraded by 35%'
      ],
      aiExplanation: 'Telemetry predictive maintenance sensors across 42 tanks logged particulate pressure spikes triggering automated reorder protocol.',
      alternativeActions: [
        'Clean existing filters via ultrasonic bath at Field Workshop',
        'Transfer 40 filters from Southern Command reserve at Pune'
      ],
      expectedImpact: 'Maintains tank fleet 98.1% combat availability without engine power loss.'
    },
    {
      id: 'ALT-884',
      theater: 'Northern Command',
      sector: 'Zojila Axis',
      type: 'Route Disruption',
      severity: 'High',
      headline: 'Zojila Pass Upper Sector Landslide Hazard Triggered',
      details: 'Convoy HIMALAYA-9 encountered fresh rockfall and icing at Km 84. Upper axis temporarily restricted.',
      affectedUnit: '19 ARTILLERY REGIMENT',
      affectedSupply: 'Class V Munitions & Winter Buffer',
      recommendedAction: 'Activate BRO Secondary Tunnel Bypass at Nilgrath. Re-route 34 vehicles with military police escort.',
      timestamp: 'Today 13:20 hrs',
      contributingFactors: [
        'Unseasonal rain followed by sudden sub-zero freeze',
        'Rockfall slope destabilization reported by BRO'
      ],
      aiExplanation: 'Automated Route Optimization engine computed alternate axis adding 42 minutes but reducing slope hazard probability from 78% to 4%.',
      alternativeActions: [
        'Halt convoy at Sonamarg transit depot until BRO clears rockfall',
        'Split convoy into smaller 6-vehicle packets'
      ],
      expectedImpact: 'Safe delivery of 420 tonnes defense stores with only 2.5 hours total ETA delay.'
    }
  ]);

  // Weather & Terrain Intelligence Stations
  weatherStations = signal<WeatherStationData[]>([
    {
      location: 'Siachen Base Camp (Ladakh)',
      passName: 'Khardung La Axis',
      elevation: '17,800 ft',
      temperature: '-26°C',
      rainfallSnow: '42 cm fresh snow',
      windSpeed: '64 km/h (Gale)',
      visibility: '300 meters',
      alert: 'AVALANCHE WARNING - RED ALERT',
      accessibility: 'Chains Required',
      riskScore: 78,
      alternativeRoute: 'Nubra Valley Low Altitude Corridor'
    },
    {
      location: 'Zojila Pass (J&K)',
      passName: 'Zojila Mountain Pass',
      elevation: '11,575 ft',
      temperature: '-14°C',
      rainfallSnow: '18 cm snow / black ice',
      windSpeed: '45 km/h',
      visibility: '800 meters',
      alert: 'BLACK ICE & ROCKFALL ADVISORY',
      accessibility: 'Convoy Restriced',
      riskScore: 65,
      alternativeRoute: 'Nilgrath Lower Tunnel Bypass'
    },
    {
      location: 'Sela Pass (Arunachal Pradesh)',
      passName: 'Sela Tunnel Axis',
      elevation: '13,700 ft',
      temperature: '-8°C',
      rainfallSnow: 'Dense fog & frost',
      windSpeed: '28 km/h',
      visibility: '150 meters',
      alert: 'LOW VISIBILITY & FOG ADVISORY',
      accessibility: 'Open',
      riskScore: 32,
      alternativeRoute: 'Sela Twin-Tube Tunnel All-Weather Axis'
    },
    {
      location: 'Nathu La (Sikkim)',
      passName: 'Nathu La Pass',
      elevation: '14,140 ft',
      temperature: '-11°C',
      rainfallSnow: 'Light snow flurry',
      windSpeed: '38 km/h',
      visibility: '1.2 km',
      alert: 'NORMAL HIGH ALTITUDE WEATHER',
      accessibility: 'Open',
      riskScore: 24
    },
    {
      location: 'Longewala (Rajasthan Desert)',
      passName: 'Thar Desert Axis',
      elevation: '550 ft',
      temperature: '38°C',
      rainfallSnow: 'Dry / Dust storm',
      windSpeed: '52 km/h',
      visibility: '500 meters',
      alert: 'HEAT & SANDSTORM ADVISORY',
      accessibility: 'Open',
      riskScore: 40
    }
  ]);

  // Strategic Indents Signal
  indents = signal<UnitIndent[]>([
    {
      id: 'IND-2026-9041',
      unitName: '14 RAJPUT (MECHANISED)',
      category: 'Class III (POL)',
      itemDescription: 'Sub-Zero High Speed Diesel (Winter Grade -40°C)',
      requestedQty: '18,000 Litres',
      urgency: 'Operational Priority 1',
      dateCreated: 'Today 08:30 hrs',
      requiredBy: '2026-10-10',
      reason: 'Pre-winter reserve replenishment for FDL Leh Sector',
      status: 'Approved by DGOS',
      remarks: 'Pre-winter reserve replenishment for FDL Leh Sector'
    },
    {
      id: 'IND-2026-9042',
      unitName: '14 RAJPUT (MECHANISED)',
      category: 'Class IX (Spares)',
      itemDescription: 'BMP-II Track Pins, Rubber Bushings & Cold-Start Batteries',
      requestedQty: '48 Sets',
      urgency: 'Routine',
      dateCreated: 'Today 11:15 hrs',
      requiredBy: '2026-10-15',
      reason: 'Scheduled preventive track overhaul',
      status: 'Dispatched from COD',
      remarks: 'Dispatched via Convoy GARUDA-01'
    },
    {
      id: 'IND-2026-9043',
      unitName: '3 PARA (SPECIAL FORCES)',
      category: 'ECC / Winter Clothing',
      itemDescription: 'Special Glacier Multi-layer Suits & High-Altitude Ration Packs',
      requestedQty: '320 Kits',
      urgency: 'Operational Priority 1',
      dateCreated: 'Today 06:00 hrs',
      requiredBy: '2026-10-08',
      reason: 'Winter patrol mobilization to forward pickets',
      status: 'Pending HQ Approval',
      remarks: 'Urgent requisition for upcoming forward deployment'
    },
    {
      id: 'IND-2026-9044',
      unitName: '19 ARTILLERY REGIMENT',
      category: 'Class V (Ammo)',
      itemDescription: '155mm Extended Range Bi-Modular Charge Systems',
      requestedQty: '450 Rounds',
      urgency: 'Operational Priority 1',
      dateCreated: 'Today 11:20 hrs',
      requiredBy: '2026-10-12',
      reason: 'Scheduled tactical firing exercise readiness',
      status: 'Pending HQ Approval',
      remarks: 'Scheduled tactical firing exercise readiness'
    }
  ]);

  // Unit Specific Stock Levels (For 14 Rajput)
  unitStock = signal({
    unitName: '14 RAJPUT (MECHANISED)',
    unitId: 'UN-14RM-LEH',
    sector: 'FDL Leh - Shyok Axis',
    daysOfStock: 48,
    classI: { current: '48 Days', capacity: '60 Days', percentage: 80, status: 'Healthy', notes: 'Fresh: 12 Days | MRE/Dry: 36 Days' },
    classIII: { current: '16,200 L', capacity: '20,000 L', percentage: 81, status: 'Adequate', notes: 'Winter Grade HSD: 12,400L | 2T Oil: 3,800L' },
    classV: { current: '94.5% UBL', capacity: '100% UBL', percentage: 94.5, status: 'Optimal', notes: 'Small arms 100% | ATGM missiles 92%' },
    classIX: { current: '82%', capacity: '100%', percentage: 82, status: 'Review Needed', notes: '4 BMP-II suspension pads pending receipt' },
    readinessScore: 97.4
  });

  // What-If Simulation State
  simulationState = signal({
    scenario: 'Zojila Pass Avalanche & Extreme Cold Wave',
    intensity: 65,
    airliftSupport: true,
    demandMultiplier: 25,
    inventoryAdjustment: -15,
    simulatedDaysOfStock: 24,
    projectedShortfallHour: 110,
    readinessDelta: -4.2,
    stockoutRisk: 'Low (Controlled via Buffer)',
    alternateRoutesFound: 2,
    requiredBuffer: '24,000 Litres Fuel & 120 T Rations',
    remedyRecommendation: 'Reroute 65% cargo via Atal Tunnel-Keylong axis. Task 2x IAF C-130J sorties for emergency medical & Class V ammo.'
  });

  // Actions
  addIndent(indent: Omit<UnitIndent, 'id' | 'dateCreated' | 'status'>) {
    const newIndent: UnitIndent = {
      ...indent,
      id: `IND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      dateCreated: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      status: 'Pending HQ Approval'
    };
    this.indents.update(items => [newIndent, ...items]);
    return newIndent;
  }

  approveIndent(id: string) {
    this.indents.update(items =>
      items.map(item => item.id === id ? { ...item, status: 'Approved by DGOS' } : item)
    );
  }

  dispatchIndent(id: string) {
    this.indents.update(items =>
      items.map(item => item.id === id ? { ...item, status: 'Dispatched from COD' } : item)
    );
  }

  runSimulation(scenario: string, intensity: number, airlift: boolean, demandChange: number = 25, invChange: number = -15) {
    const days = Math.max(14, Math.round(34 - (intensity * 0.22) + (airlift ? 6 : 0) + (invChange * 0.2)));
    const shortfall = Math.max(36, Math.round(150 - intensity * 1.2 + (airlift ? 48 : 0)));
    const readinessDelta = -(Math.min(18, Math.round((intensity * 0.15) - (airlift ? 5 : 0))));

    this.simulationState.set({
      scenario,
      intensity,
      airliftSupport: airlift,
      demandMultiplier: demandChange,
      inventoryAdjustment: invChange,
      simulatedDaysOfStock: days,
      projectedShortfallHour: shortfall,
      readinessDelta: readinessDelta,
      stockoutRisk: intensity > 75 && !airlift ? 'High Risk' : (intensity > 50 ? 'Moderate' : 'Low Buffer'),
      alternateRoutesFound: intensity > 70 ? 1 : 2,
      requiredBuffer: `${Math.round(18000 * (1 + intensity / 100))} Litres POL & ${Math.round(80 * (1 + intensity / 100))} Tonnes Stores`,
      remedyRecommendation: airlift
        ? `IAF Airlift sorties active (+6 Days buffer). Stock stabilized across forward pickets with zero stockouts.`
        : `Surface roads under high pressure. Recommend activating emergency IAF AN-32/C-17 airlift sorties immediately.`
    });
  }
}
