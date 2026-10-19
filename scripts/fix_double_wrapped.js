const fs = require('fs');
let html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');

// Regex to fix double nesting: {{ langService.t('{{ langService.t(\'...\') }}') }}
const regex = /\{\{\s*langService\.t\('\{\{\s*langService\.t\('([^']+)'\)\s*\}\}'\)\s*\}\}/g;
let count = 0;
html = html.replace(regex, (match, inner) => {
  count++;
  return "{{ langService.t('" + inner + "') }}";
});

console.log('Fixed double wrapped instances:', count);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html', html, 'utf8');
