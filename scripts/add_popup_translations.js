const fs = require('fs');

const servicePath = 'src/app/services/language.service.ts';
let code = fs.readFileSync(servicePath, 'utf8');

const popupEntries = {
  'APEX COMMAND HQ': 'शीर्ष कमान मुख्यालय',
  'Units Active': 'सक्रिय इकाइयां',
  'Avg DOS': 'औसत आपूर्ति दिवस',
  'AOR:': 'जिम्मेदारी का क्षेत्र (AOR):',
  'GPS Telemetry Connected': 'GPS टेलीमेट्री कनेक्टेड',
  'Glacial Weather Alert': 'हिमनद मौसम अलर्ट',
  'Mountain Frost Advisory': 'पर्वतीय पाला सलाह',
  'AVALANCHE WARNING GRADE 4': 'हिमस्खलन चेतावनी ग्रेड 4',
  'Heavy Snow Drifts (Reroute Active)': 'भारी बर्फ के ढेर (पुनर्निर्देशन सक्रिय)',
  'Siachen - DBO Highway: -34°C Blizzard Cold Wave': 'सियाचिन - DBO राजमार्ग: -34°C बर्फीला तूफान शीत लहर',
  'Tawang High Altitude Axis': 'तवांग उच्च तुंगता अक्ष',
  'Zojila Pass - Heavy Snow Drifts (Reroute Active)': 'ज़ोजिला दर्रा - भारी बर्फ के ढेर (पुनर्निर्देशन सक्रिय)',
  'Remediation cryptographically authorized & synced to PostgreSQL DB Ledger': 'उपचार को क्रिप्टोग्राफ़िक रूप से अधिकृत किया गया एवं PostgreSQL DB लेज़र में सिंक किया गया',
  'Suggested action dispatched.': 'सुझाई गई कार्रवाई प्रेषित की गई।',
  'Tactical Mitigation Authorized: C-130J sorties dispatched & reserve buffer released with ASCON signature.': 'सामरिक शमन अधिकृत: C-130J सॉर्टियां प्रेषित एवं ASCON हस्ताक्षर के साथ आरक्षित बफर जारी किया गया।',
  'Pre-Winter Stocking Buffer authorized for': 'शीतकाल पूर्व भंडारण बफर इसके लिए अधिकृत किया गया:'
};

const startIndex = code.indexOf('export const DASHBOARD_TRANSLATIONS: Record<string, string> = {');
const endMatch = code.substring(startIndex).match(/\r?\n\};\r?\n\r?\n@Injectable\(/);
const endIndex = startIndex + endMatch.index;
const existingBlock = code.substring(startIndex, endIndex);

const toAdd = [];
for (const [k, v] of Object.entries(popupEntries)) {
  const escK = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (!existingBlock.includes(`'${escK}':`)) {
    toAdd.push(`  '${escK}': '${escV}',`);
  }
}

console.log('Adding', toAdd.length, 'popup entries');
if (toAdd.length > 0) {
  code = code.substring(0, endIndex) + '\n' + toAdd.join('\n') + code.substring(endIndex);
  fs.writeFileSync(servicePath, code, 'utf8');
  console.log('Updated successfully');
}
