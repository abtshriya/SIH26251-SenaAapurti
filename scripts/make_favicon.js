const fs = require('fs');
const imgBase64 = fs.readFileSync('public/images/sena_crest_logo.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="tabBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#183621"/>
      <stop offset="100%" stop-color="#0a180e"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="31" fill="url(#tabBg)" stroke="#d4af37" stroke-width="1.8"/>
  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(212, 175, 55, 0.4)" stroke-width="0.8"/>
  <image href="data:image/png;base64,${imgBase64}" x="7" y="7" width="50" height="50"/>
</svg>`;
fs.writeFileSync('public/images/sena_tab_favicon.svg', svg);
console.log('Favicon generated at public/images/sena_tab_favicon.svg');
