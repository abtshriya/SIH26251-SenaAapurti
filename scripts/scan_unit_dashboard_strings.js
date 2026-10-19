const fs = require('fs');

const content = fs.readFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

// Find lines that have plain English text outside angular interpolation {{ ... }}
const lines = content.split(/\r?\n/);
const untranslatedLines = [];

lines.forEach((line, idx) => {
  const lineNo = idx + 1;
  const trimmed = line.trim();
  // Skip comments, tags only, angular directives only
  if (!trimmed || trimmed.startsWith('<!--') || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('<svg') || trimmed.startsWith('</svg>') || trimmed.startsWith('<path') || trimmed.startsWith('<polygon') || trimmed.startsWith('<rect') || trimmed.startsWith('<line') || trimmed.startsWith('<circle')) {
    return;
  }
  // Check if line contains English letters and no langService.t
  const hasLetters = /[A-Za-z]{3,}/.test(trimmed);
  const hasLangService = trimmed.includes('langService.t');
  if (hasLetters && !hasLangService) {
    // Check if it's pure html tag without text content, e.g. <div class="...">
    const stripped = trimmed.replace(/<[^>]+>/g, '').trim();
    if (stripped.length > 2 && /[A-Za-z]{3,}/.test(stripped) && !stripped.startsWith('{{') && !stripped.startsWith('[')) {
      untranslatedLines.push({ lineNo, text: stripped, full: trimmed });
    }
  }
});

console.log('Total untranslated text lines found:', untranslatedLines.length);
fs.writeFileSync('scripts/unit_dashboard_untranslated.json', JSON.stringify(untranslatedLines, null, 2));
untranslatedLines.slice(0, 30).forEach(u => console.log(`L${u.lineNo}: ${u.text}`));
