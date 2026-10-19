const fs = require('fs');

let originalFile = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', 'utf8');
const isCrlf = originalFile.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

const expandedTranslations = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/dashboard_translations_expanded.json', 'utf8'));

// Regex to find DASHBOARD_TRANSLATIONS block
const dtRegex = /export const DASHBOARD_TRANSLATIONS: Record<string, string> = \{([\s\S]*?)\n\};/;
const match = originalFile.match(dtRegex);

if (!match) {
  console.error('Could not match DASHBOARD_TRANSLATIONS block!');
  process.exit(1);
}

const existingSection = match[1];
const existingEntries = {};

const lines = existingSection.split(/\r?\n/);
for (const line of lines) {
  const m = line.match(/^\s*'([^']+)':\s*'([^']+)',?/);
  if (m) {
    existingEntries[m[1]] = m[2];
  }
}

console.log('Existing entries count:', Object.keys(existingEntries).length);

// Merge existing and expanded
const merged = { ...existingEntries, ...expandedTranslations };
console.log('Merged entries count:', Object.keys(merged).length);

// Build new DASHBOARD_TRANSLATIONS code
let newDtLines = ['export const DASHBOARD_TRANSLATIONS: Record<string, string> = {'];
for (const [k, v] of Object.entries(merged)) {
  const escapedK = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escapedV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  newDtLines.push(`  '${escapedK}': '${escapedV}',`);
}
newDtLines.push('};');

const newDtCode = newDtLines.join(nl);

// Replace block
const updatedFile = originalFile.replace(dtRegex, newDtCode);

fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', updatedFile);
console.log('Successfully updated language.service.ts with merged translations!');
