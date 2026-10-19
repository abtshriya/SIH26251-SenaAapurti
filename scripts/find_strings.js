const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/command-dashboard/command-dashboard.component.html', 'utf8');

// Match text between > and <
const matches = [];
const regex = />([^<]+)</g;
let m;
while ((m = regex.exec(html)) !== null) {
  const text = m[1].trim();
  if (text && !text.startsWith('{{') && !text.startsWith('//') && text.length > 1 && !/^[0-9.,%+\-—#★▲●•:;\/]+$/.test(text)) {
    matches.push(text);
  }
}

// Find placeholders
const pRegex = /placeholder="([^"]+)"/g;
while ((m = pRegex.exec(html)) !== null) {
  matches.push(m[1].trim());
}

const unique = [...new Set(matches)].sort();
console.log('Total extracted unique strings:', unique.length);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/extracted_cmd_strings.json', JSON.stringify(unique, null, 2));
console.log('Saved to scripts/extracted_cmd_strings.json');
