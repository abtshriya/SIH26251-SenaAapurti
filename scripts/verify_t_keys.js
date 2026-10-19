const fs = require('fs');

const svc = fs.readFileSync('src/app/services/language.service.ts', 'utf8');
const targeted = JSON.parse(fs.readFileSync('scripts/sena_full_merged_translations.json', 'utf8'));

const uHtml = fs.readFileSync('src/app/pages/unit-dashboard/unit-dashboard.component.html', 'utf8');
const cHtml = fs.readFileSync('src/app/pages/command-dashboard/command-dashboard.component.html', 'utf8');

const tCalls = [];
const regex = /langService\.t\(\s*'([^']+)'\s*\)/g;
let m;
while ((m = regex.exec(uHtml)) !== null) {
  tCalls.push(m[1]);
}
while ((m = regex.exec(cHtml)) !== null) {
  tCalls.push(m[1]);
}

const uniqueKeys = Array.from(new Set(tCalls));
console.log('Total unique keys wrapped with langService.t:', uniqueKeys.length);

const missing = [];
uniqueKeys.forEach(k => {
  const inTargeted = targeted[k] !== undefined;
  const inSvc = svc.includes(JSON.stringify(k) + ':');
  if (!inTargeted && !inSvc) {
    missing.push(k);
  }
});

console.log('Keys missing from translations:', missing.length);
if (missing.length > 0) {
  console.log(missing);
}
