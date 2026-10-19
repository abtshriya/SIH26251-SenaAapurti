const fs = require('fs');
const missing = JSON.parse(fs.readFileSync('scripts/missing_logistics.json', 'utf8'));
const fullDict = JSON.parse(fs.readFileSync('scripts/full_translations_dict.json', 'utf8'));

const stillMissing = missing.filter(s => !fullDict[s]);
console.log('Still missing count:', stillMissing.length);
fs.writeFileSync('scripts/still_missing.json', JSON.stringify(stillMissing, null, 2), 'utf8');

console.log('Top 40 still missing:');
stillMissing.slice(0, 40).forEach(s => console.log(' -', s));
