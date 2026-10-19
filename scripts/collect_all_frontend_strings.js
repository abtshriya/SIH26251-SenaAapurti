const fs = require('fs');
const path = require('path');

const filesToScan = [
  'src/app/pages/command-dashboard/command-dashboard.component.html',
  'src/app/pages/command-dashboard/command-dashboard.component.ts',
  'src/app/pages/unit-dashboard/unit-dashboard.component.html',
  'src/app/pages/unit-dashboard/unit-dashboard.component.ts',
  'src/app/components/header/header.component.html',
  'src/app/components/header/header.component.ts',
  'src/app/services/logistics.service.ts',
  'src/app/data/indian-army-commands-database.ts'
];

const extracted = new Set();

function cleanString(s) {
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length < 2) return null;
  // Ignore HTML tags, angular bindings, pure numbers or punctuation
  if (/^<.*>$/.test(s)) return null;
  if (/^\{\{.*\}\}$/.test(s)) return null;
  if (/^[\d\s.,:;()#%•|+\-\/°℃'"]+$/.test(s)) return null;
  if (/^[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+$/.test(s)) return null;
  if (['string', 'number', 'boolean', 'any', 'none', 'auto', 'default', 'root', 'true', 'false', 'null', 'undefined', 'void', 'never'].includes(s)) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return null;
  if (s.startsWith('app-') || s.startsWith('mat-') || s.startsWith('svg-') || s.startsWith('btn-') || s.startsWith('card-')) return null;
  return s;
}

for (const relPath of filesToScan) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');

  if (relPath.endsWith('.html')) {
    // 1. Text nodes between > and <
    const textNodeRegex = />([^<]+)</g;
    let m;
    while ((m = textNodeRegex.exec(content)) !== null) {
      let raw = m[1];
      // Remove any {{ ... }} bindings to get surrounding static text
      const parts = raw.split(/\{\{[^}]+\}\}/);
      for (const p of parts) {
        const cleaned = cleanString(p);
        if (cleaned) extracted.add(cleaned);
      }
    }

    // 2. Placeholder, title, aria-label
    const attrRegex = /(?:placeholder|title|aria-label)="([^"]+)"/g;
    while ((m = attrRegex.exec(content)) !== null) {
      const cleaned = cleanString(m[1]);
      if (cleaned) extracted.add(cleaned);
    }
  } else {
    // TS file: extract string literals
    const strRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let m;
    while ((m = strRegex.exec(content)) !== null) {
      const str = m[1] !== undefined ? m[1] : m[2];
      const cleaned = cleanString(str);
      if (cleaned && cleaned.length > 2) {
        // filter out imports, angular properties, colors, etc.
        if (cleaned.startsWith('./') || cleaned.startsWith('../') || cleaned.startsWith('@') || cleaned.startsWith('rgba') || cleaned.startsWith('var(--')) continue;
        if (/^[a-z0-9\-]+$/.test(cleaned) && cleaned.length < 15 && !['critical', 'high', 'medium', 'low', 'active', 'healthy', 'warning', 'surplus', 'adequate', 'depleted'].includes(cleaned.toLowerCase())) continue;
        extracted.add(cleaned);
      }
    }
  }
}

console.log('Total extracted candidate strings:', extracted.size);
fs.writeFileSync('scripts/extracted_candidates.json', JSON.stringify(Array.from(extracted).sort(), null, 2), 'utf8');
