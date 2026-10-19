const fs = require('fs');

// Read language.service.ts
const langFile = fs.readFileSync('src/app/services/language.service.ts', 'utf8');
const dtMatch = langFile.match(/export const DASHBOARD_TRANSLATIONS: Record<string, string> = \{([\s\S]*?)\n\};/);
const currentDt = {};
if (dtMatch) {
  const lines = dtMatch[1].split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*'([^']+)':\s*'([^']+)',?/);
    if (m) currentDt[m[1]] = m[2];
  }
}

const expanded = JSON.parse(fs.readFileSync('scripts/dashboard_translations_expanded.json', 'utf8'));
const comp = JSON.parse(fs.readFileSync('scripts/comprehensive_translations.json', 'utf8'));

const allMerged = { ...currentDt, ...expanded, ...comp };
console.log('Current DT keys:', Object.keys(currentDt).length);
console.log('Expanded keys:', Object.keys(expanded).length);
console.log('Comprehensive keys:', Object.keys(comp).length);
console.log('Total merged unique keys:', Object.keys(allMerged).length);

// Now read logistics.service.ts to extract all strings
const logisticsFile = fs.readFileSync('src/app/services/logistics.service.ts', 'utf8');
const stringRegex = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g;
const matches = logisticsFile.match(stringRegex) || [];

const missingStrings = new Set();
for (let s of matches) {
  // Strip quotes
  s = s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
  if (!s || s.length < 3) continue;
  if (/^[0-9\-_./: #%+]+$/.test(s)) continue; // purely numeric or codes
  if (['string', 'number', 'boolean', 'any', 'none', 'auto', 'default', 'root'].includes(s)) continue;
  if (s.startsWith('http')) continue;
  if (!allMerged[s]) {
    missingStrings.add(s);
  }
}

console.log('Missing strings from logistics.service.ts:', missingStrings.size);
fs.writeFileSync('scripts/missing_from_logistics.json', JSON.stringify(Array.from(missingStrings), null, 2));
