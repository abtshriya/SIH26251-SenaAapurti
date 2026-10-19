const fs = require('fs');

const extra42 = {
  'CORPS // ': 'कोर // ',
  'Fresh & MRE Rations:': 'ताजा एवं एमआरई राशन:',
  'Capacity': 'क्षमता',
  'Winter Grade HSD:': 'विंटर ग्रेड एचएसडी:',
  'BMP-II Armor Spares:': 'बीएमपी-II बख्तरबंद स्पेयर:',
  '4 suspension pads under transit via Convoy GARUDA-01': 'काफिला GARUDA-01 द्वारा 4 सस्पेंशन पैड पारगमन में',
  'Feels like': 'महसूस होता है',
  'Sub-Zero POL Consumption Breakdown': 'शून्य से नीचे तापमान में पीओएल खपत विवरण',
  'Forward Base IoT Sensor Telemetry': 'अग्रिम बेस आईओटी सेंसर टेलीमेट्री',
  'Unit Requisition & Indent Vouchers': 'यूनिट मांग एवं मांग-पत्र वाउचर',
  'Voucher #': 'वाउचर संख्या',
  'Requested Qty': 'मांगी गई मात्रा',
  'Required By': 'आवश्यकता की तिथि',
  'Date Submitted': 'प्रस्तुत करने की तिथि',
  'Unit Inbound & Outbound Logistics': 'यूनिट आवक एवं जावक रसद',
  'Inbound Military Consignments Manifest': 'आवक सैन्य माल विवरण (मैनिफेस्ट)',
  'Shipment / Convoy': 'खेप / काफिला',
  'Destination Depot': 'गंतव्य डिपो',
  'Fleet Size': 'काफिले का आकार',
  '✓ DIRECTIVE EXECUTED': '✓ निर्देश निष्पादित',
  'TARGET STORES': 'लक्षित भंडार',
  'EXPECTED READINESS IMPACT': 'अपेक्षित तत्परता प्रभाव',
  'OPERATIONAL ASSESSMENT': 'परिचालन मूल्यांकन',
  'Key Drivers:': 'प्रमुख कारक:',
  'REQUIRED DIRECTIVE': 'आवश्यक निर्देश',
  'Hide Options ▲': 'विकल्प छुपाएं ▲',
  'Secondary Options': 'द्वितीयक विकल्प',
  '✓ Approve & Issue Order': '✓ आदेश स्वीकृत एवं जारी करें',
  '✓ Order Issued & Dispatched': '✓ आदेश जारी एवं रवाना किया गया',
  'Report Title & ID': 'रिपोर्ट शीर्षक एवं आईडी',
  'Ledger Status': 'लेजर स्थिति',
  'Redistribute': 'पुनर्वितरण करें',
  'Replenish': 'पुनः पूर्ति करें',
  'Authorize Emergency Buffer Release': 'आपातकालीन बफर रिलीज अधिकृत करें',
  'Authorize Pre-Winter Buffer Dispatch': 'शीतकालीन पूर्व बफर प्रेषण अधिकृत करें',
  'POL & Arctic Fuel': 'पीओएल एवं आर्कटिक ईंधन',
  'Combat Rations': 'युद्ध राशन',
  'Munitions & Shells': 'गोला-बारूद एवं शेल्स',
  'Vehicle & Armor Spares': 'वाहन एवं बख्तरबंद स्पेयर',
  'High-Alt Medical & O2': 'उच्च तुंगता चिकित्सा एवं ऑक्सीजन',
  'ECC Winter Clothing': 'ईसीसी शीतकालीन वस्त्र',
  'Baseline:': 'आधार रेखा:'
};

const svcPath = 'src/app/services/language.service.ts';
let content = fs.readFileSync(svcPath, 'utf8');

const dtStart = content.indexOf('export const DASHBOARD_TRANSLATIONS: Record<string, string> = {');
const injectIdx = content.indexOf('@Injectable({');

const dtSlice = content.slice(dtStart, injectIdx);
const semiLast = dtSlice.lastIndexOf('};');
const dtEnd = dtStart + semiLast;

const dtContent = content.slice(dtStart + 'export const DASHBOARD_TRANSLATIONS: Record<string, string> = {'.length, dtEnd);

// Parse all key-value entries
const entries = new Map();
const lines = dtContent.split(/\r?\n/);

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//')) continue;
  const m = trimmed.match(/^(['"])([\s\S]*?)\1\s*:\s*(['"])([\s\S]*?)\3,?\s*$/);
  if (m) {
    entries.set(m[2], m[4]);
  }
}

// Add the extra 42
for (const [k, v] of Object.entries(extra42)) {
  entries.set(k, v);
}

console.log('Total unique keys with extra 42:', entries.size);

const sortedEntries = [];
entries.forEach((val, key) => {
  sortedEntries.push(`  ${JSON.stringify(key)}: ${JSON.stringify(val)},`);
});

const isCrlf = content.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

const newDtBlock = 'export const DASHBOARD_TRANSLATIONS: Record<string, string> = {' + nl + sortedEntries.join(nl) + nl + '};';

content = content.slice(0, dtStart) + newDtBlock + content.slice(dtEnd + 2);

fs.writeFileSync(svcPath, content);
console.log('Successfully inserted all remaining keys into language.service.ts!');
