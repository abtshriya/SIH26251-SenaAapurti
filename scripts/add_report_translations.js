const fs = require('fs');

const newEntries = {
  'Central Depot / Base': 'केंद्रीय डिपो / बेस',
  'Supply Class / SKU': 'आपूर्ति वर्ग / SKU',
  'On-Hand Stock': 'उपलब्ध स्टॉक',
  'Safety Buffer': 'सुरक्षा बफर',
  'Stock Status': 'स्टॉक स्थिति',
  'Audit Clearance': 'ऑडिट अनापत्ति',
  'Convoy Callsign': 'काफिला कॉलसाइन',
  'Strategic Axis': 'सामरिक अक्ष',
  'Cargo Class': 'कार्गो वर्ग',
  'Transit Punctuality': 'पारगमन समयबद्धता',
  'Supply Discipline': 'आपूर्ति अनुशासन',
  'Baseline Demand': 'आधारभूत मांग',
  'Projected Surge': 'प्रक्षेपित वृद्धि',
  'AI Confidence': 'AI विश्वास',
  'Formation / Unit': 'फॉर्मेशन / यूनिट',
  'Corps / Sector': 'कोर / सेक्टर',
  'Combat Posture': 'युद्ध मुद्रा',
  'Comms Security': 'संचार सुरक्षा',
  'Pass & Elevation': 'दर्रा एवं ऊंचाई',
  'Transit Status': 'पारगमन स्थिति',
  'Daily Capacity': 'दैनिक क्षमता',
  'Hazard Risk': 'खतरा जोखिम',
  'Bypass Route': 'बाईपास मार्ग',
  'Station / Pass': 'स्टेशन / दर्रा',
  'Snow Accumulation': 'बर्फ संचय',
  'Wind & Gale': 'हवा एवं तूफान',
  'Accessibility': 'पहुंच योग्यता',
  'Critical Sector': 'गंभीर सेक्टर',
  'Vulnerable SKU': 'संवेदनशील SKU',
  'Reserve DOS': 'आरक्षित आपूर्ति दिवस',
  'Depletion Window': 'रिक्तीकरण अवधि',
  'Impact Level': 'प्रभाव स्तर',
  'Mitigation Protocol': 'शमन प्रोटोकॉल',
  'Receiving Unit': 'प्राप्तकर्ता यूनिट',
  'Material Transferred': 'हस्तांतरित सामग्री',
  'Savings Estimate': 'बचत अनुमान',
  'Voucher Ref': 'वाउचर संदर्भ',
  'Total Formations': 'कुल फॉर्मेशन',
  'Avg Readiness': 'औसत तत्परता',
  'Audit Status': 'ऑडिट स्थिति',
  'Audit Window:': 'ऑडिट विंडो:',
  'AUDIT WINDOW:': 'ऑडिट विंडो:',
  'All Audited': 'सभी ऑडिट पूर्ण',
  'COMBAT READY': 'युद्ध हेतु तैयार',
  'Real-time ASCON military telemetry feeds refreshed across all 7 Operational Commands.': 'सभी 7 परिचालन कमानों में रीयल-टाइम ASCON सैन्य टेलीमेट्री फीड रीफ्रेश किए गए।',
  'Tactical Mitigation Authorized: C-130J sorties dispatched & reserve buffer released with ASCON signature.': 'सामरिक शमन अधिकृत: C-130J सॉर्टियां प्रेषित एवं ASCON हस्ताक्षर के साथ आरक्षित बफर जारी किया गया।',
  'Remediation cryptographically authorized & synced to PostgreSQL DB Ledger': 'उपचार क्रिप्टोग्राफ़िक रूप से अधिकृत एवं PostgreSQL DB लेज़र में सिंक किया गया',
  'Suggested action dispatched.': 'सुझाई गई कार्रवाई प्रेषित।',
  '✓ Inter-Depot Transfer Authorized: 120,000L POL dispatched to Udhampur.': '✓ अंतर-डिपो स्थानांतरण अधिकृत: 120,000L POL उधमपुर को प्रेषित।',
  '✓ Strategic Replenishment Requisition Order Dispatched to COD Pathankot.': '✓ सामरिक पुनःपूर्ति मांग आदेश COD पठानकोट को प्रेषित।',
  '✓ Emergency Reserve Buffer Released for': '✓ इसके लिए आपातकालीन आरक्षित बफर जारी किया गया:',
  'Stock Status restored to Adequate.': 'स्टॉक स्थिति को पर्याप्त के रूप में बहाल किया गया।',
  'Generating classified': 'वर्गीकृत तैयार किया जा रहा है:',
  'with official Ministry of Defence seals...': 'रक्षा मंत्रालय की आधिकारिक मुहरों के साथ...',
  '✓ Official Ministry of Defence': '✓ आधिकारिक रक्षा मंत्रालय',
  'statement downloaded': 'विवरण डाउनलोड किया गया',
  'Stamped with Ashok emblem, DGOS seal & PostgreSQL ledger block hash.': 'अशोक प्रतीक, DGOS मुहर एवं PostgreSQL लेज़र ब्लॉक हैश से मुद्रित।',
  'Zojila Pass Avalanche & Extreme Cold Wave (Ladakh Sector)': 'ज़ोजिला दर्रा हिमस्खलन एवं अत्यधिक शीत लहर (लद्दाख सेक्टर)',
  'Sela Tunnel Snow Drifts & LAC Heavy Artillery Escalation (Eastern Sector)': 'सेला सुरंग हिम बहाव एवं LAC भारी तोपखाना विस्तार (पूर्वी सेक्टर)',
  'Western Desert Sandstorm & Heavy Armor Exercises (Pokhran Axis)': 'पश्चिमी रेगिस्तान रेतीला तूफान एवं भारी बख्तरबंद अभ्यास (पोखरण अक्ष)',
  'High-Altitude Siachen Forward Picket Replenishment (Glacier Sector)': 'उच्च-तुंगता सियाचिन अग्रिम चौकी पुनःपूर्ति (ग्लेशियर सेक्टर)',
  'Siliguri Strategic Chokepoint Railway Disruption (Chicken Neck)': 'सिलीगुड़ी सामरिक अवरोध बिंदु रेलवे व्यवधान (चिकन नेक)',
  'Monsoon Landslide & High-Altitude Bridge Washout (Joshimath Axis)': 'मानसून भूस्खलन एवं उच्च-तुंगता पुल विनाश (जोशीमठ अक्ष)',
  'Simultaneous Dual-Theater Defense Mobilization (Northern + Eastern Commands)': 'एक साथ दोहरा-थिएटर रक्षा लामबंदी (उत्तरी + पूर्वी कमान)',
  'Convoy Telematics:': 'काफिला टेलीमैटिक्स:',
  'DELTA:': 'परिवर्तन (DELTA):',
  'POSTURE SHIFT': 'स्थिति परिवर्तन',
  'Escort Commander:': 'एस्कॉर्ट कमांडर:'
};

const servicePath = 'src/app/services/language.service.ts';
let code = fs.readFileSync(servicePath, 'utf8');
const startIndex = code.indexOf('export const DASHBOARD_TRANSLATIONS: Record<string, string> = {');
const endMatch = code.substring(startIndex).match(/\r?\n\};\r?\n\r?\n@Injectable\(/);
const endIndex = startIndex + endMatch.index;

const existingBlock = code.substring(startIndex, endIndex);
const toAdd = [];
for (const [k, v] of Object.entries(newEntries)) {
  const escK = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (!existingBlock.includes(`'${escK}':`)) {
    toAdd.push(`  '${escK}': '${escV}',`);
  }
}

console.log('Adding', toAdd.length, 'entries');
if (toAdd.length > 0) {
  code = code.substring(0, endIndex) + '\n' + toAdd.join('\n') + code.substring(endIndex);
  fs.writeFileSync(servicePath, code, 'utf8');
  console.log('Updated successfully');
}
