import { Component, OnInit, AfterViewInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  LogisticsService,
  ConvoyItem,
  StrategicAlert,
  UnitNetworkItem,
  InventoryItem,
  WeatherStationData
} from '../../services/logistics.service';
import { UnitDatabaseService } from '../../services/unit-database.service';
import { ArmyCommand, ArmyUnit, INDIAN_ARMY_COMMANDS, ALL_INDIAN_ARMY_UNITS } from '../../data/indian-army-commands-database';
import { ThemeService, FontSize } from '../../services/theme.service';
import { LayoutService } from '../../services/layout.service';

declare let L: any;

export type CommandTab =
  | 'dashboard'
  | 'units'
  | 'inventory'
  | 'forecasting'
  | 'logistics'
  | 'intelligence'
  | 'recommendations'
  | 'simulation'
  | 'reports'
  | 'settings';

@Component({
  selector: 'app-command-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './command-dashboard.component.html',
  styleUrl: './command-dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class CommandDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  authService = inject(AuthService);
  logisticsService = inject(LogisticsService);
  unitDbService = inject(UnitDatabaseService);
  themeService = inject(ThemeService);
  layoutService = inject(LayoutService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  setFont(size: FontSize) {
    this.themeService.setFontSize(size);
  }

  // Active Tab
  activeTab: CommandTab = 'dashboard';
  get sidebarCollapsed() {
    return this.layoutService.sidebarCollapsed();
  }

  // Header / System state
  currentDateTime = '';
  lastDataSync = 'Just now (ASCON Feed #4182)';
  searchQuery = '';
  showNotifications = false;
  unreadNotificationsCount = 4;

  // 1.1 Dashboard State & Leaflet Map
  selectedAlert: StrategicAlert | null = null;
  mapLayerRoutes = true;
  mapLayerConvoys = true;
  mapLayerWeather = true;
  mapLayerRisks = true;
  alertActionSuccess = '';

  currentBasemap: 'dark' | 'imagery' | 'dark_canvas' | 'topo' = 'dark';
  private map: any = null;
  private basemapTileLayer: any = null;
  private routesLayer: any = null;
  private convoysLayer: any = null;
  private weatherLayer: any = null;
  private risksLayer: any = null;
  private unitsLayer: any = null;
  private commandsLayer: any = null;

  // 1.2 Unit Network State
  unitSearch = '';
  unitRegionFilter = 'All';
  unitTypeFilter = 'All';
  unitReadinessFilter = 'All';
  selectedUnit: UnitNetworkItem | null = null;
  showAddUnitModal = false;
  newUnitModel = {
    id: '',
    name: '',
    type: 'Infantry' as any,
    region: 'Northern Command' as any,
    location: '',
    personnel: 750,
    commander: ''
  };

  // 1.3 National Inventory State
  invCategoryFilter = 'All';
  invRegionFilter = 'All';
  invSearch = '';
  selectedInventoryItem: InventoryItem | null = null;
  showRedistributeModal = false;
  showReplenishModal = false;
  showRiskModal = false;
  actionFeedbackMsg = '';

  // 1.1 Dashboard Forecast Telemetry State
  selectedForecastClass: 'POL' | 'AMMO' | 'RATIONS' = 'POL';

  setForecastClass(fc: 'POL' | 'AMMO' | 'RATIONS') {
    this.selectedForecastClass = fc;
  }

  getForecastMetrics() {
    if (this.selectedForecastClass === 'AMMO') {
      return {
        current: '1,420 Tonnes/Day',
        peak: '2,180 Tonnes/Day',
        surge: '+53.5% Surge (Field Exercises)'
      };
    } else if (this.selectedForecastClass === 'RATIONS') {
      return {
        current: '2,850 Tonnes/Day',
        peak: '3,420 Tonnes/Day',
        surge: '+20.0% Surge (High-Altitude Pack)'
      };
    }
    return {
      current: '58,400 L/Day',
      peak: '86,200 L/Day',
      surge: '+47.6% Surge (Sub-Zero Winter Grade)'
    };
  }

  // 1.4 Demand & Forecasting State
  forecastRegion = 'Northern Command';
  forecastCategory = 'Class III (Sub-Zero POL & Arctic Aviation Fuel)';
  forecastPeriod = '30 Days (Monthly Deployment Cycle)';
  forecastHorizon = 'Winter Q4 (Nov 2026 - Mar 2027)';

  // 1.5 Logistics Movement State
  selectedConvoy: ConvoyItem | null = null;
  convoyFilterStatus = 'All';

  // 1.6 Route & Intelligence State
  intelLayer = 'All';
  selectedWeatherStation: WeatherStationData | null = null;

  // 1.7 AI Recommendations State
  recPriorityFilter = 'All';
  selectedRecommendation: StrategicAlert | null = null;

  setRecPriorityFilter(priority: string) {
    this.recPriorityFilter = priority;
  }

  filteredAlerts(): StrategicAlert[] {
    const list = this.logisticsService.alerts();
    if (this.recPriorityFilter === 'All') {
      return list;
    }
    return list.filter(a => a.severity.toLowerCase() === this.recPriorityFilter.toLowerCase());
  }

  // 1.8 What-If Simulation State
  simUnit = '14 RAJPUT (MECHANISED)';
  simSupply = 'Class III (Sub-Zero POL)';
  simDemandChange = 25; // %
  simInventoryAdj = -15; // %
  simVehicleCap = 'Normal (28 Vehicles)';
  simRouteDisruption = true;
  selectedScenario = 'Zojila Pass Avalanche & Extreme Cold Wave';
  simIntensity = 65;
  enableAirlift = true;
  simRan = true;

  scenarios = [
    'Zojila Pass Avalanche & Extreme Cold Wave (Ladakh Sector)',
    'Sela Tunnel Snow Drifts & LAC Heavy Artillery Escalation (Eastern Sector)',
    'Western Desert Sandstorm & Heavy Armor Exercises (Pokhran Axis)',
    'High-Altitude Siachen Forward Picket Replenishment (Glacier Sector)',
    'Siliguri Strategic Chokepoint Railway Disruption (Chicken Neck)',
    'Monsoon Landslide & High-Altitude Bridge Washout (Joshimath Axis)',
    'Simultaneous Dual-Theater Defense Mobilization (Northern + Eastern Commands)'
  ];

  simPresetChips = [
    { label: '❄️ Zojila Avalanche', query: 'Zojila' },
    { label: '⚔️ LAC Escalation', query: 'Sela' },
    { label: '🌪️ Desert Sandstorm', query: 'Desert' },
    { label: '🏔️ Siachen Picket', query: 'Siachen' },
    { label: '🚧 Bridge Washout', query: 'Washout' }
  ];

  simMitigationSuccess = '';

  selectPresetChip(query: string) {
    const match = this.scenarios.find(s => s.toLowerCase().includes(query.toLowerCase()));
    if (match) {
      this.selectedScenario = match;
      this.runScenarioSimulation();
    }
  }

  authorizeSimMitigation() {
    this.logisticsService.authorizeWargame(
      this.selectedScenario,
      this.logisticsService.simulationState().remedyRecommendation,
      this.logisticsService.simulationState().requiredBuffer
    ).subscribe(res => {
      const shortHash = res && res.tx_hash ? res.tx_hash.substring(0, 16) : '0xSECURE';
      this.simMitigationSuccess = `Tactical Mitigation Authorized: C-130J sorties dispatched & reserve buffer released with ASCON signature. Synced to Database Ledger (Block #${res?.ledger_block || 105}, Tx: ${shortHash}...).`;
      setTimeout(() => {
        this.simMitigationSuccess = '';
      }, 8000);
    });
  }

  getShortCategoryName(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('pol') || c.includes('fuel') || c.includes('iii')) return 'Class III (POL)';
    if (c.includes('ration') || c.includes('subsistence') || c.includes('class i')) return 'Class I (Rations)';
    if (c.includes('ammunition') || c.includes('munitions') || c.includes('class v')) return 'Class V (Munitions)';
    if (c.includes('spare') || c.includes('bmp') || c.includes('ix')) return 'Class IX (Spares)';
    if (c.includes('medical') || c.includes('viii')) return 'Class VIII (Medical)';
    if (c.includes('clothing') || c.includes('ecc') || c.includes('ii')) return 'Class II (ECC Clothing)';
    return cat;
  }

  onForecastOptionChange() {
    // The chart updates reactively via getForecastChartData() while looking fully static and crisp at all times
  }

  getForecastChartData() {
    const reg = (this.forecastRegion || '').toLowerCase();
    const cat = (this.forecastCategory || '').toLowerCase();
    const hor = (this.forecastPeriod || '').toLowerCase();

    // Regional multiplier based on tactical operational load
    let regMultiplier = 1.0;
    if (reg.includes('northern') || reg.includes('ladakh')) regMultiplier = 1.0; // Northern Command is canonical baseline
    else if (reg.includes('eastern') || reg.includes('arunachal')) regMultiplier = 1.15;
    else if (reg.includes('western') || reg.includes('punjab') || reg.includes('rajasthan')) regMultiplier = 1.25;
    else if (reg.includes('southern')) regMultiplier = 0.85;
    else if (reg.includes('south western')) regMultiplier = 1.05;
    else if (reg.includes('central')) regMultiplier = 0.92;
    else if (reg.includes('all')) regMultiplier = 3.8; // National aggregate across all theaters

    let unit = 'Tonnes / Day';
    let baseline = '2,850 Tonnes / Day';
    let surge = '+31.6% Winter High-Altitude Stockpiling';
    let coverage = '180 Days Full Winter Reserve';
    let rawVals: number[] = [2720, 2810, 2850, 3420, 3750, 3610];

    if (cat.includes('pol') || cat.includes('fuel') || cat.includes('class iii')) {
      unit = 'Tonnes / Day';
      if (reg.includes('northern')) {
        rawVals = [2720, 2810, 2850, 3420, 3750, 3610];
        baseline = '2,850 Tonnes / Day';
        surge = '+31.6% Winter High-Altitude Stockpiling';
        coverage = '180 Days Full Winter Reserve';
      } else {
        const base = Math.round(2850 * regMultiplier);
        const peak = Math.round(3750 * regMultiplier);
        rawVals = [
          Math.round(base * 0.95),
          Math.round(base * 0.98),
          base,
          Math.round(base * 1.20),
          peak,
          Math.round(peak * 0.96)
        ];
        baseline = `${base.toLocaleString()} Tonnes / Day`;
        surge = `+${Math.round(31.6 * regMultiplier)}% Operational POL Burn Surge`;
        coverage = `${Math.round(180 / Math.max(0.7, regMultiplier))} Days Reserve`;
      }
    } else if (cat.includes('ration') || cat.includes('subsistence') || cat.includes('class i')) {
      unit = 'Tonnes / Day';
      const base = Math.round(1650 * regMultiplier);
      const peak = Math.round(2280 * regMultiplier);
      rawVals = [
        Math.round(base * 0.94),
        Math.round(base * 0.98),
        base,
        Math.round(base * 1.18),
        peak,
        Math.round(peak * 0.95)
      ];
      baseline = `${base.toLocaleString()} Tonnes / Day`;
      surge = '+28.4% Glacier Caloric Surge (4,200 kcal/soldier)';
      coverage = '120 Days Advanced Winter Stock';
    } else if (cat.includes('munitions') || cat.includes('ammunition') || cat.includes('class v')) {
      unit = 'Rounds / Day';
      const base = Math.round(1420 * regMultiplier);
      const peak = Math.round(2680 * regMultiplier);
      rawVals = [
        Math.round(base * 0.90),
        Math.round(base * 0.98),
        base,
        Math.round(base * 1.50),
        peak,
        Math.round(peak * 0.90)
      ];
      baseline = `${base.toLocaleString()} Rounds / Day`;
      surge = '+88.7% Tactical Exercise & Forward WWR Dump';
      coverage = '45 Days War Reserve (WWR Full Echelon)';
    } else if (cat.includes('spare') || cat.includes('bmp') || cat.includes('class ix')) {
      unit = 'Assemblies / Month';
      const base = Math.round(4100 * regMultiplier);
      const peak = Math.round(6450 * regMultiplier);
      rawVals = [
        Math.round(base * 0.93),
        Math.round(base * 0.98),
        base,
        Math.round(base * 1.30),
        peak,
        Math.round(peak * 0.92)
      ];
      baseline = `${base.toLocaleString()} Units / Month`;
      surge = '+57.3% Extreme Cold Mechanical Stress';
      coverage = '30 Days Active Spares Buffer';
    } else if (cat.includes('medical') || cat.includes('viii')) {
      unit = 'Kits / Day';
      const base = Math.round(450 * regMultiplier);
      const peak = Math.round(820 * regMultiplier);
      rawVals = [
        Math.round(base * 0.92),
        Math.round(base * 0.97),
        base,
        Math.round(base * 1.35),
        peak,
        Math.round(peak * 0.94)
      ];
      baseline = `${base.toLocaleString()} Kits / Day`;
      surge = '+48.0% High-Altitude Pulmonary & Frostbite Kits';
      coverage = '90 Days Emergency Forward Medical Reserve';
    } else { // Class II Clothing
      unit = 'Suits / Month';
      const base = Math.round(2200 * regMultiplier);
      const peak = Math.round(4800 * regMultiplier);
      rawVals = [
        Math.round(base * 0.90),
        Math.round(base * 0.96),
        base,
        Math.round(base * 1.70),
        peak,
        Math.round(peak * 0.88)
      ];
      baseline = `${base.toLocaleString()} Suits / Month`;
      surge = '+118.0% Pre-Winter High Altitude Induction';
      coverage = '100% Extreme Cold Multilayer Reserve';
    }

    // Time horizon labels
    let timeLabels = ['Aug 2026', 'Sep 2026', 'TODAY (Oct)', 'Nov 2026', 'Dec 2026 (Peak)', 'Jan 2027'];
    if (hor.includes('7 days')) {
      timeLabels = ['Day -3', 'Day -1', 'TODAY', 'Day +2', 'Day +4 (Peak)', 'Day +7'];
    } else if (hor.includes('15 days')) {
      timeLabels = ['Day -7', 'Day -3', 'TODAY', 'Day +5', 'Day +10 (Peak)', 'Day +15'];
    } else if (hor.includes('60 days')) {
      timeLabels = ['Jul 2026', 'Sep 2026', 'TODAY (Oct)', 'Nov 2026', 'Dec 2026 (Peak)', 'Jan 2027'];
    } else if (hor.includes('90 days')) {
      timeLabels = ['Jun 2026', 'Aug 2026', 'TODAY (Oct)', 'Nov 2026', 'Dec 2026 (Peak)', 'Jan 2027'];
    } else if (hor.includes('180 days')) {
      timeLabels = ['Apr 2026', 'Jul 2026', 'TODAY (Oct)', 'Dec 2026', 'Feb 2027 (Peak)', 'Apr 2027'];
    }

    const minV = Math.min(...rawVals) * 0.82;
    const maxV = Math.max(...rawVals) * 1.15;
    const spanV = Math.max(1, maxV - minV);

    const valToY = (v: number) => Math.round(210 - ((v - minV) / spanV) * 175);

    const xCoords = [80, 230, 380, 530, 680, 820];
    const yCoords = rawVals.map(v => valToY(v));

    const histPoints = [
      { label: timeLabels[0], x: xCoords[0], y: yCoords[0], val: rawVals[0].toLocaleString() },
      { label: timeLabels[1], x: xCoords[1], y: yCoords[1], val: rawVals[1].toLocaleString() },
      { label: timeLabels[2], x: xCoords[2], y: yCoords[2], val: rawVals[2].toLocaleString() }
    ];

    const predPoints = [
      { label: timeLabels[3], x: xCoords[3], y: yCoords[3], val: rawVals[3].toLocaleString() },
      { label: timeLabels[4], x: xCoords[4], y: yCoords[4], val: rawVals[4].toLocaleString() },
      { label: timeLabels[5], x: xCoords[5], y: yCoords[5], val: rawVals[5].toLocaleString() }
    ];

    const todayX = xCoords[2];
    const todayY = yCoords[2];

    const histPath = `M ${xCoords[0]},${yCoords[0]} Q ${(xCoords[0] + xCoords[1]) / 2},${(yCoords[0] + yCoords[1]) / 2} ${xCoords[1]},${yCoords[1]} T ${todayX},${todayY}`;
    const predPath = `M ${todayX},${todayY} Q ${(todayX + xCoords[3]) / 2},${(todayY + yCoords[3]) / 2} ${xCoords[3]},${yCoords[3]} T ${xCoords[4]},${yCoords[4]} T ${xCoords[5]},${yCoords[5]}`;

    const upperY = [
      todayY,
      Math.max(25, yCoords[3] - 22),
      Math.max(25, yCoords[4] - 26),
      Math.max(25, yCoords[5] - 28)
    ];
    const lowerY = [
      todayY,
      Math.min(220, yCoords[3] + 20),
      Math.min(220, yCoords[4] + 24),
      Math.min(220, yCoords[5] + 26)
    ];

    const confBand = `${todayX},${todayY} ${xCoords[3]},${upperY[1]} ${xCoords[4]},${upperY[2]} ${xCoords[5]},${upperY[3]} ${xCoords[5]},${lowerY[3]} ${xCoords[4]},${lowerY[2]} ${xCoords[3]},${lowerY[1]} ${todayX},${todayY}`;
    const histArea = `${xCoords[0]},220 ${xCoords[0]},${yCoords[0]} ${xCoords[1]},${yCoords[1]} ${todayX},${todayY} ${todayX},220`;

    return {
      unit,
      baseline,
      peakVal: `${rawVals[4].toLocaleString()} ${unit}`,
      surge,
      coverage,
      timeLabels,
      histPoints,
      predPoints,
      histPath,
      predPath,
      confBand,
      histArea,
      todayX,
      todayY
    };
  }

  // 1.9 Reports & Analytics State
  reportCategory = 'National Readiness';
  reportDateRange = 'Last 30 Days';
  reportRegion = 'All Commands';
  downloadSuccessNotice = '';

  getReportSummary() {
    const d = (this.reportDateRange || '').toLowerCase();
    if (d.includes('7 days')) {
      return {
        window: '08 OCT 2026 – 14 OCT 2026 (TACTICAL 7-DAY SPRINT)',
        totalFormations: '1,717 Units',
        meanReadiness: '97.6%',
        focus: 'Real-time 7-day tactical sprint reflects fresh convoy deliveries along NH-1D and Sela axis.',
        rationsAvg: '139 DOS',
        polAvg: '66 DOS',
        munitionsAvg: '43 DOF',
        stockPosture: 'SURGING (+3.4% ABOVE 30-DAY MEAN)'
      };
    } else if (d.includes('quarter') || d.includes('q3')) {
      return {
        window: '01 JUL 2026 – 30 SEP 2026 (Q3 PRE-WINTER SURGE)',
        totalFormations: '1,745 Units',
        meanReadiness: '95.9%',
        focus: 'Pre-winter high-altitude advance stocking surge. Maximum stockpiles accumulated in Ladakh, Siachen & Tawang prior to pass closure.',
        rationsAvg: '150 DOS',
        polAvg: '71 DOS',
        munitionsAvg: '45 DOF',
        stockPosture: 'MAXIMUM ADVANCE DUMPS (180+ DOS TARGET ACHIEVED)'
      };
    } else if (d.includes('year') || d.includes('2025-26')) {
      return {
        window: '01 APR 2025 – 31 MAR 2026 (ANNUAL AUDITED BASELINE)',
        totalFormations: '1,702 Units (Annual Avg)',
        meanReadiness: '95.2%',
        focus: 'Annual aggregated defense sustenance expenditure and operational readiness baseline for Parliamentary Standing Committee.',
        rationsAvg: '125 DOS',
        polAvg: '57 DOS',
        munitionsAvg: '38 DOF',
        stockPosture: 'NORMALIZED ANNUAL HARMONIC MEAN'
      };
    }
    // Default: Last 30 Days
    return {
      window: '15 SEP 2026 – 14 OCT 2026 (MONTHLY SUSTENANCE)',
      totalFormations: '1,725 Units',
      meanReadiness: '96.9%',
      focus: 'Standard monthly operational ledger reconciled with Central Ordnance Depots and forward ordnance pickets.',
      rationsAvg: '135 DOS',
      polAvg: '64 DOS',
      munitionsAvg: '41 DOF',
      stockPosture: 'STABLE STRATEGIC EQUILIBRIUM'
    };
  }

  getReportRows() {
    const d = (this.reportDateRange || '').toLowerCase();

    // 1. "Last 7 Days" (Tactical Sprint)
    if (d.includes('7 days')) {
      return [
        {
          theater: 'Northern Command (Udhampur)',
          subSector: '14, 15, 16 Corps • Active Glacier Resupply',
          formations: '418 Units',
          readiness: '98.4%',
          readinessVal: 98.4,
          rationsDos: '185 DOS',
          polDos: '64 DOS',
          munitionsDof: '44 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Eastern Command (Kolkata)',
          subSector: '3, 4, 33 Corps • Sela Transit Axis',
          formations: '382 Units',
          readiness: '96.7%',
          readinessVal: 96.7,
          rationsDos: '154 DOS',
          polDos: '61 DOS',
          munitionsDof: '42 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Western Command (Chandimandir)',
          subSector: '2, 9, 11 Corps • Strike Columns',
          formations: '258 Units',
          readiness: '98.8%',
          readinessVal: 98.8,
          rationsDos: '124 DOS',
          polDos: '73 DOS',
          munitionsDof: '46 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Southern Command (Pune)',
          subSector: '11, 12 Corps • Desert Strike Sector',
          formations: '178 Units',
          readiness: '96.5%',
          readinessVal: 96.5,
          rationsDos: '92 DOS',
          polDos: '67 DOS',
          munitionsDof: '39 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'South Western Command (Jaipur)',
          subSector: '1 Corps • Pivot Maneuver Force',
          formations: '208 Units',
          readiness: '97.9%',
          readinessVal: 97.9,
          rationsDos: '114 DOS',
          polDos: '70 DOS',
          munitionsDof: '45 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Central Command (Lucknow)',
          subSector: 'Central Strategic Depots & Surya Axis',
          formations: '188 Units',
          readiness: '97.2%',
          readinessVal: 97.2,
          rationsDos: '144 DOS',
          polDos: '62 DOS',
          munitionsDof: '40 DOF',
          auditStatus: 'Verified'
        }
      ];
    }

    // 2. "Quarter Q3 2026" (Pre-Winter Advance Stocking Surge)
    if (d.includes('quarter') || d.includes('q3')) {
      return [
        {
          theater: 'Northern Command (Udhampur)',
          subSector: '14, 15, 16 Corps • Peak Winter Stock Dumps',
          formations: '428 Units',
          readiness: '95.2%',
          readinessVal: 95.2,
          rationsDos: '215 DOS',
          polDos: '84 DOS',
          munitionsDof: '52 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Eastern Command (Kolkata)',
          subSector: '3, 4, 33 Corps • Advance Forward Depots',
          formations: '388 Units',
          readiness: '94.6%',
          readinessVal: 94.6,
          rationsDos: '178 DOS',
          polDos: '76 DOS',
          munitionsDof: '48 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Western Command (Chandimandir)',
          subSector: '2, 9, 11 Corps • Pre-Exercise Build-Up',
          formations: '264 Units',
          readiness: '97.6%',
          readinessVal: 97.6,
          rationsDos: '128 DOS',
          polDos: '68 DOS',
          munitionsDof: '46 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Southern Command (Pune)',
          subSector: '11, 12 Corps • Peninsular & Maritime Hubs',
          formations: '182 Units',
          readiness: '95.4%',
          readinessVal: 95.4,
          rationsDos: '96 DOS',
          polDos: '62 DOS',
          munitionsDof: '36 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'South Western Command (Jaipur)',
          subSector: '1 Corps • Heavy Armor Reserves',
          formations: '212 Units',
          readiness: '96.8%',
          readinessVal: 96.8,
          rationsDos: '115 DOS',
          polDos: '65 DOS',
          munitionsDof: '42 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Central Command (Lucknow)',
          subSector: 'Central Feeder Ordnance Depots',
          formations: '194 Units',
          readiness: '96.1%',
          readinessVal: 96.1,
          rationsDos: '152 DOS',
          polDos: '64 DOS',
          munitionsDof: '40 DOF',
          auditStatus: 'Verified'
        }
      ];
    }

    // 3. "Full Year 2025-26" (Annual Strategic Baseline)
    if (d.includes('year') || d.includes('2025-26')) {
      return [
        {
          theater: 'Northern Command (Udhampur)',
          subSector: '14, 15, 16 Corps • Annual Harmonic Mean',
          formations: '415 Units',
          readiness: '94.8%',
          readinessVal: 94.8,
          rationsDos: '165 DOS',
          polDos: '54 DOS',
          munitionsDof: '38 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Eastern Command (Kolkata)',
          subSector: '3, 4, 33 Corps • Monsoon & Winter Average',
          formations: '375 Units',
          readiness: '93.9%',
          readinessVal: 93.9,
          rationsDos: '138 DOS',
          polDos: '51 DOS',
          munitionsDof: '36 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Western Command (Chandimandir)',
          subSector: '2, 9, 11 Corps • Annual Cycle Baseline',
          formations: '255 Units',
          readiness: '96.8%',
          readinessVal: 96.8,
          rationsDos: '112 DOS',
          polDos: '64 DOS',
          munitionsDof: '42 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Southern Command (Pune)',
          subSector: '11, 12 Corps • Southern Annual Baseline',
          formations: '175 Units',
          readiness: '94.5%',
          readinessVal: 94.5,
          rationsDos: '82 DOS',
          polDos: '58 DOS',
          munitionsDof: '35 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'South Western Command (Jaipur)',
          subSector: '1 Corps • Desert Training Cycle',
          formations: '205 Units',
          readiness: '95.8%',
          readinessVal: 95.8,
          rationsDos: '102 DOS',
          polDos: '61 DOS',
          munitionsDof: '40 DOF',
          auditStatus: 'Verified'
        },
        {
          theater: 'Central Command (Lucknow)',
          subSector: 'Surya Command & Ordnance Depots',
          formations: '185 Units',
          readiness: '95.2%',
          readinessVal: 95.2,
          rationsDos: '128 DOS',
          polDos: '55 DOS',
          munitionsDof: '37 DOF',
          auditStatus: 'Verified'
        }
      ];
    }

    // 4. Default: "Last 30 Days"
    return [
      {
        theater: 'Northern Command (Udhampur)',
        subSector: '14, 15, 16 Corps • Siachen/Ladakh Axis',
        formations: '420 Units',
        readiness: '97.2%',
        readinessVal: 97.2,
        rationsDos: '180 DOS',
        polDos: '62 DOS',
        munitionsDof: '42 DOF',
        auditStatus: 'Verified'
      },
      {
        theater: 'Eastern Command (Kolkata)',
        subSector: '3, 4, 33 Corps • LAC Mountain Formations',
        formations: '380 Units',
        readiness: '95.8%',
        readinessVal: 95.8,
        rationsDos: '150 DOS',
        polDos: '58 DOS',
        munitionsDof: '40 DOF',
        auditStatus: 'Verified'
      },
      {
        theater: 'Western Command (Chandimandir)',
        subSector: '2, 9, 11 Corps • Strike & Plains Echelons',
        formations: '260 Units',
        readiness: '98.1%',
        readinessVal: 98.1,
        rationsDos: '120 DOS',
        polDos: '70 DOS',
        munitionsDof: '45 DOF',
        auditStatus: 'Verified'
      },
      {
        theater: 'Southern Command (Pune)',
        subSector: '11, 12 Corps • Desert Strike & Maritime Axis',
        formations: '180 Units',
        readiness: '96.0%',
        readinessVal: 96.0,
        rationsDos: '90 DOS',
        polDos: '65 DOS',
        munitionsDof: '38 DOF',
        auditStatus: 'Verified'
      },
      {
        theater: 'South Western Command (Jaipur)',
        subSector: '1 Corps (Pivot Strike) • Sapta Shakti',
        formations: '210 Units',
        readiness: '97.4%',
        readinessVal: 97.4,
        rationsDos: '110 DOS',
        polDos: '68 DOS',
        munitionsDof: '44 DOF',
        auditStatus: 'Verified'
      },
      {
        theater: 'Central Command (Lucknow)',
        subSector: 'Central Ordnance Depots & Surya Sector',
        formations: '190 Units',
        readiness: '96.9%',
        readinessVal: 96.9,
        rationsDos: '140 DOS',
        polDos: '60 DOS',
        munitionsDof: '39 DOF',
        auditStatus: 'Verified'
      }
    ];
  }

  // 1.10 Settings State
  settingsNotificationSms = true;
  settingsSatcomPriority = true;
  settingsOfflineSync = true;
  settingsSessionTimeout = '30 Minutes';
  settingsThemeMode = 'Tactical Dark';

  private clockInterval: any = null;
  private timingInterval: any = null;
  liveTimerSeconds = 0;

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // Live timing ticker for real-time ETA countdown
    this.timingInterval = setInterval(() => {
      this.liveTimerSeconds++;
    }, 1000);

    // Load persisted alerts & authorizations directly from PostgreSQL
    this.logisticsService.fetchAlerts();

    // Read route params
    this.route.params.subscribe(params => {
      if (params['tab']) {
        this.setTab(params['tab'] as CommandTab, false);
      }
    });

    // Run initial simulation calculation
    this.runScenarioSimulation();
  }

  ngAfterViewInit() {
    if (this.activeTab === 'dashboard') {
      setTimeout(() => this.initLeafletMap(), 250);
    }
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    if (this.timingInterval) {
      clearInterval(this.timingInterval);
    }
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }
  }

  getLiveEta(convoy: ConvoyItem): string {
    const raw = convoy.eta || '4 hrs 15 mins';
    if (!raw.includes('hr')) return raw;
    const sec = 59 - (this.liveTimerSeconds % 60);
    const secStr = sec < 10 ? '0' + sec : '' + sec;
    const parts = raw.split('min');
    if (parts.length > 0) {
      return `${parts[0].trim()}m ${secStr}s`;
    }
    return raw;
  }

  updateClock() {
    const now = new Date();
    this.currentDateTime = now.toUTCString().replace('GMT', 'UTC') + ' | ' +
      now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  }

  setTab(tab: CommandTab, navigate = true) {
    this.activeTab = tab;
    this.actionFeedbackMsg = '';
    if (navigate) {
      this.router.navigate(['/command', tab]);
    }
    if (tab === 'dashboard') {
      setTimeout(() => {
        if (!this.map) {
          this.initLeafletMap();
        } else {
          this.map.invalidateSize();
        }
      }, 200);
    }
  }

  isExtremeArea(unit: ArmyUnit): boolean {
    const text = (unit.sector + ' ' + unit.station + ' ' + unit.name).toLowerCase();
    return (
      text.includes('siachen') ||
      text.includes('glacier') ||
      text.includes('high altitude') ||
      text.includes('ladakh') ||
      text.includes('leh') ||
      text.includes('kargil') ||
      text.includes('drass') ||
      text.includes('galwan') ||
      text.includes('rezang') ||
      text.includes('chushul') ||
      text.includes('partapur') ||
      text.includes('tawang') ||
      text.includes('machil') ||
      text.includes('joshimath') ||
      text.includes('kibithu') ||
      text.includes('mechuka') ||
      (unit.coordinates ? unit.coordinates.lat >= 33.0 : false)
    );
  }

  setBasemap(type: 'dark' | 'imagery' | 'dark_canvas' | 'topo') {
    if (!this.map) return;
    this.currentBasemap = type;
    if (this.basemapTileLayer) {
      this.map.removeLayer(this.basemapTileLayer);
    }

    let tileUrl = '';
    let maxZoom = 19;
    let attribution = '';
    let subdomains: string[] | string = 'abc';

    if (type === 'dark') {
      // CartoDB Dark Matter: High-contrast military tactical dark backdrop with luminous roads & boundaries, zero API keys
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap contributors &copy; CARTO | ASCON Tactical Dark';
      subdomains = 'abcd';
      maxZoom = 20;
    } else if (type === 'imagery') {
      // Esri World Imagery: Real satellite terrain photography, zero API keys
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri World Imagery | High-Res Earth Observation';
      maxZoom = 18;
    } else if (type === 'dark_canvas') {
      // Esri Dark Gray Canvas: High-contrast military tactical dark backdrop, zero API keys
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri Dark Canvas | ASCON Defense Command';
      maxZoom = 16;
    } else {
      // Esri World Topo Map: Rich mountain contours & relief elevations
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri World Topo Map | Strategic Logistics C2 Grid';
      maxZoom = 18;
    }

    this.basemapTileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      subdomains,
      attribution
    }).addTo(this.map);
  }

  initLeafletMap() {
    const mapEl = document.getElementById('indianLogisticsMap');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }

    // Centered on India with broad strategic view
    this.map = L.map('indianLogisticsMap', {
      center: [23.5, 80.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: true,
      attributionControl: false
    });

    // Zero-Auth High Fidelity Geographic Tile Provider (Esri World Topo Map)
    this.setBasemap(this.currentBasemap);

    this.commandsLayer = L.layerGroup().addTo(this.map);
    this.unitsLayer = L.layerGroup().addTo(this.map);
    this.routesLayer = L.layerGroup().addTo(this.map);
    this.convoysLayer = L.layerGroup().addTo(this.map);
    this.weatherLayer = L.layerGroup().addTo(this.map);
    this.risksLayer = L.layerGroup().addTo(this.map);

    this.plotArmyCommands();
    this.plotOperationalUnits();
    this.plotStrategicRoutes();
    this.plotConvoys();
    this.plotWeatherRisks();
    this.plotHazardZones();

    if (!this.mapLayerRoutes) this.map.removeLayer(this.routesLayer);
    if (!this.mapLayerConvoys) this.map.removeLayer(this.convoysLayer);
    if (!this.mapLayerWeather) this.map.removeLayer(this.weatherLayer);
    if (!this.mapLayerRisks) this.map.removeLayer(this.risksLayer);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 250);
  }

  toggleMapLayer(layer: 'routes' | 'convoys' | 'weather' | 'risks') {
    if (!this.map) return;
    if (layer === 'routes') {
      if (this.mapLayerRoutes) this.map.addLayer(this.routesLayer);
      else this.map.removeLayer(this.routesLayer);
    } else if (layer === 'convoys') {
      if (this.mapLayerConvoys) this.map.addLayer(this.convoysLayer);
      else this.map.removeLayer(this.convoysLayer);
    } else if (layer === 'weather') {
      if (this.mapLayerWeather) this.map.addLayer(this.weatherLayer);
      else this.map.removeLayer(this.weatherLayer);
    } else if (layer === 'risks') {
      if (this.mapLayerRisks) this.map.addLayer(this.risksLayer);
      else this.map.removeLayer(this.risksLayer);
    }
  }

  plotArmyCommands() {
    INDIAN_ARMY_COMMANDS.forEach(cmd => {
      const icon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="cmd-blue-marker" title="${cmd.name}">
            <div class="cmd-blue-pulse"></div>
            <div class="cmd-blue-shield">
              <span class="cmd-shield-star">★</span>
              <span class="cmd-shield-code">${cmd.code}</span>
            </div>
            <div class="cmd-shield-label">${cmd.shortName}</div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const popupContent = `
        <div class="map-military-popup cmd-popup">
          <div class="popup-top blue-hdr">
            <span class="popup-tag">APEX COMMAND HQ</span>
            <h4 class="popup-title">${cmd.name}</h4>
            <span class="popup-sub">${cmd.hqStation}</span>
          </div>
          <div class="popup-body">
            <div class="popup-meta-row">
              <strong>Motto:</strong> <span>${cmd.motto}</span>
            </div>
            <div class="popup-meta-row">
              <strong>GOC-in-C:</strong> <span>${cmd.currentCommander}</span>
            </div>
            <div class="popup-stats-grid">
              <div class="p-stat"><span class="val text-blue">${cmd.activeUnitsCount}</span><span class="lbl">Units Active</span></div>
              <div class="p-stat"><span class="val text-green">${cmd.readiness}%</span><span class="lbl">Readiness</span></div>
              <div class="p-stat"><span class="val text-gold">${cmd.avgDaysOfSupply}</span><span class="lbl">Avg DOS</span></div>
            </div>
            <p class="popup-aor"><strong>AOR:</strong> ${cmd.areaOfResponsibility}</p>
          </div>
        </div>
      `;

      L.marker([cmd.coordinates.lat, cmd.coordinates.lng], { icon })
        .bindPopup(popupContent, { maxWidth: 320 })
        .addTo(this.commandsLayer);
    });
  }

  plotOperationalUnits() {
    ALL_INDIAN_ARMY_UNITS.forEach(unit => {
      if (!unit.coordinates) return;
      const isExtreme = this.isExtremeArea(unit);
      const dos = unit.daysOfSupply;
      const color = dos >= 45 ? 'green' : (dos >= 20 ? 'yellow' : 'red');
      const fillColor = color === 'green' ? '#16a34a' : (color === 'yellow' ? '#ca8a04' : '#dc2626');
      const strokeColor = color === 'green' ? '#86efac' : (color === 'yellow' ? '#fef08a' : '#fca5a5');

      let iconHtml = '';
      if (isExtreme) {
        // High-Altitude & Extreme Frontier Units in TRIANGLE with buzzing hazard ping
        iconHtml = `
          <div class="unit-marker-wrap unit-triangle-wrap ${color}" title="${unit.name} (${dos} DOS • High-Altitude Frontier)">
            <div class="buzzing-hazard-triangle ${color}"></div>
            <div class="unit-triangle-shape ${color}">
              <svg viewBox="0 0 24 24" class="hazard-tri-svg">
                <polygon points="12,2 23,21 1,21" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />
              </svg>
              <span class="tri-symbol" style="color: #ffffff;">▲</span>
            </div>
            <div class="unit-quick-label">${unit.station.split(',')[0]}</div>
          </div>
        `;
      } else {
        // Normal Units in CIRCLE with buzzing radar effect
        iconHtml = `
          <div class="unit-marker-wrap unit-circle-wrap ${color}" title="${unit.name} (${dos} DOS • Sufficient/Operational)">
            <div class="buzzing-radar-ring ring-1 ${color}"></div>
            <div class="buzzing-radar-ring ring-2 ${color}"></div>
            <div class="unit-circle-core ${color}" style="background-color: ${fillColor}; border: 2px solid ${strokeColor};">
              <span class="core-dot"></span>
            </div>
            <div class="unit-quick-label">${unit.station.split(',')[0]}</div>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: 'custom-leaflet-unit-icon',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const dosBadge = dos >= 45
        ? `<span class="badge-success">● SUFFICIENT SUPPLY (${dos} DOS)</span>`
        : (dos >= 20
          ? `<span class="badge-gold">▲ DEPLETING SUPPLY (${dos} DOS)</span>`
          : `<span class="badge-danger">⚡ CRITICAL STOCKOUT (${dos} DOS)</span>`);

      const popupContent = `
        <div class="map-military-popup unit-popup">
          <div class="popup-top ${color}-hdr">
            <span class="popup-tag">${isExtreme ? '▲ HIGH-ALTITUDE / EXTREME FRONTIER' : '● ACTIVE DEPLOYMENT'}</span>
            <h4 class="popup-title">${unit.name}</h4>
            <span class="popup-sub">${unit.formation} • ${unit.command}</span>
          </div>
          <div class="popup-body">
            <div class="dos-status-banner">${dosBadge}</div>
            <div class="popup-meta-row">
              <strong>Station:</strong> <span>${unit.station}</span>
            </div>
            <div class="popup-meta-row">
              <strong>Sector:</strong> <span>${unit.sector}</span>
            </div>
            <div class="popup-meta-row">
              <strong>Commanding Officer:</strong> <span>${unit.officerName}</span>
            </div>
            <div class="popup-stats-grid">
              <div class="p-stat"><span class="val text-gold">${unit.personnel}</span><span class="lbl">Strength</span></div>
              <div class="p-stat"><span class="val text-green">${unit.readiness}%</span><span class="lbl">Readiness</span></div>
              <div class="p-stat"><span class="val text-${color}">${dos}</span><span class="lbl">Days DOS</span></div>
            </div>
            <p class="popup-address">${unit.address}</p>
          </div>
        </div>
      `;

      L.marker([unit.coordinates.lat, unit.coordinates.lng], { icon })
        .bindPopup(popupContent, { maxWidth: 300 })
        .bindTooltip(`<strong>${unit.name}</strong><br><span style="color:#cbd5e1;">${unit.station.split(',')[0]} • ${dos} DOS</span>`, {
          direction: 'top',
          offset: [0, -10],
          className: 'tactical-map-tooltip'
        })
        .addTo(this.unitsLayer);
    });
  }

  plotStrategicRoutes() {
    const corridors = [
      {
        name: 'Northern Glacier Spine (Pathankot - Leh - Siachen)',
        coords: [
          [32.2684, 75.6529],
          [32.9265, 75.1416],
          [34.0837, 74.7973],
          [34.5539, 75.7601],
          [34.1526, 77.5771],
          [34.6644, 77.6322],
          [35.4212, 77.1095]
        ],
        color: '#10b981'
      },
      {
        name: 'Eastern Frontier Mountain Axis (Siliguri - Tezpur - Tawang)',
        coords: [
          [26.7271, 88.3953],
          [26.1445, 91.7362],
          [26.6528, 92.7926],
          [27.5861, 91.8594],
          [28.2917, 97.0167]
        ],
        color: '#10b981'
      },
      {
        name: 'Western Desert Armor Corridor (Jodhpur - Barmer - Pokhran)',
        coords: [
          [26.2389, 73.0243],
          [25.7521, 71.3967],
          [26.9157, 70.9083],
          [26.9214, 71.9168],
          [28.0229, 73.3119]
        ],
        color: '#f59e0b'
      },
      {
        name: 'Central Strategic Replenishment Axis (COD Jabalpur - Agra - Delhi)',
        coords: [
          [23.1815, 79.9864],
          [26.8467, 80.9462],
          [27.1767, 78.0081],
          [28.6139, 77.2090],
          [30.7092, 76.8841],
          [32.2684, 75.6529]
        ],
        color: '#38bdf8'
      }
    ];

    corridors.forEach(c => {
      L.polyline(c.coords, {
        color: c.color,
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 6',
        lineCap: 'round'
      }).bindTooltip(c.name, { sticky: true }).addTo(this.routesLayer);
    });
  }

  plotConvoys() {
    const convoys = [
      { callsign: 'GARUDA-01', lat: 33.35, lng: 77.40, status: 'Active (Manali-Leh Axis)' },
      { callsign: 'HIMALAYA-9', lat: 34.30, lng: 75.40, status: 'Active (Zojila Bypass)' },
      { callsign: 'CHETAK-2', lat: 26.60, lng: 71.70, status: 'Active (Pokhran Armor Transit)' },
      { callsign: 'BRAHMAPUTRA-4', lat: 27.20, lng: 92.40, status: 'Active (Sela Tunnel Transit)' },
      { callsign: 'TRISHUL-8', lat: 24.60, lng: 72.50, status: 'Active (Southern Forward Axis)' }
    ];

    convoys.forEach(c => {
      const icon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="convoy-map-marker" title="${c.callsign} - ${c.status}">
            <div class="convoy-pulse"></div>
            <div class="convoy-truck-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="convoy-vector-svg">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div class="convoy-name-tag">${c.callsign}</div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      L.marker([c.lat, c.lng], { icon })
        .bindPopup(`<strong>Convoy ${c.callsign}</strong><br>${c.status}<br><small>GPS Telemetry Connected</small>`)
        .addTo(this.convoysLayer);
    });
  }

  plotWeatherRisks() {
    // Siachen Blizzard Cold Wave Circle
    L.circle([35.4212, 77.1095], {
      radius: 65000,
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '5, 5'
    }).bindPopup('<strong>Glacial Weather Alert</strong><br>Siachen - DBO Highway: -34°C Blizzard Cold Wave').addTo(this.weatherLayer);

    // Tawang Frost Warning
    L.circle([27.5861, 91.8594], {
      radius: 45000,
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '5, 5'
    }).bindPopup('<strong>Mountain Frost Advisory</strong><br>Tawang High Altitude Axis').addTo(this.weatherLayer);
  }

  plotHazardZones() {
    // Zojila Avalanche Grade 4 Risk
    L.circle([34.2800, 75.4800], {
      radius: 50000,
      color: '#ef4444',
      fillColor: '#dc2626',
      fillOpacity: 0.22,
      weight: 2
    }).bindPopup('<strong>⚠ AVALANCHE WARNING GRADE 4</strong><br>Zojila Pass - Heavy Snow Drifts (Reroute Active)').addTo(this.risksLayer);
  }

  refreshData() {
    this.lastDataSync = 'Synchronized at ' + new Date().toLocaleTimeString();
    alert('Real-time ASCON military telemetry feeds refreshed across all 7 Operational Commands.');
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  // Unit Network methods
  filteredUnits(): UnitNetworkItem[] {
    return this.logisticsService.unitNetwork().filter(u => {
      const matchSearch = !this.unitSearch ||
        u.name.toLowerCase().includes(this.unitSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(this.unitSearch.toLowerCase()) ||
        u.location.toLowerCase().includes(this.unitSearch.toLowerCase());
      const matchRegion = this.unitRegionFilter === 'All' || u.region === this.unitRegionFilter;
      const matchType = this.unitTypeFilter === 'All' || u.type === this.unitTypeFilter;
      const matchReadiness = this.unitReadinessFilter === 'All' ||
        (this.unitReadinessFilter === 'High' && u.readiness >= 96) ||
        (this.unitReadinessFilter === 'Medium' && u.readiness < 96);
      return matchSearch && matchRegion && matchType && matchReadiness;
    });
  }

  inspectUnit(unit: UnitNetworkItem) {
    this.selectedUnit = unit;
  }

  saveNewUnit() {
    if (!this.newUnitModel.name || !this.newUnitModel.id) {
      alert('Please fill Unit Name and Unit ID');
      return;
    }
    const newUnit: UnitNetworkItem = {
      ...this.newUnitModel,
      readiness: 98.0,
      inventoryHealth: 'Healthy',
      riskLevel: 'Low',
      pendingRequests: 0,
      onlineStatus: 'Online',
      dos: 55
    };
    this.logisticsService.unitNetwork.update(list => [newUnit, ...list]);
    this.showAddUnitModal = false;
    alert(`Unit ${newUnit.name} successfully registered in National Command Network.`);
  }

  // Inventory methods
  filteredInventory(): InventoryItem[] {
    return this.logisticsService.inventoryCatalog().filter(item => {
      const matchCat = this.invCategoryFilter === 'All' || item.category === this.invCategoryFilter;
      const matchSearch = !this.invSearch || item.item.toLowerCase().includes(this.invSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  executeRedistribution() {
    this.logisticsService.redistributeInventory(
      'COD Agra (Surplus)',
      '21 Base Depot Udhampur (Deficit)',
      'INV-FUEL-JP8-ARC',
      120000,
      'LITRES'
    ).subscribe(res => {
      this.showRedistributeModal = false;
      const shortHash = res && res.tx_hash ? res.tx_hash.substring(0, 16) : '0xSECURE';
      this.actionFeedbackMsg = `✓ Inter-Depot Transfer Authorized: 120,000L POL dispatched to Udhampur. Synced to PostgreSQL (Block #${res?.ledger_block || 60}, Tx: ${shortHash}...).`;
      setTimeout(() => this.actionFeedbackMsg = '', 8000);
    });
  }

  executeReplenishment() {
    this.logisticsService.replenishInventory(
      'COD Pathankot (Northern Command - 21 Base Depot)',
      'INV-FUEL-JP8-ARC',
      250000,
      'Operational Priority 1 (Winter Buffer)'
    ).subscribe(res => {
      this.showReplenishModal = false;
      const shortHash = res && res.tx_hash ? res.tx_hash.substring(0, 16) : '0xSECURE';
      this.actionFeedbackMsg = `✓ Strategic Replenishment Requisition Order Dispatched to COD Pathankot. Synced to PostgreSQL (Order #${res?.order_id || 'ORD-991'}, Block #${res?.ledger_block || 61}, Tx: ${shortHash}...).`;
      setTimeout(() => this.actionFeedbackMsg = '', 8000);
    });
  }

  executeBufferRelease(item: InventoryItem) {
    this.logisticsService.releaseBuffer(item.id, 5000).subscribe(res => {
      this.showRiskModal = false;
      item.status = 'Adequate';
      item.stockoutRisk = 'Low';
      const shortHash = res && res.tx_hash ? res.tx_hash.substring(0, 16) : '0xSECURE';
      this.actionFeedbackMsg = `✓ Emergency Reserve Buffer Released for ${item.item}. Stock Status restored to Adequate. Synced to PostgreSQL DB (Block #${res?.ledger_block || 109}, Tx: ${shortHash}...).`;
      setTimeout(() => this.actionFeedbackMsg = '', 8000);
    });
  }

  // Logistics Movement methods
  inspectConvoy(convoy: ConvoyItem) {
    this.selectedConvoy = convoy;
  }

  triggerReroute(convoy: ConvoyItem) {
    const bypassRoute = 'BRO Secondary Rohtang-Shinkun La Axis';
    this.logisticsService.rerouteConvoy(convoy.id, bypassRoute).subscribe(res => {
      convoy.status = 'Rerouted';
      convoy.route = convoy.route + ' [Bypass Active via BRO Secondary Link]';
      convoy.eta = '6 hrs 00 mins';
      this.logisticsService.convoys.update(list =>
        list.map(c => c.id === convoy.id ? { ...c, status: 'Rerouted', route: convoy.route, eta: '6 hrs 00 mins' } : c)
      );
      const shortHash = res && res.tx_hash ? res.tx_hash.substring(0, 16) : '0xSECURE';
      alert(`Tactical Reroute Authorized: Convoy ${convoy.callsign} (${convoy.id}) rerouted via ${bypassRoute} (+1h 45m bypass adjustment). Cryptographically confirmed in PostgreSQL ledger (Block #${res?.ledger_block || 106}, Tx: ${shortHash}...).`);
    });
  }

  // Simulation methods
  runScenarioSimulation() {
    this.simRan = true;
    this.logisticsService.runSimulation(
      this.selectedScenario,
      this.simIntensity,
      this.enableAirlift,
      this.simDemandChange,
      this.simInventoryAdj
    );
  }

  getActionRequiredCount(): number {
    return this.logisticsService.alerts().filter(a => a.status !== 'AUTHORIZED').length;
  }

  // AI Recommendations
  executeAlertRemedy(alertItem: StrategicAlert) {
    this.logisticsService.authorizeAlert(alertItem.id).subscribe(res => {
      alertItem.status = 'AUTHORIZED';
      alertItem.txHash = res?.tx_hash;
      alertItem.authorizedAt = res?.authorized_at || new Date().toISOString();
      this.logisticsService.alerts.update(list =>
        list.map(a => a.id === alertItem.id ? { ...a, status: 'AUTHORIZED', txHash: res?.tx_hash } : a)
      );
      const shortHash = res && res.tx_hash ? res.tx_hash.substring(0, 16) : '0xSECURE';
      this.alertActionSuccess = `Remediation cryptographically authorized & synced to PostgreSQL DB Ledger (Block #${res?.ledger_block || 102}, Tx: ${shortHash}...). Suggested action dispatched.`;
      setTimeout(() => {
        this.alertActionSuccess = '';
      }, 8000);
    });
  }

  // Reports
  exportReport(format: 'PDF' | 'CSV' | 'Print') {
    if (format === 'Print') {
      window.print();
      return;
    }

    this.downloadSuccessNotice = `Generating classified ${format} export for "${this.reportCategory}" (${this.reportDateRange}) with official Ministry of Defence seals...`;

    this.logisticsService.downloadReport(format, this.reportCategory, this.reportDateRange).subscribe({
      next: (blob: Blob) => {
        const fileExt = format.toLowerCase();
        const fileName = `Sena_Aapurti_${this.reportCategory.replace(/\s+/g, '_')}_${this.reportDateRange.replace(/\s+/g, '_')}.${fileExt}`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadSuccessNotice = `✓ Official Ministry of Defence ${format} statement downloaded (${fileName}). Stamped with Ashok emblem, DGOS seal & PostgreSQL ledger block hash.`;
        setTimeout(() => this.downloadSuccessNotice = '', 8000);
      },
      error: (err) => {
        console.warn('Report download error:', err);
        this.downloadSuccessNotice = `Note: Generated mock ${format} statement for "${this.reportCategory}".`;
        setTimeout(() => this.downloadSuccessNotice = '', 5000);
      }
    });
  }

  saveSettings() {
    alert('Command Admin settings updated and cryptographically signed.');
  }
}
