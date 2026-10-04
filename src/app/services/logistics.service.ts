import { Injectable, signal } from '@angular/core';

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
  gpsCoordinates: { lat: number; lng: number };
  weatherAlert?: string;
}

export interface UnitIndent {
  id: string;
  unitName: string;
  category: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Ammo)' | 'Class IX (Spares)' | 'ECC / Winter Clothing';
  itemDescription: string;
  requestedQty: string;
  urgency: 'Routine' | 'Operational Priority 1' | 'SOS Emergency';
  dateCreated: string;
  status: 'Pending HQ Approval' | 'Approved by DGOS' | 'Dispatched from COD' | 'Delivered';
  remarks?: string;
}

export interface StrategicAlert {
  id: string;
  theater: string;
  sector: string;
  type: 'Weather Risk' | 'Demand Surge' | 'Stock Critical' | 'Convoy Bottleneck';
  severity: 'Amber' | 'Red' | 'Yellow';
  headline: string;
  details: string;
  recommendedAction: string;
  timestamp: string;
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
      driverEscort: 'Subedar R. P. Yadav (ASC)',
      gpsCoordinates: { lat: 32.55, lng: 77.21 },
      weatherAlert: 'Light snow flurry near Baralacha La pass'
    },
    {
      id: 'CV-209-E',
      callsign: 'BRAHMAPUTRA-4',
      source: 'COD Narangi (Guwahati)',
      destination: 'Forward Base Tawang (4 Corps)',
      route: 'Bhalukpong - Bomdila - Sela Tunnel',
      vehiclesCount: 16,
      cargoType: 'Class V (Ammunition)',
      tonnage: 190,
      status: 'In-Transit',
      riskLevel: 'Low',
      eta: '2 hrs 40 mins',
      driverEscort: 'Naib Subedar K. Gogoi (AOC)',
      gpsCoordinates: { lat: 27.58, lng: 91.86 }
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
      driverEscort: 'Major S. Nambiar (ASC)',
      gpsCoordinates: { lat: 34.28, lng: 75.32 },
      weatherAlert: 'Zojila upper axis closed due to icing; rerouted via lower tunnel bypass'
    },
    {
      id: 'CV-442-W',
      callsign: 'CHETAK-2',
      source: 'COD Agra',
      destination: 'Desert Strike Depot (Jodhpur)',
      route: 'Agra - Jaipur - Jodhpur NH25',
      vehiclesCount: 22,
      cargoType: 'Class IX (Spares)',
      tonnage: 210,
      status: 'In-Transit',
      riskLevel: 'Low',
      eta: '1 hr 15 mins',
      driverEscort: 'Havildar M. Rathore (EME)',
      gpsCoordinates: { lat: 26.28, lng: 73.02 }
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
      dateCreated: '2026-10-03 08:30 hrs',
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
      dateCreated: '2026-10-03 14:15 hrs',
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
      dateCreated: '2026-10-04 06:00 hrs',
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
      dateCreated: '2026-10-04 11:20 hrs',
      status: 'Pending HQ Approval',
      remarks: 'Scheduled tactical firing exercise readiness'
    }
  ]);

  // Strategic Alerts
  alerts = signal<StrategicAlert[]>([
    {
      id: 'ALT-881',
      theater: 'Northern Command',
      sector: 'Ladakh - Siachen Axis',
      type: 'Weather Risk',
      severity: 'Red',
      headline: 'Severe Cold Wave Forecast (-32°C) in Siachen Base / DBO Axis',
      details: 'Satellite meteorological data indicates 140km/h blizzard winds starting in 36 hours. Road transit to Khardung La will be halted for 48 hours.',
      recommendedAction: 'Preposition 12,000L sub-zero POL and dry rations to Partapur forward replenishment node immediately.',
      timestamp: '2026-10-04 09:15'
    },
    {
      id: 'ALT-882',
      theater: 'Eastern Command',
      sector: 'Tawang Sector (Arunachal)',
      type: 'Demand Surge',
      severity: 'Amber',
      headline: 'Predicted 28% Surge in Class I Fresh Rations & Fuel Requirement',
      details: 'AI consumption prediction models detect early onset of mountain frost affecting localized greenhouse yield.',
      recommendedAction: 'Augment Narangi-Tawang convoy frequency from bi-weekly to tri-weekly.',
      timestamp: '2026-10-04 11:45'
    },
    {
      id: 'ALT-883',
      theater: 'Western Command',
      sector: 'Desert Sector (Rajasthan)',
      type: 'Stock Critical',
      severity: 'Yellow',
      headline: 'T-90 Tank Filtration Spares Reached Re-Order Threshold',
      details: 'Heavy sandstorm operations accelerated air cleaner consumption to 82% of monthly buffer.',
      recommendedAction: 'Trigger automatic release order from COD Jabalpur for 120 filter assemblies.',
      timestamp: '2026-10-04 13:00'
    }
  ]);

  // Unit Specific Stock Levels (For 14 Rajput)
  unitStock = signal({
    unitName: '14 RAJPUT (MECHANISED)',
    sector: 'FDL Leh - Shyok Axis',
    daysOfStock: 28,
    classI: { current: '28 Days', capacity: '35 Days', percentage: 80, status: 'Healthy', notes: 'Fresh: 6 Days | MRE/Dry: 22 Days' },
    classIII: { current: '16,200 L', capacity: '20,000 L', percentage: 81, status: 'Adequate', notes: 'Winter Grade HSD: 12,400L | 2T Oil: 3,800L' },
    classV: { current: '94.5% UBL', capacity: '100% UBL', percentage: 94.5, status: 'Optimal', notes: 'Small arms 100% | Anti-tank missiles 92%' },
    classIX: { current: '82%', capacity: '100%', percentage: 82, status: 'Review Needed', notes: '4 BMP-II suspension pads pending receipt' },
    readinessScore: 92
  });

  // What-If Simulation State
  simulationState = signal({
    scenario: 'Zojila Pass Avalanche & Winter Surge',
    intensity: 65,
    airliftSupport: true,
    simulatedDaysOfStock: 22,
    projectedShortfallHour: 96,
    alternateRoutesFound: 2,
    remedyRecommendation: 'Reroute 60% cargo via Atal Tunnel-Keylong axis. Task 2x IAF C-130J sorties for emergency medical & Class V ammo.'
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

  runSimulation(scenario: string, intensity: number, airlift: boolean) {
    let days = Math.max(12, Math.round(30 - (intensity * 0.2) + (airlift ? 4 : 0)));
    let shortfall = Math.max(48, Math.round(140 - intensity * 1.1 + (airlift ? 36 : 0)));

    this.simulationState.set({
      scenario,
      intensity,
      airliftSupport: airlift,
      simulatedDaysOfStock: days,
      projectedShortfallHour: shortfall,
      alternateRoutesFound: intensity > 70 ? 1 : 2,
      remedyRecommendation: airlift
        ? `IAF Airlift sorties active (+${airlift ? 4 : 0} Days buffer). Stock stabilized across forward pickets.`
        : `Surface roads under high pressure. Recommend activating emergency IAF AN-32/C-17 airlift sorties.`
    });
  }
}
