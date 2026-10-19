const fs = require('fs');

const dbContent = fs.readFileSync('src/app/data/indian-army-commands-database.ts', 'utf8');

// Match all objects in ALL_INDIAN_ARMY_UNITS
const unitsStart = dbContent.indexOf('export const ALL_INDIAN_ARMY_UNITS: ArmyUnit[] = [');
const unitsEnd = dbContent.indexOf('export function getAllUnits');
const unitsSlice = dbContent.slice(unitsStart, unitsEnd);

const units = [];
const blocks = unitsSlice.split(/\n\s*\{\s*\n/).slice(1);

blocks.forEach(b => {
  const getField = (f) => {
    const m = b.match(new RegExp(f + ':\\s*[\'"]([^\'"]+)[\'"]'));
    return m ? m[1] : '';
  };
  const id = getField('id');
  if (id) {
    units.push({
      id,
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
    });
  }
});

console.log('Successfully parsed units:', units.length);

const stations = Array.from(new Set(units.map(u => u.station).filter(Boolean)));
const sectors = Array.from(new Set(units.map(u => u.sector).filter(Boolean)));
const composites = Array.from(new Set(units.map(u => `${u.station} • ${u.sector}`).filter(Boolean)));
const names = Array.from(new Set(units.map(u => u.name).filter(Boolean)));
const commanders = Array.from(new Set(units.map(u => u.commanderRankName || u.officerName).filter(Boolean)));
const descriptions = Array.from(new Set(units.map(u => u.placeDescription).filter(Boolean)));
const formations = Array.from(new Set(units.map(u => u.formation).filter(Boolean)));
const corps = Array.from(new Set(units.map(u => u.corps).filter(Boolean)));

fs.writeFileSync('scripts/extracted_all_units_fields.json', JSON.stringify({
  unitsCount: units.length,
  stations,
  sectors,
  composites,
  names,
  commanders,
  descriptions,
  formations,
  corps
}, null, 2));

console.log('Saved extracted_all_units_fields.json');
console.log('Stations:', stations.length);
console.log('Sectors:', sectors.length);
console.log('Composites:', composites.length);
console.log('Names:', names.length);
console.log('Commanders:', commanders.length);
console.log('Descriptions:', descriptions.length);
