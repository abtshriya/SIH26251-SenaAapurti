const fs = require('fs');

let html = fs.readFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');
// Normalize to \n during replacement, then we can write back
const hasCRLF = html.includes('\r\n');
if (hasCRLF) {
  html = html.replace(/\r\n/g, '\n');
}

const replacements = [
  {
    target: `<div class="kpi-label">STOCKOUT RISK</div>\n            <div class="kpi-value text-red">{{ criticalInventoryCount }} High Risk</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('STOCKOUT RISK') }}</div>\n            <div class="kpi-value text-red">{{ langService.t(criticalInventoryCount + ' High Risk') }}</div>`
  },
  {
    target: `<option value="All">All Categories</option>\n              <option value="Class I (Rations)">Class I (Rations)</option>\n              <option value="Class III (POL)">Class III (POL)</option>\n              <option value="Class V (Ammo)">Class V (Ammo)</option>\n              <option value="Class IX (Spares)">Class IX (Spares)</option>\n              <option value="Medical & Clothing">Medical & Clothing</option>`,
    replacement: `<option value="All">{{ langService.t('All Categories') }}</option>\n              <option value="Class I (Rations)">{{ langService.t('Class I (Rations)') }}</option>\n              <option value="Class III (POL)">{{ langService.t('Class III (POL)') }}</option>\n              <option value="Class V (Ammo)">{{ langService.t('Class V (Ammo)') }}</option>\n              <option value="Class IX (Spares)">{{ langService.t('Class IX (Spares)') }}</option>\n              <option value="Medical & Clothing">{{ langService.t('Medical & Clothing') }}</option>`
  },
  {
    target: `<option value="All">All Statuses</option>\n              <option value="Adequate">Adequate</option>\n              <option value="Low">Low Stock</option>\n              <option value="Surplus">Surplus</option>\n              <option value="Critical">Critical</option>`,
    replacement: `<option value="All">{{ langService.t('All Statuses') }}</option>\n              <option value="Adequate">{{ langService.t('Adequate') }}</option>\n              <option value="Low">{{ langService.t('Low Stock') }}</option>\n              <option value="Surplus">{{ langService.t('Surplus') }}</option>\n              <option value="Critical">{{ langService.t('Critical') }}</option>`
  },
  {
    target: `<td><strong>{{ item.item }}</strong></td>\n                <td><span class="badge-military">{{ item.category }}</span></td>`,
    replacement: `<td><strong>{{ langService.t(item.item) }}</strong></td>\n                <td><span class="badge-military">{{ langService.t(item.category) }}</span></td>`
  },
  {
    target: `<p class="advisory-text">\n                With expected winter freeze surge climbing to <strong>630 L/day (+28.4%)</strong>, current 16,200L reserves will deplete to critical safety margins in 26 days.\n                Pre-stock an additional <strong>25,000L Arctic HSD</strong> before Zoji La closes.\n              </p>`,
    replacement: `<p class="advisory-text">{{ langService.t('With expected winter freeze surge climbing to 630 L/day (+28.4%), current 16,200L reserves will deplete to critical safety margins in 26 days. Pre-stock an additional 25,000L Arctic HSD before Zoji La closes.') }}</p>`
  },
  {
    target: `<td class="col-cat nowrap-cell"><span class="badge-military">{{ ind.category }}</span></td>\n                <td class="col-item item-nomenclature-cell"><strong>{{ ind.itemDescription }}</strong></td>`,
    replacement: `<td class="col-cat nowrap-cell"><span class="badge-military">{{ langService.t(ind.category) }}</span></td>\n                <td class="col-item item-nomenclature-cell"><strong>{{ langService.t(ind.itemDescription) }}</strong></td>`
  },
  {
    target: `<span class="badge-risk" [class.badge-danger]="ind.urgency === 'SOS Emergency'" [class.badge-gold]="ind.urgency === 'Operational Priority 1'" [class.badge-success]="ind.urgency === 'Routine'">\n                    {{ ind.urgency }}\n                  </span>`,
    replacement: `<span class="badge-risk" [class.badge-danger]="ind.urgency === 'SOS Emergency'" [class.badge-gold]="ind.urgency === 'Operational Priority 1'" [class.badge-success]="ind.urgency === 'Routine'">\n                    {{ langService.t(ind.urgency) }}\n                  </span>`
  },
  {
    target: `<span class="badge-status" [class.badge-success]="ind.status === 'Approved by DGOS' || ind.status === 'Dispatched from COD'" [class.badge-gold]="ind.status === 'Pending HQ Approval'">\n                    {{ ind.status }}\n                  </span>`,
    replacement: `<span class="badge-status" [class.badge-success]="ind.status === 'Approved by DGOS' || ind.status === 'Dispatched from COD'" [class.badge-gold]="ind.status === 'Pending HQ Approval'">\n                    {{ langService.t(ind.status) }}\n                  </span>`
  },
  {
    target: `<div class="kpi-label">Active Convoys</div>\n              <div class="kpi-sub">{{ logisticsService.convoys().length - getReroutedConvoysCount() }} In-Transit • {{ getReroutedConvoysCount() }} Rerouted</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Active Convoys') }}</div>\n              <div class="kpi-sub">{{ logisticsService.convoys().length - getReroutedConvoysCount() }} {{ langService.t('In-Transit') }} • {{ getReroutedConvoysCount() }} {{ langService.t('Rerouted') }}</div>`
  },
  {
    target: `<div class="kpi-label">Gross Tonnage En-Route</div>\n              <div class="kpi-sub">POL, Munitions, Spares & Winter Stores</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Gross Tonnage En-Route') }}</div>\n              <div class="kpi-sub">{{ langService.t('POL, Munitions, Spares & Winter Stores') }}</div>`
  },
  {
    target: `<div class="kpi-label">Heavy Military Trucks</div>\n              <div class="kpi-sub">100% ASC & EME Escorts Assigned</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Heavy Military Trucks') }}</div>\n              <div class="kpi-sub">{{ langService.t('100% ASC & EME Escorts Assigned') }}</div>`
  },
  {
    target: `<div class="kpi-label">Next Inbound Arrival</div>\n              <div class="kpi-sub">CHETAK-2 (CV-442-W) • COD Agra</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Next Inbound Arrival') }}</div>\n              <div class="kpi-sub">{{ langService.t('CHETAK-2 (CV-442-W) • COD Agra') }}</div>`
  },
  {
    target: `<label class="toolbar-label">Status:</label>\n                <select [(ngModel)]="logisticsStatusFilter" class="toolbar-select">\n                  <option value="All">All Statuses</option>\n                  <option value="In-Transit">In-Transit</option>\n                  <option value="Rerouted">Rerouted</option>\n                </select>`,
    replacement: `<label class="toolbar-label">{{ langService.t('Status:') }}</label>\n                <select [(ngModel)]="logisticsStatusFilter" class="toolbar-select">\n                  <option value="All">{{ langService.t('All Statuses') }}</option>\n                  <option value="In-Transit">{{ langService.t('In-Transit') }}</option>\n                  <option value="Rerouted">{{ langService.t('Rerouted') }}</option>\n                </select>`
  },
  {
    target: `<h3>No Convoys Found</h3>\n          <p>No military consignments match your search query or filter selection.</p>\n          <button type="button" class="btn-army-sm mt-2" (click)="logisticsSearch = ''; logisticsCargoFilter = 'All'; logisticsStatusFilter = 'All'">\n            Clear All Filters\n          </button>`,
    replacement: `<h3>{{ langService.t('No Convoys Found') }}</h3>\n          <p>{{ langService.t('No military consignments match your search query or filter selection.') }}</p>\n          <button type="button" class="btn-army-sm mt-2" (click)="logisticsSearch = ''; logisticsCargoFilter = 'All'; logisticsStatusFilter = 'All'">\n            {{ langService.t('Clear All Filters') }}\n          </button>`
  },
  {
    target: `<span class="depot-type">ORIGIN DEPOT</span>\n                  <span class="depot-name">{{ c.source }}</span>`,
    replacement: `<span class="depot-type">{{ langService.t('ORIGIN DEPOT') }}</span>\n                  <span class="depot-name">{{ langService.t(c.source) }}</span>`
  },
  {
    target: `<span class="depot-type">DESTINATION</span>\n                  <span class="depot-name">{{ c.destination }}</span>`,
    replacement: `<span class="depot-type">{{ langService.t('DESTINATION') }}</span>\n                  <span class="depot-name">{{ langService.t(c.destination) }}</span>`
  },
  {
    target: `<span class="c-metric-label">CARGO CATEGORY</span>\n                <span class="c-metric-val font-accent">{{ c.cargoType }}</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('CARGO CATEGORY') }}</span>\n                <span class="c-metric-val font-accent">{{ langService.t(c.cargoType) }}</span>`
  },
  {
    target: `<span class="c-metric-label">PAYLOAD</span>\n                <span class="c-metric-val font-gold">{{ c.tonnage }} Metric Tons</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('PAYLOAD') }}</span>\n                <span class="c-metric-val font-gold">{{ c.tonnage }} {{ langService.t('Metric Tons') }}</span>`
  },
  {
    target: `<span class="c-metric-label">FLEET VEHICLES</span>\n                <span class="c-metric-val">{{ c.vehiclesCount }} Trucks</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('FLEET VEHICLES') }}</span>\n                <span class="c-metric-val">{{ c.vehiclesCount }} {{ langService.t('Trucks') }}</span>`
  },
  {
    target: `<span class="c-metric-label">ESTIMATED ARRIVAL</span>\n                <span class="c-metric-val font-green font-bold">{{ c.eta }}</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('ESTIMATED ARRIVAL') }}</span>\n                <span class="c-metric-val font-green font-bold">{{ langService.t(c.eta) }}</span>`
  },
  {
    target: `<span class="waypoint-radar-icon">\n                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.48"></path></svg>\n                  </span> Route Checkpoints Progress:\n                  <strong>{{ getPassedCheckpointsCount(c) }} of {{ getTotalCheckpointsCount(c) }} Cleared</strong>`,
    replacement: `<span class="waypoint-radar-icon">\n                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.48"></path></svg>\n                  </span> {{ langService.t('Route Checkpoints Progress:') }}\n                  <strong>{{ getPassedCheckpointsCount(c) }} {{ langService.t('of') }} {{ getTotalCheckpointsCount(c) }} {{ langService.t('Cleared') }}</strong>`
  },
  {
    target: `<span class="btn-icon">\n                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>\n                </span> Inspect Telemetry & Stepper`,
    replacement: `<span class="btn-icon">\n                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>\n                </span> {{ langService.t('Inspect Telemetry & Stepper') }}`
  },
  {
    target: `<div class="table-wp-label text-xs">\n                        {{ getPassedCheckpointsCount(c) }}/{{ getTotalCheckpointsCount(c) }} Cleared\n                      </div>`,
    replacement: `<div class="table-wp-label text-xs">\n                        {{ getPassedCheckpointsCount(c) }}/{{ getTotalCheckpointsCount(c) }} {{ langService.t('Cleared') }}\n                      </div>`
  },
  {
    target: `<h2 class="module-title">Sector Passes & Tactical Weather</h2>\n            <p class="module-subtitle">High-altitude passes, DGRE avalanche danger scale, and convoy operational accessibility</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Sector Passes & Tactical Weather') }}</h2>\n            <p class="module-subtitle">{{ langService.t('High-altitude passes, DGRE avalanche danger scale, and convoy operational accessibility') }}</p>`
  },
  {
    target: `<div class="kpi-label">Lowest Sector Temp</div>\n              <div class="kpi-sub">Khardung La Axis • Siachen Base Camp</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Lowest Sector Temp') }}</div>\n              <div class="kpi-sub">{{ langService.t('Khardung La Axis • Siachen Base Camp') }}</div>`
  },
  {
    target: `<div class="kpi-label">Max Operational Altitude</div>\n              <div class="kpi-sub">Khardung La Ridge Pass AMSL</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Max Operational Altitude') }}</div>\n              <div class="kpi-sub">{{ langService.t('Khardung La Ridge Pass AMSL') }}</div>`
  },
  {
    target: `<div class="kpi-val">{{ getRestrictedPassesCount() }} Passes</div>\n              <div class="kpi-label">Convoy Transit Restrictions</div>\n              <div class="kpi-sub">Chains Required / Black Ice Warnings</div>`,
    replacement: `<div class="kpi-val">{{ getRestrictedPassesCount() }} {{ langService.t('Passes') }}</div>\n              <div class="kpi-label">{{ langService.t('Convoy Transit Restrictions') }}</div>\n              <div class="kpi-sub">{{ langService.t('Chains Required / Black Ice Warnings') }}</div>`
  },
  {
    target: `<div class="kpi-val">6 Teams</div>\n              <div class="kpi-label">BRO Snow Clearance Units</div>\n              <div class="kpi-sub">Project HIMANK & BEACON Clearing Axis</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('6 Teams') }}</div>\n              <div class="kpi-label">{{ langService.t('BRO Snow Clearance Units') }}</div>\n              <div class="kpi-sub">{{ langService.t('Project HIMANK & BEACON Clearing Axis') }}</div>`
  },
  {
    target: `<strong>TACTICAL WEATHER ADVISORY:</strong>\n                <p>{{ st.alert }}</p>`,
    replacement: `<strong>{{ langService.t('TACTICAL WEATHER ADVISORY:') }}</strong>\n                <p>{{ langService.t(st.alert) }}</p>`
  },
  {
    target: `<h4 class="bro-heading">BORDER ROADS ORGANISATION (BRO) · HIGH-ALTITUDE ROAD CLEARANCE DIRECTIVES</h4>\n                <p class="bro-sub">Live tactical telemetry between 14 Corps Logistics Branch, Project HIMANK (Leh), and Project BEACON (Srinagar)</p>`,
    replacement: `<h4 class="bro-heading">{{ langService.t('BORDER ROADS ORGANISATION (BRO) · HIGH-ALTITUDE ROAD CLEARANCE DIRECTIVES') }}</h4>\n                <p class="bro-sub">{{ langService.t('Live tactical telemetry between 14 Corps Logistics Branch, Project HIMANK (Leh), and Project BEACON (Srinagar)') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag himank">PROJECT HIMANK</span>\n                <span class="bro-status-live">CLEARING IN PROGRESS</span>`,
    replacement: `<span class="bro-proj-tag himank">{{ langService.t('PROJECT HIMANK') }}</span>\n                <span class="bro-status-live">{{ langService.t('CLEARING IN PROGRESS') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Khardung La — North Pullu Axis (Km 38–46)</strong>\n              <p class="bro-task-desc">4 Heavy Snow Cutters & 2 Graders clearing 42cm fresh drift. Light military vehicles with tire chains cleared for transit.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Khardung La — North Pullu Axis (Km 38–46)') }}</strong>\n              <p class="bro-task-desc">{{ langService.t('4 Heavy Snow Cutters & 2 Graders clearing 42cm fresh drift. Light military vehicles with tire chains cleared for transit.') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag beacon">PROJECT BEACON</span>\n                <span class="bro-status-caution">ROCKFALL CLEARANCE</span>`,
    replacement: `<span class="bro-proj-tag beacon">{{ langService.t('PROJECT BEACON') }}</span>\n                <span class="bro-status-caution">{{ langService.t('ROCKFALL CLEARANCE') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Zojila Pass — Nilgrath Bypass Corridor</strong>\n              <p class="bro-task-desc">Upper pass closed due to fresh rockfall at Km 84. Heavy military convoys diverted via Nilgrath bypass tunnel with Military Police escort.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Zojila Pass — Nilgrath Bypass Corridor') }}</strong>\n              <p class="bro-task-desc">{{ langService.t('Upper pass closed due to fresh rockfall at Km 84. Heavy military convoys diverted via Nilgrath bypass tunnel with Military Police escort.') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag vartak">PROJECT VARTAK</span>\n                <span class="bro-status-open">ALL-WEATHER TRANSIT</span>`,
    replacement: `<span class="bro-proj-tag vartak">{{ langService.t('PROJECT VARTAK') }}</span>\n                <span class="bro-status-open">{{ langService.t('ALL-WEATHER TRANSIT') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Sela Twin-Tube Tunnel Corridor (Kameng)</strong>\n              <p class="bro-task-desc">Twin tubes fully operational with automated ventilation & heating. Surface anti-freeze brine sprayed on both approach portals.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Sela Twin-Tube Tunnel Corridor (Kameng)') }}</strong>\n              <p class="bro-task-desc">{{ langService.t('Twin tubes fully operational with automated ventilation & heating. Surface anti-freeze brine sprayed on both approach portals.') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag deepak">PROJECT DEEPAK</span>\n                <span class="bro-status-live">HIGH-PASS PATROL</span>`,
    replacement: `<span class="bro-proj-tag deepak">{{ langService.t('PROJECT DEEPAK') }}</span>\n                <span class="bro-status-live">{{ langService.t('HIGH-PASS PATROL') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Atal Tunnel — Baralacha La Sector (NH-3)</strong>\n              <p class="bro-task-desc">Atal Tunnel tube clear. Continuous grit spraying on Baralacha La switchbacks due to -18°C sub-zero road icing.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Atal Tunnel — Baralacha La Sector (NH-3)') }}</strong>\n              <p class="bro-task-desc">{{ langService.t('Atal Tunnel tube clear. Continuous grit spraying on Baralacha La switchbacks due to -18°C sub-zero road icing.') }}</p>`
  },
  {
    target: `<h2 class="module-title">Predictive Logistics Intel & Early Warnings</h2>\n            <p class="module-subtitle">Operational risk advisories, demand surge forecasts, and proactive logistics directives for forward units</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Predictive Logistics Intel & Early Warnings') }}</h2>\n            <p class="module-subtitle">{{ langService.t('Operational risk advisories, demand surge forecasts, and proactive logistics directives for forward units') }}</p>`
  },
  {
    target: `<div class="kpi-val">1 Critical</div>\n              <div class="kpi-label">Severe Weather Hazard</div>\n              <div class="kpi-sub">Siachen - DBO Highway (-34°C Cold Wave)</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('1 Critical') }}</div>\n              <div class="kpi-label">{{ langService.t('Severe Weather Hazard') }}</div>\n              <div class="kpi-sub">{{ langService.t('Siachen - DBO Highway (-34°C Cold Wave)') }}</div>`
  },
  {
    target: `<div class="kpi-val">+28% Surge</div>\n              <div class="kpi-label">Winter Caloric Demand</div>\n              <div class="kpi-sub">Class I Rations & Heating Fuel Surge</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('+28% Surge') }}</div>\n              <div class="kpi-label">{{ langService.t('Winter Caloric Demand') }}</div>\n              <div class="kpi-sub">{{ langService.t('Class I Rations & Heating Fuel Surge') }}</div>`
  },
  {
    target: `<div class="kpi-val">4 Directives</div>\n              <div class="kpi-label">Mitigation Orders</div>\n              <div class="kpi-sub">Prepositioning & Alternate Tunnel Detours</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('4 Directives') }}</div>\n              <div class="kpi-label">{{ langService.t('Mitigation Orders') }}</div>\n              <div class="kpi-sub">{{ langService.t('Prepositioning & Alternate Tunnel Detours') }}</div>`
  },
  {
    target: `<div class="kpi-val">92% Reliability</div>\n              <div class="kpi-label">Historical Confidence</div>\n              <div class="kpi-sub">Cross-Checked Against 15-Year Weather Logs</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('92% Reliability') }}</div>\n              <div class="kpi-label">{{ langService.t('Historical Confidence') }}</div>\n              <div class="kpi-sub">{{ langService.t('Cross-Checked Against 15-Year Weather Logs') }}</div>`
  },
  {
    target: `<span class="coa-text">↳ {{ coa }}</span>\n                  <button type="button" class="btn-select-coa" (click)="executeAlternativeAction(alt, coa)">\n                    Select & Dispatch COA\n                  </button>`,
    replacement: `<span class="coa-text">↳ {{ langService.t(coa) }}</span>\n                  <button type="button" class="btn-select-coa" (click)="executeAlternativeAction(alt, coa)">\n                    {{ langService.t('Select & Dispatch COA') }}\n                  </button>`
  },
  {
    target: `<h2 class="module-title">Unit Logistics Reports</h2>\n            <p class="module-subtitle">Official Quartermaster store records, verified fuel balances, and DGOS audit certificates</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Unit Logistics Reports') }}</h2>\n            <p class="module-subtitle">{{ langService.t('Official Quartermaster store records, verified fuel balances, and DGOS audit certificates') }}</p>`
  },
  {
    target: `<button type="button" class="btn-outline-army" (click)="exportReport('CSV')">📥 Export CSV</button>\n            <button type="button" class="btn-outline-army" (click)="exportReport('PDF')">📄 Export PDF</button>\n            <button type="button" class="btn-army-primary" (click)="exportReport('Print')">🖨️ Print Ledger</button>`,
    replacement: `<button type="button" class="btn-outline-army" (click)="exportReport('CSV')">📥 {{ langService.t('Export CSV') }}</button>\n            <button type="button" class="btn-outline-army" (click)="exportReport('PDF')">📄 {{ langService.t('Export PDF') }}</button>\n            <button type="button" class="btn-army-primary" (click)="exportReport('Print')">🖨️ {{ langService.t('Print Ledger') }}</button>`
  },
  {
    target: `<div class="kpi-label">Ledger Reconciliation</div>\n              <div class="kpi-sub">All Vouchers Mathematically Reconciled</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Ledger Reconciliation') }}</div>\n              <div class="kpi-sub">{{ langService.t('All Vouchers Mathematically Reconciled') }}</div>`
  },
  {
    target: `<div class="kpi-label">Digitally Signed Tokens</div>\n              <div class="kpi-sub">QM Key #14R-QM-71044A Appended</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Digitally Signed Tokens') }}</div>\n              <div class="kpi-sub">{{ langService.t('QM Key #14R-QM-71044A Appended') }}</div>`
  },
  {
    target: `<div class="kpi-label">Quarterly Requisitions</div>\n              <div class="kpi-sub">100% Verified Delivery & Air Drops</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Quarterly Requisitions') }}</div>\n              <div class="kpi-sub">{{ langService.t('100% Verified Delivery & Air Drops') }}</div>`
  },
  {
    target: `<div class="kpi-label">Audit Discrepancy Rate</div>\n              <div class="kpi-sub">Zero Material Discrepancies Flagged</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Audit Discrepancy Rate') }}</div>\n              <div class="kpi-sub">{{ langService.t('Zero Material Discrepancies Flagged') }}</div>`
  },
  {
    target: `<h3 class="panel-heading">Certified Regimental Logistics Ledgers</h3>\n            <span class="table-count-tag">4 Official Ledgers Available</span>`,
    replacement: `<h3 class="panel-heading">{{ langService.t('Certified Regimental Logistics Ledgers') }}</h3>\n            <span class="table-count-tag">{{ langService.t('4 Official Ledgers Available') }}</span>`
  },
  {
    target: `<h2 class="module-title">Unit Terminal & SATCOM Settings</h2>\n            <p class="module-subtitle">Regimental authentication profiles, encryption keys, and secure ASCON C4ISR terminal parameters</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Unit Terminal & SATCOM Settings') }}</h2>\n            <p class="module-subtitle">{{ langService.t('Regimental authentication profiles, encryption keys, and secure ASCON C4ISR terminal parameters') }}</p>`
  },
  {
    target: `<h3 class="panel-heading mb-0">Quartermaster Identity & Clearance</h3>\n                  <span class="text-xs text-muted">Active duty officer signature keys</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('Quartermaster Identity & Clearance') }}</h3>\n                  <span class="text-xs text-muted">{{ langService.t('Active duty officer signature keys') }}</span>`
  },
  {
    target: `<h3 class="panel-heading mb-0">ASCON Grid & SATCOM Uplink</h3>\n                  <span class="text-xs text-muted">Military satellite transceiver telemetry</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('ASCON Grid & SATCOM Uplink') }}</h3>\n                  <span class="text-xs text-muted">{{ langService.t('Military satellite transceiver telemetry') }}</span>`
  },
  {
    target: `<label class="form-label">Sync Pulse Interval</label>\n                <select [(ngModel)]="asconSyncInterval" class="form-control form-select">\n                  <option>15 Seconds</option>\n                  <option>30 Seconds</option>\n                  <option>60 Seconds</option>\n                  <option>5 Minutes</option>\n                </select>`,
    replacement: `<label class="form-label">{{ langService.t('Sync Pulse Interval') }}</label>\n                <select [(ngModel)]="asconSyncInterval" class="form-control form-select">\n                  <option value="15 Seconds">{{ langService.t('15 Seconds') }}</option>\n                  <option value="30 Seconds">{{ langService.t('30 Seconds') }}</option>\n                  <option value="60 Seconds">{{ langService.t('60 Seconds') }}</option>\n                  <option value="5 Minutes">{{ langService.t('5 Minutes') }}</option>\n                </select>`
  },
  {
    target: `<h3 class="panel-heading mb-0">Tactical Automation & Notification Policies</h3>\n                  <span class="text-xs text-muted">Automated defense responses</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('Tactical Automation & Notification Policies') }}</h3>\n                  <span class="text-xs text-muted">{{ langService.t('Automated defense responses') }}</span>`
  },
  {
    target: `<strong>Automatic SOS Emergency Flash Broadcast</strong>\n                  <span>Auto-task emergency IAF sortie request when forward platoon cuts off by avalanche</span>`,
    replacement: `<strong>{{ langService.t('Automatic SOS Emergency Flash Broadcast') }}</strong>\n                  <span>{{ langService.t('Auto-task emergency IAF sortie request when forward platoon cuts off by avalanche') }}</span>`
  },
  {
    target: `<strong>Live Convoy SATCOM SMS & Dispatch Alerts</strong>\n                  <span>Broadcast checkpoint clearances and detour alerts to escort Subedars in real-time</span>`,
    replacement: `<strong>{{ langService.t('Live Convoy SATCOM SMS & Dispatch Alerts') }}</strong>\n                  <span>{{ langService.t('Broadcast checkpoint clearances and detour alerts to escort Subedars in real-time') }}</span>`
  },
  {
    target: `<strong>Sub-Zero Battery & Bandwidth Optimization</strong>\n                  <span>Throttles non-essential background graphics when terminal operates below -20°C ambient</span>`,
    replacement: `<strong>{{ langService.t('Sub-Zero Battery & Bandwidth Optimization') }}</strong>\n                  <span>{{ langService.t('Throttles non-essential background graphics when terminal operates below -20°C ambient') }}</span>`
  },
  {
    target: `<strong>Local Ledger Offline Cache</strong>\n                  <span>Permits complete voucher signing even if SATCOM uplink is temporarily blocked by blizzard</span>`,
    replacement: `<strong>{{ langService.t('Local Ledger Offline Cache') }}</strong>\n                  <span>{{ langService.t('Permits complete voucher signing even if SATCOM uplink is temporarily blocked by blizzard') }}</span>`
  },
  {
    target: `<h3 class="panel-heading mb-0">Cryptographic Signing Credentials</h3>\n                  <span class="text-xs text-muted">Army Cyber Security Node authorization</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('Cryptographic Signing Credentials') }}</h3>\n                  <span class="text-xs text-muted">{{ langService.t('Army Cyber Security Node authorization') }}</span>`
  },
  {
    target: `<span class="key-label">Key Certificate Expiration:</span>\n                <span class="text-xs font-mono text-green">31 December 2026 (Active)</span>`,
    replacement: `<span class="key-label">{{ langService.t('Key Certificate Expiration:') }}</span>\n                <span class="text-xs font-mono text-green">{{ langService.t('31 December 2026 (Active)') }}</span>`
  },
  {
    target: `<span class="modal-form-badge">DGOS DEFENSE INDENT · FORM IAFA-2026</span>\n          <h3 class="modal-title">Submit Ordnance Requisition Voucher</h3>\n          <p class="modal-subtitle-text">Direct transmission to Northern Command Supply Depot (14 Corps Logistics Grid)</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('DGOS DEFENSE INDENT · FORM IAFA-2026') }}</span>\n          <h3 class="modal-title">{{ langService.t('Submit Ordnance Requisition Voucher') }}</h3>\n          <p class="modal-subtitle-text">{{ langService.t('Direct transmission to Northern Command Supply Depot (14 Corps Logistics Grid)') }}</p>`
  },
  {
    target: `<label class="form-label">Supply Category <span class="req-star">*</span></label>\n            <select [(ngModel)]="newReqCategory" class="form-control form-select">\n              <option>Class I (Rations)</option>\n              <option>Class III (POL)</option>\n              <option>Class V (Ammo)</option>\n              <option>Class IX (Spares)</option>\n              <option>ECC / Winter Clothing</option>\n            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Supply Category') }} <span class="req-star">*</span></label>\n            <select [(ngModel)]="newReqCategory" class="form-control form-select">\n              <option value="Class I (Rations)">{{ langService.t('Class I (Rations)') }}</option>\n              <option value="Class III (POL)">{{ langService.t('Class III (POL)') }}</option>\n              <option value="Class V (Ammo)">{{ langService.t('Class V (Ammo)') }}</option>\n              <option value="Class IX (Spares)">{{ langService.t('Class IX (Spares)') }}</option>\n              <option value="ECC / Winter Clothing">{{ langService.t('ECC / Winter Clothing') }}</option>\n            </select>`
  },
  {
    target: `<label class="form-label">Urgency Priority <span class="req-star">*</span></label>\n            <select [(ngModel)]="newReqPriority" class="form-control form-select">\n              <option>Routine</option>\n              <option>Operational Priority 1</option>\n              <option>SOS Emergency</option>\n            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Urgency Priority') }} <span class="req-star">*</span></label>\n            <select [(ngModel)]="newReqPriority" class="form-control form-select">\n              <option value="Routine">{{ langService.t('Routine') }}</option>\n              <option value="Operational Priority 1">{{ langService.t('Operational Priority 1') }}</option>\n              <option value="SOS Emergency">{{ langService.t('SOS Emergency') }}</option>\n            </select>`
  },
  {
    target: `<label class="form-label">Item Nomenclature <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newReqItem" placeholder="e.g. Sub-Zero -40°C HSD" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Item Nomenclature') }} <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newReqItem" [placeholder]="langService.t('e.g. Sub-Zero -40°C HSD')" class="form-control">`
  },
  {
    target: `<label class="form-label">Requested Quantity <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newReqQty" placeholder="e.g. 18,000 Litres" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Requested Quantity') }} <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newReqQty" [placeholder]="langService.t('e.g. 18,000 Litres')" class="form-control">`
  },
  {
    target: `<label class="form-label">Consignee Delivery Depot</label>\n            <input type="text" value="14 Rajput BFI Depot (Sector 4A Forward)" class="form-control form-readonly" readonly>`,
    replacement: `<label class="form-label">{{ langService.t('Consignee Delivery Depot') }}</label>\n            <input type="text" [value]="langService.t('14 Rajput BFI Depot (Sector 4A Forward)')" class="form-control form-readonly" readonly>`
  },
  {
    target: `<label class="form-label">Reason / Operational Justification <span class="req-star">*</span></label>\n            <textarea [(ngModel)]="newReqReason" rows="3" placeholder="Specify tactical justification, burn-rate surge, or pre-winter stockpile buffer requirement..." class="form-control form-textarea"></textarea>`,
    replacement: `<label class="form-label">{{ langService.t('Reason / Operational Justification') }} <span class="req-star">*</span></label>\n            <textarea [(ngModel)]="newReqReason" rows="3" [placeholder]="langService.t('Specify tactical justification, burn-rate surge, or pre-winter stockpile buffer requirement...')" class="form-control form-textarea"></textarea>`
  },
  {
    target: `<span class="modal-form-badge">{{ selectedRequest.category }} · DEFENSE INDENT LIFECYCLE</span>\n          <h3 class="modal-title">Indent Voucher: {{ selectedRequest.id }}</h3>\n          <p class="modal-subtitle-text">{{ selectedRequest.itemDescription }} ({{ selectedRequest.requestedQty }})</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t(selectedRequest.category) }} · {{ langService.t('DEFENSE INDENT LIFECYCLE') }}</span>\n          <h3 class="modal-title">{{ langService.t('Indent Voucher:') }} {{ selectedRequest.id }}</h3>\n          <p class="modal-subtitle-text">{{ langService.t(selectedRequest.itemDescription) }} ({{ langService.t(selectedRequest.requestedQty) }})</p>`
  },
  {
    target: `<span class="spec-label">URGENCY PRIORITY</span>\n            <span class="spec-val font-accent">{{ selectedRequest.urgency }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('URGENCY PRIORITY') }}</span>\n            <span class="spec-val font-accent">{{ langService.t(selectedRequest.urgency) }}</span>`
  },
  {
    target: `<span class="spec-label">CURRENT STATUS</span>\n            <span class="spec-val font-green font-bold">{{ selectedRequest.status }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('CURRENT STATUS') }}</span>\n            <span class="spec-val font-green font-bold">{{ langService.t(selectedRequest.status) }}</span>`
  },
  {
    target: `<span *ngIf="selectedRequest.status === 'Pending HQ Approval'">Approve via DGOS HQ</span>\n          <span *ngIf="selectedRequest.status === 'Approved by DGOS'">Dispatch from COD</span>\n          <span *ngIf="selectedRequest.status === 'Dispatched from COD'">Acknowledge Delivery</span>`,
    replacement: `<span *ngIf="selectedRequest.status === 'Pending HQ Approval'">{{ langService.t('Approve via DGOS HQ') }}</span>\n          <span *ngIf="selectedRequest.status === 'Approved by DGOS'">{{ langService.t('Dispatch from COD') }}</span>\n          <span *ngIf="selectedRequest.status === 'Dispatched from COD'">{{ langService.t('Acknowledge Delivery') }}</span>`
  },
  {
    target: `<h3 class="modal-title">SATCOM Telemetry: {{ selectedShipment.callsign }}</h3>\n            <span class="convoy-modal-sub">ID: {{ selectedShipment.id }} • {{ selectedShipment.status }} • {{ selectedShipment.riskLevel }} Risk</span>`,
    replacement: `<h3 class="modal-title">{{ langService.t('SATCOM Telemetry:') }} {{ langService.t(selectedShipment.callsign) }}</h3>\n            <span class="convoy-modal-sub">ID: {{ selectedShipment.id }} • {{ langService.t(selectedShipment.status) }} • {{ langService.t(selectedShipment.riskLevel) }} {{ langService.t('Risk') }}</span>`
  },
  {
    target: `<span class="spec-label">ORIGIN DEPOT</span>\n            <span class="spec-val">{{ selectedShipment.source }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('ORIGIN DEPOT') }}</span>\n            <span class="spec-val">{{ langService.t(selectedShipment.source) }}</span>`
  },
  {
    target: `<span class="spec-label">DESTINATION</span>\n            <span class="spec-val">{{ selectedShipment.destination }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('DESTINATION') }}</span>\n            <span class="spec-val">{{ langService.t(selectedShipment.destination) }}</span>`
  },
  {
    target: `<span class="spec-label">ESCORT COMMANDER</span>\n            <span class="spec-val font-accent">{{ selectedShipment.driverEscort }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('ESCORT COMMANDER') }}</span>\n            <span class="spec-val font-accent">{{ langService.t(selectedShipment.driverEscort) }}</span>`
  },
  {
    target: `<span class="spec-label">FLEET ASSETS</span>\n            <span class="spec-val">{{ selectedShipment.vehiclesCount }} Military Trucks</span>`,
    replacement: `<span class="spec-label">{{ langService.t('FLEET ASSETS') }}</span>\n            <span class="spec-val">{{ selectedShipment.vehiclesCount }} {{ langService.t('Military Trucks') }}</span>`
  },
  {
    target: `<span class="spec-label">CARGO MANIFEST</span>\n            <span class="spec-val font-gold">{{ selectedShipment.cargoType }} ({{ selectedShipment.tonnage }}T)</span>`,
    replacement: `<span class="spec-label">{{ langService.t('CARGO MANIFEST') }}</span>\n            <span class="spec-val font-gold">{{ langService.t(selectedShipment.cargoType) }} ({{ selectedShipment.tonnage }}T)</span>`
  },
  {
    target: `<span class="strip-label">TRANSIT AXIS:</span>\n          <span class="strip-text">{{ selectedShipment.route }}</span>`,
    replacement: `<span class="strip-label">{{ langService.t('TRANSIT AXIS:') }}</span>\n          <span class="strip-text">{{ langService.t(selectedShipment.route) }}</span>`
  },
  {
    target: `<strong>ENVIRONMENTAL / HIGH-ALTITUDE ALERT:</strong>\n            <p>{{ selectedShipment.weatherAlert }}</p>`,
    replacement: `<strong>{{ langService.t('ENVIRONMENTAL / HIGH-ALTITUDE ALERT:') }}</strong>\n            <p>{{ langService.t(selectedShipment.weatherAlert) }}</p>`
  },
  {
    target: `<h4>Route Checkpoint Verification Log</h4>\n            <span class="timeline-progress-tag">\n              {{ getPassedCheckpointsCount(selectedShipment) }} of {{ getTotalCheckpointsCount(selectedShipment) }} Checkpoints Verified\n            </span>`,
    replacement: `<h4>{{ langService.t('Route Checkpoint Verification Log') }}</h4>\n            <span class="timeline-progress-tag">\n              {{ getPassedCheckpointsCount(selectedShipment) }} {{ langService.t('of') }} {{ getTotalCheckpointsCount(selectedShipment) }} {{ langService.t('Checkpoints Verified') }}\n            </span>`
  },
  {
    target: `<strong class="cp-title">{{ cp.name }}</strong>\n                  <span class="cp-status-tag" [class.passed]="cp.passed">\n                    {{ cp.passed ? 'PASSED' : 'EN-ROUTE' }}\n                  </span>`,
    replacement: `<strong class="cp-title">{{ langService.t(cp.name) }}</strong>\n                  <span class="cp-status-tag" [class.passed]="cp.passed">\n                    {{ cp.passed ? langService.t('PASSED') : langService.t('EN-ROUTE') }}\n                  </span>`
  },
  {
    target: `<span class="modal-form-badge">{{ selectedReportPreview.classification }} · INDIAN ARMY OFFICIAL RECORD</span>\n          <h3 class="modal-title">{{ selectedReportPreview.title }}</h3>\n          <p class="modal-subtitle-text">Document ID: {{ selectedReportPreview.id }} • {{ selectedReportPreview.period }}</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t(selectedReportPreview.classification) }} · {{ langService.t('INDIAN ARMY OFFICIAL RECORD') }}</span>\n          <h3 class="modal-title">{{ langService.t(selectedReportPreview.title) }}</h3>\n          <p class="modal-subtitle-text">{{ langService.t('Document ID:') }} {{ selectedReportPreview.id }} • {{ langService.t(selectedReportPreview.period) }}</p>`
  },
  {
    target: `<span class="rm-label">AUTHORIZING OFFICER</span>\n            <strong>{{ selectedReportPreview.authorizingOfficer }}</strong>`,
    replacement: `<span class="rm-label">{{ langService.t('AUTHORIZING OFFICER') }}</span>\n            <strong>{{ langService.t(selectedReportPreview.authorizingOfficer) }}</strong>`
  },
  {
    target: `<span class="rm-label">UNIT DESIGNATION</span>\n            <strong>{{ unitDbService.selectedUnit().name }}</strong>`,
    replacement: `<span class="rm-label">{{ langService.t('UNIT DESIGNATION') }}</span>\n            <strong>{{ langService.t(unitDbService.selectedUnit().name) }}</strong>`
  },
  {
    target: `<span class="rm-label">CATEGORY</span>\n            <strong>{{ selectedReportPreview.category }}</strong>`,
    replacement: `<span class="rm-label">{{ langService.t('CATEGORY') }}</span>\n            <strong>{{ langService.t(selectedReportPreview.category) }}</strong>`
  },
  {
    target: `<span class="rm-label">LEDGER AUDIT STATUS</span>\n            <span class="text-green font-bold">✓ {{ selectedReportPreview.status }}</span>`,
    replacement: `<span class="rm-label">{{ langService.t('LEDGER AUDIT STATUS') }}</span>\n            <span class="text-green font-bold">✓ {{ langService.t(selectedReportPreview.status) }}</span>`
  },
  {
    target: `<h4>EXECUTIVE RECONCILIATION SUMMARY</h4>\n          <p>This document certifies that all supply allocations, fuel receipts, and indent transfers for the designated period have been cross-verified with Army Central Ordnance Depot (COD) records and {{ unitDbService.selectedUnit().name }} Regimental Stock Registers. All transactions conform strictly to Army Ordnance Corps (AOC) Regulations and DGOS Standard Operating Procedures.</p>`,
    replacement: `<h4>{{ langService.t('EXECUTIVE RECONCILIATION SUMMARY') }}</h4>\n          <p>{{ langService.t('This document certifies that all supply allocations, fuel receipts, and indent transfers for the designated period have been cross-verified with Army Central Ordnance Depot (COD) records and 14 Rajput (Mechanised) Regimental Stock Registers. All transactions conform strictly to Army Ordnance Corps (AOC) Regulations and DGOS Standard Operating Procedures.') }}</p>`
  },
  {
    target: `<button type="button" class="btn-modal-cancel" (click)="closeReportPreview()">Close Document</button>\n        <button type="button" class="btn-outline-army" (click)="downloadReportCSV(selectedReportPreview)">\n          📊 Download CSV\n        </button>\n        <button type="button" class="btn-modal-submit" (click)="exportReport('PDF', selectedReportPreview); closeReportPreview()">\n          📥 Download Certified PDF\n        </button>`,
    replacement: `<button type="button" class="btn-modal-cancel" (click)="closeReportPreview()">{{ langService.t('Close Document') }}</button>\n        <button type="button" class="btn-outline-army" (click)="downloadReportCSV(selectedReportPreview)">\n          📊 {{ langService.t('Download CSV') }}\n        </button>\n        <button type="button" class="btn-modal-submit" (click)="exportReport('PDF', selectedReportPreview); closeReportPreview()">\n          📥 {{ langService.t('Download Certified PDF') }}\n        </button>`
  },
  {
    target: `<span class="modal-form-badge">ARMY ORDNANCE CORPS · FORM IAFA-2027</span>\n          <h3 class="modal-title">Log Store Receipt Voucher (RV)</h3>\n          <p class="modal-subtitle-text">Record incoming consignment into 14 Rajput Regimental Stores Ledger</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('ARMY ORDNANCE CORPS · FORM IAFA-2027') }}</span>\n          <h3 class="modal-title">{{ langService.t('Log Store Receipt Voucher (RV)') }}</h3>\n          <p class="modal-subtitle-text">{{ langService.t('Record incoming consignment into 14 Rajput Regimental Stores Ledger') }}</p>`
  },
  {
    target: `<label class="form-label">Target Inventory Item <span class="req-star">*</span></label>\n            <select [(ngModel)]="newReceiptItemId" class="form-control form-select">\n              <option *ngFor="let itm of itemsForReceiptCategory" [value]="itm.id">\n                [{{ itm.id }}] {{ itm.item }} (Available: {{ itm.quantity }})\n              </option>\n            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Target Inventory Item') }} <span class="req-star">*</span></label>\n            <select [(ngModel)]="newReceiptItemId" class="form-control form-select">\n              <option *ngFor="let itm of itemsForReceiptCategory" [value]="itm.id">\n                [{{ itm.id }}] {{ langService.t(itm.item) }} ({{ langService.t('Available:') }} {{ itm.quantity }})\n              </option>\n            </select>`
  },
  {
    target: `<label class="form-label">Quantity Received & Inspected <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newReceiptQty" placeholder="e.g. 5,000 Litres or 500 Packs" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Quantity Received & Inspected') }} <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newReceiptQty" [placeholder]="langService.t('e.g. 5,000 Litres or 500 Packs')" class="form-control">`
  },
  {
    target: `<label class="form-label">Consignor / Origin Depot</label>\n            <input type="text" [(ngModel)]="newReceiptDepot" placeholder="e.g. COD Pathankot / FSD Leh" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Consignor / Origin Depot') }}</label>\n            <input type="text" [(ngModel)]="newReceiptDepot" [placeholder]="langService.t('e.g. COD Pathankot / FSD Leh')" class="form-control">`
  },
  {
    target: `<label class="form-label">Quality Inspection & Escort Verification</label>\n            <textarea [(ngModel)]="newReceiptNotes" rows="2" placeholder="Inspection certified by Quartermaster. Seals intact, lab test verified..." class="form-control form-textarea"></textarea>`,
    replacement: `<label class="form-label">{{ langService.t('Quality Inspection & Escort Verification') }}</label>\n            <textarea [(ngModel)]="newReceiptNotes" rows="2" [placeholder]="langService.t('Inspection certified by Quartermaster. Seals intact, lab test verified...')" class="form-control form-textarea"></textarea>`
  },
  {
    target: `<span class="modal-form-badge">ARMY ORDNANCE CORPS · FORM IAFA-2028</span>\n          <h3 class="modal-title">Record Daily Store Issue & Consumption</h3>\n          <p class="modal-subtitle-text">Debit operational burn and troop rations from 14 Rajput Stock Ledger</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('ARMY ORDNANCE CORPS · FORM IAFA-2028') }}</span>\n          <h3 class="modal-title">{{ langService.t('Record Daily Store Issue & Consumption') }}</h3>\n          <p class="modal-subtitle-text">{{ langService.t('Debit operational burn and troop rations from 14 Rajput Stock Ledger') }}</p>`
  },
  {
    target: `<label class="form-label">Select Stock Item <span class="req-star">*</span></label>\n            <select [(ngModel)]="newIssueItemId" class="form-control form-select">\n              <option *ngFor="let itm of itemsForIssueCategory" [value]="itm.id">\n                [{{ itm.id }}] {{ itm.item }} (Available: {{ itm.quantity }})\n              </option>\n            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Select Stock Item') }} <span class="req-star">*</span></label>\n            <select [(ngModel)]="newIssueItemId" class="form-control form-select">\n              <option *ngFor="let itm of itemsForIssueCategory" [value]="itm.id">\n                [{{ itm.id }}] {{ langService.t(itm.item) }} ({{ langService.t('Available:') }} {{ itm.quantity }})\n              </option>\n            </select>`
  },
  {
    target: `<label class="form-label">Quantity to Issue / Burn <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newIssueQty" placeholder="e.g. 450 Litres or 200 Packs" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Quantity to Issue / Burn') }} <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newIssueQty" [placeholder]="langService.t('e.g. 450 Litres or 200 Packs')" class="form-control">`
  },
  {
    target: `<label class="form-label">Receiving Post / Sub-Unit <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newIssueRecipient" placeholder="e.g. Bravo Coy, FDL Shyok Sector 4A" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Receiving Post / Sub-Unit') }} <span class="req-star">*</span></label>\n            <input type="text" [(ngModel)]="newIssueRecipient" [placeholder]="langService.t('e.g. Bravo Coy, FDL Shyok Sector 4A')" class="form-control">`
  },
  {
    target: `<label class="form-label">Operational Purpose</label>\n            <input type="text" [(ngModel)]="newIssuePurpose" placeholder="e.g. Bukhari continuous heating / BMP-II patrol" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Operational Purpose') }}</label>\n            <input type="text" [(ngModel)]="newIssuePurpose" [placeholder]="langService.t('e.g. Bukhari continuous heating / BMP-II patrol')" class="form-control">`
  },
  {
    target: `<span class="modal-form-badge">BRO / METEOROLOGICAL DEFENSE INTEL · LIVE CORRIDOR STATUS</span>\n          <h3 class="modal-title">Pass Telemetry: {{ selectedPass.passName }}</h3>\n          <p class="modal-subtitle-text">📍 {{ selectedPass.location }} • Elevation: {{ selectedPass.elevation }}</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('BRO / METEOROLOGICAL DEFENSE INTEL · LIVE CORRIDOR STATUS') }}</span>\n          <h3 class="modal-title">{{ langService.t('Pass Telemetry:') }} {{ langService.t(selectedPass.passName) }}</h3>\n          <p class="modal-subtitle-text">📍 {{ langService.t(selectedPass.location) }} • {{ langService.t('Elevation:') }} {{ selectedPass.elevation }}</p>`
  },
  {
    target: `<strong>CORRIDOR DEFENSE ADVISORY:</strong>\n            <p>{{ selectedPass.alert }}</p>`,
    replacement: `<strong>{{ langService.t('CORRIDOR DEFENSE ADVISORY:') }}</strong>\n            <p>{{ langService.t(selectedPass.alert) }}</p>`
  },
  {
    target: `<strong>Designated Bypass Axis:</strong>\n              <p>{{ selectedPass.alternativeRoute }}</p>`,
    replacement: `<strong>{{ langService.t('Designated Bypass Axis:') }}</strong>\n              <p>{{ langService.t(selectedPass.alternativeRoute) }}</p>`
  }
];

let applied = 0;
for (const r of replacements) {
  if (html.includes(r.target)) {
    html = html.replace(r.target, r.replacement);
    applied++;
  } else {
    console.warn('Still not found:', r.target.slice(0, 50));
  }
}

if (hasCRLF) {
  html = html.replace(/\n/g, '\r\n');
}

console.log(`Applied ${applied} of ${replacements.length} multiline replacements.`);
fs.writeFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', html, 'utf8');
