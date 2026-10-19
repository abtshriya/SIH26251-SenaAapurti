const fs = require('fs');

// Collect all dictionaries from scripts and language.service.ts
let master = {};

function mergeObj(obj) {
  if (!obj) return;
  for (const [k, v] of Object.entries(obj)) {
    if (k && v && typeof k === 'string' && typeof v === 'string') {
      master[k.trim()] = v.trim();
    }
  }
}

// 1. Existing DASHBOARD_TRANSLATIONS in language.service.ts
const langFile = fs.readFileSync('src/app/services/language.service.ts', 'utf8');
const dtMatch = langFile.match(/export const DASHBOARD_TRANSLATIONS: Record<string, string> = \{([\s\S]*?)\n\};/);
if (dtMatch) {
  const lines = dtMatch[1].split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*'([^']+)':\s*'([^']+)',?/);
    if (m) master[m[1].trim()] = m[2].trim();
  }
}
console.log('Base language.service.ts entries:', Object.keys(master).length);

// 2. Load JSON files
const jsonFiles = [
  'scripts/comprehensive_translations.json',
  'scripts/dashboard_translations_expanded.json',
  'scripts/full_translations_dict.json'
];

for (const jf of jsonFiles) {
  if (fs.existsSync(jf)) {
    mergeObj(JSON.parse(fs.readFileSync(jf, 'utf8')));
  }
}
console.log('After JSON files:', Object.keys(master).length);

// 3. Extract dictionaries from JS files using eval/require
const jsFiles = [
  'scripts/build_translations.js',
  'scripts/generate_all_translations.js',
  'scripts/build_full_translations.js',
  'scripts/add_more_translations.js',
  'scripts/add_report_translations.js',
  'scripts/add_popup_translations.js'
];

for (const jsf of jsFiles) {
  if (fs.existsSync(jsf)) {
    const content = fs.readFileSync(jsf, 'utf8');
    // Extract object literals matching: const xxx = { ... };
    const objMatches = content.match(/(?:const|let|var)\s+\w+\s*=\s*\{([\s\S]*?)\n\};/g);
    if (objMatches) {
      for (const om of objMatches) {
        try {
          // evaluate safely by creating function
          const clean = om.replace(/^(?:const|let|var)\s+\w+\s*=\s*/, 'return ');
          const fn = new Function(clean);
          mergeObj(fn());
        } catch (e) {
          // parse line by line fallback
          const lines = om.split(/\r?\n/);
          for (const l of lines) {
            const sm = l.match(/^\s*['"](.*?)['"]\s*:\s*['"](.*?)['"],?/);
            if (sm) master[sm[1].trim()] = sm[2].trim();
          }
        }
      }
    }
  }
}

console.log('Total merged dictionary size:', Object.keys(master).length);

// Save current merged dictionary
fs.writeFileSync('scripts/master_merged_translations.json', JSON.stringify(master, null, 2), 'utf8');
