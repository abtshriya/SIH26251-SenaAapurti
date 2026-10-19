const fs = require('fs');

let html = fs.readFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

// Replacements array of { target, replacement }
const replacements = [
  // --- Tab 2.1 Dashboard Overview ---
  {
    target: `<span class="ud-sec-badge">{{ unitDbService.selectedUnit().corps ? (langService.t('CORPS // ') + langService.t(unitDbService.selectedUnit().corps)) : langService.t('SECTOR COMMAND // 14 CORPS') }}</span>`,
    replacement: `<span class="ud-sec-badge">{{ unitDbService.selectedUnit().corps ? (langService.t('CORPS // ') + langService.t(unitDbService.selectedUnit().corps)) : langService.t('SECTOR COMMAND // 14 CORPS') }}</span>`
  },
  {
    target: `<span class="ud-satcom-status">SATCOM ONLINE</span>`,
    replacement: `<span class="ud-satcom-status">{{ langService.t('SATCOM ONLINE') }}</span>`
  },
  {
    target: `<span>Flash SOS Air-Drop</span>`,
    replacement: `<span>{{ langService.t('Flash SOS Air-Drop') }}</span>`
  },
  {
    target: `<span class="ud-kpi-label">UNIT READINESS</span>
              <span class="ud-kpi-badge badge-green">OPTIMAL</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('UNIT READINESS') }}</span>
              <span class="ud-kpi-badge badge-green">{{ langService.t('OPTIMAL') }}</span>`
  },
  {
    target: `<span>Optimal Posture</span>`,
    replacement: `<span>{{ langService.t('Optimal Posture') }}</span>`
  },
  {
    target: `<span class="ud-kpi-label">INVENTORY HEALTH</span>
              <span class="ud-kpi-badge badge-green">STABLE</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('INVENTORY HEALTH') }}</span>
              <span class="ud-kpi-badge badge-green">{{ langService.t('STABLE') }}</span>`
  },
  {
    target: `<div class="ud-kpi-val text-green">Optimal</div>`,
    replacement: `<div class="ud-kpi-val text-green">{{ langService.t('Optimal') }}</div>`
  },
  {
    target: `<span>48 DOS Average</span>`,
    replacement: `<span>{{ langService.t('48 DOS Average') }}</span>`
  },
  {
    target: `<span class="ud-kpi-label">CRITICAL SUPPLIES</span>
              <span class="ud-kpi-badge badge-saffron">ATTENTION</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('CRITICAL SUPPLIES') }}</span>
              <span class="ud-kpi-badge badge-saffron">{{ langService.t('ATTENTION') }}</span>`
  },
  {
    target: `<div class="ud-kpi-val text-saffron">2 Items</div>`,
    replacement: `<div class="ud-kpi-val text-saffron">{{ langService.t('2 Items') }}</div>`
  },
  {
    target: `<span>Spares under transit</span>`,
    replacement: `<span>{{ langService.t('Spares under transit') }}</span>`
  },
  {
    target: `<span class="ud-kpi-label">DAYS OF SUPPLY</span>
              <span class="ud-kpi-badge badge-gold">WINTER SCALE</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('DAYS OF SUPPLY') }}</span>
              <span class="ud-kpi-badge badge-gold">{{ langService.t('WINTER SCALE') }}</span>`
  },
  {
    target: `<div class="ud-kpi-val text-gold">48 DOS</div>`,
    replacement: `<div class="ud-kpi-val text-gold">{{ langService.t('48 DOS') }}</div>`
  },
  {
    target: `<span>POL & Dry Rations</span>`,
    replacement: `<span>{{ langService.t('POL & Dry Rations') }}</span>`
  },
  {
    target: `<span class="ud-kpi-label">PENDING REQUESTS</span>
              <span class="ud-kpi-badge badge-blue">ACTIVE</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('PENDING REQUESTS') }}</span>
              <span class="ud-kpi-badge badge-blue">{{ langService.t('ACTIVE') }}</span>`
  },
  {
    target: `<div class="ud-kpi-val text-blue">1 Indent</div>`,
    replacement: `<div class="ud-kpi-val text-blue">{{ langService.t('1 Indent') }}</div>`
  },
  {
    target: `<span>18,000L POL Approved</span>`,
    replacement: `<span>{{ langService.t('18,000L POL Approved') }}</span>`
  },
  {
    target: `<span class="ud-kpi-label">INCOMING SHIPMENTS</span>
              <span class="ud-kpi-badge badge-blue">EN ROUTE</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('INCOMING SHIPMENTS') }}</span>
              <span class="ud-kpi-badge badge-blue">{{ langService.t('EN ROUTE') }}</span>`
  },
  {
    target: `<div class="ud-kpi-val text-blue">2 Convoys</div>`,
    replacement: `<div class="ud-kpi-val text-blue">{{ langService.t('2 Convoys') }}</div>`
  },
  {
    target: `<span class="ud-kpi-label">ACTIVE LOGISTICS</span>
              <span class="ud-kpi-badge badge-gold">AXIS LOAD</span>`,
    replacement: `<span class="ud-kpi-label">{{ langService.t('ACTIVE LOGISTICS') }}</span>
              <span class="ud-kpi-badge badge-gold">{{ langService.t('AXIS LOAD') }}</span>`
  },
  {
    target: `<div class="ud-kpi-val text-gold">340 T</div>`,
    replacement: `<div class="ud-kpi-val text-gold">{{ langService.t('340 T') }}</div>`
  },
  {
    target: `<span>Rolling on Axis</span>`,
    replacement: `<span>{{ langService.t('Rolling on Axis') }}</span>`
  },
  {
    target: `<span class="ud-actions-badge">TACTICAL OPS</span>
            <span class="ud-actions-title">QUICK OPERATIONAL ACTIONS:</span>`,
    replacement: `<span class="ud-actions-badge">{{ langService.t('TACTICAL OPS') }}</span>
            <span class="ud-actions-title">{{ langService.t('QUICK OPERATIONAL ACTIONS:') }}</span>`
  },
  {
    target: `<span class="ud-btn-plus">+</span> Request Supply Requisition`,
    replacement: `<span class="ud-btn-plus">+</span> {{ langService.t('Request Supply Requisition') }}`
  },
  {
    target: `<span class="ud-btn-sym">📋</span> Record Daily Consumption`,
    replacement: `<span class="ud-btn-sym">📋</span> {{ langService.t('Record Daily Consumption') }}`
  },
  {
    target: `<span class="ud-btn-sym">📥</span> Update Received Inventory`,
    replacement: `<span class="ud-btn-sym">📥</span> {{ langService.t('Update Received Inventory') }}`
  },
  {
    target: `<span class="ud-btn-sym">🚚</span> Track Incoming Shipment`,
    replacement: `<span class="ud-btn-sym">🚚</span> {{ langService.t('Track Incoming Shipment') }}`
  },
  {
    target: `<span class="ud-meta-segment">Fresh: <strong>12 Days</strong></span>
                  <span class="ud-meta-divider">|</span>
                  <span class="ud-meta-segment">MRE/Dry: <strong>36 Days</strong></span>`,
    replacement: `<span class="ud-meta-segment">{{ langService.t('Fresh:') }} <strong>{{ langService.t('12 Days') }}</strong></span>
                  <span class="ud-meta-divider">|</span>
                  <span class="ud-meta-segment">{{ langService.t('MRE/Dry:') }} <strong>{{ langService.t('36 Days') }}</strong></span>`
  },
  {
    target: `<span class="ud-meta-segment">Winter Grade -40°C HSD: <strong>12,400L</strong></span>
                  <span class="ud-meta-divider">|</span>
                  <span class="ud-meta-segment">2T Oil: <strong>3,800L</strong></span>`,
    replacement: `<span class="ud-meta-segment">{{ langService.t('Winter Grade -40°C HSD:') }} <strong>12,400L</strong></span>
                  <span class="ud-meta-divider">|</span>
                  <span class="ud-meta-segment">{{ langService.t('2T Oil:') }} <strong>3,800L</strong></span>`
  },
  {
    target: `<span class="ud-meta-segment">Small Arms: <strong>100%</strong></span>
                  <span class="ud-meta-divider">|</span>
                  <span class="ud-meta-segment">ATGM Missiles: <strong>92%</strong></span>`,
    replacement: `<span class="ud-meta-segment">{{ langService.t('Small Arms:') }} <strong>100%</strong></span>
                  <span class="ud-meta-divider">|</span>
                  <span class="ud-meta-segment">{{ langService.t('ATGM Missiles:') }} <strong>92%</strong></span>`
  },
  {
    target: `<strong class="ud-convoy-name">Convoy GARUDA-01</strong>`,
    replacement: `<strong class="ud-convoy-name">{{ langService.t('Convoy GARUDA-01') }}</strong>`
  },
  {
    target: `<strong class="ud-convoy-name">Convoy HIMALAYA-9</strong>`,
    replacement: `<strong class="ud-convoy-name">{{ langService.t('Convoy HIMALAYA-9') }}</strong>`
  },
  {
    target: `<span>📡 Track Convoy Live</span>`,
    replacement: `<span>📡 {{ langService.t('Track Convoy Live') }}</span>`
  },
  {
    target: `<span class="ud-altitude-tag">ALT: 3,500m MSL</span>`,
    replacement: `<span class="ud-altitude-tag">{{ langService.t('ALT: 3,500m MSL') }}</span>`
  },

  // --- Tab 2.2 Inventory Ledger ---
  {
    target: `<div class="kpi-label">TOTAL STOCK NOMENCLATURES</div>
            <div class="kpi-value text-gold">{{ totalInventoryCount }} Items</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('TOTAL STOCK NOMENCLATURES') }}</div>
            <div class="kpi-value text-gold">{{ langService.t(totalInventoryCount + ' Items') }}</div>`
  },
  {
    target: `<div class="kpi-label">AVAILABLE & VERIFIED</div>
            <div class="kpi-value text-green">{{ adequateInventoryCount }} Items</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('AVAILABLE & VERIFIED') }}</div>
            <div class="kpi-value text-green">{{ langService.t(adequateInventoryCount + ' Items') }}</div>`
  },
  {
    target: `<div class="kpi-label">LOW STOCK ITEMS</div>
            <div class="kpi-value text-amber">{{ lowInventoryCount }} Items</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('LOW STOCK ITEMS') }}</div>
            <div class="kpi-value text-amber">{{ langService.t(lowInventoryCount + ' Items') }}</div>`
  },
  {
    target: `<div class="kpi-label">CRITICAL SURPLUS</div>
            <div class="kpi-value text-blue">{{ surplusInventoryCount }} Item</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('CRITICAL SURPLUS') }}</div>
            <div class="kpi-value text-blue">{{ langService.t(surplusInventoryCount + ' Item') }}</div>`
  },
  {
    target: `<div class="kpi-label">STOCKOUT RISK</div>
            <div class="kpi-value text-red">{{ criticalInventoryCount }} High Risk</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('STOCKOUT RISK') }}</div>
            <div class="kpi-value text-red">{{ langService.t(criticalInventoryCount + ' High Risk') }}</div>`
  },
  {
    target: `<input type="text" [(ngModel)]="invSearch" placeholder="Search item..." class="form-control-sm">`,
    replacement: `<input type="text" [(ngModel)]="invSearch" [placeholder]="langService.t('Search item...')" class="form-control-sm">`
  },
  {
    target: `<option value="All">All Categories</option>
              <option value="Class I (Rations)">Class I (Rations)</option>
              <option value="Class III (POL)">Class III (POL)</option>
              <option value="Class V (Ammo)">Class V (Ammo)</option>
              <option value="Class IX (Spares)">Class IX (Spares)</option>
              <option value="Medical & Clothing">Medical & Clothing</option>`,
    replacement: `<option value="All">{{ langService.t('All Categories') }}</option>
              <option value="Class I (Rations)">{{ langService.t('Class I (Rations)') }}</option>
              <option value="Class III (POL)">{{ langService.t('Class III (POL)') }}</option>
              <option value="Class V (Ammo)">{{ langService.t('Class V (Ammo)') }}</option>
              <option value="Class IX (Spares)">{{ langService.t('Class IX (Spares)') }}</option>
              <option value="Medical & Clothing">{{ langService.t('Medical & Clothing') }}</option>`
  },
  {
    target: `<option value="All">All Statuses</option>
              <option value="Adequate">Adequate</option>
              <option value="Low">Low Stock</option>
              <option value="Surplus">Surplus</option>
              <option value="Critical">Critical</option>`,
    replacement: `<option value="All">{{ langService.t('All Statuses') }}</option>
              <option value="Adequate">{{ langService.t('Adequate') }}</option>
              <option value="Low">{{ langService.t('Low Stock') }}</option>
              <option value="Surplus">{{ langService.t('Surplus') }}</option>
              <option value="Critical">{{ langService.t('Critical') }}</option>`
  },
  {
    target: `✕ Reset Filters`,
    replacement: `✕ {{ langService.t('Reset Filters') }}`
  },
  {
    target: `<td><strong>{{ item.item }}</strong></td>
                <td><span class="badge-military">{{ item.category }}</span></td>`,
    replacement: `<td><strong>{{ langService.t(item.item) }}</strong></td>
                <td><span class="badge-military">{{ langService.t(item.category) }}</span></td>`
  },
  {
    target: `<span class="d-label">Expired:</span>`,
    replacement: `<span class="d-label">{{ langService.t('Expired:') }}</span>`
  },
  {
    target: `<span class="text-xs text-muted" style="margin-right: 12px;">Direct Stock Actions:</span>`,
    replacement: `<span class="text-xs text-muted" style="margin-right: 12px;">{{ langService.t('Direct Stock Actions:') }}</span>`
  },
  {
    target: `+ Add Store Receipt RV`,
    replacement: `{{ langService.t('+ Add Store Receipt RV') }}`
  },
  {
    target: `📋 Record Issue / Burn`,
    replacement: `📋 {{ langService.t('Record Issue / Burn') }}`
  },
  {
    target: `Close Ledger`,
    replacement: `{{ langService.t('Close Ledger') }}`
  },

  // --- Tab 2.3 Consumption ---
  {
    target: `<span class="kpi-label">DAILY POL RUN-RATE</span>`,
    replacement: `<span class="kpi-label">{{ langService.t('DAILY POL RUN-RATE') }}</span>`
  },
  {
    target: `<span class="kpi-label">DAILY TROOP RATIONS</span>`,
    replacement: `<span class="kpi-label">{{ langService.t('DAILY TROOP RATIONS') }}</span>`
  },
  {
    target: `<span class="kpi-label">MUNITIONS EXPENDITURE</span>`,
    replacement: `<span class="kpi-label">{{ langService.t('MUNITIONS EXPENDITURE') }}</span>`
  },
  {
    target: `<span class="kpi-label">AI WINTER PEAK SURGE</span>`,
    replacement: `<span class="kpi-label">{{ langService.t('AI WINTER PEAK SURGE') }}</span>`
  },
  {
    target: `<span>Gensets (44%) + Bukhari (30%) + BMPs (17%)</span>`,
    replacement: `<span>{{ langService.t('Gensets (44%) + Bukhari (30%) + BMPs (17%)') }}</span>`
  },
  {
    target: `<span>840 Garrison Troops · 3,800 kcal MRE</span>`,
    replacement: `<span>{{ langService.t('840 Garrison Troops · 3,800 kcal MRE') }}</span>`
  },
  {
    target: `<span>7.62mm & 30mm Cannon Zeroing Ranges</span>`,
    replacement: `<span>{{ langService.t('7.62mm & 30mm Cannon Zeroing Ranges') }}</span>`
  },
  {
    target: `<span>Forecast: 630 L/day by Mid-Nov Freeze</span>`,
    replacement: `<span>{{ langService.t('Forecast: 630 L/day by Mid-Nov Freeze') }}</span>`
  },
  {
    target: `<span class="kpi-buffer-tag text-amber">Pass Closes 22d</span>`,
    replacement: `<span class="kpi-buffer-tag text-amber">{{ langService.t('Pass Closes 22d') }}</span>`
  },
  {
    target: `<span class="kpi-buffer-tag text-blue">100% WWR Safe</span>`,
    replacement: `<span class="kpi-buffer-tag text-blue">{{ langService.t('100% WWR Safe') }}</span>`
  },
  {
    target: `<span class="chart-tag">TELEMATICS RADAR</span>`,
    replacement: `<span class="chart-tag">{{ langService.t('TELEMATICS RADAR') }}</span>`
  },
  {
    target: `<span class="chart-model-tag">NEURAL LOGISTICS ENGINE v4.2</span>`,
    replacement: `<span class="chart-model-tag">{{ langService.t('NEURAL LOGISTICS ENGINE v4.2') }}</span>`
  },
  {
    target: `High-Altitude POL Fuel · High-Calorie Rations · Munitions Expenditure · Temperature Correlation Curve`,
    replacement: `{{ langService.t('High-Altitude POL Fuel · High-Calorie Rations · Munitions Expenditure · Temperature Correlation Curve') }}`
  },
  {
    target: `<span class="metric-indicator all-ind"></span> All Classes`,
    replacement: `<span class="metric-indicator all-ind"></span> {{ langService.t('All Classes') }}`
  },
  {
    target: `<span class="metric-indicator pol-ind"></span> Class III (POL)`,
    replacement: `<span class="metric-indicator pol-ind"></span> {{ langService.t('Class III (POL)') }}`
  },
  {
    target: `<span class="metric-indicator rat-ind"></span> Class I (Rations)`,
    replacement: `<span class="metric-indicator rat-ind"></span> {{ langService.t('Class I (Rations)') }}`
  },
  {
    target: `<span class="metric-indicator ammo-ind"></span> Class V (Ammo)`,
    replacement: `<span class="metric-indicator ammo-ind"></span> {{ langService.t('Class V (Ammo)') }}`
  },
  {
    target: `<span class="legend-text">POL Run-Rate (L/d)</span>`,
    replacement: `<span class="legend-text">{{ langService.t('POL Run-Rate (L/d)') }}</span>`
  },
  {
    target: `<span class="legend-text">Rations (Packs)</span>`,
    replacement: `<span class="legend-text">{{ langService.t('Rations (Packs)') }}</span>`
  },
  {
    target: `<span class="legend-text">Munitions (Rnds)</span>`,
    replacement: `<span class="legend-text">{{ langService.t('Munitions (Rnds)') }}</span>`
  },
  {
    target: `<span class="legend-text">Sub-Zero Temp (°C)</span>`,
    replacement: `<span class="legend-text">{{ langService.t('Sub-Zero Temp (°C)') }}</span>`
  },
  {
    target: `<span class="legend-text">Neural Surge Model (+28%)</span>`,
    replacement: `<span class="legend-text">{{ langService.t('Neural Surge Model (+28%)') }}</span>`
  },
  {
    target: `<p class="panel-desc">Real-time telematics from BFI Depot flow-meters & generator telemetry</p>`,
    replacement: `<p class="panel-desc">{{ langService.t('Real-time telematics from BFI Depot flow-meters & generator telemetry') }}</p>`
  },
  {
    target: `Base Prime Gensets (Kirloskar 62.5kVA Twin)`,
    replacement: `{{ langService.t('Base Prime Gensets (Kirloskar 62.5kVA Twin)') }}`
  },
  {
    target: `<div class="meter-sub-text">Continuous radar grid, SATCOM array & medical hospital power</div>`,
    replacement: `<div class="meter-sub-text">{{ langService.t('Continuous radar grid, SATCOM array & medical hospital power') }}</div>`
  },
  {
    target: `Bukhari Space Heaters & Pipe Anti-Freeze`,
    replacement: `{{ langService.t('Bukhari Space Heaters & Pipe Anti-Freeze') }}`
  },
  {
    target: `<div class="meter-sub-text">42 Living bunkers, water pipe continuous trace heating (-18°C)</div>`,
    replacement: `<div class="meter-sub-text">{{ langService.t('42 Living bunkers, water pipe continuous trace heating (-18°C)') }}</div>`
  },
  {
    target: `BMP-II Armoured Vehicles & 4x4 Gypsies`,
    replacement: `{{ langService.t('BMP-II Armoured Vehicles & 4x4 Gypsies') }}`
  },
  {
    target: `<div class="meter-sub-text">11 Combat vehicles on border patrol & daily sub-zero engine warmups</div>`,
    replacement: `<div class="meter-sub-text">{{ langService.t('11 Combat vehicles on border patrol & daily sub-zero engine warmups') }}</div>`
  },
  {
    target: `Auxiliary Thawing & Pre-Heat Burners`,
    replacement: `{{ langService.t('Auxiliary Thawing & Pre-Heat Burners') }}`
  },
  {
    target: `<div class="meter-sub-text">Underground reservoir coil heating to prevent diesel waxing</div>`,
    replacement: `<div class="meter-sub-text">{{ langService.t('Underground reservoir coil heating to prevent diesel waxing') }}</div>`
  },
  {
    target: `<p class="panel-desc">Direct telemetric telemetry from forward fuel tanks & weather stations</p>`,
    replacement: `<p class="panel-desc">{{ langService.t('Direct telemetric telemetry from forward fuel tanks & weather stations') }}</p>`
  },
  {
    target: `<span class="sensor-label">Arctic Diesel Storage (BFI Tank 1)</span>`,
    replacement: `<span class="sensor-label">{{ langService.t('Arctic Diesel Storage (BFI Tank 1)') }}</span>`
  },
  {
    target: `<span class="sensor-label">Command Prime Genset 62.5kVA</span>`,
    replacement: `<span class="sensor-label">{{ langService.t('Command Prime Genset 62.5kVA') }}</span>`
  },
  {
    target: `<span class="sensor-label">Forward AWS Meteorological Mast</span>`,
    replacement: `<span class="sensor-label">{{ langService.t('Forward AWS Meteorological Mast') }}</span>`
  },
  {
    target: `<p class="panel-desc">Himalayan highway pass closure projections & buffer requirements</p>`,
    replacement: `<p class="panel-desc">{{ langService.t('Himalayan highway pass closure projections & buffer requirements') }}</p>`
  },
  {
    target: `<span class="pass-name">ZOJI LA PASS (11,575 FT)</span>`,
    replacement: `<span class="pass-name">{{ langService.t('ZOJI LA PASS (11,575 FT)') }}</span>`
  },
  {
    target: `<span class="pass-badge badge-amber">CLOSING IN ~22 DAYS</span>`,
    replacement: `<span class="pass-badge badge-amber">{{ langService.t('CLOSING IN ~22 DAYS') }}</span>`
  },
  {
    target: `<span>Drift Probability: <strong>88%</strong></span>`,
    replacement: `<span>{{ langService.t('Drift Probability:') }} <strong>88%</strong></span>`
  },
  {
    target: `<span>Last Convoy Slot: <strong>03 Nov</strong></span>`,
    replacement: `<span>{{ langService.t('Last Convoy Slot:') }} <strong>03 Nov</strong></span>`
  },
  {
    target: `<span class="pass-name">KHARDUNG LA PASS (17,582 FT)</span>`,
    replacement: `<span class="pass-name">{{ langService.t('KHARDUNG LA PASS (17,582 FT)') }}</span>`
  },
  {
    target: `<span class="pass-badge badge-blue">CLOSING IN ~31 DAYS</span>`,
    replacement: `<span class="pass-badge badge-blue">{{ langService.t('CLOSING IN ~31 DAYS') }}</span>`
  },
  {
    target: `<span>Snow Chain Mandate: <strong>Active</strong></span>`,
    replacement: `<span>{{ langService.t('Snow Chain Mandate:') }} <strong>{{ langService.t('Active') }}</strong></span>`
  },
  {
    target: `<span>Road Status: <strong>Open for 4x4</strong></span>`,
    replacement: `<span>{{ langService.t('Road Status:') }} <strong>{{ langService.t('Open for 4x4') }}</strong></span>`
  },
  {
    target: `<strong class="text-gold">DGOS / AI LOGISTICS DIRECTIVE:</strong>`,
    replacement: `<strong class="text-gold">{{ langService.t('DGOS / AI LOGISTICS DIRECTIVE:') }}</strong>`
  },
  {
    target: `<p class="advisory-text">
                With expected winter freeze surge climbing to <strong>630 L/day (+28.4%)</strong>, current 16,200L reserves will deplete to critical safety margins in 26 days.
                Pre-stock an additional <strong>25,000L Arctic HSD</strong> before Zoji La closes.
              </p>`,
    replacement: `<p class="advisory-text">{{ langService.t('With expected winter freeze surge climbing to 630 L/day (+28.4%), current 16,200L reserves will deplete to critical safety margins in 26 days. Pre-stock an additional 25,000L Arctic HSD before Zoji La closes.') }}</p>`
  },
  {
    target: `<span>⚡ Auto-Generate Pre-Winter Indent Voucher</span>`,
    replacement: `<span>⚡ {{ langService.t('Auto-Generate Pre-Winter Indent Voucher') }}</span>`
  },

  // --- Tab 2.4 Requests ---
  {
    target: `+ Create New Requisition`,
    replacement: `+ {{ langService.t('Create New Requisition') }}`
  },
  {
    target: `<td class="col-cat nowrap-cell"><span class="badge-military">{{ ind.category }}</span></td>
                <td class="col-item item-nomenclature-cell"><strong>{{ ind.itemDescription }}</strong></td>`,
    replacement: `<td class="col-cat nowrap-cell"><span class="badge-military">{{ langService.t(ind.category) }}</span></td>
                <td class="col-item item-nomenclature-cell"><strong>{{ langService.t(ind.itemDescription) }}</strong></td>`
  },
  {
    target: `<span class="badge-risk" [class.badge-danger]="ind.urgency === 'SOS Emergency'" [class.badge-gold]="ind.urgency === 'Operational Priority 1'" [class.badge-success]="ind.urgency === 'Routine'">
                    {{ ind.urgency }}
                  </span>`,
    replacement: `<span class="badge-risk" [class.badge-danger]="ind.urgency === 'SOS Emergency'" [class.badge-gold]="ind.urgency === 'Operational Priority 1'" [class.badge-success]="ind.urgency === 'Routine'">
                    {{ langService.t(ind.urgency) }}
                  </span>`
  },
  {
    target: `<span class="badge-status" [class.badge-success]="ind.status === 'Approved by DGOS' || ind.status === 'Dispatched from COD'" [class.badge-gold]="ind.status === 'Pending HQ Approval'">
                    {{ ind.status }}
                  </span>`,
    replacement: `<span class="badge-status" [class.badge-success]="ind.status === 'Approved by DGOS' || ind.status === 'Dispatched from COD'" [class.badge-gold]="ind.status === 'Pending HQ Approval'">
                    {{ langService.t(ind.status) }}
                  </span>`
  },
  {
    target: `Track Stepper`,
    replacement: `{{ langService.t('Track Stepper') }}`
  },

  // --- Tab 2.5 Logistics / Shipments ---
  {
    target: `<div class="kpi-label">Active Convoys</div>
              <div class="kpi-sub">{{ logisticsService.convoys().length - getReroutedConvoysCount() }} In-Transit • {{ getReroutedConvoysCount() }} Rerouted</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Active Convoys') }}</div>
              <div class="kpi-sub">{{ logisticsService.convoys().length - getReroutedConvoysCount() }} {{ langService.t('In-Transit') }} • {{ getReroutedConvoysCount() }} {{ langService.t('Rerouted') }}</div>`
  },
  {
    target: `<div class="kpi-label">Gross Tonnage En-Route</div>
              <div class="kpi-sub">POL, Munitions, Spares & Winter Stores</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Gross Tonnage En-Route') }}</div>
              <div class="kpi-sub">{{ langService.t('POL, Munitions, Spares & Winter Stores') }}</div>`
  },
  {
    target: `<div class="kpi-label">Heavy Military Trucks</div>
              <div class="kpi-sub">100% ASC & EME Escorts Assigned</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Heavy Military Trucks') }}</div>
              <div class="kpi-sub">{{ langService.t('100% ASC & EME Escorts Assigned') }}</div>`
  },
  {
    target: `<div class="kpi-label">Next Inbound Arrival</div>
              <div class="kpi-sub">CHETAK-2 (CV-442-W) • COD Agra</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Next Inbound Arrival') }}</div>
              <div class="kpi-sub">{{ langService.t('CHETAK-2 (CV-442-W) • COD Agra') }}</div>`
  },
  {
    target: `placeholder="Search by Callsign (e.g. GARUDA), Depot, Route Axis, Convoy ID..."`,
    replacement: `[placeholder]="langService.t('Search by Callsign (e.g. GARUDA), Depot, Route Axis, Convoy ID...')"`
  },
  {
    target: `<span>Cards</span>`,
    replacement: `<span>{{ langService.t('Cards') }}</span>`
  },
  {
    target: `<span>Table</span>`,
    replacement: `<span>{{ langService.t('Table') }}</span>`
  },
  {
    target: `<span>All Cargo ({{ logisticsService.convoys().length }})</span>`,
    replacement: `<span>{{ langService.t('All Cargo') }} ({{ logisticsService.convoys().length }})</span>`
  },
  {
    target: `<span>Class III (POL)</span>`,
    replacement: `<span>{{ langService.t('Class III (POL)') }}</span>`
  },
  {
    target: `<span>Class V (Ammo)</span>`,
    replacement: `<span>{{ langService.t('Class V (Ammo)') }}</span>`
  },
  {
    target: `<span>Winter Stocking</span>`,
    replacement: `<span>{{ langService.t('Winter Stocking') }}</span>`
  },
  {
    target: `<span>Class IX (Spares)</span>`,
    replacement: `<span>{{ langService.t('Class IX (Spares)') }}</span>`
  },
  {
    target: `<label class="toolbar-label">Status:</label>
                <select [(ngModel)]="logisticsStatusFilter" class="toolbar-select">
                  <option value="All">All Statuses</option>
                  <option value="In-Transit">In-Transit</option>
                  <option value="Rerouted">Rerouted</option>
                </select>`,
    replacement: `<label class="toolbar-label">{{ langService.t('Status:') }}</label>
                <select [(ngModel)]="logisticsStatusFilter" class="toolbar-select">
                  <option value="All">{{ langService.t('All Statuses') }}</option>
                  <option value="In-Transit">{{ langService.t('In-Transit') }}</option>
                  <option value="Rerouted">{{ langService.t('Rerouted') }}</option>
                </select>`
  },
  {
    target: `Displaying <strong>{{ filteredConvoys().length }}</strong> of {{ logisticsService.convoys().length }} Convoys`,
    replacement: `{{ langService.t('Displaying') }} <strong>{{ filteredConvoys().length }}</strong> {{ langService.t('of') }} {{ logisticsService.convoys().length }} {{ langService.t('Convoys') }}`
  },
  {
    target: `Reset Filters ↺`,
    replacement: `{{ langService.t('Reset Filters') }} ↺`
  },
  {
    target: `<h3>No Convoys Found</h3>
          <p>No military consignments match your search query or filter selection.</p>
          <button type="button" class="btn-army-sm mt-2" (click)="logisticsSearch = ''; logisticsCargoFilter = 'All'; logisticsStatusFilter = 'All'">
            Clear All Filters
          </button>`,
    replacement: `<h3>{{ langService.t('No Convoys Found') }}</h3>
          <p>{{ langService.t('No military consignments match your search query or filter selection.') }}</p>
          <button type="button" class="btn-army-sm mt-2" (click)="logisticsSearch = ''; logisticsCargoFilter = 'All'; logisticsStatusFilter = 'All'">
            {{ langService.t('Clear All Filters') }}
          </button>`
  },
  {
    target: `<span class="c-callsign convoy-clickable-title" (click)="inspectConvoy(c)" title="Inspect Telemetry & Stepper">{{ c.callsign }}</span>`,
    replacement: `<span class="c-callsign convoy-clickable-title" (click)="inspectConvoy(c)" [title]="langService.t('Inspect Telemetry & Stepper')">{{ langService.t(c.callsign) }}</span>`
  },
  {
    target: `<span class="escort-name">{{ c.driverEscort }}</span>`,
    replacement: `<span class="escort-name">{{ langService.t(c.driverEscort) }}</span>`
  },
  {
    target: `{{ (c.status === 'Arrived' || isConvoyAcknowledged(c.id)) ? 'Received / In Stores' : c.status }}`,
    replacement: `{{ langService.t((c.status === 'Arrived' || isConvoyAcknowledged(c.id)) ? 'Received / In Stores' : c.status) }}`
  },
  {
    target: `{{ c.riskLevel }} Risk`,
    replacement: `{{ langService.t(c.riskLevel) }} {{ langService.t('Risk') }}`
  },
  {
    target: `<span class="depot-type">ORIGIN DEPOT</span>
                  <span class="depot-name">{{ c.source }}</span>`,
    replacement: `<span class="depot-type">{{ langService.t('ORIGIN DEPOT') }}</span>
                  <span class="depot-name">{{ langService.t(c.source) }}</span>`
  },
  {
    target: `<span class="depot-type">DESTINATION</span>
                  <span class="depot-name">{{ c.destination }}</span>`,
    replacement: `<span class="depot-type">{{ langService.t('DESTINATION') }}</span>
                  <span class="depot-name">{{ langService.t(c.destination) }}</span>`
  },
  {
    target: `<span class="axis-text"><strong>Transit Axis:</strong> {{ c.route }}</span>`,
    replacement: `<span class="axis-text"><strong>{{ langService.t('Transit Axis:') }}</strong> {{ langService.t(c.route) }}</span>`
  },
  {
    target: `<span class="c-metric-label">CARGO CATEGORY</span>
                <span class="c-metric-val font-accent">{{ c.cargoType }}</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('CARGO CATEGORY') }}</span>
                <span class="c-metric-val font-accent">{{ langService.t(c.cargoType) }}</span>`
  },
  {
    target: `<span class="c-metric-label">PAYLOAD</span>
                <span class="c-metric-val font-gold">{{ c.tonnage }} Metric Tons</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('PAYLOAD') }}</span>
                <span class="c-metric-val font-gold">{{ c.tonnage }} {{ langService.t('Metric Tons') }}</span>`
  },
  {
    target: `<span class="c-metric-label">FLEET VEHICLES</span>
                <span class="c-metric-val">{{ c.vehiclesCount }} Trucks</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('FLEET VEHICLES') }}</span>
                <span class="c-metric-val">{{ c.vehiclesCount }} {{ langService.t('Trucks') }}</span>`
  },
  {
    target: `<span class="c-metric-label">ESTIMATED ARRIVAL</span>
                <span class="c-metric-val font-green font-bold">{{ c.eta }}</span>`,
    replacement: `<span class="c-metric-label">{{ langService.t('ESTIMATED ARRIVAL') }}</span>
                <span class="c-metric-val font-green font-bold">{{ langService.t(c.eta) }}</span>`
  },
  {
    target: `<span class="waypoint-radar-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.48"></path></svg>
                  </span> Route Checkpoints Progress:
                  <strong>{{ getPassedCheckpointsCount(c) }} of {{ getTotalCheckpointsCount(c) }} Cleared</strong>`,
    replacement: `<span class="waypoint-radar-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.48"></path></svg>
                  </span> {{ langService.t('Route Checkpoints Progress:') }}
                  <strong>{{ getPassedCheckpointsCount(c) }} {{ langService.t('of') }} {{ getTotalCheckpointsCount(c) }} {{ langService.t('Cleared') }}</strong>`
  },
  {
    target: `<span class="cp-step-name">{{ cp.name }}</span>`,
    replacement: `<span class="cp-step-name">{{ langService.t(cp.name) }}</span>`
  },
  {
    target: `<strong>TACTICAL ADVISORY:</strong> {{ c.weatherAlert }}`,
    replacement: `<strong>{{ langService.t('TACTICAL ADVISORY:') }}</strong> {{ langService.t(c.weatherAlert) }}`
  },
  {
    target: `<span class="btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span> Inspect Telemetry & Stepper`,
    replacement: `<span class="btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span> {{ langService.t('Inspect Telemetry & Stepper') }}`
  },
  {
    target: `<span class="btn-icon">✓</span> {{ (isConvoyAcknowledged(c.id) || c.status === 'Arrived') ? 'Acknowledged & Received' : 'Acknowledge Receipt' }}`,
    replacement: `<span class="btn-icon">✓</span> {{ (isConvoyAcknowledged(c.id) || c.status === 'Arrived') ? langService.t('Acknowledged & Received') : langService.t('Acknowledge Receipt') }}`
  },
  {
    target: `<span class="table-count-tag">{{ filteredConvoys().length }} Records Active</span>`,
    replacement: `<span class="table-count-tag">{{ filteredConvoys().length }} {{ langService.t('Records Active') }}</span>`
  },
  {
    target: `<div class="table-wp-label text-xs">
                        {{ getPassedCheckpointsCount(c) }}/{{ getTotalCheckpointsCount(c) }} Cleared
                      </div>`,
    replacement: `<div class="table-wp-label text-xs">
                        {{ getPassedCheckpointsCount(c) }}/{{ getTotalCheckpointsCount(c) }} {{ langService.t('Cleared') }}
                      </div>`
  },
  {
    target: `{{ (c.status === 'Arrived' || isConvoyAcknowledged(c.id)) ? 'Received' : c.status }}`,
    replacement: `{{ langService.t((c.status === 'Arrived' || isConvoyAcknowledged(c.id)) ? 'Received' : c.status) }}`
  },
  {
    target: `🔍 Stepper`,
    replacement: `🔍 {{ langService.t('Stepper') }}`
  },
  {
    target: `{{ (isConvoyAcknowledged(c.id) || c.status === 'Arrived') ? '✓ In Stores' : '✓ Acknowledge' }}`,
    replacement: `{{ (isConvoyAcknowledged(c.id) || c.status === 'Arrived') ? ('✓ ' + langService.t('In Stores')) : ('✓ ' + langService.t('Acknowledge')) }}`
  },

  // --- Tab 2.6 Weather & BRO ---
  {
    target: `<h2 class="module-title">Sector Passes & Tactical Weather</h2>
            <p class="module-subtitle">High-altitude passes, DGRE avalanche danger scale, and convoy operational accessibility</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Sector Passes & Tactical Weather') }}</h2>
            <p class="module-subtitle">{{ langService.t('High-altitude passes, DGRE avalanche danger scale, and convoy operational accessibility') }}</p>`
  },
  {
    target: `<div class="kpi-label">Lowest Sector Temp</div>
              <div class="kpi-sub">Khardung La Axis • Siachen Base Camp</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Lowest Sector Temp') }}</div>
              <div class="kpi-sub">{{ langService.t('Khardung La Axis • Siachen Base Camp') }}</div>`
  },
  {
    target: `<div class="kpi-label">Max Operational Altitude</div>
              <div class="kpi-sub">Khardung La Ridge Pass AMSL</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Max Operational Altitude') }}</div>
              <div class="kpi-sub">{{ langService.t('Khardung La Ridge Pass AMSL') }}</div>`
  },
  {
    target: `<div class="kpi-val">{{ getRestrictedPassesCount() }} Passes</div>
              <div class="kpi-label">Convoy Transit Restrictions</div>
              <div class="kpi-sub">Chains Required / Black Ice Warnings</div>`,
    replacement: `<div class="kpi-val">{{ getRestrictedPassesCount() }} {{ langService.t('Passes') }}</div>
              <div class="kpi-label">{{ langService.t('Convoy Transit Restrictions') }}</div>
              <div class="kpi-sub">{{ langService.t('Chains Required / Black Ice Warnings') }}</div>`
  },
  {
    target: `<div class="kpi-val">6 Teams</div>
              <div class="kpi-label">BRO Snow Clearance Units</div>
              <div class="kpi-sub">Project HIMANK & BEACON Clearing Axis</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('6 Teams') }}</div>
              <div class="kpi-label">{{ langService.t('BRO Snow Clearance Units') }}</div>
              <div class="kpi-sub">{{ langService.t('Project HIMANK & BEACON Clearing Axis') }}</div>`
  },
  {
    target: `placeholder="Search by Pass Name, Mountain Ridge, or Advisory Alert..."`,
    replacement: `[placeholder]="langService.t('Search by Pass Name, Mountain Ridge, or Advisory Alert...')"`
  },
  {
    target: `All Passes ({{ logisticsService.weatherStations().length }})`,
    replacement: `{{ langService.t('All Passes') }} ({{ logisticsService.weatherStations().length }})`
  },
  {
    target: `🟢 Open ({{ openPassesCount }})`,
    replacement: `🟢 {{ langService.t('Open') }} ({{ openPassesCount }})`
  },
  {
    target: `⛓️ Chains Required ({{ chainsPassesCount }})`,
    replacement: `⛓️ {{ langService.t('Chains Required') }} ({{ chainsPassesCount }})`
  },
  {
    target: `🚫 Convoy Restricted ({{ restrictedPassesCount }})`,
    replacement: `🚫 {{ langService.t('Convoy Restricted') }} ({{ restrictedPassesCount }})`
  },
  {
    target: `<h3 class="st-pass-name">{{ st.passName }}</h3>`,
    replacement: `<h3 class="st-pass-name">{{ langService.t(st.passName) }}</h3>`
  },
  {
    target: `<span class="st-elevation-chip">⛰️ {{ st.elevation }}</span>`,
    replacement: `<span class="st-elevation-chip">⛰️ {{ langService.t(st.elevation) }}</span>`
  },
  {
    target: `<span class="st-location-text">📍 {{ st.location }}</span>`,
    replacement: `<span class="st-location-text">📍 {{ langService.t(st.location) }}</span>`
  },
  {
    target: `{{ st.accessibility }}`,
    replacement: `{{ langService.t(st.accessibility) }}`
  },
  {
    target: `Risk Index: <strong>{{ st.riskScore }}/100</strong>`,
    replacement: `{{ langService.t('Risk Index:') }} <strong>{{ st.riskScore }}/100</strong>`
  },
  {
    target: `<span class="st-m-label">TEMPERATURE</span>`,
    replacement: `<span class="st-m-label">{{ langService.t('TEMPERATURE') }}</span>`
  },
  {
    target: `<span class="st-m-label">PRECIPITATION / SNOW</span>`,
    replacement: `<span class="st-m-label">{{ langService.t('PRECIPITATION / SNOW') }}</span>`
  },
  {
    target: `<span class="st-m-label">WIND VELOCITY</span>`,
    replacement: `<span class="st-m-label">{{ langService.t('WIND VELOCITY') }}</span>`
  },
  {
    target: `<span class="st-m-label">OPTICAL VISIBILITY</span>`,
    replacement: `<span class="st-m-label">{{ langService.t('OPTICAL VISIBILITY') }}</span>`
  },
  {
    target: `<strong>TACTICAL WEATHER ADVISORY:</strong>
                <p>{{ st.alert }}</p>`,
    replacement: `<strong>{{ langService.t('TACTICAL WEATHER ADVISORY:') }}</strong>
                <p>{{ langService.t(st.alert) }}</p>`
  },
  {
    target: `<span class="alt-route-text"><strong>Recommended Bypass Axis:</strong> {{ st.alternativeRoute }} ➔</span>`,
    replacement: `<span class="alt-route-text"><strong>{{ langService.t('Recommended Bypass Axis:') }}</strong> {{ langService.t(st.alternativeRoute) }} ➔</span>`
  },
  {
    target: `<h4 class="bro-heading">BORDER ROADS ORGANISATION (BRO) · HIGH-ALTITUDE ROAD CLEARANCE DIRECTIVES</h4>
                <p class="bro-sub">Live tactical telemetry between 14 Corps Logistics Branch, Project HIMANK (Leh), and Project BEACON (Srinagar)</p>`,
    replacement: `<h4 class="bro-heading">{{ langService.t('BORDER ROADS ORGANISATION (BRO) · HIGH-ALTITUDE ROAD CLEARANCE DIRECTIVES') }}</h4>
                <p class="bro-sub">{{ langService.t('Live tactical telemetry between 14 Corps Logistics Branch, Project HIMANK (Leh), and Project BEACON (Srinagar)') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag himank">PROJECT HIMANK</span>
                <span class="bro-status-live">CLEARING IN PROGRESS</span>`,
    replacement: `<span class="bro-proj-tag himank">{{ langService.t('PROJECT HIMANK') }}</span>
                <span class="bro-status-live">{{ langService.t('CLEARING IN PROGRESS') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Khardung La — North Pullu Axis (Km 38–46)</strong>
              <p class="bro-task-desc">4 Heavy Snow Cutters & 2 Graders clearing 42cm fresh drift. Light military vehicles with tire chains cleared for transit.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Khardung La — North Pullu Axis (Km 38–46)') }}</strong>
              <p class="bro-task-desc">{{ langService.t('4 Heavy Snow Cutters & 2 Graders clearing 42cm fresh drift. Light military vehicles with tire chains cleared for transit.') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag beacon">PROJECT BEACON</span>
                <span class="bro-status-caution">ROCKFALL CLEARANCE</span>`,
    replacement: `<span class="bro-proj-tag beacon">{{ langService.t('PROJECT BEACON') }}</span>
                <span class="bro-status-caution">{{ langService.t('ROCKFALL CLEARANCE') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Zojila Pass — Nilgrath Bypass Corridor</strong>
              <p class="bro-task-desc">Upper pass closed due to fresh rockfall at Km 84. Heavy military convoys diverted via Nilgrath bypass tunnel with Military Police escort.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Zojila Pass — Nilgrath Bypass Corridor') }}</strong>
              <p class="bro-task-desc">{{ langService.t('Upper pass closed due to fresh rockfall at Km 84. Heavy military convoys diverted via Nilgrath bypass tunnel with Military Police escort.') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag vartak">PROJECT VARTAK</span>
                <span class="bro-status-open">ALL-WEATHER TRANSIT</span>`,
    replacement: `<span class="bro-proj-tag vartak">{{ langService.t('PROJECT VARTAK') }}</span>
                <span class="bro-status-open">{{ langService.t('ALL-WEATHER TRANSIT') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Sela Twin-Tube Tunnel Corridor (Kameng)</strong>
              <p class="bro-task-desc">Twin tubes fully operational with automated ventilation & heating. Surface anti-freeze brine sprayed on both approach portals.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Sela Twin-Tube Tunnel Corridor (Kameng)') }}</strong>
              <p class="bro-task-desc">{{ langService.t('Twin tubes fully operational with automated ventilation & heating. Surface anti-freeze brine sprayed on both approach portals.') }}</p>`
  },
  {
    target: `<span class="bro-proj-tag deepak">PROJECT DEEPAK</span>
                <span class="bro-status-live">HIGH-PASS PATROL</span>`,
    replacement: `<span class="bro-proj-tag deepak">{{ langService.t('PROJECT DEEPAK') }}</span>
                <span class="bro-status-live">{{ langService.t('HIGH-PASS PATROL') }}</span>`
  },
  {
    target: `<strong class="bro-route-title">Atal Tunnel — Baralacha La Sector (NH-3)</strong>
              <p class="bro-task-desc">Atal Tunnel tube clear. Continuous grit spraying on Baralacha La switchbacks due to -18°C sub-zero road icing.</p>`,
    replacement: `<strong class="bro-route-title">{{ langService.t('Atal Tunnel — Baralacha La Sector (NH-3)') }}</strong>
              <p class="bro-task-desc">{{ langService.t('Atal Tunnel tube clear. Continuous grit spraying on Baralacha La switchbacks due to -18°C sub-zero road icing.') }}</p>`
  },

  // --- Tab 2.7 AI Insights ---
  {
    target: `<h2 class="module-title">Predictive Logistics Intel & Early Warnings</h2>
            <p class="module-subtitle">Operational risk advisories, demand surge forecasts, and proactive logistics directives for forward units</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Predictive Logistics Intel & Early Warnings') }}</h2>
            <p class="module-subtitle">{{ langService.t('Operational risk advisories, demand surge forecasts, and proactive logistics directives for forward units') }}</p>`
  },
  {
    target: `<div class="kpi-val">1 Critical</div>
              <div class="kpi-label">Severe Weather Hazard</div>
              <div class="kpi-sub">Siachen - DBO Highway (-34°C Cold Wave)</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('1 Critical') }}</div>
              <div class="kpi-label">{{ langService.t('Severe Weather Hazard') }}</div>
              <div class="kpi-sub">{{ langService.t('Siachen - DBO Highway (-34°C Cold Wave)') }}</div>`
  },
  {
    target: `<div class="kpi-val">+28% Surge</div>
              <div class="kpi-label">Winter Caloric Demand</div>
              <div class="kpi-sub">Class I Rations & Heating Fuel Surge</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('+28% Surge') }}</div>
              <div class="kpi-label">{{ langService.t('Winter Caloric Demand') }}</div>
              <div class="kpi-sub">{{ langService.t('Class I Rations & Heating Fuel Surge') }}</div>`
  },
  {
    target: `<div class="kpi-val">4 Directives</div>
              <div class="kpi-label">Mitigation Orders</div>
              <div class="kpi-sub">Prepositioning & Alternate Tunnel Detours</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('4 Directives') }}</div>
              <div class="kpi-label">{{ langService.t('Mitigation Orders') }}</div>
              <div class="kpi-sub">{{ langService.t('Prepositioning & Alternate Tunnel Detours') }}</div>`
  },
  {
    target: `<div class="kpi-val">92% Reliability</div>
              <div class="kpi-label">Historical Confidence</div>
              <div class="kpi-sub">Cross-Checked Against 15-Year Weather Logs</div>`,
    replacement: `<div class="kpi-val">{{ langService.t('92% Reliability') }}</div>
              <div class="kpi-label">{{ langService.t('Historical Confidence') }}</div>
              <div class="kpi-sub">{{ langService.t('Cross-Checked Against 15-Year Weather Logs') }}</div>`
  },
  {
    target: `All Advisories ({{ logisticsService.alerts().length }})`,
    replacement: `{{ langService.t('All Advisories') }} ({{ logisticsService.alerts().length }})`
  },
  {
    target: `🌪️ Weather Hazards`,
    replacement: `🌪️ {{ langService.t('Weather Hazards') }}`
  },
  {
    target: `📊 Demand Surges`,
    replacement: `📊 {{ langService.t('Demand Surges') }}`
  },
  {
    target: `⚙️ Stock Alerts`,
    replacement: `⚙️ {{ langService.t('Stock Alerts') }}`
  },
  {
    target: `🚧 Route Warnings`,
    replacement: `🚧 {{ langService.t('Route Warnings') }}`
  },
  {
    target: `<div class="tray-title">SECONDARY CONTINGENCY COURSES OF ACTION:</div>`,
    replacement: `<div class="tray-title">{{ langService.t('SECONDARY CONTINGENCY COURSES OF ACTION:') }}</div>`
  },
  {
    target: `<span class="coa-text">↳ {{ coa }}</span>
                  <button type="button" class="btn-select-coa" (click)="executeAlternativeAction(alt, coa)">
                    Select & Dispatch COA
                  </button>`,
    replacement: `<span class="coa-text">↳ {{ langService.t(coa) }}</span>
                  <button type="button" class="btn-select-coa" (click)="executeAlternativeAction(alt, coa)">
                    {{ langService.t('Select & Dispatch COA') }}
                  </button>`
  },

  // --- Tab 2.8 Reports ---
  {
    target: `<h2 class="module-title">Unit Logistics Reports</h2>
            <p class="module-subtitle">Official Quartermaster store records, verified fuel balances, and DGOS audit certificates</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Unit Logistics Reports') }}</h2>
            <p class="module-subtitle">{{ langService.t('Official Quartermaster store records, verified fuel balances, and DGOS audit certificates') }}</p>`
  },
  {
    target: `<button type="button" class="btn-outline-army" (click)="exportReport('CSV')">📥 Export CSV</button>
            <button type="button" class="btn-outline-army" (click)="exportReport('PDF')">📄 Export PDF</button>
            <button type="button" class="btn-army-primary" (click)="exportReport('Print')">🖨️ Print Ledger</button>`,
    replacement: `<button type="button" class="btn-outline-army" (click)="exportReport('CSV')">📥 {{ langService.t('Export CSV') }}</button>
            <button type="button" class="btn-outline-army" (click)="exportReport('PDF')">📄 {{ langService.t('Export PDF') }}</button>
            <button type="button" class="btn-army-primary" (click)="exportReport('Print')">🖨️ {{ langService.t('Print Ledger') }}</button>`
  },
  {
    target: `<div class="kpi-label">Ledger Reconciliation</div>
              <div class="kpi-sub">All Vouchers Mathematically Reconciled</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Ledger Reconciliation') }}</div>
              <div class="kpi-sub">{{ langService.t('All Vouchers Mathematically Reconciled') }}</div>`
  },
  {
    target: `<div class="kpi-label">Digitally Signed Tokens</div>
              <div class="kpi-sub">QM Key #14R-QM-71044A Appended</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Digitally Signed Tokens') }}</div>
              <div class="kpi-sub">{{ langService.t('QM Key #14R-QM-71044A Appended') }}</div>`
  },
  {
    target: `<div class="kpi-label">Quarterly Requisitions</div>
              <div class="kpi-sub">100% Verified Delivery & Air Drops</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Quarterly Requisitions') }}</div>
              <div class="kpi-sub">{{ langService.t('100% Verified Delivery & Air Drops') }}</div>`
  },
  {
    target: `<div class="kpi-label">Audit Discrepancy Rate</div>
              <div class="kpi-sub">Zero Material Discrepancies Flagged</div>`,
    replacement: `<div class="kpi-label">{{ langService.t('Audit Discrepancy Rate') }}</div>
              <div class="kpi-sub">{{ langService.t('Zero Material Discrepancies Flagged') }}</div>`
  },
  {
    target: `<h3 class="panel-heading">Certified Regimental Logistics Ledgers</h3>
            <span class="table-count-tag">4 Official Ledgers Available</span>`,
    replacement: `<h3 class="panel-heading">{{ langService.t('Certified Regimental Logistics Ledgers') }}</h3>
            <span class="table-count-tag">{{ langService.t('4 Official Ledgers Available') }}</span>`
  },
  {
    target: `<strong class="convoy-name-link" (click)="openReportPreview(rep)">{{ rep.title }}</strong>`,
    replacement: `<strong class="convoy-name-link" (click)="openReportPreview(rep)">{{ langService.t(rep.title) }}</strong>`
  },
  {
    target: `<span class="text-xs text-muted block">{{ rep.recordsCount }} Records • {{ rep.fileSize }}</span>`,
    replacement: `<span class="text-xs text-muted block">{{ rep.recordsCount }} {{ langService.t('Records') }} • {{ rep.fileSize }}</span>`
  },
  {
    target: `<span class="cargo-tag">{{ rep.category }}</span>`,
    replacement: `<span class="cargo-tag">{{ langService.t(rep.category) }}</span>`
  },
  {
    target: `<span class="font-mono text-xs">{{ rep.period }}</span>`,
    replacement: `<span class="font-mono text-xs">{{ langService.t(rep.period) }}</span>`
  },
  {
    target: `<strong>{{ rep.authorizingOfficer }}</strong>`,
    replacement: `<strong>{{ langService.t(rep.authorizingOfficer) }}</strong>`
  },
  {
    target: `{{ rep.classification }}`,
    replacement: `{{ langService.t(rep.classification) }}`
  },
  {
    target: `<span class="badge-success">✓ {{ rep.status }}</span>`,
    replacement: `<span class="badge-success">✓ {{ langService.t(rep.status) }}</span>`
  },
  {
    target: `👁️ Preview`,
    replacement: `👁️ {{ langService.t('Preview') }}`
  },

  // --- Tab 2.9 Settings ---
  {
    target: `<h2 class="module-title">Unit Terminal & SATCOM Settings</h2>
            <p class="module-subtitle">Regimental authentication profiles, encryption keys, and secure ASCON C4ISR terminal parameters</p>`,
    replacement: `<h2 class="module-title">{{ langService.t('Unit Terminal & SATCOM Settings') }}</h2>
            <p class="module-subtitle">{{ langService.t('Regimental authentication profiles, encryption keys, and secure ASCON C4ISR terminal parameters') }}</p>`
  },
  {
    target: `<span class="btn-icon">{{ settingsSaved ? '✓' : '💾' }}</span> {{ settingsSaved ? 'Settings Saved & Synced!' : 'Save & Sync Settings' }}`,
    replacement: `<span class="btn-icon">{{ settingsSaved ? '✓' : '💾' }}</span> {{ settingsSaved ? langService.t('Settings Saved & Synced!') : langService.t('Save & Sync Settings') }}`
  },
  {
    target: `<h3 class="panel-heading mb-0">Quartermaster Identity & Clearance</h3>
                  <span class="text-xs text-muted">Active duty officer signature keys</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('Quartermaster Identity & Clearance') }}</h3>
                  <span class="text-xs text-muted">{{ langService.t('Active duty officer signature keys') }}</span>`
  },
  {
    target: `<span class="badge-clearance">LEVEL 4 - TOP SECRET</span>`,
    replacement: `<span class="badge-clearance">{{ langService.t('LEVEL 4 - TOP SECRET') }}</span>`
  },
  {
    target: `<label class="form-label">Designated Military Unit</label>`,
    replacement: `<label class="form-label">{{ langService.t('Designated Military Unit') }}</label>`
  },
  {
    target: `<label class="form-label">Authorized Commanding QM</label>`,
    replacement: `<label class="form-label">{{ langService.t('Authorized Commanding QM') }}</label>`
  },
  {
    target: `<label class="form-label">Officer Service Identity</label>`,
    replacement: `<label class="form-label">{{ langService.t('Officer Service Identity') }}</label>`
  },
  {
    target: `<label class="form-label">Stationed Sector Base</label>`,
    replacement: `<label class="form-label">{{ langService.t('Stationed Sector Base') }}</label>`
  },
  {
    target: `<h3 class="panel-heading mb-0">ASCON Grid & SATCOM Uplink</h3>
                  <span class="text-xs text-muted">Military satellite transceiver telemetry</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('ASCON Grid & SATCOM Uplink') }}</h3>
                  <span class="text-xs text-muted">{{ langService.t('Military satellite transceiver telemetry') }}</span>`
  },
  {
    target: `<span class="badge-success">ONLINE · SYNCED</span>`,
    replacement: `<span class="badge-success">{{ langService.t('ONLINE · SYNCED') }}</span>`
  },
  {
    target: `<label class="form-label">Terminal Identity Node</label>`,
    replacement: `<label class="form-label">{{ langService.t('Terminal Identity Node') }}</label>`
  },
  {
    target: `<label class="form-label">Active Transponder</label>`,
    replacement: `<label class="form-label">{{ langService.t('Active Transponder') }}</label>`
  },
  {
    target: `value="GSAT-7A Military Ku-Band (Channel 4)"`,
    replacement: `[value]="langService.t('GSAT-7A Military Ku-Band (Channel 4)')"`
  },
  {
    target: `<label class="form-label">Comms Encryption Standard</label>`,
    replacement: `<label class="form-label">{{ langService.t('Comms Encryption Standard') }}</label>`
  },
  {
    target: `value="AES-256-GCM Hardware Encrypted"`,
    replacement: `[value]="langService.t('AES-256-GCM Hardware Encrypted')"`
  },
  {
    target: `<label class="form-label">Sync Pulse Interval</label>
                <select [(ngModel)]="asconSyncInterval" class="form-control form-select">
                  <option>15 Seconds</option>
                  <option>30 Seconds</option>
                  <option>60 Seconds</option>
                  <option>5 Minutes</option>
                </select>`,
    replacement: `<label class="form-label">{{ langService.t('Sync Pulse Interval') }}</label>
                <select [(ngModel)]="asconSyncInterval" class="form-control form-select">
                  <option value="15 Seconds">{{ langService.t('15 Seconds') }}</option>
                  <option value="30 Seconds">{{ langService.t('30 Seconds') }}</option>
                  <option value="60 Seconds">{{ langService.t('60 Seconds') }}</option>
                  <option value="5 Minutes">{{ langService.t('5 Minutes') }}</option>
                </select>`
  },
  {
    target: `<h3 class="panel-heading mb-0">Tactical Automation & Notification Policies</h3>
                  <span class="text-xs text-muted">Automated defense responses</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('Tactical Automation & Notification Policies') }}</h3>
                  <span class="text-xs text-muted">{{ langService.t('Automated defense responses') }}</span>`
  },
  {
    target: `<strong>Automatic SOS Emergency Flash Broadcast</strong>
                  <span>Auto-task emergency IAF sortie request when forward platoon cuts off by avalanche</span>`,
    replacement: `<strong>{{ langService.t('Automatic SOS Emergency Flash Broadcast') }}</strong>
                  <span>{{ langService.t('Auto-task emergency IAF sortie request when forward platoon cuts off by avalanche') }}</span>`
  },
  {
    target: `<strong>Live Convoy SATCOM SMS & Dispatch Alerts</strong>
                  <span>Broadcast checkpoint clearances and detour alerts to escort Subedars in real-time</span>`,
    replacement: `<strong>{{ langService.t('Live Convoy SATCOM SMS & Dispatch Alerts') }}</strong>
                  <span>{{ langService.t('Broadcast checkpoint clearances and detour alerts to escort Subedars in real-time') }}</span>`
  },
  {
    target: `<strong>Sub-Zero Battery & Bandwidth Optimization</strong>
                  <span>Throttles non-essential background graphics when terminal operates below -20°C ambient</span>`,
    replacement: `<strong>{{ langService.t('Sub-Zero Battery & Bandwidth Optimization') }}</strong>
                  <span>{{ langService.t('Throttles non-essential background graphics when terminal operates below -20°C ambient') }}</span>`
  },
  {
    target: `<strong>Local Ledger Offline Cache</strong>
                  <span>Permits complete voucher signing even if SATCOM uplink is temporarily blocked by blizzard</span>`,
    replacement: `<strong>{{ langService.t('Local Ledger Offline Cache') }}</strong>
                  <span>{{ langService.t('Permits complete voucher signing even if SATCOM uplink is temporarily blocked by blizzard') }}</span>`
  },
  {
    target: `<h3 class="panel-heading mb-0">Cryptographic Signing Credentials</h3>
                  <span class="text-xs text-muted">Army Cyber Security Node authorization</span>`,
    replacement: `<h3 class="panel-heading mb-0">{{ langService.t('Cryptographic Signing Credentials') }}</h3>
                  <span class="text-xs text-muted">{{ langService.t('Army Cyber Security Node authorization') }}</span>`
  },
  {
    target: `<span class="key-label">Active QM Signing Key Token:</span>`,
    replacement: `<span class="key-label">{{ langService.t('Active QM Signing Key Token:') }}</span>`
  },
  {
    target: `<span class="key-label">Key Certificate Expiration:</span>
                <span class="text-xs font-mono text-green">31 December 2026 (Active)</span>`,
    replacement: `<span class="key-label">{{ langService.t('Key Certificate Expiration:') }}</span>
                <span class="text-xs font-mono text-green">{{ langService.t('31 December 2026 (Active)') }}</span>`
  },
  {
    target: `🔄 Re-Authenticate Key with Army Cyber Node`,
    replacement: `🔄 {{ langService.t('Re-Authenticate Key with Army Cyber Node') }}`
  },

  // --- Modals ---
  // Create Request Modal
  {
    target: `<span class="modal-form-badge">DGOS DEFENSE INDENT · FORM IAFA-2026</span>
          <h3 class="modal-title">Submit Ordnance Requisition Voucher</h3>
          <p class="modal-subtitle-text">Direct transmission to Northern Command Supply Depot (14 Corps Logistics Grid)</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('DGOS DEFENSE INDENT · FORM IAFA-2026') }}</span>
          <h3 class="modal-title">{{ langService.t('Submit Ordnance Requisition Voucher') }}</h3>
          <p class="modal-subtitle-text">{{ langService.t('Direct transmission to Northern Command Supply Depot (14 Corps Logistics Grid)') }}</p>`
  },
  {
    target: `title="Close Voucher"`,
    replacement: `[title]="langService.t('Close Voucher')"`
  },
  {
    target: `<label class="form-label">Supply Category <span class="req-star">*</span></label>
            <select [(ngModel)]="newReqCategory" class="form-control form-select">
              <option>Class I (Rations)</option>
              <option>Class III (POL)</option>
              <option>Class V (Ammo)</option>
              <option>Class IX (Spares)</option>
              <option>ECC / Winter Clothing</option>
            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Supply Category') }} <span class="req-star">*</span></label>
            <select [(ngModel)]="newReqCategory" class="form-control form-select">
              <option value="Class I (Rations)">{{ langService.t('Class I (Rations)') }}</option>
              <option value="Class III (POL)">{{ langService.t('Class III (POL)') }}</option>
              <option value="Class V (Ammo)">{{ langService.t('Class V (Ammo)') }}</option>
              <option value="Class IX (Spares)">{{ langService.t('Class IX (Spares)') }}</option>
              <option value="ECC / Winter Clothing">{{ langService.t('ECC / Winter Clothing') }}</option>
            </select>`
  },
  {
    target: `<label class="form-label">Urgency Priority <span class="req-star">*</span></label>
            <select [(ngModel)]="newReqPriority" class="form-control form-select">
              <option>Routine</option>
              <option>Operational Priority 1</option>
              <option>SOS Emergency</option>
            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Urgency Priority') }} <span class="req-star">*</span></label>
            <select [(ngModel)]="newReqPriority" class="form-control form-select">
              <option value="Routine">{{ langService.t('Routine') }}</option>
              <option value="Operational Priority 1">{{ langService.t('Operational Priority 1') }}</option>
              <option value="SOS Emergency">{{ langService.t('SOS Emergency') }}</option>
            </select>`
  },
  {
    target: `<label class="form-label">Item Nomenclature <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newReqItem" placeholder="e.g. Sub-Zero -40°C HSD" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Item Nomenclature') }} <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newReqItem" [placeholder]="langService.t('e.g. Sub-Zero -40°C HSD')" class="form-control">`
  },
  {
    target: `<label class="form-label">Requested Quantity <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newReqQty" placeholder="e.g. 18,000 Litres" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Requested Quantity') }} <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newReqQty" [placeholder]="langService.t('e.g. 18,000 Litres')" class="form-control">`
  },
  {
    target: `<label class="form-label">Required By Date <span class="req-star">*</span></label>`,
    replacement: `<label class="form-label">{{ langService.t('Required By Date') }} <span class="req-star">*</span></label>`
  },
  {
    target: `<label class="form-label">Consignee Delivery Depot</label>
            <input type="text" value="14 Rajput BFI Depot (Sector 4A Forward)" class="form-control form-readonly" readonly>`,
    replacement: `<label class="form-label">{{ langService.t('Consignee Delivery Depot') }}</label>
            <input type="text" [value]="langService.t('14 Rajput BFI Depot (Sector 4A Forward)')" class="form-control form-readonly" readonly>`
  },
  {
    target: `<label class="form-label">Reason / Operational Justification <span class="req-star">*</span></label>
            <textarea [(ngModel)]="newReqReason" rows="3" placeholder="Specify tactical justification, burn-rate surge, or pre-winter stockpile buffer requirement..." class="form-control form-textarea"></textarea>`,
    replacement: `<label class="form-label">{{ langService.t('Reason / Operational Justification') }} <span class="req-star">*</span></label>
            <textarea [(ngModel)]="newReqReason" rows="3" [placeholder]="langService.t('Specify tactical justification, burn-rate surge, or pre-winter stockpile buffer requirement...')" class="form-control form-textarea"></textarea>`
  },
  {
    target: `<strong>SECURE DISPATCH:</strong> Authenticated with QM Key <code>#14R-QM-71044A</code>. Voucher will automatically be queued for DGOS automated dispatch allocation.`,
    replacement: `<strong>{{ langService.t('SECURE DISPATCH:') }}</strong> {{ langService.t('Authenticated with QM Key') }} <code>#14R-QM-71044A</code>. {{ langService.t('Voucher will automatically be queued for DGOS automated dispatch allocation.') }}`
  },
  {
    target: `Discard / Cancel`,
    replacement: `{{ langService.t('Discard / Cancel') }}`
  },
  {
    target: `<span class="btn-check-icon">✓</span> Authorize & Submit Indent`,
    replacement: `<span class="btn-check-icon">✓</span> {{ langService.t('Authorize & Submit Indent') }}`
  },

  // Track Stepper Modal
  {
    target: `<span class="modal-form-badge">{{ selectedRequest.category }} · DEFENSE INDENT LIFECYCLE</span>
          <h3 class="modal-title">Indent Voucher: {{ selectedRequest.id }}</h3>
          <p class="modal-subtitle-text">{{ selectedRequest.itemDescription }} ({{ selectedRequest.requestedQty }})</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t(selectedRequest.category) }} · {{ langService.t('DEFENSE INDENT LIFECYCLE') }}</span>
          <h3 class="modal-title">{{ langService.t('Indent Voucher:') }} {{ selectedRequest.id }}</h3>
          <p class="modal-subtitle-text">{{ langService.t(selectedRequest.itemDescription) }} ({{ langService.t(selectedRequest.requestedQty) }})</p>`
  },
  {
    target: `title="Close Tracker"`,
    replacement: `[title]="langService.t('Close Tracker')"`
  },
  {
    target: `<span class="spec-label">URGENCY PRIORITY</span>
            <span class="spec-val font-accent">{{ selectedRequest.urgency }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('URGENCY PRIORITY') }}</span>
            <span class="spec-val font-accent">{{ langService.t(selectedRequest.urgency) }}</span>`
  },
  {
    target: `<span class="spec-label">REQUIRED BY</span>`,
    replacement: `<span class="spec-label">{{ langService.t('REQUIRED BY') }}</span>`
  },
  {
    target: `<span class="spec-label">DATE SUBMITTED</span>`,
    replacement: `<span class="spec-label">{{ langService.t('DATE SUBMITTED') }}</span>`
  },
  {
    target: `<span class="spec-label">CURRENT STATUS</span>
            <span class="spec-val font-green font-bold">{{ selectedRequest.status }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('CURRENT STATUS') }}</span>
            <span class="spec-val font-green font-bold">{{ langService.t(selectedRequest.status) }}</span>`
  },
  {
    target: `<div class="cp-info"><strong>1. Indent Submitted</strong><span>By QM 14 Rajput (Recorded in Regimental Ledger)</span></div>`,
    replacement: `<div class="cp-info"><strong>{{ langService.t('1. Indent Submitted') }}</strong><span>{{ langService.t('By QM 14 Rajput (Recorded in Regimental Ledger)') }}</span></div>`
  },
  {
    target: `<div class="cp-info"><strong>2. DGOS Approval Granted</strong><span>Northern Command Ordnance Branch Clearance</span></div>`,
    replacement: `<div class="cp-info"><strong>{{ langService.t('2. DGOS Approval Granted') }}</strong><span>{{ langService.t('Northern Command Ordnance Branch Clearance') }}</span></div>`
  },
  {
    target: `<div class="cp-info"><strong>3. Depot Stock Allocation</strong><span>Allocated at Central Ordnance Depot Pathankot</span></div>`,
    replacement: `<div class="cp-info"><strong>{{ langService.t('3. Depot Stock Allocation') }}</strong><span>{{ langService.t('Allocated at Central Ordnance Depot Pathankot') }}</span></div>`
  },
  {
    target: `<div class="cp-info"><strong>4. Convoy Dispatched En-Route</strong><span>Assigned to Convoy Column GARUDA-01</span></div>`,
    replacement: `<div class="cp-info"><strong>{{ langService.t('4. Convoy Dispatched En-Route') }}</strong><span>{{ langService.t('Assigned to Convoy Column GARUDA-01') }}</span></div>`
  },
  {
    target: `<div class="cp-info"><strong>5. Unit Ledger Acknowledged</strong><span>Stores Verification & Receipt Signed</span></div>`,
    replacement: `<div class="cp-info"><strong>{{ langService.t('5. Unit Ledger Acknowledged') }}</strong><span>{{ langService.t('Stores Verification & Receipt Signed') }}</span></div>`
  },
  {
    target: `<strong>TACTICAL LIFECYCLE ACTION:</strong> You can simulate next-stage DGOS clearance or mark as received into base stores below.`,
    replacement: `<strong>{{ langService.t('TACTICAL LIFECYCLE ACTION:') }}</strong> {{ langService.t('You can simulate next-stage DGOS clearance or mark as received into base stores below.') }}`
  },
  {
    target: `<button type="button" class="btn-modal-cancel" (click)="closeTrackModal()">Close</button>`,
    replacement: `<button type="button" class="btn-modal-cancel" (click)="closeTrackModal()">{{ langService.t('Close') }}</button>`
  },
  {
    target: `<span *ngIf="selectedRequest.status === 'Pending HQ Approval'">Approve via DGOS HQ</span>
          <span *ngIf="selectedRequest.status === 'Approved by DGOS'">Dispatch from COD</span>
          <span *ngIf="selectedRequest.status === 'Dispatched from COD'">Acknowledge Delivery</span>`,
    replacement: `<span *ngIf="selectedRequest.status === 'Pending HQ Approval'">{{ langService.t('Approve via DGOS HQ') }}</span>
          <span *ngIf="selectedRequest.status === 'Approved by DGOS'">{{ langService.t('Dispatch from COD') }}</span>
          <span *ngIf="selectedRequest.status === 'Dispatched from COD'">{{ langService.t('Acknowledge Delivery') }}</span>`
  },

  // Convoy Inspector Modal
  {
    target: `<h3 class="modal-title">SATCOM Telemetry: {{ selectedShipment.callsign }}</h3>
            <span class="convoy-modal-sub">ID: {{ selectedShipment.id }} • {{ selectedShipment.status }} • {{ selectedShipment.riskLevel }} Risk</span>`,
    replacement: `<h3 class="modal-title">{{ langService.t('SATCOM Telemetry:') }} {{ langService.t(selectedShipment.callsign) }}</h3>
            <span class="convoy-modal-sub">ID: {{ selectedShipment.id }} • {{ langService.t(selectedShipment.status) }} • {{ langService.t(selectedShipment.riskLevel) }} {{ langService.t('Risk') }}</span>`
  },
  {
    target: `<span class="spec-label">ORIGIN DEPOT</span>
            <span class="spec-val">{{ selectedShipment.source }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('ORIGIN DEPOT') }}</span>
            <span class="spec-val">{{ langService.t(selectedShipment.source) }}</span>`
  },
  {
    target: `<span class="spec-label">DESTINATION</span>
            <span class="spec-val">{{ selectedShipment.destination }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('DESTINATION') }}</span>
            <span class="spec-val">{{ langService.t(selectedShipment.destination) }}</span>`
  },
  {
    target: `<span class="spec-label">ESCORT COMMANDER</span>
            <span class="spec-val font-accent">{{ selectedShipment.driverEscort }}</span>`,
    replacement: `<span class="spec-label">{{ langService.t('ESCORT COMMANDER') }}</span>
            <span class="spec-val font-accent">{{ langService.t(selectedShipment.driverEscort) }}</span>`
  },
  {
    target: `<span class="spec-label">DEPARTURE TIME</span>`,
    replacement: `<span class="spec-label">{{ langService.t('DEPARTURE TIME') }}</span>`
  },
  {
    target: `<span class="spec-label">ESTIMATED ARRIVAL</span>`,
    replacement: `<span class="spec-label">{{ langService.t('ESTIMATED ARRIVAL') }}</span>`
  },
  {
    target: `<span class="spec-label">FLEET ASSETS</span>
            <span class="spec-val">{{ selectedShipment.vehiclesCount }} Military Trucks</span>`,
    replacement: `<span class="spec-label">{{ langService.t('FLEET ASSETS') }}</span>
            <span class="spec-val">{{ selectedShipment.vehiclesCount }} {{ langService.t('Military Trucks') }}</span>`
  },
  {
    target: `<span class="spec-label">CARGO MANIFEST</span>
            <span class="spec-val font-gold">{{ selectedShipment.cargoType }} ({{ selectedShipment.tonnage }}T)</span>`,
    replacement: `<span class="spec-label">{{ langService.t('CARGO MANIFEST') }}</span>
            <span class="spec-val font-gold">{{ langService.t(selectedShipment.cargoType) }} ({{ selectedShipment.tonnage }}T)</span>`
  },
  {
    target: `<span class="spec-label">SATCOM COORDINATES</span>`,
    replacement: `<span class="spec-label">{{ langService.t('SATCOM COORDINATES') }}</span>`
  },
  {
    target: `<span class="strip-label">TRANSIT AXIS:</span>
          <span class="strip-text">{{ selectedShipment.route }}</span>`,
    replacement: `<span class="strip-label">{{ langService.t('TRANSIT AXIS:') }}</span>
          <span class="strip-text">{{ langService.t(selectedShipment.route) }}</span>`
  },
  {
    target: `<strong>ENVIRONMENTAL / HIGH-ALTITUDE ALERT:</strong>
            <p>{{ selectedShipment.weatherAlert }}</p>`,
    replacement: `<strong>{{ langService.t('ENVIRONMENTAL / HIGH-ALTITUDE ALERT:') }}</strong>
            <p>{{ langService.t(selectedShipment.weatherAlert) }}</p>`
  },
  {
    target: `<h4>Route Checkpoint Verification Log</h4>
            <span class="timeline-progress-tag">
              {{ getPassedCheckpointsCount(selectedShipment) }} of {{ getTotalCheckpointsCount(selectedShipment) }} Checkpoints Verified
            </span>`,
    replacement: `<h4>{{ langService.t('Route Checkpoint Verification Log') }}</h4>
            <span class="timeline-progress-tag">
              {{ getPassedCheckpointsCount(selectedShipment) }} {{ langService.t('of') }} {{ getTotalCheckpointsCount(selectedShipment) }} {{ langService.t('Checkpoints Verified') }}
            </span>`
  },
  {
    target: `<strong class="cp-title">{{ cp.name }}</strong>
                  <span class="cp-status-tag" [class.passed]="cp.passed">
                    {{ cp.passed ? 'PASSED' : 'EN-ROUTE' }}
                  </span>`,
    replacement: `<strong class="cp-title">{{ langService.t(cp.name) }}</strong>
                  <span class="cp-status-tag" [class.passed]="cp.passed">
                    {{ cp.passed ? langService.t('PASSED') : langService.t('EN-ROUTE') }}
                  </span>`
  },
  {
    target: `<div class="cp-time-text">Time Stamp: {{ cp.time }}</div>`,
    replacement: `<div class="cp-time-text">{{ langService.t('Time Stamp:') }} {{ cp.time }}</div>`
  },
  {
    target: `<strong>REGIMENTAL LEDGER DISPATCH TOKEN:</strong>`,
    replacement: `<strong>{{ langService.t('REGIMENTAL LEDGER DISPATCH TOKEN:') }}</strong>`
  },
  {
    target: `<span>Encrypted via ASCON Indian Army C4ISR Network (HQ 14 Corps)</span>`,
    replacement: `<span>{{ langService.t('Encrypted via ASCON Indian Army C4ISR Network (HQ 14 Corps)') }}</span>`
  },
  {
    target: `Close Telemetry`,
    replacement: `{{ langService.t('Close Telemetry') }}`
  },
  {
    target: `<span class="btn-check-icon">✓</span> Acknowledge & Sign Ledger`,
    replacement: `<span class="btn-check-icon">✓</span> {{ langService.t('Acknowledge & Sign Ledger') }}`
  },

  // Report Preview Modal
  {
    target: `<span class="modal-form-badge">{{ selectedReportPreview.classification }} · INDIAN ARMY OFFICIAL RECORD</span>
          <h3 class="modal-title">{{ selectedReportPreview.title }}</h3>
          <p class="modal-subtitle-text">Document ID: {{ selectedReportPreview.id }} • {{ selectedReportPreview.period }}</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t(selectedReportPreview.classification) }} · {{ langService.t('INDIAN ARMY OFFICIAL RECORD') }}</span>
          <h3 class="modal-title">{{ langService.t(selectedReportPreview.title) }}</h3>
          <p class="modal-subtitle-text">{{ langService.t('Document ID:') }} {{ selectedReportPreview.id }} • {{ langService.t(selectedReportPreview.period) }}</p>`
  },
  {
    target: `<span class="rm-label">AUTHORIZING OFFICER</span>
            <strong>{{ selectedReportPreview.authorizingOfficer }}</strong>`,
    replacement: `<span class="rm-label">{{ langService.t('AUTHORIZING OFFICER') }}</span>
            <strong>{{ langService.t(selectedReportPreview.authorizingOfficer) }}</strong>`
  },
  {
    target: `<span class="rm-label">UNIT DESIGNATION</span>
            <strong>{{ unitDbService.selectedUnit().name }}</strong>`,
    replacement: `<span class="rm-label">{{ langService.t('UNIT DESIGNATION') }}</span>
            <strong>{{ langService.t(unitDbService.selectedUnit().name) }}</strong>`
  },
  {
    target: `<span class="rm-label">CATEGORY</span>
            <strong>{{ selectedReportPreview.category }}</strong>`,
    replacement: `<span class="rm-label">{{ langService.t('CATEGORY') }}</span>
            <strong>{{ langService.t(selectedReportPreview.category) }}</strong>`
  },
  {
    target: `<span class="rm-label">LEDGER AUDIT STATUS</span>
            <span class="text-green font-bold">✓ {{ selectedReportPreview.status }}</span>`,
    replacement: `<span class="rm-label">{{ langService.t('LEDGER AUDIT STATUS') }}</span>
            <span class="text-green font-bold">✓ {{ langService.t(selectedReportPreview.status) }}</span>`
  },
  {
    target: `<h4>EXECUTIVE RECONCILIATION SUMMARY</h4>
          <p>This document certifies that all supply allocations, fuel receipts, and indent transfers for the designated period have been cross-verified with Army Central Ordnance Depot (COD) records and {{ unitDbService.selectedUnit().name }} Regimental Stock Registers. All transactions conform strictly to Army Ordnance Corps (AOC) Regulations and DGOS Standard Operating Procedures.</p>`,
    replacement: `<h4>{{ langService.t('EXECUTIVE RECONCILIATION SUMMARY') }}</h4>
          <p>{{ langService.t('This document certifies that all supply allocations, fuel receipts, and indent transfers for the designated period have been cross-verified with Army Central Ordnance Depot (COD) records and 14 Rajput (Mechanised) Regimental Stock Registers. All transactions conform strictly to Army Ordnance Corps (AOC) Regulations and DGOS Standard Operating Procedures.') }}</p>`
  },
  {
    target: `<span class="stamp-title">OFFICIALLY VERIFIED</span>`,
    replacement: `<span class="stamp-title">{{ langService.t('OFFICIALLY VERIFIED') }}</span>`
  },
  {
    target: `<span class="stamp-date">DATE: {{ currentDate }}</span>`,
    replacement: `<span class="stamp-date">{{ langService.t('DATE:') }} {{ currentDate }}</span>`
  },
  {
    target: `<button type="button" class="btn-modal-cancel" (click)="closeReportPreview()">Close Document</button>
        <button type="button" class="btn-outline-army" (click)="downloadReportCSV(selectedReportPreview)">
          📊 Download CSV
        </button>
        <button type="button" class="btn-modal-submit" (click)="exportReport('PDF', selectedReportPreview); closeReportPreview()">
          📥 Download Certified PDF
        </button>`,
    replacement: `<button type="button" class="btn-modal-cancel" (click)="closeReportPreview()">{{ langService.t('Close Document') }}</button>
        <button type="button" class="btn-outline-army" (click)="downloadReportCSV(selectedReportPreview)">
          📊 {{ langService.t('Download CSV') }}
        </button>
        <button type="button" class="btn-modal-submit" (click)="exportReport('PDF', selectedReportPreview); closeReportPreview()">
          📥 {{ langService.t('Download Certified PDF') }}
        </button>`
  },

  // Add Receipt Modal
  {
    target: `<span class="modal-form-badge">ARMY ORDNANCE CORPS · FORM IAFA-2027</span>
          <h3 class="modal-title">Log Store Receipt Voucher (RV)</h3>
          <p class="modal-subtitle-text">Record incoming consignment into 14 Rajput Regimental Stores Ledger</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('ARMY ORDNANCE CORPS · FORM IAFA-2027') }}</span>
          <h3 class="modal-title">{{ langService.t('Log Store Receipt Voucher (RV)') }}</h3>
          <p class="modal-subtitle-text">{{ langService.t('Record incoming consignment into 14 Rajput Regimental Stores Ledger') }}</p>`
  },
  {
    target: `title="Close Receipt Voucher"`,
    replacement: `[title]="langService.t('Close Receipt Voucher')"`
  },
  {
    target: `<label class="form-label">Store Receipt Voucher (RV) # <span class="req-star">*</span></label>`,
    replacement: `<label class="form-label">{{ langService.t('Store Receipt Voucher (RV) #') }} <span class="req-star">*</span></label>`
  },
  {
    target: `<label class="form-label">Target Inventory Item <span class="req-star">*</span></label>
            <select [(ngModel)]="newReceiptItemId" class="form-control form-select">
              <option *ngFor="let itm of itemsForReceiptCategory" [value]="itm.id">
                [{{ itm.id }}] {{ itm.item }} (Available: {{ itm.quantity }})
              </option>
            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Target Inventory Item') }} <span class="req-star">*</span></label>
            <select [(ngModel)]="newReceiptItemId" class="form-control form-select">
              <option *ngFor="let itm of itemsForReceiptCategory" [value]="itm.id">
                [{{ itm.id }}] {{ langService.t(itm.item) }} ({{ langService.t('Available:') }} {{ itm.quantity }})
              </option>
            </select>`
  },
  {
    target: `<label class="form-label">Quantity Received & Inspected <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newReceiptQty" placeholder="e.g. 5,000 Litres or 500 Packs" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Quantity Received & Inspected') }} <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newReceiptQty" [placeholder]="langService.t('e.g. 5,000 Litres or 500 Packs')" class="form-control">`
  },
  {
    target: `<label class="form-label">Consignor / Origin Depot</label>
            <input type="text" [(ngModel)]="newReceiptDepot" placeholder="e.g. COD Pathankot / FSD Leh" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Consignor / Origin Depot') }}</label>
            <input type="text" [(ngModel)]="newReceiptDepot" [placeholder]="langService.t('e.g. COD Pathankot / FSD Leh')" class="form-control">`
  },
  {
    target: `<label class="form-label">Date of Store Entry <span class="req-star">*</span></label>`,
    replacement: `<label class="form-label">{{ langService.t('Date of Store Entry') }} <span class="req-star">*</span></label>`
  },
  {
    target: `<label class="form-label">Quality Inspection & Escort Verification</label>
            <textarea [(ngModel)]="newReceiptNotes" rows="2" placeholder="Inspection certified by Quartermaster. Seals intact, lab test verified..." class="form-control form-textarea"></textarea>`,
    replacement: `<label class="form-label">{{ langService.t('Quality Inspection & Escort Verification') }}</label>
            <textarea [(ngModel)]="newReceiptNotes" rows="2" [placeholder]="langService.t('Inspection certified by Quartermaster. Seals intact, lab test verified...')" class="form-control form-textarea"></textarea>`
  },
  {
    target: `<strong>LEDGER RECONCILIATION:</strong> Submitting will automatically increment the physical stock count and update the Regimental Stock Register ledger card.`,
    replacement: `<strong>{{ langService.t('LEDGER RECONCILIATION:') }}</strong> {{ langService.t('Submitting will automatically increment the physical stock count and update the Regimental Stock Register ledger card.') }}`
  },
  {
    target: `Cancel / Discard`,
    replacement: `{{ langService.t('Cancel / Discard') }}`
  },
  {
    target: `<span class="btn-check-icon">✓</span> Verify & Add to Stores Ledger`,
    replacement: `<span class="btn-check-icon">✓</span> {{ langService.t('Verify & Add to Stores Ledger') }}`
  },

  // Record Consumption Modal
  {
    target: `<span class="modal-form-badge">ARMY ORDNANCE CORPS · FORM IAFA-2028</span>
          <h3 class="modal-title">Record Daily Store Issue & Consumption</h3>
          <p class="modal-subtitle-text">Debit operational burn and troop rations from 14 Rajput Stock Ledger</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('ARMY ORDNANCE CORPS · FORM IAFA-2028') }}</span>
          <h3 class="modal-title">{{ langService.t('Record Daily Store Issue & Consumption') }}</h3>
          <p class="modal-subtitle-text">{{ langService.t('Debit operational burn and troop rations from 14 Rajput Stock Ledger') }}</p>`
  },
  {
    target: `title="Close Issue Voucher"`,
    replacement: `[title]="langService.t('Close Issue Voucher')"`
  },
  {
    target: `<label class="form-label">Date of Issue <span class="req-star">*</span></label>`,
    replacement: `<label class="form-label">{{ langService.t('Date of Issue') }} <span class="req-star">*</span></label>`
  },
  {
    target: `<label class="form-label">Select Stock Item <span class="req-star">*</span></label>
            <select [(ngModel)]="newIssueItemId" class="form-control form-select">
              <option *ngFor="let itm of itemsForIssueCategory" [value]="itm.id">
                [{{ itm.id }}] {{ itm.item }} (Available: {{ itm.quantity }})
              </option>
            </select>`,
    replacement: `<label class="form-label">{{ langService.t('Select Stock Item') }} <span class="req-star">*</span></label>
            <select [(ngModel)]="newIssueItemId" class="form-control form-select">
              <option *ngFor="let itm of itemsForIssueCategory" [value]="itm.id">
                [{{ itm.id }}] {{ langService.t(itm.item) }} ({{ langService.t('Available:') }} {{ itm.quantity }})
              </option>
            </select>`
  },
  {
    target: `<label class="form-label">Quantity to Issue / Burn <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newIssueQty" placeholder="e.g. 450 Litres or 200 Packs" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Quantity to Issue / Burn') }} <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newIssueQty" [placeholder]="langService.t('e.g. 450 Litres or 200 Packs')" class="form-control">`
  },
  {
    target: `<label class="form-label">Receiving Post / Sub-Unit <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newIssueRecipient" placeholder="e.g. Bravo Coy, FDL Shyok Sector 4A" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Receiving Post / Sub-Unit') }} <span class="req-star">*</span></label>
            <input type="text" [(ngModel)]="newIssueRecipient" [placeholder]="langService.t('e.g. Bravo Coy, FDL Shyok Sector 4A')" class="form-control">`
  },
  {
    target: `<label class="form-label">Operational Purpose</label>
            <input type="text" [(ngModel)]="newIssuePurpose" placeholder="e.g. Bukhari continuous heating / BMP-II patrol" class="form-control">`,
    replacement: `<label class="form-label">{{ langService.t('Operational Purpose') }}</label>
            <input type="text" [(ngModel)]="newIssuePurpose" [placeholder]="langService.t('e.g. Bukhari continuous heating / BMP-II patrol')" class="form-control">`
  },
  {
    target: `<strong>STOCK DEBIT:</strong> This action issues stock under Quartermaster authority. Stock ledger balance will immediately decrease by the specified quantity.`,
    replacement: `<strong>{{ langService.t('STOCK DEBIT:') }}</strong> {{ langService.t('This action issues stock under Quartermaster authority. Stock ledger balance will immediately decrease by the specified quantity.') }}`
  },
  {
    target: `<span class="btn-check-icon">✓</span> Authorize & Debit from Ledger`,
    replacement: `<span class="btn-check-icon">✓</span> {{ langService.t('Authorize & Debit from Ledger') }}`
  },

  // Pass Telemetry Modal
  {
    target: `<span class="modal-form-badge">BRO / METEOROLOGICAL DEFENSE INTEL · LIVE CORRIDOR STATUS</span>
          <h3 class="modal-title">Pass Telemetry: {{ selectedPass.passName }}</h3>
          <p class="modal-subtitle-text">📍 {{ selectedPass.location }} • Elevation: {{ selectedPass.elevation }}</p>`,
    replacement: `<span class="modal-form-badge">{{ langService.t('BRO / METEOROLOGICAL DEFENSE INTEL · LIVE CORRIDOR STATUS') }}</span>
          <h3 class="modal-title">{{ langService.t('Pass Telemetry:') }} {{ langService.t(selectedPass.passName) }}</h3>
          <p class="modal-subtitle-text">📍 {{ langService.t(selectedPass.location) }} • {{ langService.t('Elevation:') }} {{ selectedPass.elevation }}</p>`
  },
  {
    target: `title="Close Pass Telemetry"`,
    replacement: `[title]="langService.t('Close Pass Telemetry')"`
  },
  {
    target: `Calculated Risk Index: <strong>{{ selectedPass.riskScore }}/100</strong>`,
    replacement: `{{ langService.t('Calculated Risk Index:') }} <strong>{{ selectedPass.riskScore }}/100</strong>`
  },
  {
    target: `<span class="st-m-label">SURFACE TEMPERATURE</span>`,
    replacement: `<span class="st-m-label">{{ langService.t('SURFACE TEMPERATURE') }}</span>`
  },
  {
    target: `<span class="st-m-label">PRECIPITATION / SNOW DEPTH</span>`,
    replacement: `<span class="st-m-label">{{ langService.t('PRECIPITATION / SNOW DEPTH') }}</span>`
  },
  {
    target: `<strong>CORRIDOR DEFENSE ADVISORY:</strong>
            <p>{{ selectedPass.alert }}</p>`,
    replacement: `<strong>{{ langService.t('CORRIDOR DEFENSE ADVISORY:') }}</strong>
            <p>{{ langService.t(selectedPass.alert) }}</p>`
  },
  {
    target: `<strong>Designated Bypass Axis:</strong>
              <p>{{ selectedPass.alternativeRoute }}</p>`,
    replacement: `<strong>{{ langService.t('Designated Bypass Axis:') }}</strong>
              <p>{{ langService.t(selectedPass.alternativeRoute) }}</p>`
  },
  {
    target: `View Active Convoys on Bypass Axis ➔`,
    replacement: `{{ langService.t('View Active Convoys on Bypass Axis ➔') }}`
  }
];

let applied = 0;
for (const r of replacements) {
  if (html.includes(r.target)) {
    html = html.replace(r.target, r.replacement);
    applied++;
  } else {
    console.warn('Target not found:', r.target.slice(0, 60));
  }
}

console.log(`Applied ${applied} of ${replacements.length} replacements.`);
fs.writeFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', html, 'utf8');
