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
    this.simMitigationSuccess = 'Tactical Mitigation Authorized: C-130J sorties dispatched & reserve buffer released with ASCON signature.';
    setTimeout(() => {
      this.simMitigationSuccess = '';
    }, 6000);
  }

  getForecastChartData() {
    const cat = this.forecastCategory;
    if (cat.includes('Munitions') || cat.includes('Class V')) {
      return {
        unit: 'Tonnes / Day',
        baseline: '1,420 Tonnes',
        peakVal: '2,680 Tonnes',
        surge: '+88.7% Surge (Winter Exercise Buffer)',
        coverage: '42 Days Reserve (Forward Ammunition Dumps)',
        histPoints: [
          { label: 'Aug 2026', x: 80, y: 190, val: '1,280' },
          { label: 'Sep 2026', x: 230, y: 175, val: '1,390' },
          { label: 'Oct 2026', x: 380, y: 160, val: '1,420' }
        ],
        predPoints: [
          { label: 'Nov (Pre-winter)', x: 530, y: 110, val: '2,140' },
          { label: 'Dec (Peak)', x: 680, y: 72, val: '2,680' },
          { label: 'Jan (Sustained)', x: 820, y: 88, val: '2,420' }
        ],
        histPath: 'M 80,190 Q 155,182 230,175 T 380,160',
        predPath: 'M 380,160 Q 455,135 530,110 T 680,72 T 820,88',
        confBand: '380,160 530,90 680,50 820,65 820,115 680,95 530,130 380,160',
        histArea: '80,220 80,190 230,175 380,160 380,220',
        todayX: 380,
        todayY: 160
      };
    } else if (cat.includes('Rations') || cat.includes('Class I')) {
      return {
        unit: 'Tonnes / Day',
        baseline: '2,850 Tonnes',
        peakVal: '3,750 Tonnes',
        surge: '+31.6% Winter High-Altitude Stockpiling',
        coverage: '180 Days Full Winter Reserve',
        histPoints: [
          { label: 'Aug 2026', x: 80, y: 180, val: '2,720' },
          { label: 'Sep 2026', x: 230, y: 168, val: '2,810' },
          { label: 'Oct 2026', x: 380, y: 155, val: '2,850' }
        ],
        predPoints: [
          { label: 'Nov (Advance Stoc)', x: 530, y: 118, val: '3,420' },
          { label: 'Dec (Deep Winter)', x: 680, y: 92, val: '3,750' },
          { label: 'Jan (Glacier Pack)', x: 820, y: 102, val: '3,610' }
        ],
        histPath: 'M 80,180 Q 155,174 230,168 T 380,155',
        predPath: 'M 380,155 Q 455,136 530,118 T 680,92 T 820,102',
        confBand: '380,155 530,100 680,75 820,85 820,122 680,110 530,138 380,155',
        histArea: '80,220 80,180 230,168 380,155 380,220',
        todayX: 380,
        todayY: 155
      };
    } else if (cat.includes('Spares') || cat.includes('Class IX')) {
      return {
        unit: 'Assemblies / Month',
        baseline: '4,100 Units',
        peakVal: '6,450 Units',
        surge: '+57.3% Extreme Cold Mechanical Stress',
        coverage: '26 Days Active Spares Buffer',
        histPoints: [
          { label: 'Aug 2026', x: 80, y: 185, val: '3,850' },
          { label: 'Sep 2026', x: 230, y: 172, val: '4,020' },
          { label: 'Oct 2026', x: 380, y: 158, val: '4,100' }
        ],
        predPoints: [
          { label: 'Nov (Cold Stress)', x: 530, y: 115, val: '5,350' },
          { label: 'Dec (T-90/BMP Peak)', x: 680, y: 78, val: '6,450' },
          { label: 'Jan (Winter Wear)', x: 820, y: 95, val: '5,920' }
        ],
        histPath: 'M 80,185 Q 155,178 230,172 T 380,158',
        predPath: 'M 380,158 Q 455,136 530,115 T 680,78 T 820,95',
        confBand: '380,158 530,95 680,58 820,78 820,115 680,100 530,135 380,158',
        histArea: '80,220 80,185 230,172 380,158 380,220',
        todayX: 380,
        todayY: 158
      };
    }
    // Default Class III Fuel / POL
    return {
      unit: 'Litres / Day',
      baseline: '51,200 L',
      peakVal: '86,200 L',
      surge: '+68.4% Sub-Zero Heating & Aviation HSD Surge',
      coverage: '62 Days Sealed Polar Buffer',
      histPoints: [
        { label: 'Aug 2026', x: 80, y: 182, val: '48,200' },
        { label: 'Sep 2026', x: 230, y: 165, val: '50,400' },
        { label: 'Oct 2026', x: 380, y: 152, val: '51,200' }
      ],
      predPoints: [
        { label: 'Nov (Freeze Point)', x: 530, y: 104, val: '68,400' },
        { label: 'Dec (Peak Frost)', x: 680, y: 64, val: '86,200' },
        { label: 'Jan (Glacier Axis)', x: 820, y: 80, val: '79,500' }
      ],
      histPath: 'M 80,182 Q 155,173 230,165 T 380,152',
      predPath: 'M 380,152 Q 455,128 530,104 T 680,64 T 820,80',
      confBand: '380,152 530,85 680,44 820,62 820,102 680,86 530,125 380,152',
      histArea: '80,220 80,182 230,165 380,152 380,220',
      todayX: 380,
      todayY: 152
    };
  }

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

  ngAfterViewInit() {
    if (this.activeTab === 'dashboard') {
      setTimeout(() => this.initLeafletMap(), 250);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }
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
