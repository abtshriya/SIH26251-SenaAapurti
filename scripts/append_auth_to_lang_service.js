const fs = require('fs');

let file = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', 'utf8');
const isCrlf = file.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

const authDict = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/auth_translations_dict.json', 'utf8'));

// Find closing marker for DASHBOARD_TRANSLATIONS
const marker = nl + '};' + nl + nl + '@Injectable';
const idx = file.indexOf(marker);
if (idx === -1) {
  console.error('Marker not found in language.service.ts!');
  process.exit(1);
}

const entries = [];
for (const [k, v] of Object.entries(authDict)) {
  const escK = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  entries.push("  '" + escK + "': '" + escV + "',");
}

const insertion = nl + entries.join(nl);
file = file.slice(0, idx) + insertion + file.slice(idx);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', file, 'utf8');
console.log('Appended ' + entries.length + ' auth translations into DASHBOARD_TRANSLATIONS');
