const fs = require('fs');

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

const candidates = JSON.parse(fs.readFileSync('scripts/extracted_candidates.json', 'utf8'));

const untranslated = [];
for (const str of candidates) {
  if (allMerged[str]) continue;
  // If already Hindi characters
  if (/[\u0900-\u097F]/.test(str)) continue;
  // If technical IDs or hashes or SVG paths
  if (/^[A-Z0-9_\-]+$/.test(str) && str.length > 3 && !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'ACTIVE', 'HEALTHY', 'WARNING', 'SURPLUS', 'ADEQUATE', 'DEPLETED', 'ROUTINE', 'AUTHORIZED', 'REJECTED', 'PENDING', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'ALL'].includes(str)) continue;
  if (/^M\d+|^[0-9a-f]{16,}/.test(str)) continue;
  if (str.includes('{') || str.includes('}') || str.includes('=>') || str.includes('(') && str.includes(')')) {
    // If it's code snippet like "console.log"
    if (str.includes('console.') || str.includes('return ') || str.includes('const ') || str.includes('let ')) continue;
  }
  // Check if starts with common English letters
  if (/^[A-Za-z]/.test(str)) {
    untranslated.push(str);
  }
}

console.log('Total untranslated candidate strings:', untranslated.length);
fs.writeFileSync('scripts/untranslated_ui.json', JSON.stringify(untranslated, null, 2), 'utf8');
