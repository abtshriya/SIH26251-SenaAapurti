const fs = require('fs');

const missing = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/missing_cmd_strings.json', 'utf8'));

// Filter out noise (interpolations, HTML fragments, pure punctuation/numbers)
const validStrings = missing.filter(s => {
  if (s.includes('{{') || s.includes('}}')) return false;
  if (s.includes('<') || s.includes('>')) return false;
  if (/^[0-9.,%+\-—#★▲●•:;\/\s()]+$/.test(s)) return false;
  if (s.length < 2) return false;
  return true;
});

console.log('Valid translatable strings count:', validStrings.length);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/valid_cmd_strings.json', JSON.stringify(validStrings, null, 2));
