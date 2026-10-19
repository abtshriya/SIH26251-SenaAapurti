const fs = require('fs');
const html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', 'utf8');

const tagRegex = />([^<]+)</g;
let m;
const list = new Set();
while ((m = tagRegex.exec(html)) !== null) {
  let text = m[1].trim();
  if (!text) continue;
  if (/^\s*\{\{\s*[^}]+\s*\}\}\s*$/.test(text)) continue;
  if (text.includes('langService.t')) continue;
  if (/^[0-9\s.,:%°\-_/\\#+()|•✓]+$/.test(text)) continue;
  if (/[a-zA-Z]{2,}/.test(text)) {
    list.add(text);
  }
}

// Also check placeholders
const phRegex = /placeholder="([^"]+)"/g;
while ((m = phRegex.exec(html)) !== null) {
  let text = m[1].trim();
  if (!text) continue;
  if (/[a-zA-Z]{2,}/.test(text) && !text.includes('langService.t')) {
    list.add(text);
  }
}

console.log('Total unique strings in auth.component.html:', list.size);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/auth_strings.json', JSON.stringify([...list], null, 2), 'utf8');
