const fs = require('fs');

const svcPath = 'src/app/services/language.service.ts';
let svcContent = fs.readFileSync(svcPath, 'utf8');

const mergedDict = JSON.parse(fs.readFileSync('scripts/sena_full_merged_translations.json', 'utf8'));

const isCrlf = svcContent.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

// 1. Merge translations into DASHBOARD_TRANSLATIONS
// Find where DASHBOARD_TRANSLATIONS ends (line 1752: "};")
const idx = svcContent.indexOf("'Severe Cold Wave Forecast': 'भीषण शीतलहर का पूर्वानुमान',");
if (idx === -1) {
  console.error('Could not find Severe Cold Wave Forecast key');
  process.exit(1);
}
const semiIdx = svcContent.indexOf('};' + nl, idx);
if (semiIdx === -1) {
  console.error('Could not find closing };');
  process.exit(1);
}

// Format new translations
const newEntries = [];
for (const [enKey, hiVal] of Object.entries(mergedDict)) {
  // Check if enKey already exists as key in DASHBOARD_TRANSLATIONS
  const escapedKey = JSON.stringify(enKey);
  const regex = new RegExp(`^\\s*${escapedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'm');
  if (!regex.test(svcContent)) {
    newEntries.push(`  ${escapedKey}: ${JSON.stringify(hiVal)},`);
  }
}

console.log('New translation entries to insert:', newEntries.length);
const formattedNew = newEntries.join(nl) + nl;
svcContent = svcContent.slice(0, semiIdx) + formattedNew + svcContent.slice(semiIdx);

// 2. Enhance translateText with altitude, date, quantity-unit, and status regex
const oldDynamicHeader = `    // 3. Dynamic patterns (timestamps, dates, counters, status badges)`;
const newDynamicPatterns = `    // 3. Dynamic patterns (timestamps, dates, counters, status badges)
    // Altitude regex: e.g. "Eastern Ladakh / Shyok Axis (11,500 ft)" or "(18,800 ft)"
    const mAlt = trimmed.match(/^(.*?)\s*\\((\\d+[\\d,]*)\\s*ft\\)$/i);
    if (mAlt) {
      const baseTranslated = this.translateText(mAlt[1]);
      return text.replace(trimmed, \`\${baseTranslated} (\${mAlt[2]} फीट)\`);
    }
    const mFtOnly = trimmed.match(/^(\\d+[\\d,]*)\\s*ft$/i);
    if (mFtOnly) {
      return text.replace(trimmed, \`\${mFtOnly[1]} फीट\`);
    }

    // Military date format: e.g. "Monday, 19 Oct 2026"
    const mMilDate = trimmed.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\\s*(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+(\\d{4})$/i);
    if (mMilDate) {
      const dayMap: Record<string, string> = {
        monday: 'सोमवार', tuesday: 'मंगलवार', wednesday: 'बुधवार', thursday: 'गुरुवार',
        friday: 'शुक्रवार', saturday: 'शनिवार', sunday: 'रविवार'
      };
      const monthMap: Record<string, string> = {
        jan: 'जनवरी', feb: 'फरवरी', mar: 'मार्च', apr: 'अप्रैल', may: 'मई', jun: 'जून',
        jul: 'जुलाई', aug: 'अगस्त', sep: 'सितंबर', oct: 'अक्टूबर', nov: 'नवंबर', dec: 'दिसंबर'
      };
      const dName = dayMap[mMilDate[1].toLowerCase()] || mMilDate[1];
      const mName = monthMap[mMilDate[3].toLowerCase()] || mMilDate[3];
      return text.replace(trimmed, \`\${dName}, \${mMilDate[2]} \${mName} \${mMilDate[4]}\`);
    }

    // Date format e.g. "19-Oct-2026" or "19 Oct 2026"
    const mDateSimple = trimmed.match(/^(\\d{1,2})[\\s\\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s\\-]+(\\d{4})$/i);
    if (mDateSimple) {
      const monthMap: Record<string, string> = {
        jan: 'जनवरी', feb: 'फरवरी', mar: 'मार्च', apr: 'अप्रैल', may: 'मई', jun: 'जून',
        jul: 'जुलाई', aug: 'अगस्त', sep: 'सितंबर', oct: 'अक्टूबर', nov: 'नवंबर', dec: 'दिसंबर'
      };
      const mName = monthMap[mDateSimple[2].toLowerCase()] || mDateSimple[2];
      return text.replace(trimmed, \`\${mDateSimple[1]} \${mName} \${mDateSimple[3]}\`);
    }

    // Military quantities with units: e.g. "16,200 Litres", "4,200 Packs", "120,000 Rounds", "12 Sets", "450 Suits", "320 Tonnes", "340 T", "48 DOS", "12 Days", "0 Item", "0 High Risk"
    const mQtyUnit = trimmed.match(/^([\\d,]+(?:\\.\\d+)?)\\s*(Litres|Litre|Ltrs|Ltr|Packs|Pack|Pkts|Rounds|Round|Rnds|Sets|Set|Suits|Suit|Tonnes|Tonne|Tons|Ton|T|Vehicles|Vehicle|Items|Item|Days|Day|DOS|High Risk)$/i);
    if (mQtyUnit) {
      const unitMap: Record<string, string> = {
        litres: 'लीटर', litre: 'लीटर', ltrs: 'लीटर', ltr: 'लीटर',
        packs: 'पैकेट', pack: 'पैकेट', pkts: 'पैकेट',
        rounds: 'राउंड', round: 'राउंड', rnds: 'राउंड',
        sets: 'सेट', set: 'सेट',
        suits: 'सूट', suit: 'सूट',
        tonnes: 'टन', tonne: 'टन', tons: 'टन', ton: 'टन', t: 'टन',
        vehicles: 'वाहन', vehicle: 'वाहन',
        items: 'आइटम', item: 'आइटम',
        days: 'दिन', day: 'दिन',
        dos: 'आपूर्ति दिवस',
        'high risk': 'उच्च जोखिम'
      };
      const uHindi = unitMap[mQtyUnit[2].toLowerCase()] || mQtyUnit[2];
      return text.replace(trimmed, \`\${mQtyUnit[1]} \${uHindi}\`);
    }

    // Buffer scale: e.g. "12d Buffer", "30d Buffer"
    const mBuffer = trimmed.match(/^(\\d+)\\s*d\\s+Buffer$/i);
    if (mBuffer) return text.replace(trimmed, \`\${mBuffer[1]} दिन बफर\`);

    // In-transit indication: e.g. "4 suspension pads under transit via Convoy GARUDA-01"
    const mTransit = trimmed.match(/^(\\d+)\\s+([A-Za-z0-9\\s\\-]+?)\\s+under transit via Convoy\\s+([A-Za-z0-9\\-]+)$/i);
    if (mTransit) {
      return text.replace(trimmed, \`\${mTransit[1]} \${mTransit[2]} काफिला \${mTransit[3]} के माध्यम से पारगमन में\`);
    }
`;

svcContent = svcContent.replace(oldDynamicHeader, newDynamicPatterns.replace(/\r?\n/g, nl));

// 3. Add select option translation to applyDomTranslations
const oldSelectRestore = `        // Also restore placeholder and title attributes`;
const newSelectRestore = `        // Restore select options
        document.querySelectorAll<HTMLOptionElement>('option[data-orig-text]').forEach(opt => {
          const orig = opt.getAttribute('data-orig-text');
          if (orig) {
            opt.text = orig;
            opt.removeAttribute('data-orig-text');
          }
        });

        // Also restore placeholder and title attributes`;

svcContent = svcContent.replace(oldSelectRestore, newSelectRestore.replace(/\r?\n/g, nl));

const oldWalkTextNodes = `      // Walk text nodes and translate`;
const newWalkSelectAndText = `      // Walk select option elements to translate dropdowns
      document.querySelectorAll<HTMLSelectElement>('select').forEach(sel => {
        sel.querySelectorAll<HTMLOptionElement>('option').forEach(opt => {
          const raw = opt.text?.trim();
          if (raw && raw.length >= 2) {
            if (!opt.hasAttribute('data-orig-text')) {
              opt.setAttribute('data-orig-text', opt.text);
            }
            const tr = this.translateText(raw);
            if (tr !== raw) {
              opt.text = tr;
            }
          }
        });
      });

      // Walk text nodes and translate`;

svcContent = svcContent.replace(oldWalkTextNodes, newWalkSelectAndText.replace(/\r?\n/g, nl));

fs.writeFileSync(svcPath, svcContent);
console.log('Successfully updated src/app/services/language.service.ts!');
