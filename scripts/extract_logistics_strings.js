const fs = require('fs');
const code = fs.readFileSync('src/app/services/logistics.service.ts', 'utf8');

const regex = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;
let match;
const strings = new Set();
while ((match = regex.exec(code)) !== null) {
  const str = (match[1] !== undefined ? match[1] : match[2]).trim();
  if (str.length > 2 && !str.startsWith('http') && !str.startsWith('/') && !str.startsWith('api/')) {
    strings.add(str);
  }
}

console.log('Total extracted strings:', strings.size);
const sorted = Array.from(strings).sort((a, b) => b.length - a.length);
fs.writeFileSync('scripts/logistics_strings.json', JSON.stringify(sorted, null, 2), 'utf8');
console.log('Saved to scripts/logistics_strings.json');
