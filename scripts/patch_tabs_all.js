const fs = require('fs');

const filePath = 'src/app/pages/command-dashboard/command-dashboard.component.html';
let html = fs.readFileSync(filePath, 'utf8');

// Comprehensive list of static replacements for Tabs 1.2 - 1.10
const replacements = [
  // Module 1.2 Unit Network
  ['<h2 class="module-title">1.2 Unit Network Management</h2>', '<h2 class="module-title">{{ langService.t(\'1.2 Unit Network Management\') }}</h2>'],
  ['<p class="module-subtitle">Comprehensive registry and operational status of all deployed Army Formations</p>', '<p class="module-subtitle">{{ langService.t(\'Comprehensive registry and operational status of all deployed Army Formations\') }}</p>'],
  ['+ Register / Manage Unit\r\n          </button>', '{{ langService.t(\'+ Register / Manage Unit\') }}\r\n          </button>'],
  ['+ Register / Manage Unit\n          </button>', '{{ langService.t(\'+ Register / Manage Unit\') }}\n          </button>'],
  ['<label class="filter-label">Search Unit</label>', '<label class="filter-label">{{ langService.t(\'Search Unit\') }}</label>'],
  ['<label class="filter-label">Command / Region</label>', '<label class="filter-label">{{ langService.t(\'Command / Region\') }}</label>'],
  ['<label class="filter-label">Unit Type / Arm</label>', '<label class="filter-label">{{ langService.t(\'Unit Type / Arm\') }}</label>'],
  ['<label class="filter-label">Combat Readiness</label>', '<label class="filter-label">{{ langService.t(\'Combat Readiness\') }}</label>'],
  ['<th>Unit ID</th>', '<th>{{ langService.t(\'Unit ID\') }}</th>'],
  ['<th>Unit Name & Type</th>', '<th>{{ langService.t(\'Unit Name & Type\') }}</th>'],
  ['<th>Region / Sector</th>', '<th>{{ langService.t(\'Region / Sector\') }}</th>'],
  ['<th>Personnel</th>', '<th>{{ langService.t(\'Personnel\') }}</th>'],
  ['<th>Readiness</th>', '<th>{{ langService.t(\'Readiness\') }}</th>'],
  ['<th>Health</th>', '<th>{{ langService.t(\'Health\') }}</th>'],
  ['<th>Risk</th>', '<th>{{ langService.t(\'Risk\') }}</th>'],
  ['<th>Pending Reqs</th>', '<th>{{ langService.t(\'Pending Reqs\') }}</th>'],
  ['<th>Status</th>', '<th>{{ langService.t(\'Status\') }}</th>'],
  ['<th>Actions</th>', '<th>{{ langService.t(\'Actions\') }}</th>'],
  ['Inspect Unit\r\n                  </button>', '{{ langService.t(\'Inspect Unit\') }}\r\n                  </button>'],
  ['Inspect Unit\n                  </button>', '{{ langService.t(\'Inspect Unit\') }}\n                  </button>'],

  // Module 1.3 National Strategic Inventory
  ['<h2 class="module-title">1.3 National Strategic Inventory</h2>', '<h2 class="module-title">{{ langService.t(\'1.3 National Strategic Inventory\') }}</h2>'],
  ['<p class="module-subtitle">Total defense asset visibility across Central Ordnance Depots & Field Stores</p>', '<p class="module-subtitle">{{ langService.t(\'Total defense asset visibility across Central Ordnance Depots & Field Stores\') }}</p>'],
  ['<label class="filter-label">Search Materiel SKU</label>', '<label class="filter-label">{{ langService.t(\'Search Materiel SKU\') }}</label>'],
  ['<label class="filter-label">Supply Class</label>', '<label class="filter-label">{{ langService.t(\'Supply Class\') }}</label>'],
  ['<label class="filter-label">Stock Posture</label>', '<label class="filter-label">{{ langService.t(\'Stock Posture\') }}</label>'],
  ['<th>Item SKU</th>', '<th>{{ langService.t(\'Item SKU\') }}</th>'],
  ['<th>Description & Defense Class</th>', '<th>{{ langService.t(\'Description & Defense Class\') }}</th>'],
  ['<th>Current Stock</th>', '<th>{{ langService.t(\'Current Stock\') }}</th>'],
  ['<th>Safety Buffer</th>', '<th>{{ langService.t(\'Safety Buffer\') }}</th>'],
  ['<th>Days of Supply</th>', '<th>{{ langService.t(\'Days of Supply\') }}</th>'],
  ['<th>Stock Posture</th>', '<th>{{ langService.t(\'Stock Posture\') }}</th>'],
  ['<th>Stocking Depot</th>', '<th>{{ langService.t(\'Stocking Depot\') }}</th>'],
  ['<th>Requisition Action</th>', '<th>{{ langService.t(\'Requisition Action\') }}</th>'],
  ['<span class="card-kpi-lbl">TOTAL LINE ITEMS</span>', '<span class="card-kpi-lbl">{{ langService.t(\'TOTAL LINE ITEMS\') }}</span>'],
  ['<span class="card-kpi-lbl">ADEQUATE POSTURE</span>', '<span class="card-kpi-lbl">{{ langService.t(\'ADEQUATE POSTURE\') }}</span>'],
  ['<span class="card-kpi-lbl">DEPLETION WARNING</span>', '<span class="card-kpi-lbl">{{ langService.t(\'DEPLETION WARNING\') }}</span>'],
  ['<span class="card-kpi-lbl">CRITICAL DEFICIT</span>', '<span class="card-kpi-lbl">{{ langService.t(\'CRITICAL DEFICIT\') }}</span>'],

  // Module 1.4 Demand & Predictive Forecasting
  ['<h2 class="module-title">1.4 Demand & Predictive Forecasting Engine</h2>', '<h2 class="module-title">{{ langService.t(\'1.4 Demand & Predictive Forecasting Engine\') }}</h2>'],
  ['<p class="module-subtitle">Machine learning neural network forecasting seasonal defense consumption</p>', '<p class="module-subtitle">{{ langService.t(\'Machine learning neural network forecasting seasonal defense consumption\') }}</p>'],
  ['<label class="filter-label">Operational Region</label>', '<label class="filter-label">{{ langService.t(\'Operational Region\') }}</label>'],
  ['<label class="filter-label">Materiel Category</label>', '<label class="filter-label">{{ langService.t(\'Materiel Category\') }}</label>'],
  ['<label class="filter-label">Forecast Horizon</label>', '<label class="filter-label">{{ langService.t(\'Forecast Horizon\') }}</label>'],
  ['<span class="fc-card-lbl">PEAK SURGE (NEXT 30D)</span>', '<span class="fc-card-lbl">{{ langService.t(\'PEAK SURGE (NEXT 30D)\') }}</span>'],
  ['<span class="fc-card-lbl">MEAN BURN RATE</span>', '<span class="fc-card-lbl">{{ langService.t(\'MEAN BURN RATE\') }}</span>'],
  ['<span class="fc-card-lbl">NEURAL ACCURACY (R²)</span>', '<span class="fc-card-lbl">{{ langService.t(\'NEURAL ACCURACY (R²)\') }}</span>'],
  ['<span class="fc-card-lbl">PRE-WINTER BUFFER</span>', '<span class="fc-card-lbl">{{ langService.t(\'PRE-WINTER BUFFER\') }}</span>'],
  ['Authorize Pre-Winter Stocking Buffer\r\n            </button>', '{{ langService.t(\'Authorize Pre-Winter Stocking Buffer\') }}\r\n            </button>'],
  ['Authorize Pre-Winter Stocking Buffer\n            </button>', '{{ langService.t(\'Authorize Pre-Winter Stocking Buffer\') }}\n            </button>'],

  // Module 1.5 Logistics Movement & Convoy Tracking
  ['<h2 class="module-title">1.5 Logistics Movement & Convoy Tracking</h2>', '<h2 class="module-title">{{ langService.t(\'1.5 Logistics Movement & Convoy Tracking\') }}</h2>'],
  ['<p class="module-subtitle">GPS and ASCON telematics tracking tactical military road columns</p>', '<p class="module-subtitle">{{ langService.t(\'GPS and ASCON telematics tracking tactical military road columns\') }}</p>'],
  ['<label class="filter-label">Search Convoy</label>', '<label class="filter-label">{{ langService.t(\'Search Convoy\') }}</label>'],
  ['<label class="filter-label">Movement Status</label>', '<label class="filter-label">{{ langService.t(\'Movement Status\') }}</label>'],
  ['<label class="filter-label">Transit Axis</label>', '<label class="filter-label">{{ langService.t(\'Transit Axis\') }}</label>'],
  ['<span class="convoy-kpi-lbl">ACTIVE COLUMNS</span>', '<span class="convoy-kpi-lbl">{{ langService.t(\'ACTIVE COLUMNS\') }}</span>'],
  ['<span class="convoy-kpi-lbl">IN TRANSIT TONNAGE</span>', '<span class="convoy-kpi-lbl">{{ langService.t(\'IN TRANSIT TONNAGE\') }}</span>'],
  ['<span class="convoy-kpi-lbl">DELAYED / REROUTED</span>', '<span class="convoy-kpi-lbl">{{ langService.t(\'DELAYED / REROUTED\') }}</span>'],
  ['<span class="convoy-kpi-lbl">AVERAGE SPEED</span>', '<span class="convoy-kpi-lbl">{{ langService.t(\'AVERAGE SPEED\') }}</span>'],
  ['<th>Convoy ID</th>', '<th>{{ langService.t(\'Convoy ID\') }}</th>'],
  ['<th>Callsign & Column</th>', '<th>{{ langService.t(\'Callsign & Column\') }}</th>'],
  ['<th>Route Axis</th>', '<th>{{ langService.t(\'Route Axis\') }}</th>'],
  ['<th>Origin → Destination</th>', '<th>{{ langService.t(\'Origin → Destination\') }}</th>'],
  ['<th>Vehicles & Tonnage</th>', '<th>{{ langService.t(\'Vehicles & Tonnage\') }}</th>'],
  ['<th>Speed & GPS Telemetry</th>', '<th>{{ langService.t(\'Speed & GPS Telemetry\') }}</th>'],

  // Module 1.6 Route & Weather Intel
  ['<h2 class="module-title">1.6 Route, Weather & High-Altitude Terrain Intelligence</h2>', '<h2 class="module-title">{{ langService.t(\'1.6 Route, Weather & High-Altitude Terrain Intelligence\') }}</h2>'],
  ['<p class="module-subtitle">Direct sensor telemetry from mountain passes, avalanche monitors, and BRO weather stations</p>', '<p class="module-subtitle">{{ langService.t(\'Direct sensor telemetry from mountain passes, avalanche monitors, and BRO weather stations\') }}</p>'],

  // Module 1.7 Explainable AI Strategic Recommendations
  ['<h2 class="module-title">1.7 Explainable AI Strategic Recommendations</h2>', '<h2 class="module-title">{{ langService.t(\'1.7 Explainable AI Strategic Recommendations\') }}</h2>'],
  ['<p class="module-subtitle">Autonomous decision engine with transparent audit factors and suggested remediations</p>', '<p class="module-subtitle">{{ langService.t(\'Autonomous decision engine with transparent audit factors and suggested remediations\') }}</p>'],
  ['All Alerts ({{ logisticsService.alerts().length }})', '{{ langService.t(\'All Alerts\') }} ({{ logisticsService.alerts().length }})'],

  // Module 1.8 What-If Strategic Simulator
  ['<h2 class="module-title">1.8 What-If Strategic Logistics Simulator</h2>', '<h2 class="module-title">{{ langService.t(\'1.8 What-If Strategic Logistics Simulator\') }}</h2>'],
  ['<p class="module-subtitle">Wargame multi-theater blockades, extreme weather scenarios, and demand surges</p>', '<p class="module-subtitle">{{ langService.t(\'Wargame multi-theater blockades, extreme weather scenarios, and demand surges\') }}</p>'],
  ['Execute Wargame Simulation\r\n            </button>', '{{ langService.t(\'Execute Wargame Simulation\') }}\r\n            </button>'],
  ['Execute Wargame Simulation\n            </button>', '{{ langService.t(\'Execute Wargame Simulation\') }}\n            </button>'],

  // Module 1.9 Reports & Analytics
  ['<h2 class="module-title">1.9 Reports & Executive Defense Analytics</h2>', '<h2 class="module-title">{{ langService.t(\'1.9 Reports & Executive Defense Analytics\') }}</h2>'],
  ['<p class="module-subtitle">Official audited logistics statements for DGOS Directorate and Parliamentary Oversight</p>', '<p class="module-subtitle">{{ langService.t(\'Official audited logistics statements for DGOS Directorate and Parliamentary Oversight\') }}</p>'],
  ['<label class="filter-label">Report Category</label>', '<label class="filter-label">{{ langService.t(\'Report Category\') }}</label>'],
  ['<label class="filter-label">Date Range</label>', '<label class="filter-label">{{ langService.t(\'Date Range\') }}</label>'],
  ['Download PDF Statement\r\n            </button>', '{{ langService.t(\'Download PDF Statement\') }}\r\n            </button>'],
  ['Download PDF Statement\n            </button>', '{{ langService.t(\'Download PDF Statement\') }}\n            </button>'],
  ['Download Excel / CSV\r\n            </button>', '{{ langService.t(\'Download Excel / CSV\') }}\r\n            </button>'],
  ['Download Excel / CSV\n            </button>', '{{ langService.t(\'Download Excel / CSV\') }}\n            </button>'],
  ['<th *ngFor="let col of reportColumns">{{ col }}</th>', '<th *ngFor="let col of reportColumns">{{ langService.t(col) }}</th>'],
  ['AUDIT WINDOW: <strong>{{ reportSummary.window }}</strong>', '{{ langService.t(\'AUDIT WINDOW:\') }} <strong>{{ langService.translateText(reportSummary.window) }}</strong>'],
  ['POSTURE: {{ reportSummary.stockPosture }}', '{{ langService.t(\'POSTURE:\') }} {{ langService.t(reportSummary.stockPosture) }}'],
  ['{{ reportSummary.focus }}', '{{ langService.translateText(reportSummary.focus) }}'],
  ['<div class="text-xs text-muted">{{ row.sub }}</div>', '<div class="text-xs text-muted">{{ langService.translateText(row.sub) }}</div>'],
  ['<span class="badge-success">{{ row.col7 }}</span>', '<span class="badge-success">{{ langService.t(row.col7) }}</span>'],

  // Module 1.10 Settings
  ['<h2 class="module-title">1.10 Command Admin & System Security Settings</h2>', '<h2 class="module-title">{{ langService.t(\'1.10 Command Admin & System Security Settings\') }}</h2>'],
  ['<p class="module-subtitle">Configure ASCON credentials, satellite relay priorities, and cryptographic session policies</p>', '<p class="module-subtitle">{{ langService.t(\'Configure ASCON credentials, satellite relay priorities, and cryptographic session policies\') }}</p>'],
  ['Save Security Configuration\r\n            </button>', '{{ langService.t(\'Save Security Configuration\') }}\r\n            </button>'],
  ['Save Security Configuration\n            </button>', '{{ langService.t(\'Save Security Configuration\') }}\n            </button>'],
  ['Purge Inactive Sessions\r\n            </button>', '{{ langService.t(\'Purge Inactive Sessions\') }}\r\n            </button>'],
  ['Purge Inactive Sessions\n            </button>', '{{ langService.t(\'Purge Inactive Sessions\') }}\n            </button>']
];

let count = 0;
for (const [target, replacement] of replacements) {
  if (html.includes(target)) {
    html = html.replace(target, replacement);
    count++;
  }
}

console.log('Applied', count, 'of', replacements.length, 'replacements across Tabs 1.2 to 1.10');
fs.writeFileSync(filePath, html, 'utf8');
