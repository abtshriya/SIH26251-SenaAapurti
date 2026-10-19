const fs = require('fs');

const content = fs.readFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

// Find remaining button, h1-h5, th, and label elements that don't have langService.t
const tags = ['button', 'h1', 'h2', 'h3', 'h4', 'h5', 'th', 'label', '.ud-panel-heading', '.ud-panel-hint', '.kpi-label'];

const lines = content.split(/\r?\n/);
const untranslatedElements = [];

lines.forEach((l, idx) => {
  const lineNo = idx + 1;
  const trimmed = l.trim();
  if (trimmed.includes('langService.t')) return;
  // Check if it has readable text like <button ...>Some Text</button>
  const m = trimmed.match(/<(button|h1|h2|h3|h4|h5|th|label)[^>]*>([^<]+)<\/\1>/);
  if (m) {
    const text = m[2].trim();
    if (/[A-Za-z]{2,}/.test(text) && !text.startsWith('{{')) {
      untranslatedElements.push({ lineNo, tag: m[1], text, line: trimmed });
    }
  }
});

console.log('Untranslated element tags found:', untranslatedElements.length);
untranslatedElements.slice(0, 40).forEach(e => console.log(`L${e.lineNo} <${e.tag}>: ${e.text}`));

fs.writeFileSync('scripts/remaining_unit_elements.json', JSON.stringify(untranslatedElements, null, 2));
