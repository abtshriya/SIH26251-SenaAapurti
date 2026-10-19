const fs = require('fs');

const langServiceFile = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', 'utf8');
const extracted = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/extracted_cmd_strings.json', 'utf8'));

// Extract DASHBOARD_TRANSLATIONS keys from language.service.ts
const dtMatch = langServiceFile.match(/export const DASHBOARD_TRANSLATIONS: Record<string, string> = \{([\s\S]*?)\n\};/);
const keysInDt = new Set();
if (dtMatch) {
  const lines = dtMatch[1].split('\n');
  for (const line of lines) {
    const km = line.match(/^\s*'([^']+)':/);
    if (km) keysInDt.add(km[1]);
  }
}

const missing = [];
const existing = [];

for (const s of extracted) {
  if (keysInDt.has(s)) {
    existing.push(s);
  } else {
    missing.push(s);
  }
}

console.log('Existing in DASHBOARD_TRANSLATIONS:', existing.length);
console.log('Missing from DASHBOARD_TRANSLATIONS:', missing.length);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/missing_cmd_strings.json', JSON.stringify(missing, null, 2));
console.log('Sample missing (first 30):', missing.slice(0, 30));
