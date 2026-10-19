const fs = require('fs');
const path = require('path');

const langServiceContent = fs.readFileSync('src/app/services/language.service.ts', 'utf8');
const dtMatch = langServiceContent.match(/export const DASHBOARD_TRANSLATIONS: Record<string, string> = \{([\s\S]*?)\n\};/);
const currentDt = {};
if (dtMatch) {
  const lines = dtMatch[1].split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*'([^']+)':\s*'([^']+)',?/);
    if (m) currentDt[m[1]] = m[2];
  }
}

const files = [
  'src/app/pages/unit-dashboard/unit-dashboard.component.html',
  'src/app/pages/unit-dashboard/unit-dashboard.component.ts',
  'src/app/pages/command-dashboard/command-dashboard.component.html',
  'src/app/data/indian-army-commands-database.ts',
  'src/app/services/logistics.service.ts'
];

const extracted = new Set();

function clean(s) {
  if (!s) return null;
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length < 2) return null;
  if (/^<.*>$/.test(s)) return null;
  if (/^\{\{.*\}\}$/.test(s)) return null;
  if (/^[\d\s.,:;()#%•|+\-\/°℃'"]+$/.test(s)) return null;
  if (['string', 'number', 'boolean', 'any', 'none', 'auto', 'default', 'root', 'true', 'false', 'null', 'undefined'].includes(s)) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return null;
  if (s.startsWith('app-') || s.startsWith('mat-') || s.startsWith('svg-') || s.startsWith('btn-') || s.startsWith('card-')) return null;
  return s;
}

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  if (f.endsWith('.html')) {
    // text nodes
    const matches = content.match(/>([^<]+)</g) || [];
    for (const m of matches) {
      const text = m.slice(1, -1);
      // Remove {{ ... }}
      const parts = text.split(/\{\{[^}]+\}\}/);
      for (const p of parts) {
        const c = clean(p);
        if (c) extracted.add(c);
      }
    }
    // attributes
    const attrMatches = content.match(/(?:placeholder|title|aria-label)="([^"]+)"/g) || [];
    for (const a of attrMatches) {
      const val = a.split('="')[1].slice(0, -1);
      const c = clean(val);
      if (c) extracted.add(c);
    }
  } else {
    // ts file
    const strMatches = content.match(/'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g) || [];
    for (const sm of strMatches) {
      const s = sm.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
      const c = clean(s);
      if (c) extracted.add(c);
    }
  }
}

const missing = [];
for (const s of Array.from(extracted).sort()) {
  if (!currentDt[s]) {
    missing.push(s);
  }
}

console.log('Total extracted candidate strings:', extracted.size);
console.log('Total missing from DASHBOARD_TRANSLATIONS:', missing.length);
fs.writeFileSync('scripts/missing_extracted.json', JSON.stringify(missing, null, 2));
