const fs = require('fs');
let file = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', 'utf8');
const isCrlf = file.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

// Extract the whole DASHBOARD_TRANSLATIONS block
const startIdx = file.indexOf('export const DASHBOARD_TRANSLATIONS: Record<string, string> = {');
const endMarker = nl + '};' + nl + nl + '@Injectable';
const endIdx = file.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not delimit DASHBOARD_TRANSLATIONS block');
  process.exit(1);
}

const block = file.substring(startIdx, endIdx);
const lines = block.split(/\r?\n/);
console.log('Total lines in block:', lines.length);

const entries = new Map();
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^\s*'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)',?$/);
  if (m) {
    const k = m[1];
    const v = m[2];
    entries.set(k, v);
  }
}

console.log('Unique entries count:', entries.size);

const cleanLines = ['export const DASHBOARD_TRANSLATIONS: Record<string, string> = {'];
for (const [k, v] of entries.entries()) {
  cleanLines.push("  '" + k + "': '" + v + "',");
}

const newBlock = cleanLines.join(nl);
file = file.slice(0, startIdx) + newBlock + file.slice(endIdx);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/services/language.service.ts', file, 'utf8');
console.log('Deduplicated DASHBOARD_TRANSLATIONS successfully!');
