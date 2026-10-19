const fs = require('fs');
const html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

// Walk text nodes between > and <
const matches = [];
const tagRegex = />([^<]+)</g;
let m;
while ((m = tagRegex.exec(html)) !== null) {
  let text = m[1].trim();
  if (!text) continue;
  if (/^\s*\{\{\s*[^}]+\s*\}\}\s*$/.test(text)) continue;
  if (text.includes('langService.t')) continue;
  if (/^[0-9\s.,:%°\-_/\\#+()|•✓]+$/.test(text)) continue;
  if (/[a-zA-Z]{2,}/.test(text)) {
    matches.push(text);
  }
}

// Walk attributes: placeholder, title
const attrRegex = /(placeholder|title)="([^"]+)"/g;
while ((m = attrRegex.exec(html)) !== null) {
  let text = m[2].trim();
  if (!text) continue;
  if (text.includes('langService.t') || text.includes('{{')) continue;
  if (/[a-zA-Z]{2,}/.test(text)) {
    matches.push(text);
  }
}

console.log('Unit dashboard unwrapped strings count:', matches.length);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/unit_dashboard_unwrapped_all.json', JSON.stringify([...new Set(matches)], null, 2), 'utf8');
console.log('Unique strings count:', new Set(matches).size);
