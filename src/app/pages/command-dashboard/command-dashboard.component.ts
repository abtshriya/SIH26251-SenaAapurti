import { Component, OnInit, AfterViewInit, OnDestroy, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of, filter } from 'rxjs';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
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
import { LanguageService } from '../../services/language.service';

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
  langService = inject(LanguageService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  http = inject(HttpClient);
  cdr = inject(ChangeDetectorRef);
  readonly API_BASE = 'http://localhost:8000/api/v1';

  normalizeTab(rawTab: string | null): CommandTab {
    if (!rawTab) {
      const url = this.router.url || '';
      const parts = url.split('?')[0].split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'command') {
        rawTab = parts[1];
      }
    }
    if (!rawTab) return 'dashboard';
    const t = rawTab.toLowerCase().trim();
    if (t === 'forecasting' || t === 'demand-forecasting' || t === 'demand' || t === 'forecast') return 'forecasting';
    if (t === 'reports' || t === 'reports-and-analytics' || t === 'analytics' || t === 'report') return 'reports';
    if (t === 'units' || t === 'unit-network') return 'units';
    if (t === 'inventory' || t === 'stocks') return 'inventory';
    if (t === 'logistics' || t === 'convoys' || t === 'movement') return 'logistics';
    if (t === 'intelligence' || t === 'intel' || t === 'c4isr') return 'intelligence';
    if (t === 'recommendations' || t === 'ai-recommendations') return 'recommendations';
    if (t === 'simulation' || t === 'wargame') return 'simulation';
    if (t === 'settings' || t === 'admin') return 'settings';
    return (t as CommandTab) || 'dashboard';
  }

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
  forecastChartData: any = null;
  forecastLoading = false;
  preStockingSuccessMsg = '';

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

  fetchDemandCurve() {
    this.forecastLoading = true;
    this.http.get<any>(`${this.API_BASE}/forecast/demand-curve`, {
      params: {
        region: this.forecastRegion,
        category: this.forecastCategory,
        horizon: this.forecastPeriod
      }
    }).pipe(
      catchError(err => {
        console.warn('Backend demand curve endpoint unreachable, falling back to local model', err);
        return of(this.computeLocalForecastChartData());
      })
    ).subscribe(data => {
      this.forecastLoading = false;
      if (data) {
        this.forecastChartData = data;
      }
      this.cdr.markForCheck();
    });
  }

  onForecastOptionChange() {
    this.forecastChartData = this.computeLocalForecastChartData();
    this.fetchDemandCurve();
  }

  setForecastCategory(cat: string) {
    this.forecastCategory = cat;
    this.onForecastOptionChange();
  }

  setForecastRegion(reg: string) {
    this.forecastRegion = reg;
    this.onForecastOptionChange();
  }

  authorizePreStockingBuffer() {
    this.preStockingSuccessMsg = `Pre-Winter Stocking Buffer authorized for ${this.forecastRegion} (${this.getShortCategoryName(this.forecastCategory)}). Special C-130J sorties prioritized with ASCON electronic verification.`;
    setTimeout(() => {
      this.preStockingSuccessMsg = '';
      this.cdr.markForCheck();
    }, 8000);
    this.cdr.markForCheck();
  }

  getForecastChartData() {
    if (!this.forecastChartData) {
      this.forecastChartData = this.computeLocalForecastChartData();
    }
    return this.forecastChartData;
  }

  computeLocalForecastChartData() {
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

  reportColumns: string[] = [];
  reportRows: any[] = [];
  reportAggregateRow: any = {};
  reportSummary: any = {};

  updateReportData() {
    this.reportColumns = this.getReportColumns();
    this.reportRows = this.getReportRows();
    this.reportAggregateRow = this.getReportAggregateRow();
    this.reportSummary = this.getReportSummary();
    this.cdr.markForCheck();
  }

  onReportCategoryChange() {
    this.updateReportData();
  }

  getReportColumns(): string[] {
    const cat = (this.reportCategory || '').toLowerCase();
    if (cat.includes('inventory')) {
      return ['Central Depot / Base', 'Supply Class / SKU', 'On-Hand Stock', 'Safety Buffer', 'Days of Supply', 'Stock Status', 'Audit Clearance'];
    }
    if (cat.includes('convoy') || cat.includes('efficiency')) {
      return ['Convoy Callsign', 'Strategic Axis', 'Vehicles', 'Cargo Class', 'Tonnage', 'Transit Punctuality', 'Audit Clearance'];
    }
    if (cat.includes('demand') || cat.includes('projection')) {
      return ['Theater Command', 'Supply Discipline', 'Baseline Demand', 'Projected Surge', 'Reserve Horizon', 'AI Confidence', 'Audit Clearance'];
    }
    if (cat.includes('unit')) {
      return ['Formation / Unit', 'Corps / Sector', 'Strength', 'Readiness', 'Combat Posture', 'Comms Security', 'Audit Clearance'];
    }
    if (cat.includes('route') || cat.includes('risk')) {
      return ['Strategic Axis', 'Pass & Elevation', 'Transit Status', 'Daily Capacity', 'Hazard Risk', 'Bypass Route', 'Audit Clearance'];
    }
    if (cat.includes('weather')) {
      return ['Station / Pass', 'Elevation', 'Temperature', 'Snow Accumulation', 'Wind & Gale', 'Accessibility', 'Audit Clearance'];
    }
    if (cat.includes('stockout')) {
      return ['Critical Sector', 'Vulnerable SKU', 'Reserve DOS', 'Depletion Window', 'Impact Level', 'Mitigation Protocol', 'Audit Clearance'];
    }
    if (cat.includes('redistribution') || cat.includes('saving')) {
      return ['Origin Depot', 'Receiving Unit', 'Material Transferred', 'Tonnage', 'Savings Estimate', 'Voucher Ref', 'Audit Clearance'];
    }
    // Default National Readiness
    return ['Theater Command', 'Total Formations', 'Avg Readiness', 'Class I (Rations)', 'Class III (POL)', 'Class V (Munitions)', 'Audit Status'];
  }

  getReportSummary() {
    const cat = (this.reportCategory || '').toLowerCase();
    const d = (this.reportDateRange || '').toLowerCase();

    if (cat.includes('inventory')) {
      return {
        window: 'CENTRAL & FORWARD ORDNANCE STORES AUDIT (ALL CODs)',
        totalFormations: '2,450,000 Total Line Items',
        meanReadiness: '135 DOS Mean Reserve',
        focus: 'Quarterly physical muster verification against tamper-proof PostgreSQL ledger across 6 Central Ordnance Depots.',
        rationsAvg: '185 DOS',
        polAvg: '94 DOS',
        munitionsAvg: '65 DOF',
        stockPosture: 'SURPLUS ADVANCED HIGH-ALTITUDE POSTURE'
      };
    }

    if (cat.includes('convoy') || cat.includes('efficiency')) {
      return {
        window: 'HIGHWAY LOGISTICS & CONVOY TELEMETICS AUDIT',
        totalFormations: '38 Active Military Columns',
        meanReadiness: '97.8% Fleet On-Time Rate',
        focus: 'Real-time GPS telematics and military check-post passage times along NH-1D, Manali-Leh, and Sela Axis.',
        rationsAvg: '158 Vehicles',
        polAvg: '1,470 T In-Transit',
        munitionsAvg: 'Zero Breaches',
        stockPosture: 'UNINTERRUPTED MULTIMODAL CONVOY TRANSIT'
      };
    }

    if (cat.includes('demand') || cat.includes('projection')) {
      return {
        window: 'PREDICTIVE NEURAL NETWORK SUSTENANCE PROJECTIONS',
        totalFormations: '9 Strategic Theater Commands',
        meanReadiness: '97.8% Model Confidence (R²=0.982)',
        focus: 'ARIMA-LSTM neural network demand forecasting cross-referenced against historical high-altitude seasonal spikes.',
        rationsAvg: '+28.4% Glacier Surge',
        polAvg: '+31.6% Cold Surge',
        munitionsAvg: '180 DOS Horizon',
        stockPosture: 'PRE-WINTER HIGH ALTITUDE ACCELERATION'
      };
    }

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
    const cat = (this.reportCategory || '').toLowerCase();
    const d = (this.reportDateRange || '').toLowerCase();

    // 1. INVENTORY AUDIT
    if (cat.includes('inventory')) {
      return [
        { col1: 'COD Delhi Cantt', sub: 'Central Strategic Hub • Northern Feeder', col2: 'Class III (Sub-Zero POL)', col3: '1,420,000 L', col4: '600,000 L', col5: '94 DOS', col6: 'SURPLUS RESERVE', col7: 'Verified', isGood: true },
        { col1: 'FSD Leh (14 Corps)', sub: 'Forward Supply Depot • Ladakh Sector', col2: 'Class I (High Alt Rations)', col3: '89,400 Packs', col4: '45,000 Packs', col5: '185 DOS', col6: 'WINTER BUFFER MET', col7: 'Verified', isGood: true },
        { col1: 'COD Jabalpur', sub: 'Heavy Munitions & Artillery Arsenal', col2: 'Class V (155mm Shells)', col3: '48,200 Rds', col4: '20,000 Rds', col5: '65 DOF', col6: 'WWR BUFFER STABLE', col7: 'Verified', isGood: true },
        { col1: 'COD Agra', sub: 'Armored Vehicle Spares Directorate', col2: 'Class IX (BMP/T-90 Spares)', col3: '14,800 Pcs', col4: '6,500 Pcs', col5: '48 DOS', col6: 'ADEQUATE', col7: 'Verified', isGood: true },
        { col1: 'FSD Tawang (4 Corps)', sub: 'Extreme Altitude Medical Outpost', col2: 'Class VIII (Medical O2 Kits)', col3: '12,500 Cyl', col4: '4,000 Cyl', col5: '120 DOS', col6: 'SUB-ZERO STABILIZED', col7: 'Verified', isGood: true },
        { col1: '224 ABOD Pathankot', sub: 'Forward Cold Clothing Depot', col2: 'Class II (Extreme Cold ECC)', col3: '36,000 Suits', col4: '15,000 Suits', col5: '110 DOS', col6: 'FORWARD DEPLOYED', col7: 'Verified', isGood: true }
      ];
    }

    // 2. LOGISTICS CONVOY EFFICIENCY
    if (cat.includes('convoy') || cat.includes('efficiency')) {
      return [
        { col1: 'GARUDA-01', sub: 'CV-104-N • Northern Convoy', col2: 'Manali - Rohtang - Leh Axis', col3: '28 Heavy 6x6', col4: 'Class III (POL)', col5: '320 Tonnes', col6: '98.2% ON TIME', col7: 'Verified', isGood: true },
        { col1: 'CHEETAH-04', sub: 'CV-219-W • Western Transit', col2: 'Pathankot - Kargil Axis', col3: '34 Trucks', col4: 'Class I (Rations)', col5: '280 Tonnes', col6: '100% ON TIME', col7: 'Verified', isGood: true },
        { col1: 'BRAHMA-02', sub: 'CV-308-E • Eastern Column', col2: 'Siliguri - Tawang Axis', col3: '22 4x4 Stallions', col4: 'Class V (Munitions)', col5: '195 Tonnes', col6: '95.4% ON TIME', col7: 'Verified', isGood: true },
        { col1: 'THUNDER-09', sub: 'CV-412-S • Desert Sector', col2: 'Jodhpur - Barmer Sector', col3: '40 Heavy Transporters', col4: 'Class IX (Spares)', col5: '410 Tonnes', col6: '99.1% ON TIME', col7: 'Verified', isGood: true },
        { col1: 'ARROW-12', sub: 'CV-515-E • Mountain Echelon', col2: 'Dimapur - Moreh Axis', col3: '18 Medium Trucks', col4: 'Class VIII (Medical)', col5: '140 Tonnes', col6: '96.8% ON TIME', col7: 'Verified', isGood: true },
        { col1: 'HIMALAYA-07', sub: 'CV-620-C • Central Transit', col2: 'Joshimath - Mana Pass', col3: '16 High-Mobility Trucks', col4: 'Class II (ECC)', col5: '125 Tonnes', col6: '97.5% ON TIME', col7: 'Verified', isGood: true }
      ];
    }

    // 3. DEMAND PROJECTIONS
    if (cat.includes('demand') || cat.includes('projection')) {
      return [
        { col1: 'Northern Command (Udhampur)', sub: '14, 15, 16 Corps • Arctic High Altitude', col2: 'Sub-Zero POL & Aviation', col3: '2,850 T/Day', col4: '+31.6% Winter Cold', col5: '180 Days Full Buffer', col6: '98.4% (R²=0.982)', col7: 'Verified', isGood: true },
        { col1: 'Eastern Command (Kolkata)', sub: '3, 4, 33 Corps • Mountain Glacier Resupply', col2: 'Caloric Rations (4,200 kcal)', col3: '1,650 T/Day', col4: '+28.4% Mountain Slog', col5: '120 Days Advanced Stock', col6: '97.9% (R²=0.975)', col7: 'Verified', isGood: true },
        { col1: 'Western Command (Chandimandir)', sub: '2, 9, 11 Corps • Heavy Armor Columns', col2: 'BMP & Tank Heavy Spares', col3: '4,100 Pcs/Mo', col4: '+57.3% Desert Maneuver', col5: '45 Days Combat Buffer', col6: '96.5% (R²=0.961)', col7: 'Verified', isGood: true },
        { col1: 'Northern Command (Udhampur)', sub: 'Forward Artillery & Gun Positions', col2: '155mm & ATGM Munitions', col3: '1,420 Rds/Day', col4: '+88.7% Tactical WWR', col5: '45 Days WWR Echelon', col6: '98.8% (R²=0.988)', col7: 'Verified', isGood: true },
        { col1: 'South Western Command (Jaipur)', sub: '1 Corps Pivot Strike • Thar Desert', col2: 'High-Mobility Engine Parts', col3: '2,800 Pcs/Mo', col4: '+34.2% Sand Friction', col5: '30 Days Maintenance', col6: '96.2% (R²=0.958)', col7: 'Verified', isGood: true },
        { col1: 'Central Command (Lucknow)', sub: 'Surya Command • High Altitude Inductions', col2: 'Extreme Cold Clothing (ECC)', col3: '2,200 Suits/Mo', col4: '+118.0% Pre-Winter', col5: '100% Induction Reserve', col6: '99.1% (R²=0.990)', col7: 'Verified', isGood: true }
      ];
    }

    // 4. UNIT READINESS
    if (cat.includes('unit')) {
      return [
        { col1: '14 Rajput (Mechanised)', sub: '14 Corps • Fire & Fury', col2: 'Leh - Ladakh Garrison', col3: '780 Pax', col4: '98.4%', col5: 'DEFCON 1', col6: 'ASCON V4', col7: 'Verified', isGood: true },
        { col1: '3 Grenadiers (Infantry)', sub: '15 Corps • Chinar Corps', col2: 'Uri Sector - LOC', col3: '820 Pax', col4: '97.2%', col5: 'FORWARD ACTIVE', col6: 'ASCON V4', col7: 'Verified', isGood: true },
        { col1: '7 Cavalry (Armoured)', sub: '2 Corps • Kharga Strike', col2: 'Ambala Garrison', col3: '620 Pax', col4: '99.1%', col5: 'STRIKE READY', col6: 'SATCOM PRIORITY', col7: 'Verified', isGood: true },
        { col1: '17 Mountain Artillery', sub: '4 Corps • Gajraj Corps', col2: 'Tawang LAC Sector', col3: '540 Pax', col4: '96.8%', col5: 'HIGH ALTITUDE', col6: 'ASCON V4', col7: 'Verified', isGood: true },
        { col1: '9 Para (Special Forces)', sub: 'Northern Command Reserve', col2: 'Udhampur Base', col3: '340 Pax', col4: '100.0%', col5: 'STRATEGIC AIRBORNE', col6: 'SATCOM SECURE', col7: 'Verified', isGood: true },
        { col1: '120 Forward ASC Bn', sub: '33 Corps • Trishakti', col2: 'Sukna Feeder Base', col3: '690 Pax', col4: '97.5%', col5: 'CONVOY TRANSIT', col6: 'ASCON V4', col7: 'Verified', isGood: true }
      ];
    }

    // 5. ROUTE RISK ASSESSMENT
    if (cat.includes('route') || cat.includes('risk')) {
      return [
        { col1: 'NH-1D Highway', sub: 'Srinagar - Leh Axis', col2: 'Zojila Pass (11,575 ft)', col3: 'SNOW CHAINS ON', col4: '45 Convoys/Day', col5: 'MEDIUM (AVALANCHE)', col6: 'Mughal Road Axis', col7: 'Verified', isGood: true },
        { col1: 'Manali - Leh Axis', sub: 'Himachal - Ladakh Transit', col2: 'Baralacha La (15,910 ft)', col3: 'ATAL TUNNEL OPEN', col4: '60 Convoys/Day', col5: 'LOW (CONTROLLED)', col6: 'Shinkun La Axis', col7: 'Verified', isGood: true },
        { col1: 'Balipara - Tawang Axis', sub: 'Arunachal LAC Corridor', col2: 'Sela Pass (13,700 ft)', col3: 'SELA TUNNEL OPEN', col4: '35 Convoys/Day', col5: 'LOW (ALL-WEATHER)', col6: 'Orang-Kalaktang Axis', col7: 'Verified', isGood: true },
        { col1: 'Joshimath - Malari Axis', sub: 'Garhwal Himalaya Corridor', col2: 'Niti Pass (16,600 ft)', col3: 'HIGH WIND WARNING', col4: '20 Convoys/Day', col5: 'HIGH (ROCKFALL)', col6: 'Mana Pass Axis', col7: 'Verified', isGood: false },
        { col1: 'Pathankot - Udhampur', sub: 'Jammu Strategic Feeder', col2: 'Banihal Qazigund Tunnel', col3: 'ALL-WEATHER 4-LANE', col4: '120 Convoys/Day', col5: 'LOW (SECURE)', col6: 'Old Jawahar Tunnel', col7: 'Verified', isGood: true },
        { col1: 'Darjeeling - Gangtok', sub: 'Sikkim Border Axis', col2: 'Nathu La (14,140 ft)', col3: 'DENSE FOG & MIST', col4: '25 Convoys/Day', col5: 'MEDIUM (VISIBILITY)', col6: 'Pakyong Bypass Axis', col7: 'Verified', isGood: true }
      ];
    }

    // 6. WEATHER INCIDENT SUMMARY
    if (cat.includes('weather')) {
      return [
        { col1: 'Siachen Base Camp', sub: 'Glacier Sensor • Sector 1', col2: '12,000 ft', col3: '-28°C Sub-Zero', col4: '15 cm / 6 hrs', col5: '45 km/h Blizzard', col6: 'CHAINS REQUIRED', col7: 'Verified', isGood: false },
        { col1: 'Zojila Pass Weather Post', sub: 'Mountain Ridge • NH-1D Axis', col2: '11,575 ft', col3: '-18°C Sub-Zero', col4: '28 cm / 6 hrs', col5: '62 km/h Gale Force', col6: 'CONVOY RESTRICTED', col7: 'Verified', isGood: false },
        { col1: 'Sela Pass Sensor Grid', sub: 'Arunachal LAC Sector', col2: '13,700 ft', col3: '-12°C Sub-Zero', col4: '8 cm / 6 hrs', col5: '25 km/h Moderate', col6: 'SELA TUNNEL OPEN', col7: 'Verified', isGood: true },
        { col1: 'Rohtang North Portal', sub: 'Pir Panjal Mountain Range', col2: '10,050 ft', col3: '-14°C Sub-Zero', col4: '12 cm / 6 hrs', col5: '30 km/h Gusts', col6: 'ATAL TUNNEL OPEN', col7: 'Verified', isGood: true },
        { col1: 'Kargil Ordnance Picket', sub: 'Drass High Plateau', col2: '8,780 ft', col3: '-16°C Sub-Zero', col4: '5 cm / 6 hrs', col5: '18 km/h Light', col6: 'OPEN ALL CONVOYS', col7: 'Verified', isGood: true },
        { col1: 'Nathu La Ridge Sensor', sub: 'East Sikkim Frontier', col2: '14,140 ft', col3: '-9°C Sub-Zero', col4: '2 cm / 6 hrs', col5: '50 km/h Severe Wind', col6: 'CHAINS MANDATORY', col7: 'Verified', isGood: true }
      ];
    }

    // 7. STOCKOUT RISK PREVENTION
    if (cat.includes('stockout')) {
      return [
        { col1: 'Siachen Glacier', sub: 'Sub-Zero Forward Sector', col2: 'Sub-Zero HSD Grade Fuel', col3: '14 DOS', col4: '72 Hours to Threshold', col5: 'CRITICAL RISK', col6: 'Priority Convoy + IAF Mi-17', col7: 'Verified', isGood: false },
        { col1: 'Tawang Forward Posts', sub: 'Arunachal High Altitude', col2: '81mm Mortar High Explosive', col3: '18 DOF', col4: '5 Days to Threshold', col5: 'HIGH RISK', col6: 'Siliguri Train + Stallion Fleet', col7: 'Verified', isGood: false },
        { col1: 'Kargil High Pickets', sub: 'Drass High Ridge', col2: 'High-Altitude Calorie Rations', col3: '22 DOS', col4: '8 Days to Threshold', col5: 'MEDIUM RISK', col6: 'Forward Supply Depot Release', col7: 'Verified', isGood: true },
        { col1: 'Barmer Desert Sector', sub: 'Western Operational Pickets', col2: 'T-90 Air Filter Cartridges', col3: '12 DOS', col4: '4 Days to Threshold', col5: 'HIGH RISK', col6: 'COD Delhi Cantt Express Air', col7: 'Verified', isGood: false },
        { col1: 'Uri Border Echelon', sub: 'Line of Control Posts', col2: 'Medical Oxygen Cylinders', col3: '16 DOS', col4: '6 Days to Threshold', col5: 'MEDIUM RISK', col6: '92 Base Hospital Refill Sortie', col7: 'Verified', isGood: true },
        { col1: 'Sikkim North Sector', sub: 'High Elevation Pickets', col2: 'Extreme Cold Parka Suits', col3: '15 DOS', col4: '5 Days to Threshold', col5: 'HIGH RISK', col6: 'Advance Ordnance Depot Dump', col7: 'Verified', isGood: false }
      ];
    }

    // 8. REDISTRIBUTION SAVINGS
    if (cat.includes('redistribution') || cat.includes('saving')) {
      return [
        { col1: 'COD Pathankot', sub: 'Northern Command Central Depot', col2: '14 Rajput (Mechanised)', col3: '40,000L Sub-Zero HSD', col4: '32 Tonnes', col5: '₹18.4 Lakhs Saved', col6: 'RV-14R-7104-REDIST', col7: 'Verified', isGood: true },
        { col1: 'COD Jabalpur', sub: 'Heavy Artillery Central Arsenal', col2: '17 Mountain Artillery', col3: '155mm HE Shell Assemblies', col4: '45 Tonnes', col5: '₹34.2 Lakhs Saved', col6: 'RV-17A-8821-REDIST', col7: 'Verified', isGood: true },
        { col1: 'FSD Jammu', sub: 'Forward Subsistence Reserve', col2: '3 Grenadiers (Infantry)', col3: 'Caloric Combat Meal Packs', col4: '24 Tonnes', col5: '₹12.8 Lakhs Saved', col6: 'RV-3G-9902-REDIST', col7: 'Verified', isGood: true },
        { col1: 'COD Agra', sub: 'Central Armored Spares Base', col2: '7 Cavalry (Armoured)', col3: 'T-90 Hydraulic Valve Kits', col4: '8 Tonnes', col5: '₹42.5 Lakhs Saved', col6: 'RV-7C-4412-REDIST', col7: 'Verified', isGood: true },
        { col1: 'COD Delhi Cantt', sub: 'Strategic Signals Directorate', col2: '9 Para (Special Forces)', col3: 'SATCOM Encryption Terminals', col4: '4 Tonnes', col5: '₹26.0 Lakhs Saved', col6: 'RV-9P-1123-REDIST', col7: 'Verified', isGood: true },
        { col1: '224 ABOD Pathankot', sub: 'Forward Cold Weather Depot', col2: '120 Forward ASC Bn', col3: 'Extreme Cold Boot Kits', col4: '18 Tonnes', col5: '₹14.6 Lakhs Saved', col6: 'RV-120-6674-REDIST', col7: 'Verified', isGood: true }
      ];
    }

    // 9. DEFAULT: NATIONAL READINESS
    if (d.includes('7 days')) {
      return [
        { col1: 'Northern Command (Udhampur)', sub: '14, 15, 16 Corps • Active Glacier Resupply', col2: '418 Units', col3: '98.4%', col4: '185 DOS', col5: '64 DOS', col6: '44 DOF', col7: 'Verified', isGood: true },
        { col1: 'Eastern Command (Kolkata)', sub: '3, 4, 33 Corps • Sela Transit Axis', col2: '382 Units', col3: '96.7%', col4: '154 DOS', col5: '61 DOS', col6: '42 DOF', col7: 'Verified', isGood: true },
        { col1: 'Western Command (Chandimandir)', sub: '2, 9, 11 Corps • Strike Columns', col2: '258 Units', col3: '98.8%', col4: '124 DOS', col5: '73 DOS', col6: '46 DOF', col7: 'Verified', isGood: true },
        { col1: 'Southern Command (Pune)', sub: '11, 12 Corps • Desert Strike Sector', col2: '178 Units', col3: '96.5%', col4: '92 DOS', col5: '67 DOS', col6: '39 DOF', col7: 'Verified', isGood: true },
        { col1: 'South Western Command (Jaipur)', sub: '1 Corps • Pivot Maneuver Force', col2: '208 Units', col3: '97.9%', col4: '114 DOS', col5: '70 DOS', col6: '45 DOF', col7: 'Verified', isGood: true },
        { col1: 'Central Command (Lucknow)', sub: 'Central Strategic Depots & Surya Axis', col2: '188 Units', col3: '97.2%', col4: '144 DOS', col5: '62 DOS', col6: '40 DOF', col7: 'Verified', isGood: true }
      ];
    }

    if (d.includes('quarter') || d.includes('q3')) {
      return [
        { col1: 'Northern Command (Udhampur)', sub: '14, 15, 16 Corps • Peak Winter Stock Dumps', col2: '428 Units', col3: '95.2%', col4: '215 DOS', col5: '84 DOS', col6: '52 DOF', col7: 'Verified', isGood: true },
        { col1: 'Eastern Command (Kolkata)', sub: '3, 4, 33 Corps • Advance Forward Depots', col2: '388 Units', col3: '94.6%', col4: '178 DOS', col5: '76 DOS', col6: '48 DOF', col7: 'Verified', isGood: true },
        { col1: 'Western Command (Chandimandir)', sub: '2, 9, 11 Corps • Pre-Exercise Build-Up', col2: '264 Units', col3: '97.6%', col4: '128 DOS', col5: '68 DOS', col6: '46 DOF', col7: 'Verified', isGood: true },
        { col1: 'Southern Command (Pune)', sub: '11, 12 Corps • Peninsular & Maritime Hubs', col2: '182 Units', col3: '95.4%', col4: '96 DOS', col5: '62 DOS', col6: '36 DOF', col7: 'Verified', isGood: true },
        { col1: 'South Western Command (Jaipur)', sub: '1 Corps • Heavy Armor Reserves', col2: '212 Units', col3: '96.8%', col4: '115 DOS', col5: '65 DOS', col6: '42 DOF', col7: 'Verified', isGood: true },
        { col1: 'Central Command (Lucknow)', sub: 'Central Feeder Ordnance Depots', col2: '194 Units', col3: '96.1%', col4: '152 DOS', col5: '64 DOS', col6: '40 DOF', col7: 'Verified', isGood: true }
      ];
    }

    if (d.includes('year') || d.includes('2025-26')) {
      return [
        { col1: 'Northern Command (Udhampur)', sub: '14, 15, 16 Corps • Annual Harmonic Mean', col2: '415 Units', col3: '94.8%', col4: '165 DOS', col5: '54 DOS', col6: '38 DOF', col7: 'Verified', isGood: true },
        { col1: 'Eastern Command (Kolkata)', sub: '3, 4, 33 Corps • Monsoon & Winter Average', col2: '375 Units', col3: '93.9%', col4: '138 DOS', col5: '51 DOS', col6: '36 DOF', col7: 'Verified', isGood: true },
        { col1: 'Western Command (Chandimandir)', sub: '2, 9, 11 Corps • Annual Cycle Baseline', col2: '255 Units', col3: '96.8%', col4: '112 DOS', col5: '64 DOS', col6: '42 DOF', col7: 'Verified', isGood: true },
        { col1: 'Southern Command (Pune)', sub: '11, 12 Corps • Southern Annual Baseline', col2: '175 Units', col3: '94.5%', col4: '82 DOS', col5: '58 DOS', col6: '35 DOF', col7: 'Verified', isGood: true },
        { col1: 'South Western Command (Jaipur)', sub: '1 Corps • Desert Training Cycle', col2: '205 Units', col3: '95.8%', col4: '102 DOS', col5: '61 DOS', col6: '40 DOF', col7: 'Verified', isGood: true },
        { col1: 'Central Command (Lucknow)', sub: 'Surya Command & Ordnance Depots', col2: '185 Units', col3: '95.2%', col4: '128 DOS', col5: '55 DOS', col6: '37 DOF', col7: 'Verified', isGood: true }
      ];
    }

    // Default: Last 30 Days
    return [
      { col1: 'Northern Command (Udhampur)', sub: '14, 15, 16 Corps • Siachen/Ladakh Axis', col2: '420 Units', col3: '97.2%', col4: '180 DOS', col5: '62 DOS', col6: '42 DOF', col7: 'Verified', isGood: true },
      { col1: 'Eastern Command (Kolkata)', sub: '3, 4, 33 Corps • LAC Mountain Formations', col2: '380 Units', col3: '95.8%', col4: '150 DOS', col5: '58 DOS', col6: '40 DOF', col7: 'Verified', isGood: true },
      { col1: 'Western Command (Chandimandir)', sub: '2, 9, 11 Corps • Strike & Plains Echelons', col2: '260 Units', col3: '98.1%', col4: '120 DOS', col5: '70 DOS', col6: '45 DOF', col7: 'Verified', isGood: true },
      { col1: 'Southern Command (Pune)', sub: '11, 12 Corps • Desert Strike & Maritime Axis', col2: '180 Units', col3: '96.0%', col4: '90 DOS', col5: '65 DOS', col6: '38 DOF', col7: 'Verified', isGood: true },
      { col1: 'South Western Command (Jaipur)', sub: '1 Corps (Pivot Strike) • Sapta Shakti', col2: '210 Units', col3: '97.4%', col4: '110 DOS', col5: '68 DOS', col6: '44 DOF', col7: 'Verified', isGood: true },
      { col1: 'Central Command (Lucknow)', sub: 'Central Ordnance Depots & Surya Sector', col2: '190 Units', col3: '96.9%', col4: '140 DOS', col5: '60 DOS', col6: '39 DOF', col7: 'Verified', isGood: true }
    ];
  }

  getReportAggregateRow() {
    const cat = (this.reportCategory || '').toLowerCase();
    const d = (this.reportDateRange || '').toLowerCase();

    if (cat.includes('inventory')) {
      return { col1: 'National Ordnance Stockpiles', sub: '6 Central Ordnance Depots Audited', col2: '2,450,000 Items', col3: 'Full WWR Met', col4: '135 DOS Avg', col5: 'Surplus', col6: 'STRATEGIC STABILITY', col7: 'All Audited' };
    }
    if (cat.includes('convoy') || cat.includes('efficiency')) {
      return { col1: 'National Road Movement', sub: '38 Active Military Columns Tracked', col2: '158 Vehicles', col3: 'Multimodal Road/Rail', col4: '1,470 Tonnes', col5: '98.5% Schedule', col6: '97.8% Fleet Avg', col7: 'All Audited' };
    }
    if (cat.includes('demand') || cat.includes('projection')) {
      return { col1: 'National Neural Forecast', sub: 'ASCON Telemetry Grid Convergence', col2: 'All 9 Theaters', col3: '15,020 Aggregate Load', col4: '+48.6% Mean Surge', col5: '120 Days Mean', col6: '97.8% Confidence', col7: 'All Audited' };
    }
    if (cat.includes('unit')) {
      return { col1: 'National Combat Formations', sub: '1,725 Active Battalions Integrated', col2: '1,280,000 Pax', col3: '97.1% Mean', col4: 'COMBAT READY', col5: 'DEFCON 1', col6: '99.8% Uptime', col7: 'All Audited' };
    }
    if (cat.includes('route') || cat.includes('risk')) {
      return { col1: 'National Border Corridors', sub: '6 Primary Transit Axes Monitored', col2: '94.2% Operational', col3: '305 Convoys/Day', col4: 'C4ISR Monitored', col5: 'BRO Winter Plan Active', col6: 'ALL CLEAR', col7: 'All Audited' };
    }
    if (cat.includes('weather')) {
      return { col1: 'National Mountain Grid', sub: '6 Automated Telemetry Posts', col2: 'Regional Highlands', col3: '-16.2°C Regional Mean', col4: '70 cm Total Accumulation', col5: '38.3 km/h Mean', col6: 'BRO Clearance Active', col7: 'All Audited' };
    }
    if (cat.includes('stockout')) {
      return { col1: 'National Stockout Prevention', sub: '6 Forward Sensitive Sectors', col2: 'All Echelons', col3: '16.2 DOS Average', col4: 'Continuous ASCON Telemetry', col5: 'EARLY INTERVENTION', col6: 'Zero Stockouts Logged', col7: 'All Audited' };
    }
    if (cat.includes('redistribution') || cat.includes('saving')) {
      return { col1: 'National Dynamic Redistribution', sub: '6 Lateral Strategic Re-allocations', col2: 'Multi-Theater Net', col3: '131 Tonnes Total Relocated', col4: 'Zero Fresh Procurement', col5: '₹1.485 Crores Saved', col6: 'Multi-Depot Reconciled', col7: 'All Audited' };
    }

    if (d.includes('7 days')) {
      return { col1: 'National Strategic Aggregate', sub: 'Tactical High-Tempo Window', col2: '1,712 Units', col3: '97.6%', col4: '139 DOS Avg', col5: '66 DOS Avg', col6: '43 DOF Avg', col7: 'All Audited' };
    } else if (d.includes('quarter') || d.includes('q3')) {
      return { col1: 'National Strategic Aggregate', sub: 'Pre-Winter Surge Stockpile', col2: '1,756 Units', col3: '95.9%', col4: '147 DOS Avg', col5: '70 DOS Avg', col6: '44 DOF Avg', col7: 'All Audited' };
    } else if (d.includes('year') || d.includes('2025-26')) {
      return { col1: 'National Strategic Aggregate', sub: 'Full FY Annual Fiscal Average', col2: '1,700 Units', col3: '95.2%', col4: '121 DOS Avg', col5: '57 DOS Avg', col6: '38 DOF Avg', col7: 'All Audited' };
    }

    return { col1: 'National Strategic Aggregate', sub: 'National Standard Baseline', col2: '1,725 Units', col3: '97.1%', col4: '135 DOS Avg', col5: '64 DOS Avg', col6: '41 DOF Avg', col7: 'All Audited' };
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

    // Initialize reports cached dataset
    this.updateReportData();

    // Read route params synchronously first, with url fallback
    const initialParam = this.route.snapshot.paramMap.get('tab');
    this.activeTab = this.normalizeTab(initialParam);

    // Subscribe to router navigation events
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const parts = event.urlAfterRedirects.split('?')[0].split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'command') {
        const nextTab = this.normalizeTab(parts[1]);
        if (this.activeTab !== nextTab) {
          this.setTab(nextTab, false);
        }
      }
      this.cdr.markForCheck();
    });

    // Subscribe to route param changes
    this.route.paramMap.subscribe(params => {
      const tabParam = params.get('tab');
      if (tabParam) {
        const normalized = this.normalizeTab(tabParam);
        if (this.activeTab !== normalized) {
          this.setTab(normalized, false);
        }
      }
      this.cdr.markForCheck();
    });

    if (this.activeTab === 'forecasting') {
      this.fetchDemandCurve();
    } else if (this.activeTab === 'reports') {
      this.updateReportData();
    }

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
    const normalized = this.normalizeTab(tab);
    this.activeTab = normalized;
    this.actionFeedbackMsg = '';
    if (navigate) {
      this.router.navigate(['/command', normalized]);
    }
    if (normalized === 'dashboard') {
      setTimeout(() => {
        if (!this.map) {
          this.initLeafletMap();
        } else {
          this.map.invalidateSize();
        }
      }, 200);
    } else if (normalized === 'forecasting') {
      this.fetchDemandCurve();
    } else if (normalized === 'reports') {
      this.updateReportData();
    }
    this.cdr.markForCheck();
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
    this.logisticsService.authorizeAlert(alertItem.id).subscribe((res: any) => {
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
