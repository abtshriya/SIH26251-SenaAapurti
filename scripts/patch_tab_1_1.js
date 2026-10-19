const fs = require('fs');

const filePath = 'src/app/pages/command-dashboard/command-dashboard.component.html';
let html = fs.readFileSync(filePath, 'utf8');

// Replacements in Tab 1.1 (lines 151 to 730)
const replacements = [
  // Header row
  ['<h2 class="module-title">1.1 National Command & Control Dashboard</h2>', '<h2 class="module-title">{{ langService.t(\'1.1 National Command & Control Dashboard\') }}</h2>'],
  ['<p class="module-subtitle">Operational logistics readiness posture across Indian Army theater commands</p>', '<p class="module-subtitle">{{ langService.t(\'Operational logistics readiness posture across Indian Army theater commands\') }}</p>'],
  ['<span class="header-sync">Sync: {{ lastDataSync }}</span>', '<span class="header-sync">{{ langService.t(\'Sync:\') }} {{ langService.translateText(lastDataSync) }}</span>'],
  ['<button type="button" class="btn-refresh" (click)="refreshData()">↻ Refresh</button>', '<button type="button" class="btn-refresh" (click)="refreshData()">↻ {{ langService.t(\'Refresh\') }}</button>'],
  ['{{ alertActionSuccess }}', '{{ langService.translateText(alertActionSuccess) }}'],

  // 8 KPI cards
  ['<span class="kpi-label">TOTAL UNITS</span>', '<span class="kpi-label">{{ langService.t(\'TOTAL UNITS\') }}</span>'],
  ['<div class="kpi-sub">Across 7 Commands</div>', '<div class="kpi-sub">{{ langService.t(\'Across 7 Commands\') }}</div>'],
  ['<span class="kpi-label">SUPPLY READINESS</span>', '<span class="kpi-label">{{ langService.t(\'SUPPLY READINESS\') }}</span>'],
  ['<div class="kpi-sub">Optimal Status</div>', '<div class="kpi-sub">{{ langService.t(\'Optimal Status\') }}</div>'],
  ['<span class="kpi-label">CRITICAL LOCATIONS</span>', '<span class="kpi-label">{{ langService.t(\'CRITICAL LOCATIONS\') }}</span>'],
  ['<div class="kpi-sub">High-Altitude Picked</div>', '<div class="kpi-sub">{{ langService.t(\'High-Altitude Picked\') }}</div>'],
  ['<span class="kpi-label">ACTIVE CONVOYS</span>', '<span class="kpi-label">{{ langService.t(\'ACTIVE CONVOYS\') }}</span>'],
  ['<div class="kpi-sub">5,200+ Tonnes Rolling</div>', '<div class="kpi-sub">{{ langService.t(\'5,200+ Tonnes Rolling\') }}</div>'],
  ['<span class="kpi-label">DELAYED CONVOYS</span>', '<span class="kpi-label">{{ langService.t(\'DELAYED CONVOYS\') }}</span>'],
  ['<div class="kpi-sub">Weather Choke Points</div>', '<div class="kpi-sub">{{ langService.t(\'Weather Choke Points\') }}</div>'],
  ['<span class="kpi-label">ROUTE RISKS</span>', '<span class="kpi-label">{{ langService.t(\'ROUTE RISKS\') }}</span>'],
  ['<div class="kpi-sub">Zojila & Baralacha</div>', '<div class="kpi-sub">{{ langService.t(\'Zojila & Baralacha\') }}</div>'],
  ['<span class="kpi-label">WEATHER ALERTS</span>', '<span class="kpi-label">{{ langService.t(\'WEATHER ALERTS\') }}</span>'],
  ['<div class="kpi-sub">Avalanche Grade 4</div>', '<div class="kpi-sub">{{ langService.t(\'Avalanche Grade 4\') }}</div>'],
  ['<span class="kpi-label">OFFLINE UNITS</span>', '<span class="kpi-label">{{ langService.t(\'OFFLINE UNITS\') }}</span>'],
  ['<div class="kpi-sub">On SATCOM Fallback</div>', '<div class="kpi-sub">{{ langService.t(\'On SATCOM Fallback\') }}</div>'],

  // Map panel
  ['<h3 class="panel-heading">India Military Logistics Map</h3>', '<h3 class="panel-heading">{{ langService.t(\'India Military Logistics Map\') }}</h3>'],
  ['<span class="panel-hint">Live strategic deployment corridors, formation telemetry & convoy movement</span>', '<span class="panel-hint">{{ langService.t(\'Live strategic deployment corridors, formation telemetry & convoy movement\') }}</span>'],
  ['<span class="toolbar-label">TERRAIN:</span>', '<span class="toolbar-label">{{ langService.t(\'TERRAIN:\') }}</span>'],
  ['title="Tactical Military Dark (Zero API Keys)">Tactical Dark</button>', 'title="Tactical Military Dark (Zero API Keys)">{{ langService.t(\'Tactical Dark\') }}</button>'],
  ['title="Satellite Terrain Photography (Zero API Keys)">Satellite</button>', 'title="Satellite Terrain Photography (Zero API Keys)">{{ langService.t(\'Satellite\') }}</button>'],
  ['title="Esri Dark Gray Canvas (Zero API Keys)">Dark Canvas</button>', 'title="Esri Dark Gray Canvas (Zero API Keys)">{{ langService.t(\'Dark Canvas\') }}</button>'],
  ['title="Topographic Mountain Relief & Elevations (Zero API Keys)">Topographic</button>', 'title="Topographic Mountain Relief & Elevations (Zero API Keys)">{{ langService.t(\'Topographic\') }}</button>'],
  ['(change)="toggleMapLayer(\'routes\')"> Routes', '(change)="toggleMapLayer(\'routes\')"> {{ langService.t(\'Routes\') }}'],
  ['(change)="toggleMapLayer(\'convoys\')"> Convoys', '(change)="toggleMapLayer(\'convoys\')"> {{ langService.t(\'Convoys\') }}'],
  ['(change)="toggleMapLayer(\'weather\')"> Weather', '(change)="toggleMapLayer(\'weather\')"> {{ langService.t(\'Weather\') }}'],
  ['(change)="toggleMapLayer(\'risks\')"> Risk Zones', '(change)="toggleMapLayer(\'risks\')"> {{ langService.t(\'Risk Zones\') }}'],

  // Map legend overlay
  ['<div class="legend-item"><span class="legend-symbol blue-star">★</span> HQ Commands (Blue)</div>', '<div class="legend-item"><span class="legend-symbol blue-star">★</span> {{ langService.t(\'HQ Commands (Blue)\') }}</div>'],
  ['<div class="legend-item"><span class="legend-circle green"></span> Sufficient (>45 DOS)</div>', '<div class="legend-item"><span class="legend-circle green"></span> {{ langService.t(\'Sufficient (>45 DOS)\') }}</div>'],
  ['<div class="legend-item"><span class="legend-circle yellow"></span> Depleting (20-45 DOS)</div>', '<div class="legend-item"><span class="legend-circle yellow"></span> {{ langService.t(\'Depleting (20-45 DOS)\') }}</div>'],
  ['<div class="legend-item"><span class="legend-circle red"></span> Critical (&lt;20 DOS)</div>', '<div class="legend-item"><span class="legend-circle red"></span> {{ langService.t(\'Critical (<20 DOS)\') }}</div>'],
  ['<div class="legend-item"><span class="legend-triangle">▲</span> Extreme Frontier</div>', '<div class="legend-item"><span class="legend-triangle">▲</span> {{ langService.t(\'Extreme Frontier\') }}</div>'],

  // Critical alerts
  ['<h3 class="panel-heading">Critical Logistics Alerts ({{ getActionRequiredCount() }})</h3>', '<h3 class="panel-heading">{{ langService.t(\'Critical Logistics Alerts\') }} ({{ getActionRequiredCount() }})</h3>'],
  ['<span *ngIf="getActionRequiredCount() > 0" class="badge-danger">ACTION REQUIRED</span>', '<span *ngIf="getActionRequiredCount() > 0" class="badge-danger">{{ langService.t(\'ACTION REQUIRED\') }}</span>'],
  ['<span *ngIf="getActionRequiredCount() === 0" class="badge-green">ALL DIRECTIVES SYNCED</span>', '<span *ngIf="getActionRequiredCount() === 0" class="badge-green">{{ langService.t(\'ALL DIRECTIVES SYNCED\') }}</span>'],
  ['<strong>Recommended Action:</strong> {{ alt.recommendedAction }}', '<strong>{{ langService.t(\'Recommended Action:\') }}</strong> {{ langService.translateText(alt.recommendedAction) }}'],
  ['<span *ngIf="alt.status !== \'AUTHORIZED\'">Authorize Suggested Action</span>', '<span *ngIf="alt.status !== \'AUTHORIZED\'">{{ langService.t(\'Authorize Suggested Action\') }}</span>'],
  ['<span *ngIf="alt.status === \'AUTHORIZED\'">✓ Authorized &amp; Synced in DB</span>', '<span *ngIf="alt.status === \'AUTHORIZED\'">{{ langService.t(\'✓ Authorized & Synced in DB\') }}</span>'],
  ['View Explanation Panel\r\n                    </button>', '{{ langService.t(\'View Explanation Panel\') }}\r\n                    </button>'],
  ['View Explanation Panel\n                    </button>', '{{ langService.t(\'View Explanation Panel\') }}\n                    </button>'],
  ['<small class="text-green font-mono">● PostgreSQL Cryptographic Ledger Hash: {{ alt.txHash.substring(0, 16) }}...</small>', '<small class="text-green font-mono">● {{ langService.t(\'PostgreSQL Cryptographic Ledger Hash:\') }} {{ alt.txHash.substring(0, 16) }}...</small>'],

  // National Supply Health
  ['<h3 class="panel-heading">National Supply Health & Stock Echelon</h3>', '<h3 class="panel-heading">{{ langService.t(\'National Supply Health & Stock Echelon\') }}</h3>'],
  ['<span class="panel-hint">Aggregated posture across all Strategic Central Ordnance Depots</span>', '<span class="panel-hint">{{ langService.t(\'Aggregated posture across all Strategic Central Ordnance Depots\') }}</span>'],
  ['<span class="health-name text-green">● Healthy (> 45 Days DOS)</span>', '<span class="health-name text-green">{{ langService.t(\'● Healthy (> 45 Days DOS)\') }}</span>'],
  ['<span class="health-name text-amber">● Warning (20 - 45 Days DOS)</span>', '<span class="health-name text-amber">{{ langService.t(\'● Warning (20 - 45 Days DOS)\') }}</span>'],
  ['<span class="health-name text-red">● Critical (10 - 20 Days DOS)</span>', '<span class="health-name text-red">{{ langService.t(\'● Critical (10 - 20 Days DOS)\') }}</span>'],
  ['<span class="health-name text-red">● Stockout Risk (&lt; 10 Days)</span>', '<span class="health-name text-red">{{ langService.t(\'● Stockout Risk (< 10 Days)\') }}</span>'],
  ['<h4 class="subpanel-title mt-4">Buffer Coverage by Defense Class:</h4>', '<h4 class="subpanel-title mt-4">{{ langService.t(\'Buffer Coverage by Defense Class:\') }}</h4>'],
  ['<span class="r-class">Class I (Rations)</span>', '<span class="r-class">{{ langService.t(\'Class I (Rations)\') }}</span>'],
  ['<span class="r-note">100% Pre-winter stocked</span>', '<span class="r-note">{{ langService.t(\'100% Pre-winter stocked\') }}</span>'],
  ['<span class="r-class">Class III (POL)</span>', '<span class="r-class">{{ langService.t(\'Class III (POL)\') }}</span>'],
  ['<span class="r-note">Sub-zero grades sealed</span>', '<span class="r-note">{{ langService.t(\'Sub-zero grades sealed\') }}</span>'],
  ['<span class="r-class">Class V (Munitions)</span>', '<span class="r-class">{{ langService.t(\'Class V (Munitions)\') }}</span>'],
  ['<span class="r-note">Forward dumps pre-positioned</span>', '<span class="r-note">{{ langService.t(\'Forward dumps pre-positioned\') }}</span>'],
  ['<span class="r-class">Class IX (Spares)</span>', '<span class="r-class">{{ langService.t(\'Class IX (Spares)\') }}</span>'],
  ['<span class="r-note">T-90 & BMP-II under replenish</span>', '<span class="r-note">{{ langService.t(\'T-90 & BMP-II under replenish\') }}</span>'],

  // National Demand Forecast
  ['<h3 class="panel-heading">National Demand Forecast & Telemetry Activity</h3>', '<h3 class="panel-heading">{{ langService.t(\'National Demand Forecast & Telemetry Activity\') }}</h3>'],
  ['<span class="panel-hint">AI 30-Day predictive projection across forward nodes</span>', '<span class="panel-hint">{{ langService.t(\'AI 30-Day predictive projection across forward nodes\') }}</span>'],
  ['Class III (POL)\r\n                </button>', '{{ langService.t(\'Class III (POL)\') }}\r\n                </button>'],
  ['Class III (POL)\n                </button>', '{{ langService.t(\'Class III (POL)\') }}\n                </button>'],
  ['Class V (Munitions)\r\n                </button>', '{{ langService.t(\'Class V (Munitions)\') }}\r\n                </button>'],
  ['Class V (Munitions)\n                </button>', '{{ langService.t(\'Class V (Munitions)\') }}\n                </button>'],
  ['Class I (Rations)\r\n                </button>', '{{ langService.t(\'Class I (Rations)\') }}\r\n                </button>'],
  ['Class I (Rations)\n                </button>', '{{ langService.t(\'Class I (Rations)\') }}\n                </button>'],
  ['<span class="fc-metric-lbl">CURRENT CONSUMPTION</span>', '<span class="fc-metric-lbl">{{ langService.t(\'CURRENT CONSUMPTION\') }}</span>'],
  ['<span class="fc-metric-sub">Real-Time Sensor Telemetry</span>', '<span class="fc-metric-sub">{{ langService.t(\'Real-Time Sensor Telemetry\') }}</span>'],
  ['<span class="fc-metric-lbl">PROJECTED 30-DAY PEAK</span>', '<span class="fc-metric-lbl">{{ langService.t(\'PROJECTED 30-DAY PEAK\') }}</span>'],
  ['<span class="fc-metric-sub text-amber">{{ getForecastMetrics().surge }}</span>', '<span class="fc-metric-sub text-amber">{{ langService.translateText(getForecastMetrics().surge) }}</span>'],
  ['<span class="fc-metric-lbl">AI NEURAL ACCURACY</span>', '<span class="fc-metric-lbl">{{ langService.t(\'AI NEURAL ACCURACY\') }}</span>'],
  ['<span class="fc-metric-lbl">BUFFER ADEQUACY</span>', '<span class="fc-metric-lbl">{{ langService.t(\'BUFFER ADEQUACY\') }}</span>'],
  ['<span class="fc-metric-val text-green font-mono">100% OK</span>', '<span class="fc-metric-val text-green font-mono">{{ langService.t(\'100% OK\') }}</span>'],
  ['<span class="fc-metric-sub">Pre-Winter Stocking Complete</span>', '<span class="fc-metric-sub">{{ langService.t(\'Pre-Winter Stocking Complete\') }}</span>'],

  // Forecast Legend
  ['<div class="leg-item"><span class="leg-indicator blue-line"></span> Historical Actuals (ASCON Sensor Feed)</div>', '<div class="leg-item"><span class="leg-indicator blue-line"></span> {{ langService.t(\'Historical Actuals (ASCON Sensor Feed)\') }}</div>'],
  ['<div class="leg-item"><span class="leg-indicator gold-dash"></span> AI Predictive Projection (Next 30 Days)</div>', '<div class="leg-item"><span class="leg-indicator gold-dash"></span> {{ langService.t(\'AI Predictive Projection (Next 30 Days)\') }}</div>'],
  ['<div class="leg-item"><span class="leg-indicator amber-band"></span> 95% Confidence Band (±10%)</div>', '<div class="leg-item"><span class="leg-indicator amber-band"></span> {{ langService.t(\'95% Confidence Band (±10%)\') }}</div>'],

  // Forecast summary strip
  ['<span>Avg Baseline: <strong>51,200 L/Day</strong></span>', '<span>{{ langService.t(\'Avg Baseline:\') }} <strong>51,200 L/Day</strong></span>'],
  ['<span>Seasonal Surge: <strong>+43.9% (Cold Wave & High-Altitude)</strong></span>', '<span>{{ langService.t(\'Seasonal Surge:\') }} <strong>{{ langService.t(\'+43.9% (Cold Wave & High-Altitude)\') }}</strong></span>'],
  ['<span>Inventory Coverage: <strong>62 Days Reserve Available</strong></span>', '<span>{{ langService.t(\'Inventory Coverage:\') }} <strong>{{ langService.t(\'62 Days Reserve Available\') }}</strong></span>'],

  // Tactical Activity Feed
  ['<h4 class="subpanel-title">Recent Tactical Activity & Telemetry Feed</h4>', '<h4 class="subpanel-title">{{ langService.t(\'Recent Tactical Activity & Telemetry Feed\') }}</h4>'],
  ['<span class="badge-gold">ENCRYPTED MILITARY LOG</span>', '<span class="badge-gold">{{ langService.t(\'ENCRYPTED MILITARY LOG\') }}</span>'],
  ['<span class="act-tag tag-green">REQUISITION APPROVED</span>', '<span class="act-tag tag-green">{{ langService.t(\'REQUISITION APPROVED\') }}</span>'],
  ['<span class="act-timestamp">22 mins ago</span>', '<span class="act-timestamp">{{ langService.translateText(\'22 mins ago\') }}</span>'],
  ['<h5 class="act-title">18,000L Sub-Zero HSD for 14 RAJPUT</h5>', '<h5 class="act-title">{{ langService.translateText(\'18,000L Sub-Zero HSD for 14 RAJPUT\') }}</h5>'],
  ['<p class="act-desc">Direct requisition sanctioned by DGOS Army HQ • Dispatched from Pathankot Advance Supply Depot to Leh Forward Picket.</p>', '<p class="act-desc">{{ langService.translateText(\'Direct requisition sanctioned by DGOS Army HQ • Dispatched from Pathankot Advance Supply Depot to Leh Forward Picket.\') }}</p>'],
  ['<span>Northern Theater • Ladakh Sector</span>', '<span>{{ langService.translateText(\'Northern Theater • Ladakh Sector\') }}</span>'],

  ['<span class="act-tag tag-blue">CONVOY DISPATCHED</span>', '<span class="act-tag tag-blue">{{ langService.t(\'CONVOY DISPATCHED\') }}</span>'],
  ['<span class="act-timestamp">1 hr ago</span>', '<span class="act-timestamp">{{ langService.translateText(\'1 hr ago\') }}</span>'],
  ['<h5 class="act-title">Convoy Column GARUDA-01 En Route to Leh</h5>', '<h5 class="act-title">{{ langService.translateText(\'Convoy Column GARUDA-01 En Route to Leh\') }}</h5>'],
  ['<p class="act-desc">Passed Manali North Portal (Atal Tunnel Axis) with continuous telemetry • 24 heavy vehicles transporting Arctic grade rations and fuel.</p>', '<p class="act-desc">{{ langService.translateText(\'Passed Manali North Portal (Atal Tunnel Axis) with continuous telemetry • 24 heavy vehicles transporting Arctic grade rations and fuel.\') }}</p>'],
  ['<span>Speed: 38 km/h • GPS Link 100%</span>', '<span>{{ langService.translateText(\'Speed: 38 km/h • GPS Link 100%\') }}</span>'],

  ['<span class="act-tag tag-amber">TACTICAL REROUTE</span>', '<span class="act-tag tag-amber">{{ langService.t(\'TACTICAL REROUTE\') }}</span>'],
  ['<span class="act-timestamp">2 hrs ago</span>', '<span class="act-timestamp">{{ langService.translateText(\'2 hrs ago\') }}</span>'],
  ['<h5 class="act-title">Convoy HIMALAYA-9 Diverted via Nilgrath Tunnel</h5>', '<h5 class="act-title">{{ langService.translateText(\'Convoy HIMALAYA-9 Diverted via Nilgrath Tunnel\') }}</h5>'],
  ['<p class="act-desc">Automated AI rerouting engaged due to Grade 4 avalanche risk on Zojila main axis • Safe passage ensured over BRO all-weather link.</p>', '<p class="act-desc">{{ langService.translateText(\'Automated AI rerouting engaged due to Grade 4 avalanche risk on Zojila main axis • Safe passage ensured over BRO all-weather link.\') }}</p>'],
  ['<span>Delay: +1.2 hrs • Risk Mitigated</span>', '<span>{{ langService.translateText(\'Delay: +1.2 hrs • Risk Mitigated\') }}</span>'],

  ['<span class="act-tag tag-emerald">CONSIGNMENT DELIVERED</span>', '<span class="act-tag tag-emerald">{{ langService.t(\'CONSIGNMENT DELIVERED\') }}</span>'],
  ['<span class="act-timestamp">3 hrs ago</span>', '<span class="act-timestamp">{{ langService.translateText(\'3 hrs ago\') }}</span>'],
  ['<h5 class="act-title">210 Tonnes Spares Received at Jodhpur Depot</h5>', '<h5 class="act-title">{{ langService.translateText(\'210 Tonnes Spares Received at Jodhpur Depot\') }}</h5>'],
  ['<p class="act-desc">T-90 Bhishma engine components & BMP-II transmission kits securely unloaded • QR-coded inventory ledgers updated and verified.</p>', '<p class="act-desc">{{ langService.translateText(\'T-90 Bhishma engine components & BMP-II transmission kits securely unloaded • QR-coded inventory ledgers updated and verified.\') }}</p>'],
  ['<span>Depot: COD Jodhpur</span>', '<span>{{ langService.translateText(\'Depot: COD Jodhpur\') }}</span>'],
  ['<span>Southern Command • Armoured Echelon</span>', '<span>{{ langService.translateText(\'Southern Command • Armoured Echelon\') }}</span>']
];

let applied = 0;
for (const [target, replacement] of replacements) {
  if (html.includes(target)) {
    html = html.replace(target, replacement);
    applied++;
  }
}

console.log('Applied', applied, 'of', replacements.length, 'replacements in Tab 1.1');
fs.writeFileSync(filePath, html, 'utf8');
