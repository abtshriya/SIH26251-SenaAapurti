const fs = require('fs');
const html = fs.readFileSync('src/app/pages/command-dashboard/command-dashboard.component.html', 'utf8');
const ts = fs.readFileSync('src/app/pages/command-dashboard/command-dashboard.component.ts', 'utf8');

const strings = new Set();

// 1. Text nodes inside HTML tags
const tagTextRegex = />\s*([^<>{}\n\r][^<>{}]*[^<>{}\n\r])\s*</g;
let m;
while ((m = tagTextRegex.exec(html)) !== null) {
  const text = m[1].trim();
  if (text.length > 1 && !text.match(/^[\d\s.,:;()#%•|+\-\/]+$/)) {
    strings.add(text);
  }
}

// 2. Placeholder attributes
const phRegex = /placeholder="([^"]+)"/g;
while ((m = phRegex.exec(html)) !== null) {
  strings.add(m[1].trim());
}

// 3. String literals in TS
const tsStringRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;
while ((m = tsStringRegex.exec(ts)) !== null) {
  const text = (m[1] !== undefined ? m[1] : m[2]).trim();
  if (text.length > 2 && !text.startsWith('/') && !text.startsWith('#') && !text.startsWith('alt-') && !text.startsWith('tab-') && !text.startsWith('btn-') && !text.startsWith('c2-')) {
    strings.add(text);
  }
}

console.log('Total dashboard strings extracted:', strings.size);
fs.writeFileSync('scripts/dashboard_strings.json', JSON.stringify(Array.from(strings), null, 2), 'utf8');
