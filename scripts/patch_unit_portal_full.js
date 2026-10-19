const fs = require('fs');

const htmlPath = 'src/app/pages/unit-dashboard/unit-dashboard.component.html';
let raw = fs.readFileSync(htmlPath, 'utf8');

// Normalize to LF for easy manipulation
const isCrlf = raw.includes('\r\n');
let html = raw.replace(/\r\n/g, '\n');

// List of exact substitutions
const replacements = [
  // 1. Buffer coverage panel
  [
    `<h3 class="ud-panel-heading">Regimental Stores Buffer Coverage</h3>`,
    `<h3 class="ud-panel-heading">{{ langService.t('Regimental Stores Buffer Coverage') }}</h3>`
  ],
  [
    `<span class="ud-panel-hint">Current holding vs authorized winter mobilization scales</span>`,
    `<span class="ud-panel-hint">{{ langService.t('Current holding vs authorized winter mobilization scales') }}</span>`
  ],
  [
    `<span class="ud-header-tag">WINTER BUFFER 100%</span>`,
    `<span class="ud-header-tag">{{ langService.t('WINTER BUFFER 100%') }}</span>`
  ],
  [
    `<span class="ud-stock-title">Fresh & MRE Rations: <strong>48 DOS</strong></span>`,
    `<span class="ud-stock-title">{{ langService.t('Fresh & MRE Rations:') }} <strong>{{ langService.t('48 DOS') }}</strong></span>`
  ],
  [
    `<span class="ud-stock-title">Winter Grade HSD: <strong>16,200 Litres</strong></span>`,
    `<span class="ud-stock-title">{{ langService.t('Winter Grade HSD:') }} <strong>{{ langService.t('16,200 Litres') }}</strong></span>`
  ],
  [
    `<span class="ud-stock-title">Ammunition & Munitions: <strong>94.5% UBL</strong></span>`,
    `<span class="ud-stock-title">{{ langService.t('Ammunition & Munitions:') }} <strong>94.5% UBL</strong></span>`
  ],
  [
    `<span class="ud-stock-title">BMP-II Armor Spares: <strong>12 Sets</strong></span>`,
    `<span class="ud-stock-title">{{ langService.t('BMP-II Armor Spares:') }} <strong>{{ langService.t('12 Sets') }}</strong></span>`
  ],
  [
    `<span class="ud-capacity-pill cap-green">80% Capacity</span>`,
    `<span class="ud-capacity-pill cap-green">80% {{ langService.t('Capacity') }}</span>`
  ],
  [
    `<span class="ud-capacity-pill cap-green">81% Capacity</span>`,
    `<span class="ud-capacity-pill cap-green">81% {{ langService.t('Capacity') }}</span>`
  ],
  [
    `<span class="ud-capacity-pill cap-green">94.5% Optimal</span>`,
    `<span class="ud-capacity-pill cap-green">94.5% {{ langService.t('Optimal') }}</span>`
  ],
  [
    `<span class="ud-capacity-pill cap-saffron">82% Review Needed</span>`,
    `<span class="ud-capacity-pill cap-saffron">82% {{ langService.t('Review Needed') }}</span>`
  ],
  [
    `<span class="ud-meta-transit">⚠️ 4 suspension pads under transit via Convoy GARUDA-01</span>`,
    `<span class="ud-meta-transit">⚠️ {{ langService.t('4 suspension pads under transit via Convoy GARUDA-01') }}</span>`
  ],

  // 2. AI Early Warning Alert
  [
    `<span class="ud-ai-alert-tag">CRITICAL ALERT</span>`,
    `<span class="ud-ai-alert-tag">{{ langService.t('CRITICAL ALERT') }}</span>`
  ],
  [
    `<strong class="ud-ai-title">AI Early Warning: Sub-Zero Cold Freeze Hazard</strong>`,
    `<strong class="ud-ai-title">{{ langService.t('AI Early Warning: Sub-Zero Cold Freeze Hazard') }}</strong>`
  ],
  [
    `Nighttime temperature drop to -26°C will trigger automated tank heating routines. Daily fuel burn rate is projected to increase by 24% over the next 5 days.`,
    `{{ langService.t('Nighttime temperature drop to -26°C will trigger automated tank heating routines. Daily fuel burn rate is projected to increase by 24% over the next 5 days.') }}`
  ],
  [
    `<span class="ud-rec-badge">RECOMMENDED</span>`,
    `<span class="ud-rec-badge">{{ langService.t('RECOMMENDED') }}</span>`
  ],
  [
    `<span class="ud-rec-text">Request early release of 18,000L POL buffer. (Voucher #IND-2026-9041 approved).</span>`,
    `<span class="ud-rec-text">{{ langService.t('Request early release of 18,000L POL buffer. (Voucher #IND-2026-9041 approved).') }}</span>`
  ],

  // 3. Incoming Shipments En Route
  [
    `<h3 class="ud-panel-heading">Incoming Shipments En Route</h3>`,
    `<h3 class="ud-panel-heading">{{ langService.t('Incoming Shipments En Route') }}</h3>`
  ],
  [
    `<span class="ud-panel-hint">Columns destined for FSD Leh / 14 Rajput stores</span>`,
    `<span class="ud-panel-hint">{{ langService.t('Columns destined for FSD Leh / 14 Rajput stores') }}</span>`
  ],
  [
    `<span class="ud-header-tag tag-blue">ACTIVE CONVOYS (2)</span>`,
    `<span class="ud-header-tag tag-blue">{{ langService.t('ACTIVE CONVOYS (2)') }}</span>`
  ],
  [
    `<span class="ud-status-pill st-green">In-Transit</span>`,
    `<span class="ud-status-pill st-green">{{ langService.t('In-Transit') }}</span>`
  ],
  [
    `<span class="ud-status-pill st-gold">Rerouted</span>`,
    `<span class="ud-status-pill st-gold">{{ langService.t('Rerouted') }}</span>`
  ],
  [
    `<span>320 Tonnes Class III (POL) • 28 Vehicles</span>`,
    `<span>{{ langService.t('320 Tonnes Class III (POL) • 28 Vehicles') }}</span>`
  ],
  [
    `<span>420 Tonnes Winter Stocking & Ammo • 34 Vehicles</span>`,
    `<span>{{ langService.t('420 Tonnes Winter Stocking & Ammo • 34 Vehicles') }}</span>`
  ],
  [
    `<span class="ud-eta-label">ETA</span>`,
    `<span class="ud-eta-label">{{ langService.t('ETA') }}</span>`
  ],
  [
    `<strong class="ud-eta-time">4 hrs 15 mins</strong>`,
    `<strong class="ud-eta-time">{{ langService.t('4 hrs 15 mins') }}</strong>`
  ],
  [
    `<strong class="ud-eta-time">7 hrs 10 mins</strong>`,
    `<strong class="ud-eta-time">{{ langService.t('7 hrs 10 mins') }}</strong>`
  ],
  [
    `<span class="ud-route-axis">Via Atal Tunnel-Keylong Axis</span>`,
    `<span class="ud-route-axis">{{ langService.t('Via Atal Tunnel-Keylong Axis') }}</span>`
  ],
  [
    `<span class="ud-route-axis">Via Nilgrath Bypass</span>`,
    `<span class="ud-route-axis">{{ langService.t('Via Nilgrath Bypass') }}</span>`
  ],
  [
    `<span>📡 Track Convoy Live</span>`,
    `<span>📡 {{ langService.t('Track Convoy Live') }}</span>`
  ],

  // 4. Local Sector Weather Telemetry
  [
    `<span class="ud-weather-badge">SECTOR METEOROLOGY</span>`,
    `<span class="ud-weather-badge">{{ langService.t('SECTOR METEOROLOGY') }}</span>`
  ],
  [
    `<h4 class="ud-weather-title">Local Sector Weather Telemetry (Click to Inspect)</h4>`,
    `<h4 class="ud-weather-title">{{ langService.t('Local Sector Weather Telemetry (Click to Inspect)') }}</h4>`
  ],
  [
    `<div class="ud-temp-feels">Feels like -24°C</div>`,
    `<div class="ud-temp-feels">{{ langService.t('Feels like') }} -24°C</div>`
  ],
  [
    `<span class="ud-telemetry-k">Wind Velocity:</span>`,
    `<span class="ud-telemetry-k">{{ langService.t('Wind Velocity:') }}</span>`
  ],
  [
    `<span class="ud-telemetry-k">Precipitation:</span>`,
    `<span class="ud-telemetry-k">{{ langService.t('Precipitation:') }}</span>`
  ],
  [
    `<span class="ud-telemetry-v">Light Snow</span>`,
    `<span class="ud-telemetry-v">{{ langService.t('Light Snow') }}</span>`
  ],
  [
    `<span class="ud-telemetry-k">Pass Status:</span>`,
    `<span class="ud-telemetry-k">{{ langService.t('Pass Status:') }}</span>`
  ],
  [
    `<span class="ud-telemetry-v pass-open">Khardung La Open (Chains Mandatory)</span>`,
    `<span class="ud-telemetry-v pass-open">{{ langService.t('Khardung La Open (Chains Mandatory)') }}</span>`
  ],
  [
    `<span class="ud-telemetry-k">Advisory:</span>`,
    `<span class="ud-telemetry-k">{{ langService.t('Advisory:') }}</span>`
  ],
  [
    `<span class="ud-telemetry-v text-saffron">Black ice alert on Km 42-56 track</span>`,
    `<span class="ud-telemetry-v text-saffron">{{ langService.t('Black ice alert on Km 42-56 track') }}</span>`
  ],

  // 5. Tab 2.2 Inventory Header & Buttons
  [
    `<h2 class="module-title">Regimental Stores Inventory Ledger</h2>`,
    `<h2 class="module-title">{{ langService.t('Regimental Stores Inventory Ledger') }}</h2>`
  ],
  [
    `<p class="module-subtitle">Class I to IX items stocked at 14 Rajput Forward Defended Base</p>`,
    `<p class="module-subtitle">{{ langService.t('Class I to IX items stocked at 14 Rajput Forward Defended Base') }}</p>`
  ],
  [
    `<button type="button" class="btn-outline-army" (click)="openRecordConsumptionModal()">Record Issue</button>`,
    `<button type="button" class="btn-outline-army" (click)="openRecordConsumptionModal()">{{ langService.t('Record Issue') }}</button>`
  ],
  [
    `<button type="button" class="btn-army-primary" (click)="openAddReceiptModal()">+ Add Store Receipt</button>`,
    `<button type="button" class="btn-army-primary" (click)="openAddReceiptModal()">{{ langService.t('+ Add Store Receipt') }}</button>`
  ],

  // 6. Tab 2.2 Table Headers
  [
    `<th>Item ID</th>`,
    `<th>{{ langService.t('Item ID') }}</th>`
  ],
  [
    `<th>Nomenclature</th>`,
    `<th>{{ langService.t('Nomenclature') }}</th>`
  ],
  [
    `<th>Category</th>`,
    `<th>{{ langService.t('Category') }}</th>`
  ],
  [
    `<th>Current Qty</th>`,
    `<th>{{ langService.t('Current Qty') }}</th>`
  ],
  [
    `<th>Safety Buffer</th>`,
    `<th>{{ langService.t('Safety Buffer') }}</th>`
  ],
  [
    `<th>Reorder Level</th>`,
    `<th>{{ langService.t('Reorder Level') }}</th>`
  ],
  [
    `<th>Days Remaining</th>`,
    `<th>{{ langService.t('Days Remaining') }}</th>`
  ],
  [
    `<th>Status</th>`,
    `<th>{{ langService.t('Status') }}</th>`
  ],
  [
    `<th>Actions</th>`,
    `<th>{{ langService.t('Actions') }}</th>`
  ],

  // 7. Tab 2.2 Table Cells
  [
    `<td class="font-bold text-green">{{ item.quantity }}</td>`,
    `<td class="font-bold text-green">{{ langService.t(item.quantity) }}</td>`
  ],
  [
    `<td>{{ item.safetyStock }}</td>`,
    `<td>{{ langService.t(item.safetyStock) }}</td>`
  ],
  [
    `<td>{{ item.reorderLevel }}</td>`,
    `<td>{{ langService.t(item.reorderLevel) }}</td>`
  ],
  [
    `{{ item.daysRemaining }} Days`,
    `{{ langService.t(item.daysRemaining + ' Days') }}`
  ],
  [
    `● {{ item.status }}`,
    `● {{ langService.t(item.status) }}`
  ],
  [
    `                  <button type="button" class="btn-inspect" (click)="openLedgerCard(item)">
                    Ledger Card
                  </button>`,
    `                  <button type="button" class="btn-inspect" (click)="openLedgerCard(item)">
                    {{ langService.t('Ledger Card') }}
                  </button>`
  ],

  // 8. Ledger Card Modal
  [
    `<span class="modal-form-badge">{{ selectedInvItem.category }} · REGIMENTAL STOCK LEDGER</span>`,
    `<span class="modal-form-badge">{{ langService.t(selectedInvItem.category) }} · {{ langService.t('REGIMENTAL STOCK LEDGER') }}</span>`
  ],
  [
    `<span class="d-label">Current Available:</span>`,
    `<span class="d-label">{{ langService.t('Current Available:') }}</span>`
  ],
  [
    `<span class="d-label">Total Received:</span>`,
    `<span class="d-label">{{ langService.t('Total Received:') }}</span>`
  ],
  [
    `<span class="d-label">Total Issued:</span>`,
    `<span class="d-label">{{ langService.t('Total Issued:') }}</span>`
  ],
  [
    `<span class="d-label">Safety Buffer:</span>`,
    `<span class="d-label">{{ langService.t('Safety Buffer:') }}</span>`
  ],
  [
    `<span class="d-label">Reorder Level:</span>`,
    `<span class="d-label">{{ langService.t('Reorder Level:') }}</span>`
  ],
  [
    `<span class="d-label">Days of Supply:</span>`,
    `<span class="d-label">{{ langService.t('Days of Supply:') }}</span>`
  ],
  [
    `<span class="d-label">Damaged / Written Off:</span>`,
    `<span class="d-label">{{ langService.t('Damaged / Written Off:') }}</span>`
  ],
  [
    `<span class="d-label">Lead Time from FSD:</span>`,
    `<span class="d-label">{{ langService.t('Lead Time from FSD:') }}</span>`
  ],
  [
    `<button type="button" class="btn-army-primary" (click)="closeLedgerCard()">Close Ledger</button>`,
    `<button type="button" class="btn-army-primary" (click)="closeLedgerCard()">{{ langService.t('Close Ledger') }}</button>`
  ],

  // 9. Tab 2.3 Consumption Telematics
  [
    `<h2 class="module-title">Consumption Telematics & Unit Demand</h2>`,
    `<h2 class="module-title">{{ langService.t('Consumption Telematics & Unit Demand') }}</h2>`
  ],
  [
    `<h3 class="telemetry-panel-title">Daily Multi-Class Consumption vs AI Winter Surge Trajectory</h3>`,
    `<h3 class="telemetry-panel-title">{{ langService.t('Daily Multi-Class Consumption vs AI Winter Surge Trajectory') }}</h3>`
  ],
  [
    `<h4 class="telemetry-card-title">Sub-Zero POL Consumption Breakdown</h4>`,
    `<h4 class="telemetry-card-title">{{ langService.t('Sub-Zero POL Consumption Breakdown') }}</h4>`
  ],
  [
    `<h4 class="telemetry-card-title">Forward Base IoT Sensor Telemetry</h4>`,
    `<h4 class="telemetry-card-title">{{ langService.t('Forward Base IoT Sensor Telemetry') }}</h4>`
  ],
  [
    `<h4 class="telemetry-card-title">AI Pre-Winter Stocking & Pass Advisory</h4>`,
    `<h4 class="telemetry-card-title">{{ langService.t('AI Pre-Winter Stocking & Pass Advisory') }}</h4>`
  ],

  // 10. Tab 2.4 Supply Requests & Indent Vouchers
  [
    `<h2 class="module-title">Unit Requisition & Indent Vouchers</h2>`,
    `<h2 class="module-title">{{ langService.t('Unit Requisition & Indent Vouchers') }}</h2>`
  ],
  [
    `<th>Voucher #</th>`,
    `<th>{{ langService.t('Voucher #') }}</th>`
  ],
  [
    `<th>Supply Category</th>`,
    `<th>{{ langService.t('Supply Category') }}</th>`
  ],
  [
    `<th>Item Nomenclature</th>`,
    `<th>{{ langService.t('Item Nomenclature') }}</th>`
  ],
  [
    `<th>Requested Qty</th>`,
    `<th>{{ langService.t('Requested Qty') }}</th>`
  ],
  [
    `<th>Priority</th>`,
    `<th>{{ langService.t('Priority') }}</th>`
  ],
  [
    `<th>Required By</th>`,
    `<th>{{ langService.t('Required By') }}</th>`
  ],
  [
    `<th>Date Submitted</th>`,
    `<th>{{ langService.t('Date Submitted') }}</th>`
  ],

  // 11. Tab 2.5 Logistics
  [
    `<h2 class="module-title">Unit Inbound & Outbound Logistics</h2>`,
    `<h2 class="module-title">{{ langService.t('Unit Inbound & Outbound Logistics') }}</h2>`
  ],
  [
    `<th>Shipment / Convoy</th>`,
    `<th>{{ langService.t('Shipment / Convoy') }}</th>`
  ],
  [
    `<th>Origin Depot</th>`,
    `<th>{{ langService.t('Origin Depot') }}</th>`
  ],
  [
    `<th>Destination Depot</th>`,
    `<th>{{ langService.t('Destination Depot') }}</th>`
  ],
  [
    `<th>Cargo Manifest</th>`,
    `<th>{{ langService.t('Cargo Manifest') }}</th>`
  ],

  // 12. Tab 2.6 Route & Weather
  [
    `<h2 class="module-title">Mountain Corridors & Weather Hazard Intel</h2>`,
    `<h2 class="module-title">{{ langService.t('Mountain Corridors & Weather Hazard Intel') }}</h2>`
  ],
  [
    `<th>Pass Name & Highway</th>`,
    `<th>{{ langService.t('Pass Name & Highway') }}</th>`
  ],
  [
    `<th>Altitude (MSL)</th>`,
    `<th>{{ langService.t('Altitude (MSL)') }}</th>`
  ],
  [
    `<th>Temperature</th>`,
    `<th>{{ langService.t('Temperature') }}</th>`
  ],
  [
    `<th>Wind & Snow</th>`,
    `<th>{{ langService.t('Wind & Snow') }}</th>`
  ],
  [
    `<th>Pass Status</th>`,
    `<th>{{ langService.t('Pass Status') }}</th>`
  ],
  [
    `<th>Hazard Risk</th>`,
    `<th>{{ langService.t('Hazard Risk') }}</th>`
  ],
  [
    `<th>Alternative Corridor</th>`,
    `<th>{{ langService.t('Alternative Corridor') }}</th>`
  ],

  // 13. Tab 2.7 AI Insights
  [
    `<h2 class="module-title">Predictive Logistics Intelligence & Strategic Directives</h2>`,
    `<h2 class="module-title">{{ langService.t('Predictive Logistics Intelligence & Strategic Directives') }}</h2>`
  ],

  // 14. Tab 2.8 Reports
  [
    `<h2 class="module-title">Regimental Logistics Ledger & Reports</h2>`,
    `<h2 class="module-title">{{ langService.t('Regimental Logistics Ledger & Reports') }}</h2>`
  ],
  [
    `<th>Voucher Date</th>`,
    `<th>{{ langService.t('Voucher Date') }}</th>`
  ],
  [
    `<th>Voucher Reference</th>`,
    `<th>{{ langService.t('Voucher Reference') }}</th>`
  ],
  [
    `<th>Transaction Type</th>`,
    `<th>{{ langService.t('Transaction Type') }}</th>`
  ],
  [
    `<th>Class & Nomenclature</th>`,
    `<th>{{ langService.t('Class & Nomenclature') }}</th>`
  ],
  [
    `<th>Quantity / DOS</th>`,
    `<th>{{ langService.t('Quantity / DOS') }}</th>`
  ],
  [
    `<th>Authorization Authority</th>`,
    `<th>{{ langService.t('Authorization Authority') }}</th>`
  ]
];

let appliedCount = 0;
for (const [target, repl] of replacements) {
  if (html.includes(target)) {
    html = html.replace(target, repl);
    appliedCount++;
  } else {
    // try trimmed or flexible match if not exact
    console.log('Target not found:', target.slice(0, 40));
  }
}

console.log(`Applied ${appliedCount} of ${replacements.length} replacements.`);

// Restore CRLF if needed
if (isCrlf) {
  html = html.replace(/\n/g, '\r\n');
}

fs.writeFileSync(htmlPath, html);
console.log('Saved unit-dashboard.component.html successfully!');
