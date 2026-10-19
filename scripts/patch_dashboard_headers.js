const fs = require('fs');
let html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

const replacements = [
  ['UNIT READINESS', "{{ langService.t('UNIT READINESS') }}"],
  ['INVENTORY HEALTH', "{{ langService.t('INVENTORY HEALTH') }}"],
  ['CRITICAL SUPPLIES', "{{ langService.t('CRITICAL SUPPLIES') }}"],
  ['DAYS OF SUPPLY', "{{ langService.t('DAYS OF SUPPLY') }}"],
  ['PENDING REQUESTS', "{{ langService.t('PENDING REQUESTS') }}"],
  ['INCOMING SHIPMENTS', "{{ langService.t('INCOMING SHIPMENTS') }}"],
  ['ACTIVE LOGISTICS', "{{ langService.t('ACTIVE LOGISTICS') }}"],
  ['TACTICAL OPS', "{{ langService.t('TACTICAL OPS') }}"],
  ['QUICK OPERATIONAL ACTIONS:', "{{ langService.t('QUICK OPERATIONAL ACTIONS:') }}"],
  ['TOTAL STOCK NOMENCLATURES', "{{ langService.t('TOTAL STOCK NOMENCLATURES') }}"],
  ['AVAILABLE & VERIFIED', "{{ langService.t('AVAILABLE & VERIFIED') }}"],
  ['LOW STOCK ITEMS', "{{ langService.t('LOW STOCK ITEMS') }}"],
  ['CRITICAL SURPLUS', "{{ langService.t('CRITICAL SURPLUS') }}"],
  ['ASCON MILITARY TELEMETRY GRID · SENSOR SUITE v4.2 ONLINE · LATENCY 14ms', "{{ langService.t('ASCON MILITARY TELEMETRY GRID · SENSOR SUITE v4.2 ONLINE · LATENCY 14ms') }}"],
  ['High-Altitude Sub-Zero POL Burn Rates, Troop Rations & Predictive Winter Surge Analytics', "{{ langService.t('High-Altitude Sub-Zero POL Burn Rates, Troop Rations & Predictive Winter Surge Analytics') }}"],
  ['+ Pre-Winter Stocking Indent', "{{ langService.t('+ Pre-Winter Stocking Indent') }}"],
  ['POL BURN BREAKDOWN', "{{ langService.t('POL BURN BREAKDOWN') }}"],
  ['TROOP RATIONS (CLASS I)', "{{ langService.t('TROOP RATIONS (CLASS I)') }}"],
  ['MUNITIONS EXPENDITURE (CLASS V)', "{{ langService.t('MUNITIONS EXPENDITURE (CLASS V)') }}"],
  ['METEOROLOGY & POWER LOAD', "{{ langService.t('METEOROLOGY & POWER LOAD') }}"],
  ['ASCON MILITARY LOGISTICS CORRIDOR', "{{ langService.t('ASCON MILITARY LOGISTICS CORRIDOR') }}"],
  ['Real-time SATCOM tracking of road convoys, transit depots, and heavy freight scheduled for 14 Rajput base', "{{ langService.t('Real-time SATCOM tracking of road convoys, transit depots, and heavy freight scheduled for 14 Rajput base') }}"],
  ['LIVE SATCOM FEED:', "{{ langService.t('LIVE SATCOM FEED:') }}"],
  ['5 CONVOYS TRACKED', "{{ langService.t('5 CONVOYS TRACKED') }}"],
  ['MET-SAT METEOROLOGICAL TELEMETRY', "{{ langService.t('MET-SAT METEOROLOGICAL TELEMETRY') }}"],
  ['MET-RADAR ACTIVE:', "{{ langService.t('MET-RADAR ACTIVE:') }}"],
  ['STATIONS TELEMETERED', "{{ langService.t('STATIONS TELEMETERED') }}"],
  ['BRO TASK FORCES ACTIVE:', "{{ langService.t('BRO TASK FORCES ACTIVE:') }}"],
  ['4 SECTORS OPERATIONAL', "{{ langService.t('4 SECTORS OPERATIONAL') }}"],
  ['EARLY WARNING INTEL', "{{ langService.t('EARLY WARNING INTEL') }}"],
  ['ADVISORY STATUS:', "{{ langService.t('ADVISORY STATUS:') }}"],
  ['4 ACTIVE SITREPS', "{{ langService.t('4 ACTIVE SITREPS') }}"],
  ['REGIMENTAL AUDIT & LEDGER CLEARANCE', "{{ langService.t('REGIMENTAL AUDIT & LEDGER CLEARANCE') }}"],
  ['C4ISR SECURE TERMINAL CONFIGURATION', "{{ langService.t('C4ISR SECURE TERMINAL CONFIGURATION') }}"],
  ['Cancel / Discard', "{{ langService.t('Cancel / Discard') }}"],
  ['Close Telemetry', "{{ langService.t('Close Telemetry') }}"],
  ['WIND VELOCITY', "{{ langService.t('WIND VELOCITY') }}"],
  ['OPTICAL VISIBILITY', "{{ langService.t('OPTICAL VISIBILITY') }}"]
];

let count = 0;
for (const [target, repl] of replacements) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    count++;
  }
}
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', html, 'utf8');
console.log('Replaced ' + count + ' dashboard header/banner phrases!');
