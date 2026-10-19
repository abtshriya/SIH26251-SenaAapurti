const fs = require('fs');

const langServiceContent = fs.readFileSync('src/app/services/language.service.ts', 'utf8');
const dtMatch = langServiceContent.match(/export const DASHBOARD_TRANSLATIONS: Record<string, string> = \{([\s\S]*?)\n\};/);
const currentDt = {};
if (dtMatch) {
  const lines = dtMatch[1].split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*'([^']+)':\s*'([^']+)',?/);
    if (m) currentDt[m[1]] = m[2];
  }
}

console.log('Total keys in DASHBOARD_TRANSLATIONS:', Object.keys(currentDt).length);

// Check specific examples from prompt
const promptExamples = [
  // Issue 1: Unit Network
  'Leh, Ladakh • Eastern Ladakh / Shyok Axis (11,500 ft)',
  'Partapur / Siachen Base Camp, Ladakh • Saltoro Ridge & Highest Battlefield in the World (18,800 ft)',
  'Dras / Kargil, Ladakh • NH-1D Zojila-Kargil Defense Axis (18,800 ft)',
  'Dras / Kargil, Ladakh • NH-1D Zojila-Kargil Defense Axis (10,800 ft)',
  'Chushul / Nyoma, Eastern Ladakh • Spanggur Gap & Pangong Tso South Bank (15,200 ft)',
  'DS-DBO Road / Galwan River Axis, Ladakh • Galwan Valley & Sub-Sector North (14,000 ft)',
  'Eastern Ladakh / Shyok Axis (11,500 ft)',
  'Saltoro Ridge & Highest Battlefield in the World (18,800 ft)',
  'NH-1D Zojila-Kargil Defense Axis (18,800 ft)',
  'Spanggur Gap & Pangong Tso South Bank (15,200 ft)',
  'Galwan Valley & Sub-Sector North (14,000 ft)',
  'Leh, Ladakh',
  'Partapur / Siachen Base Camp, Ladakh',
  'Dras / Kargil, Ladakh',
  'Chushul / Nyoma, Eastern Ladakh',
  'DS-DBO Road / Galwan River Axis, Ladakh',
  // Issue 3: Unit Portal
  'Unit Readiness',
  'UNIT READINESS',
  'Incoming Shipments',
  'INCOMING SHIPMENTS',
  'Current Qty',
  'CURRENT QTY',
  'Days Remaining',
  'DAYS REMAINING',
  'Adequate',
  'Low',
  'Ledger Card',
  'Optimal Posture',
  'Spares under transit',
  'Rolling on Axis',
  '1 Indent',
  '2 Convoys',
  '0 Item',
  '0 High Risk',
  '1 Item',
  '14/001/POL Approved',
  'Regimental Stores Buffer Coverage',
  'Current holding vs authorized winter mobilization scales',
  'WINTER BUFFER 100%',
  'Incoming Shipments En Route',
  'Convoys destined for FSD Leh / 14 Rajput stores',
  'TRACK CONVOY LIVE',
  'Track Convoy Live'
];

console.log('\nChecking prompt examples in currentDt:');
for (const ex of promptExamples) {
  console.log(`${ex} => ${currentDt[ex] ? 'FOUND: ' + currentDt[ex] : 'MISSING'}`);
}
