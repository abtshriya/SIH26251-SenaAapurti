const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/untranslated_ui.json', 'utf8'));

// Filter down to valid user-facing strings
const userFacing = raw.filter(s => {
  if (s.length < 2) return false;
  if (/^[0-9\s.,:;()#%•|+\-\/°℃'"]+$/.test(s)) return false;
  if (/^M\d+|^[0-9a-f]{16,}/.test(s)) return false;
  if (s.includes('function') || s.includes('return ') || s.includes('const ') || s.includes('let ') || s.includes('var ') || s.includes('=>')) return false;
  if (s.includes('AppComponent') || s.includes('inject(') || s.includes('Observable') || s.includes('Subject')) return false;
  if (/^[a-z0-9\-]+$/.test(s) && !['critical', 'high', 'medium', 'low', 'active', 'healthy', 'warning', 'surplus', 'adequate', 'depleted', 'routine', 'authorized', 'rejected', 'pending', 'approved', 'dispatched', 'delivered'].includes(s.toLowerCase())) return false;
  return true;
});

console.log('Filtered user-facing strings:', userFacing.length);
fs.writeFileSync('scripts/user_facing_untranslated.json', JSON.stringify(userFacing, null, 2), 'utf8');
