const fs = require('fs');
let html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

const replacements = [
  // KPI badges
  ['<span class="ud-kpi-badge badge-green">OPTIMAL</span>', '<span class="ud-kpi-badge badge-green">{{ langService.t(\'OPTIMAL\') }}</span>'],
  ['<span class="ud-kpi-badge badge-green">STABLE</span>', '<span class="ud-kpi-badge badge-green">{{ langService.t(\'STABLE\') }}</span>'],
  ['<span class="ud-kpi-badge badge-saffron">ATTENTION</span>', '<span class="ud-kpi-badge badge-saffron">{{ langService.t(\'ATTENTION\') }}</span>'],
  ['<span class="ud-kpi-badge badge-gold">WINTER SCALE</span>', '<span class="ud-kpi-badge badge-gold">{{ langService.t(\'WINTER SCALE\') }}</span>'],
  ['<span class="ud-kpi-badge badge-blue">ACTIVE</span>', '<span class="ud-kpi-badge badge-blue">{{ langService.t(\'ACTIVE\') }}</span>'],
  ['<span class="ud-kpi-badge badge-blue">EN ROUTE</span>', '<span class="ud-kpi-badge badge-blue">{{ langService.t(\'EN ROUTE\') }}</span>'],
  ['<span class="ud-kpi-badge badge-gold">AXIS LOAD</span>', '<span class="ud-kpi-badge badge-gold">{{ langService.t(\'AXIS LOAD\') }}</span>'],

  // Station and Command in unit banner
  ["{{ unitDbService.selectedUnit().station || 'Forward Defended Locality - Shyok Sector' }} ({{ unitDbService.selectedUnit().command || 'Northern Command' }})",
   "{{ langService.t(unitDbService.selectedUnit().station) || langService.t('Forward Defended Locality - Shyok Sector') }} ({{ langService.t(unitDbService.selectedUnit().command) || langService.t('Northern Command') }})"],

  // Stock categories and subtitles
  ['<span class="ud-cat-tag">CLASS I</span>', '<span class="ud-cat-tag">{{ langService.t(\'CLASS I\') }}</span>'],
  ['<span class="ud-cat-tag">CLASS III</span>', '<span class="ud-cat-tag">{{ langService.t(\'CLASS III\') }}</span>'],
  ['<span class="ud-cat-tag">CLASS V</span>', '<span class="ud-cat-tag">{{ langService.t(\'CLASS V\') }}</span>'],
  ['<span class="ud-cat-tag tag-saffron">CLASS IX</span>', '<span class="ud-cat-tag tag-saffron">{{ langService.t(\'CLASS IX\') }}</span>'],

  ['<span class="ud-meta-segment">Fresh: <strong>12 Days</strong></span>', '<span class="ud-meta-segment">{{ langService.t(\'Fresh:\') }} <strong>{{ langService.t(\'12 Days\') }}</strong></span>'],
  ['<span class="ud-meta-segment">MRE/Dry: <strong>36 Days</strong></span>', '<span class="ud-meta-segment">{{ langService.t(\'MRE/Dry:\') }} <strong>{{ langService.t(\'36 Days\') }}</strong></span>'],
  ['<span class="ud-meta-segment">Winter Grade -40°C HSD: <strong>12,400L</strong></span>', '<span class="ud-meta-segment">{{ langService.t(\'Winter Grade -40°C HSD:\') }} <strong>12,400L</strong></span>'],
  ['<span class="ud-meta-segment">2T Oil: <strong>3,800L</strong></span>', '<span class="ud-meta-segment">{{ langService.t(\'2T Oil:\') }} <strong>3,800L</strong></span>'],
  ['<span class="ud-meta-segment">Small Arms: <strong>100%</strong></span>', '<span class="ud-meta-segment">{{ langService.t(\'Small Arms:\') }} <strong>100%</strong></span>'],
  ['<span class="ud-meta-segment">ATGM Missiles: <strong>92%</strong></span>', '<span class="ud-meta-segment">{{ langService.t(\'ATGM Missiles:\') }} <strong>92%</strong></span>'],

  ['<div class="ud-altitude-tag">ALT: 3,500m MSL</div>', '<div class="ud-altitude-tag">{{ langService.t(\'ALT: 3,500m MSL\') }}</div>'],
  ['<span class="ud-telemetry-v">38 km/h NNW</span>', '<span class="ud-telemetry-v">38 {{ langService.t(\'km/h\') }} NNW</span>'],
  ['<span class="ud-eta-label">ETA</span>', '<span class="ud-eta-label">{{ langService.t(\'ETA\') }}</span>'],

  // Inventory KPI text
  ['<div class="kpi-value text-gold">{{ totalInventoryCount }} Items</div>', '<div class="kpi-value text-gold">{{ totalInventoryCount }} {{ langService.t(\'Items\') }}</div>'],
  ['<div class="kpi-value text-green">{{ adequateInventoryCount }} Items</div>', '<div class="kpi-value text-green">{{ adequateInventoryCount }} {{ langService.t(\'Items\') }}</div>'],
  ['<div class="kpi-value text-amber">{{ lowInventoryCount }} Items</div>', '<div class="kpi-value text-amber">{{ lowInventoryCount }} {{ langService.t(\'Items\') }}</div>'],
  ['<div class="kpi-value text-blue">{{ surplusInventoryCount }} Item</div>', '<div class="kpi-value text-blue">{{ surplusInventoryCount }} {{ langService.t(\'Item\') }}</div>'],

  // Telemetry labels
  ['Genset:', '{{ langService.t(\'Genset:\') }}'],
  ['Bukhari:', '{{ langService.t(\'Bukhari:\') }}'],
  ['Fleet:', '{{ langService.t(\'Fleet:\') }}'],
  ['Aux:', '{{ langService.t(\'Aux:\') }}'],
  ['Genset Load:', '{{ langService.t(\'Genset Load:\') }}'],
  ['Tank Temp:', '{{ langService.t(\'Tank Temp:\') }}'],
  ['Viscosity:', '{{ langService.t(\'Viscosity:\') }}'],
  ['Flow:', '{{ langService.t(\'Flow:\') }}'],
  ['Coolant:', '{{ langService.t(\'Coolant:\') }}'],
  ['Oil Pressure:', '{{ langService.t(\'Oil Pressure:\') }}'],
  ['Baro:', '{{ langService.t(\'Baro:\') }}'],
  ['Humidity:', '{{ langService.t(\'Humidity:\') }}'],
  ['Snow Depth:', '{{ langService.t(\'Snow Depth:\') }}'],

  // Pass and modal buttons
  ['title="Encrypted ASCON Link"', '[title]="langService.t(\'Encrypted ASCON Link\')"'],
  ['title="Trigger Tactical Air-Drop Priority Indent"', '[title]="langService.t(\'Trigger Tactical Air-Drop Priority Indent\')"'],
  ['title="View Unit Inventory"', '[title]="langService.t(\'View Unit Inventory\')"'],
  ['title="Inspect Critical Supplies"', '[title]="langService.t(\'Inspect Critical Supplies\')"'],
  ['title="Inspect Consumption & Days of Supply"', '[title]="langService.t(\'Inspect Consumption & Days of Supply\')"'],
  ['title="Inspect Supply Requests"', '[title]="langService.t(\'Inspect Supply Requests\')"'],
  ['title="Track Convoys"', '[title]="langService.t(\'Track Convoys\')"'],
  ['title="Inspect Active Logistics Axis Load"', '[title]="langService.t(\'Inspect Active Logistics Axis Load\')"'],
  ['title="Track Convoy Live"', '[title]="langService.t(\'Track Convoy Live\')"'],
  ['title="View Full Sector Weather Telemetry"', '[title]="langService.t(\'View Full Sector Weather Telemetry\')"'],
  ['title="Filter by All Items"', '[title]="langService.t(\'Filter by All Items\')"'],
  ['title="Filter by Adequate Items"', '[title]="langService.t(\'Filter by Adequate Items\')"'],
  ['title="Filter by Low Stock Items"', '[title]="langService.t(\'Filter by Low Stock Items\')"'],
  ['title="Filter by Surplus Items"', '[title]="langService.t(\'Filter by Surplus Items\')"'],
  ['title="Filter by Stockout Risk"', '[title]="langService.t(\'Filter by Stockout Risk\')"'],
  ['title="Reset All Filters"', '[title]="langService.t(\'Reset All Filters\')"'],
  ['title="Prime Generators"', '[title]="langService.t(\'Prime Generators\')"'],
  ['title="Bukhari Space Heating"', '[title]="langService.t(\'Bukhari Space Heating\')"'],
  ['title="BMP Fleet & Transport"', '[title]="langService.t(\'BMP Fleet & Transport\')"'],
  ['title="Auxiliary Thawing"', '[title]="langService.t(\'Auxiliary Thawing\')"'],
  ['title="Inspect Zoji La Route & Weather Telemetry"', '[title]="langService.t(\'Inspect Zoji La Route & Weather Telemetry\')"'],
  ['title="Inspect Khardung La Route & Weather Telemetry"', '[title]="langService.t(\'Inspect Khardung La Route & Weather Telemetry\')"'],
  ['title="Clear Search"', '[title]="langService.t(\'Clear Search\')"'],
  ['title="Tactical Fleet Cards Grid"', '[title]="langService.t(\'Tactical Fleet Cards Grid\')"'],
  ['title="Military Manifest Table"', '[title]="langService.t(\'Military Manifest Table\')"'],
  ['title="Inspect Telemetry"', '[title]="langService.t(\'Inspect Telemetry\')"'],
  ['title="Acknowledge Delivery"', '[title]="langService.t(\'Acknowledge Delivery\')"'],
  ['title="Click to view full pass telemetry and corridor details"', '[title]="langService.t(\'Click to view full pass telemetry and corridor details\')"'],
  ['title="View active convoys on this bypass axis"', '[title]="langService.t(\'View active convoys on this bypass axis\')"'],
  ['title="Download CSV"', '[title]="langService.t(\'Download CSV\')"']
];

let applied = 0;
for (const [target, repl] of replacements) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    applied++;
  }
}
console.log('Applied unit-dashboard detailed replacements:', applied);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', html, 'utf8');
