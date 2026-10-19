const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/extracted_all_units_fields.json', 'utf8'));
const targeted = JSON.parse(fs.readFileSync('scripts/sena_targeted_translations.json', 'utf8'));

// Build dictionary for all units
const dict = { ...targeted };

// Helper function to translate altitude in string
function translateAltitude(str) {
  return str.replace(/\((\d+[\d,]*)\s*ft\)/gi, '($1 फीट)')
            .replace(/\((\d+[\d,]*)\s*feet\)/gi, '($1 फीट)');
}

// Translations for all 53 units' stations, sectors, commanders, names, etc.
// Let's create an exhaustive mapping
const unitsDb = fs.readFileSync('src/app/data/indian-army-commands-database.ts', 'utf8');
const unitsStart = unitsDb.indexOf('export const ALL_INDIAN_ARMY_UNITS: ArmyUnit[] = [');
const unitsEnd = unitsDb.indexOf('export function getAllUnits');
const blocks = unitsDb.slice(unitsStart, unitsEnd).split(/\n\s*\{\s*\n/).slice(1);

const unitItems = blocks.map(b => {
  const getField = (f) => {
    const m = b.match(new RegExp(f + ':\\s*[\'"]([^\'"]+)[\'"]'));
    return m ? m[1] : '';
  };
  return {
    id: getField('id'),
    name: getField('name'),
    type: getField('type'),
    command: getField('command'),
    corps: getField('corps'),
    formation: getField('formation'),
    station: getField('station'),
    sector: getField('sector'),
    officerName: getField('officerName'),
    commanderRankName: getField('commanderRankName'),
    placeDescription: getField('placeDescription')
  };
});

console.log('Unit items count:', unitItems.length);
fs.writeFileSync('scripts/parsed_53_units.json', JSON.stringify(unitItems, null, 2));
