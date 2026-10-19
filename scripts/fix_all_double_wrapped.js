const fs = require('fs');

function fixDoubleWrapped(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const regex = /\{\{\s*langService\.t\('\{\{\s*langService\.t\('([^']+)'\)\s*\}\}'\)\s*\}\}/g;
  let count = 0;
  html = html.replace(regex, (match, inner) => {
    count++;
    return "{{ langService.t('" + inner + "') }}";
  });
  if (count > 0) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Fixed ' + count + ' double-wrapped in ' + filePath);
  } else {
    console.log('No double-wrapped in ' + filePath);
  }
}

fixDoubleWrapped('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html');
fixDoubleWrapped('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/unit-dashboard/unit-dashboard.component.html');
