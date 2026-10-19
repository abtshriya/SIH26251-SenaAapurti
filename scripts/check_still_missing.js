const fs = require('fs');

const master = JSON.parse(fs.readFileSync('scripts/master_merged_translations.json', 'utf8'));
const userFacing = JSON.parse(fs.readFileSync('scripts/user_facing_untranslated.json', 'utf8'));

const stillMissing = [];
for (const s of userFacing) {
  if (!master[s]) {
    stillMissing.push(s);
  }
}

console.log('Still missing user facing strings:', stillMissing.length);
fs.writeFileSync('scripts/still_missing_user_facing.json', JSON.stringify(stillMissing, null, 2), 'utf8');
