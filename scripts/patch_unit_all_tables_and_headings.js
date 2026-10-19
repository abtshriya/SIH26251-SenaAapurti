const fs = require('fs');

const htmlPath = 'src/app/pages/unit-dashboard/unit-dashboard.component.html';
let raw = fs.readFileSync(htmlPath, 'utf8');

const isCrlf = raw.includes('\r\n');
let html = raw.replace(/\r\n/g, '\n');

// 1. Generic replacement for all <th>...</th> containing plain text
html = html.replace(/<th([^>]*)>([ \t]*)([A-Za-z0-9#][A-Za-z0-9# /&.–—\-_]*[A-Za-z0-9#])([ \t]*)<\/th>/g, (m, attrs, sp1, text, sp2) => {
  if (text.includes('langService.t') || text.includes('{{')) return m;
  return `<th${attrs}>${sp1}{{ langService.t('${text.trim()}') }}${sp2}</th>`;
});

// 2. Specific module titles and headers
const headers = [
  'Consumption Telematics & Unit Demand',
  'Daily Multi-Class Consumption vs AI Winter Surge Trajectory',
  'Sub-Zero POL Consumption Breakdown',
  'Forward Base IoT Sensor Telemetry',
  'AI Pre-Winter Stocking & Pass Advisory',
  'Unit Requisition & Indent Vouchers',
  'Unit Inbound & Outbound Logistics',
  'Inbound Military Consignments Manifest',
  'Mountain Corridors & Weather Hazard Intel',
  'Predictive Logistics Intelligence & Strategic Directives',
  'Regimental Logistics Ledger & Reports',
  'Regimental Stores Inventory Ledger',
  'Class I to IX items stocked at 14 Rajput Forward Defended Base',
  'Real-time fuel, munitions, and ration burn rates against tactical reserves',
  'Formal defense supply indent records transmitted via encrypted Army WAN to 14 Corps FSD & DGOS',
  'Telemetry tracking for heavy vehicle columns transiting high-altitude Himalayan corridors',
  'High-altitude Himalayan corridor telemetry, pass avalanche warnings & real-time road accessibility',
  'Neural network anomaly detection, consumption projections, and tactical buffer recommendations',
  'Audited military vouchers, physical stock balances, and official defense audit certificates'
];

headers.forEach(h => {
  const pattern = new RegExp(`>(\\s*)${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*)<`, 'g');
  html = html.replace(pattern, `>$1{{ langService.t('${h}') }}$2<`);
});

// 3. Tab 2.2 Table headers remaining
// Check all th in html
const remainingTh = [];
html.split('\n').forEach((l, i) => {
  if (l.includes('<th') && !l.includes('langService.t')) {
    remainingTh.push(`${i+1}: ${l.trim()}`);
  }
});
console.log('Remaining th without translation:', remainingTh);

if (isCrlf) {
  html = html.replace(/\n/g, '\r\n');
}

fs.writeFileSync(htmlPath, html);
console.log('Successfully updated tables and headers in unit-dashboard.component.html!');
