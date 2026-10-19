const fs = require('fs');
const langCode = fs.readFileSync('src/app/services/language.service.ts', 'utf8');
const logStrings = JSON.parse(fs.readFileSync('scripts/logistics_strings.json', 'utf8'));

// Extract keys already in DASHBOARD_TRANSLATIONS
const keyMatches = langCode.match(/'([^'\\]*(?:\\.[^'\\]*)*)':/g) || [];
const existingKeys = new Set(keyMatches.map(k => k.slice(1, -2)));

const missing = logStrings.filter(s => !existingKeys.has(s));
console.log('Total extracted:', logStrings.length);
console.log('Already in DASHBOARD_TRANSLATIONS:', logStrings.length - missing.length);
console.log('Missing count:', missing.length);

fs.writeFileSync('scripts/missing_logistics.json', JSON.stringify(missing, null, 2), 'utf8');
console.log('Sample 30 missing strings:');
missing.slice(0, 30).forEach(s => console.log(' -', s));
