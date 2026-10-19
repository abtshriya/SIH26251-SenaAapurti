const fs = require('fs');

let file = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', 'utf8');
const isCrlf = file.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

const exp = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/dashboard_translations_expanded.json', 'utf8'));

// We want to insert the entries right before '};' that closes DASHBOARD_TRANSLATIONS, before '@Injectable'
const marker = nl + '};' + nl + nl + '@Injectable';
const idx = file.indexOf(marker);
if (idx === -1) {
  console.error('Marker not found!');
  process.exit(1);
}

const entries = [];
for (const [k, v] of Object.entries(exp)) {
  const escK = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  entries.push(`  '${escK}': '${escV}',`);
}

const insertion = nl + entries.join(nl);
file = file.slice(0, idx) + insertion + file.slice(idx);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', file, 'utf8');
console.log('Successfully inserted ' + entries.length + ' entries into DASHBOARD_TRANSLATIONS!');
