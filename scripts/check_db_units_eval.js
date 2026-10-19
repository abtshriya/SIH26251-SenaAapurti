const fs = require('fs');

const dbContent = fs.readFileSync('src/app/data/indian-army-commands-database.ts', 'utf8');
const targeted = JSON.parse(fs.readFileSync('scripts/sena_full_merged_translations.json', 'utf8'));

// Extract units
const start = dbContent.indexOf('export const ALL_INDIAN_ARMY_UNITS: ArmyUnit[] = [');
const end = dbContent.indexOf('export function getAllCommands');
let rawSlice = dbContent.slice(start + 'export const ALL_INDIAN_ARMY_UNITS: ArmyUnit[] = '.length, end);
const lastSemi = rawSlice.lastIndexOf('];');
let slice = rawSlice.slice(0, lastSemi + 1).trim();

const units = eval('(' + slice + ')');
console.log('Total units successfully evaluated:', units.length);

let missing = 0;
units.forEach(u => {
  const comp = `${u.station} • ${u.sector}`;
  const compTr = targeted[comp];
  const stTr = targeted[u.station];
  const secTr = targeted[u.sector];
  if (!compTr && (!stTr || !secTr)) {
    console.log('MISSING:', u.id, u.name);
    console.log('   station in dict:', !!stTr, u.station);
    console.log('   sector in dict:', !!secTr, u.sector);
    missing++;
  }
});

console.log('Result: Missing units:', missing);
