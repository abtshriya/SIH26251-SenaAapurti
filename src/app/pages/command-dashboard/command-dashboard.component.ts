import { Component, OnInit, inject } from '@angular/core';
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

import { ThemeService, FontSize } from '../../services/theme.service';

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
  styleUrl: './command-dashboard.component.css'
})
export class CommandDashboardComponent implements OnInit {
  authService = inject(AuthService);
  logisticsService = inject(LogisticsService);
  themeService = inject(ThemeService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  setFont(size: FontSize) {
    this.themeService.setFontSize(size);
  }

  // Active Tab
  activeTab: CommandTab = 'dashboard';
  sidebarCollapsed = false;

  // Header / System state
  currentDateTime = '';
  lastDataSync = 'Just now (ASCON Feed #4182)';
  searchQuery = '';
  showNotifications = false;
  unreadNotificationsCount = 4;

  // 1.1 Dashboard State
  selectedAlert: StrategicAlert | null = null;
  mapLayerRoutes = true;
  mapLayerConvoys = true;
  mapLayerWeather = true;
  mapLayerRisks = true;
  alertActionSuccess = '';

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

  // 1.4 Demand & Forecasting State
  forecastRegion = 'Northern Command';
  forecastCategory = 'Class III (POL)';
  forecastPeriod = '30 Days';
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
    'Zojila Pass Avalanche & Extreme Cold Wave',
    'Eastern Theater Rapid Mobilization & Mountain Frost',
    'Western Desert Sandstorm & Heavy Armor Exercises',
    'High-Altitude Siachen Forward Picket Replenishment'
  ];

  // 1.9 Reports & Analytics State
  reportCategory = 'National Readiness';
  reportDateRange = 'Last 30 Days';
  reportRegion = 'All Commands';
  downloadSuccessNotice = '';

  // 1.10 Settings State
  settingsNotificationSms = true;
  settingsSatcomPriority = true;
  settingsOfflineSync = true;
  settingsSessionTimeout = '30 Minutes';
  settingsThemeMode = 'Tactical Dark';

  ngOnInit() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Read route params
    this.route.params.subscribe(params => {
      if (params['tab']) {
        this.setTab(params['tab'] as CommandTab, false);
      }
    });

    // Run initial simulation calculation
    this.runScenarioSimulation();
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
  }

  refreshData() {
    this.lastDataSync = 'Synchronized at ' + new Date().toLocaleTimeString();
    alert('Real-time ASCON military telemetry feeds refreshed across all 7 Operational Commands.');
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
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
    this.actionFeedbackMsg = 'Redistribution order verified and dispatched to Northern Command Ordnance Officer.';
    this.showRedistributeModal = false;
    setTimeout(() => this.actionFeedbackMsg = '', 5000);
  }

  executeReplenishment() {
    this.actionFeedbackMsg = 'Urgent replenishment requisition transmitted to COD Jabalpur with Operational Priority 1.';
    this.showReplenishModal = false;
    setTimeout(() => this.actionFeedbackMsg = '', 5000);
  }

  // Logistics Movement methods
  inspectConvoy(convoy: ConvoyItem) {
    this.selectedConvoy = convoy;
  }

  triggerReroute(convoy: ConvoyItem) {
    convoy.status = 'Rerouted';
    convoy.route = convoy.route + ' [Bypass Activated via BRO Secondary Link]';
    alert(`Rerouting tactical order transmitted to Convoy ${convoy.callsign} via ASCON.`);
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

  // AI Recommendations
  executeAlertRemedy(alertItem: StrategicAlert) {
    this.alertActionSuccess = `Automated remediation authorized for Alert ${alertItem.id}: "${alertItem.recommendedAction}"`;
    setTimeout(() => {
      this.alertActionSuccess = '';
    }, 6000);
  }

  // Reports
  exportReport(format: 'PDF' | 'CSV' | 'Print') {
    if (format === 'Print') {
      window.print();
      return;
    }
    this.downloadSuccessNotice = `Generating classified ${format} export for "${this.reportCategory}" (${this.reportDateRange}). Verification SHA-256 appended.`;
    setTimeout(() => this.downloadSuccessNotice = '', 5000);
  }

  saveSettings() {
    alert('Command Admin settings updated and cryptographically signed.');
  }
}
