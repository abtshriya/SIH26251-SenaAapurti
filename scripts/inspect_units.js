const fs = require('fs');

const cmdTs = fs.readFileSync('src/app/pages/command-dashboard/command-dashboard.component.ts', 'utf8');

// Find all occurrences of units or locations
const unitMatches = cmdTs.match(/id:\s*['"]UN-[^'"]+['"][\s\S]*?\}/g);
console.log('Units found in command-dashboard:', unitMatches ? unitMatches.length : 0);
if (unitMatches) {
  unitMatches.slice(0, 5).forEach((u, idx) => {
    console.log(`--- Unit ${idx + 1} ---`);
    console.log(u);
  });
} else {
  // Let's check where the units array is
  const m = cmdTs.match(/units\s*[:=]/);
  console.log('units decl match:', m);
}
