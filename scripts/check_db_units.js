const fs = require('fs');

const dbContent = fs.readFileSync('src/app/data/indian-army-commands-database.ts', 'utf8');
const targeted = JSON.parse(fs.readFileSync('scripts/sena_full_merged_translations.json', 'utf8'));

// Find all units
const units = [];
const regex = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?station:\s*'([^']+)'[\s\S]*?sector:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(dbContent)) !== null) {
  units.push({
    id: match[1],
    name: match[2],
    station: match[3],
    sector: match[4],
    composite: `${match[3]} • ${match[4]}`
  });
}

console.log('Total units found in database:', units.length);

let missingCount = 0;
units.forEach(u => {
  const hasComp = targeted[u.composite] !== undefined;
  const hasStation = targeted[u.station] !== undefined;
  const hasSector = targeted[u.sector] !== undefined;
  if (!hasComp && (!hasStation || !hasSector)) {
    console.log('Missing translation for unit:', u.id, u.name);
    console.log('   Composite:', u.composite);
    console.log('   Station in dict?', hasStation, u.station);
    console.log('   Sector in dict?', hasSector, u.sector);
    missingCount++;
  }
});

console.log('Total units missing translation:', missingCount);
