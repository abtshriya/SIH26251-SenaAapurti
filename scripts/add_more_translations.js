const fs = require('fs');

const newTranslations = {
  "+10 Days": "+10 दिन",
  "+12d (74k)": "+12 दिन (74k)",
  "+18% Winter Surge": "+18% शीतकालीन वृद्धि",
  "+20 Days": "+20 दिन",
  "+20d (84k)": "+20 दिन (84k)",
  "+24% High-Altitude Wear": "+24% उच्च-तुंगता घिसाव",
  "+30 Days": "+30 दिन",
  "+35% Extreme Cold Surge": "+35% अत्यधिक शीत लहर वृद्धि",
  "-- AI Predicted Demand": "-- AI अनुमानित मांग",
  "-10 Days": "-10 दिन",
  "-15 Days": "-15 दिन",
  "-5 Days": "-5 दिन",
  "1 IMMEDIATE": "1 तत्काल",
  "10,000 ITERATIONS": "10,000 पुनरावृत्तियां",
  "100% OK": "100% ठीक",
  "100k": "100k",
  "12 Routes": "12 मार्ग",
  "155mm Charge Systems at Kargil:": "कारगिल में 155 मिमी चार्ज सिस्टम:",
  "18 Items": "18 वस्तुएं",
  "180 DOS": "180 आपूर्ति दिवस",
  "20k": "20k",
  "224 ABOD Panagarh (Eastern Strike Reserve)": "224 एबीओडी पानागढ़ (पूर्वी स्ट्राइक रिजर्व)",
  "26 DOS": "26 आपूर्ति दिवस",
  "3 Nodes": "3 नोड्स",
  "34 Days Buffer Nominal": "34 दिन सामान्य बफर",
  "4.2M+": "4.2M+",
  "40k": "40k",
  "42 DOF": "42 आपूर्ति दिवस (DOF)",
  "42 Items": "42 वस्तुएं",
  "42 km/h • 34.2819°N, 75.4812°E (ASCON Ping 12ms)": "42 किमी/घंटा • 34.2819°N, 75.4812°E (ASCON पिंग 12ms)",
  "51,200 L/Day": "51,200 लीटर/दिन",
  "60k": "60k",
  "62 DOS": "62 आपूर्ति दिवस",
  "64 Items": "64 वस्तुएं",
  "80k": "80k",
  "92% CONFIDENCE": "92% विश्वास",
  "92.4% PROBABILITY": "92.4% संभावना",
  "95% Confidence Band (±10%)": "95% विश्वास बैंड (±10%)",
  "98.4% (R²=0.982)": "98.4% (R²=0.982)",
  "AFFECTED COMMODITY / MATERIEL:": "प्रभावित वस्तु / सामग्री:",
  "AI Engine identified surplus Class III fuel at Western Command available for transfer to Northern forward nodes.": "AI इंजन ने पश्चिमी कमान में अधिशेष वर्ग III ईंधन की पहचान की है जो उत्तरी अग्रिम चौकियों में स्थानांतरण हेतु उपलब्ध है।",
  "AI Predictive Projection (Next 30 Days)": "AI भविष्य कहनेवाला प्रक्षेपण (अगले 30 दिन)",
  "AI STRATEGIC MITIGATION PROTOCOL": "AI सामरिक शमन प्रोटोकॉल",
  "AI-derived predictive vulnerability, days of supply & remediation protocol": "AI-व्युत्पन्न पूर्वानुमान भेद्यता, आपूर्ति दिवस एवं शमन प्रोटोकॉल",
  "ALGORITHM": "एल्गोरिदम",
  "ARIMA-LSTM ENSEMBLE": "ARIMA-LSTM एन्सेम्बल",
  "ARIMA-LSTM ENSEMBLE (15-YR TELEMETRY)": "ARIMA-LSTM एन्सेम्बल (15-वर्षीय टेलीमेट्री)",
  "ARIMA-LSTM HYBRID V3.2": "ARIMA-LSTM हाइब्रिड V3.2",
  "ASCON SECURE V4.8": "ASCON सुरक्षित V4.8",
  "ASCON-128 AUTH": "ASCON-128 प्रमाणीकरण",
  "AUTOMATED PROTOCOL READY": "स्वचालित प्रोटोकॉल तैयार",
  "Accelerated wartime ammunition burn & arctic heating fuel depletion": "युद्धकालीन त्वरित गोला-बारूद खपत एवं आर्कटिक हीटिंग ईंधन रिक्तीकरण",
  "Actions": "कार्रवाई",
  "Ammunition & Munitions (Class V)": "गोला-बारूद एवं युद्ध सामग्री (वर्ग V)",
  "Andaman & Nicobar Command (ANC Tri-Service)": "अंडमान और निकोबार कमान (ANC त्रि-सेवा)",
  "Andaman & Nicobar Command (ANC)": "अंडमान और निकोबार कमान (ANC)",
  "Army Training Command (ARTRAC - Shimla)": "सेना प्रशिक्षण कमान (ARTRAC - शिमला)",
  "Army Training Command (ARTRAC)": "सेना प्रशिक्षण कमान (ARTRAC)",
  "Authorize Recommended Action": "अनुशंसित कार्रवाई अधिकृत करें",
  "Available Days of Supply:": "उपलब्ध आपूर्ति दिवस:",
  "Avg Baseline:": "औसत आधाररेखा:",
  "BASELINE": "आधाररेखा",
  "Base": "बेस",
  "Before vs After Stress Posture:": "तनाव से पहले बनाम बाद की स्थिति:",
  "COD Agra (Central Command - Air Drop Reserve)": "COD आगरा (मध्य कमान - एयर ड्रॉप रिजर्व)",
  "COD Bhatinda (South Western Command Armoured Buffer)": "COD बठिंडा (दक्षिण पश्चिमी कमान बख्तरबंद बफर)",
  "COD Delhi Cantt (Integrated Army HQ Depot)": "COD दिल्ली कैंट (एकीकृत सेना मुख्यालय डिपो)",
  "COD Jabalpur (Munitions & Fighting Vehicle Depot)": "COD जबलपुर (गोला-बारूद एवं लड़ाकू वाहन डिपो)",
  "COD Kandivli / Mumbai (Southern Command Maritime Link)": "COD कांदिवली / मुंबई (दक्षिणी कमान समुद्री लिंक)",
  "COD Narangi / Guwahati (Eastern Command Depot)": "COD नारंगी / गुवाहाटी (पूर्वी कमान डिपो)",
  "COD Pathankot (Northern Command - 21 Base Depot)": "COD पठानकोट (उत्तरी कमान - 21 बेस डिपो)",
  "COD Udhampur (Northern Command Strategic Hub)": "COD उधमपुर (उत्तरी कमान सामरिक केंद्र)",
  "CONFIDENCE": "विश्वास स्तर",
  "Callsign: GARUDA-01": "कॉलसाइन: GARUDA-01",
  "Callsign: HIMALAYA-9": "कॉलसाइन: HIMALAYA-9",
  "Cargo Specification:": "कार्गो विनिर्देश:",
  "Central Command (Surya Command - UP, MP, Uttarakhand)": "मध्य कमान (सूर्य कमान - यूपी, एमपी, उत्तराखंड)",
  "Central Command (Surya Command)": "मध्य कमान (सूर्य कमान)",
  "Class I (Rations & Extreme Cold Subsistence)": "वर्ग I (राशन एवं अत्यधिक शीत जीवन निर्वाह)",
  "Class I (Rations): 180 DOS (Optimal)": "वर्ग I (राशन): 180 आपूर्ति दिवस (इष्टतम)",
  "Class I to IX": "वर्ग I से IX",
  "Class II (Extreme Cold Weather Clothing - ECC)": "वर्ग II (अत्यधिक शीतकालीन वस्त्र - ECC)",
  "Class III (POL): 16,200 Litres (Adequate)": "वर्ग III (POL): 16,200 लीटर (पर्याप्त)",
  "Class III (Sub-Zero POL & Arctic Aviation Fuel)": "वर्ग III (शून्य-नीचे POL एवं आर्कटिक विमानन ईंधन)",
  "Class IX (Spares): 4 Sets Pending Receipt": "वर्ग IX (स्पेयर): 4 सेट प्राप्ति लंबित",
  "Class IX (T-90, BMP & High-Mobility Vehicle Spares)": "वर्ग IX (T-90, BMP एवं उच्च-गतिशीलता वाहन स्पेयर)",
  "Class V (Ammunition): 94.5% Unit Basic Load": "वर्ग V (गोला-बारूद): 94.5% यूनिट बेसिक लोड",
  "Class V (Ammunition, Artillery Shells & ATGMs)": "वर्ग V (गोला-बारूद, तोपखाने के गोले एवं ATGM)",
  "Class VIII (High-Altitude Medical & Oxygen Cannisters)": "वर्ग VIII (उच्च-तुंगता चिकित्सा एवं ऑक्सीजन सिलेंडर)",
  "Convoy GARUDA-01 currently rolling with 320 Tonnes POL. ETA 4 hrs 15 mins. Temperature forecast -18°C with snow advisory.": "काफिला GARUDA-01 वर्तमान में 320 टन POL के साथ गतिमान। आगमन अनुमान 4 घंटे 15 मिनट। बर्फबारी सलाह के साथ -18°C तापमान का पूर्वानुमान।",
  "Critical (&lt;20 DOS)": "संकटपूर्ण (<20 आपूर्ति दिवस)",
  "Critical (<20 DOS)": "संकटपूर्ण (<20 आपूर्ति दिवस)",
  "Critical (1)": "संकटपूर्ण (1)",
  "Delay: +1.2 hrs • Risk Mitigated": "विलंब: +1.2 घंटे • जोखिम शमित",
  "Demand Breakdown by Class": "वर्ग अनुसार मांग विवरण",
  "Depot: COD Jodhpur": "डिपो: COD जोधपुर",
  "Detected Demand Anomalies": "पहचानी गई मांग विसंगतियां",
  "EXPLAINED CONSUMPTION SURGE": "स्पष्ट खपत वृद्धि",
  "Eastern Command (Veerta Aur Shaurya - Sikkim, Arunachal)": "पूर्वी कमान (वीरता और शौर्य - सिक्किम, अरुणाचल)",
  "Eastern Command (Veerta Aur Shaurya)": "पूर्वी कमान (वीरता और शौर्य)",
  "Emergency IAF Airlift Sorties (C-17 & AN-32)": "आपातकालीन IAF एयरलिफ्ट सॉर्टियां (C-17 एवं AN-32)",
  "FALLBACK CONTINGENCY:": "आकस्मिक फॉलबैक योजना:",
  "FOD Leh (High-Altitude Forward Ordnance Depot)": "FOD लेह (उच्च-तुंगता अग्रिम आयुध डिपो)",
  "Food & Combat Rations (Class I)": "खाद्य एवं युद्ध राशन (वर्ग I)",
  "Forward Pickets & Depots": "अग्रिम चौकियां एवं डिपो",
  "Fuel & Sub-Zero POL (Class III)": "ईंधन एवं शून्य-नीचे POL (वर्ग III)",
  "HIGH PRIORITY DEFENSE DIRECTIVE": "उच्च प्राथमिकता रक्षा निर्देश",
  "High Priority (1)": "उच्च प्राथमिकता (1)",
  "Historical Actuals (ASCON Sensor Feed)": "ऐतिहासिक वास्तविक आंकड़े (ASCON सेंसर फीड)",
  "Integrated Defence HQ / Army HQ": "एकीकृत रक्षा मुख्यालय / सेना मुख्यालय",
  "Integrated Defence HQ / Army HQ (New Delhi)": "एकीकृत रक्षा मुख्यालय / सेना मुख्यालय (नई दिल्ली)",
  "Inventory Pre-Reduction": "इन्वेंटरी पूर्व-कटौती",
  "KEY CONTRIBUTING FACTORS": "प्रमुख योगदान कारक",
  "MONTE CARLO": "मोंटे कार्लो",
  "Medical & Special": "चिकित्सा एवं विशेष सामग्री",
  "Medium Priority (1)": "मध्यम प्राथमिकता (1)",
  "NEURAL NETWORK REASONING": "न्यूरल नेटवर्क तर्क",
  "NEURAL WARGAME ENGINE TELEMETRY": "न्यूरल युद्ध-खेल इंजन टेलीमेट्री",
  "Normal": "सामान्य",
  "Normal Baseline": "सामान्य आधाररेखा",
  "Northern Command (Param Utkarsh - J&K, Ladakh)": "उत्तरी कमान (परम उत्कर्ष - जम्मू-कश्मीर, लद्दाख)",
  "Northern Command (Param Utkarsh)": "उत्तरी कमान (परम उत्कर्ष)",
  "ONLINE • DEFCON 1": "ऑनलाइन • DEFCON 1",
  "OPERATIONAL LOCATION & THEATER AXIS": "परिचालन स्थान एवं थिएटर अक्ष",
  "PROJECTION COMPLETE": "प्रक्षेपण पूर्ण",
  "Peak": "शिखर",
  "Peak (86.2k)": "शिखर (86.2k)",
  "Pre-Winter Stocking Complete": "शीतकाल पूर्व भंडारण पूर्ण",
  "Predictive Likelihood": "पूर्वानुमानित संभावना",
  "Priority": "प्राथमिकता",
  "Projected Supply": "प्रक्षेपित आपूर्ति",
  "REQUIRED BUFFER:": "आवश्यक बफर:",
  "Recommended: Preposition extra 12,000L to avoid picket tank exhaustion.": "अनुशंसित: चौकी टैंक खाली होने से बचाने हेतु अतिरिक्त 12,000 लीटर पहले से तैनात करें।",
  "Review Needed (&lt; 96%)": "समीक्षा आवश्यक (< 96%)",
  "Review Needed (< 96%)": "समीक्षा आवश्यक (< 96%)",
  "R² = 0.982 • LSTM Ensemble": "R² = 0.982 • LSTM एन्सेम्बल",
  "SIMULATION": "सिमुलेशन",
  "STATUS": "स्थिति",
  "STRATEGIC IMPACT:": "सामरिक प्रभाव:",
  "SUDDEN INCREASE DETECTED": "अचानक वृद्धि पहचानी गई",
  "Scheduled battery fire exercises increased demand over 72 hours. Replenishment pipeline active.": "निर्धारित तोपखाना अभ्यास से 72 घंटों में मांग बढ़ी। पुनःपूर्ति पाइपलाइन सक्रिय है।",
  "Siachen - DBO Highway": "सियाचिन - DBO राजमार्ग",
  "Simulates pre-strike buffer depletion or enemy convoy interdiction": "हमले से पूर्व बफर रिक्तीकरण या शत्रु काफिला अवरोध का अनुकरण करता है",
  "South Western Command (Sapta Shakti - Jaipur Axis)": "दक्षिण पश्चिमी कमान (सप्त शक्ति - जयपुर अक्ष)",
  "South Western Command (Sapta Shakti)": "दक्षिण पश्चिमी कमान (सप्त शक्ति)",
  "Southern Command (Sarvada Vijayee - Peninsular)": "दक्षिणी कमान (सर्वदा विजयी - प्रायद्वीपीय)",
  "Southern Command (Sarvada Vijayee)": "दक्षिणी कमान (सर्वदा विजयी)",
  "Speed: 38 km/h • GPS Link 100%": "गति: 38 किमी/घंटा • GPS लिंक 100%",
  "Stable (Tactical Baseline)": "स्थिर (सामरिक आधाररेखा)",
  "Status": "स्थिति",
  "Stockout Risk Level": "स्टॉकआउट जोखिम स्तर",
  "Strategic Reserve:": "सामरिक आरक्षित भंडार:",
  "Sub-Zero HSD Consumption in Siachen Sector:": "सियाचिन सेक्टर में शून्य-नीचे HSD खपत:",
  "TARGET FORMATION:": "लक्षित फॉर्मेशन:",
  "TELEMETRY FLAG": "टेलीमेट्री फ्लैग",
  "TODAY": "आज",
  "Target Depot": "लक्षित डिपो",
  "Task 2x Strategic Air Command heavy transport squadrons (+6 Days buffer stability)": "2x सामरिक वायु कमान भारी परिवहन स्क्वाड्रन तैनात करें (+6 दिन बफर स्थिरता)",
  "Telemetry logged +38% burn rate due to auxiliary shelter heaters running continuously at -28°C.": "-28°C पर सहायक आश्रय हीटरों के लगातार चलने के कारण टेलीमेट्री ने +38% खपत दर दर्ज की।",
  "Time to Shortfall": "कमी होने में शेष समय",
  "Trained on 15 years historical ASCON telemetry + meteorological elevation models": "15 वर्षों के ऐतिहासिक ASCON टेलीमेट्री + मौसम संबंधी ऊंचाई मॉडलों पर प्रशिक्षित",
  "Transmit Issue Order": "जारी आदेश प्रेषित करें",
  "Under Simulation Stress": "सिमुलेशन तनाव के तहत",
  "VS": "बनाम",
  "Vehicle & Armor Spares (Class IX)": "वाहन एवं बख्तरबंद कलपुर्जे (वर्ग IX)",
  "Voucher #DGOS-8841-A": "वाउचर #DGOS-8841-A",
  "Western Command (Sarvada Vijayi - Punjab, Rajasthan)": "पश्चिमी कमान (सर्वदा विजयी - पंजाब, राजस्थान)",
  "Western Command (Sarvada Vijayi)": "पश्चिमी कमान (सर्वदा विजयी)",
  "Without IAF / Depot surge": "IAF / डिपो वृद्धि के बिना",
  "Zero-Resupply Axis": "शून्य-पुनःपूर्ति अक्ष",
  "e.g. 5 GORKHA RIFLES": "उदा. 5 गोरखा राइफल्स",
  "e.g. Col R. Thapa": "उदा. कर्नल आर. थापा",
  "e.g. Drass Forward Ridge": "उदा. द्रास फॉरवर्ड रिज",
  "e.g. UN-05GR-KRG": "उदा. UN-05GR-KRG",
  "░ 95% Confidence Interval": "░ 95% विश्वास अंतराल",
  "● Stockout Risk (&lt; 10 Days)": "● स्टॉकआउट जोखिम (< 10 दिन)",
  "✓ Authorized &amp; Synced in DB": "✓ अधिकृत एवं डेटाबेस में सिंक",
  "All Arms & Services": "सभी शाखाएं एवं सेवाएं",
  "All Levels": "सभी स्तर",
  "Optimal (≥ 96%)": "इष्टतम (≥ 96%)",
  "All Commands (9 Theaters)": "सभी कमान (9 थिएटर)"
};

const servicePath = 'src/app/services/language.service.ts';
let code = fs.readFileSync(servicePath, 'utf8');

// Find insertion point before closing bracket of DASHBOARD_TRANSLATIONS
const marker = 'export const DASHBOARD_TRANSLATIONS: Record<string, string> = {';
const startIndex = code.indexOf(marker);
if (startIndex === -1) {
  console.error('Could not find DASHBOARD_TRANSLATIONS marker');
  process.exit(1);
}

// Find closing brace of DASHBOARD_TRANSLATIONS
const endMatch = code.substring(startIndex).match(/\r?\n\};\r?\n\r?\n@Injectable\(/);
if (!endMatch) {
  console.error('Could not find closing bracket of DASHBOARD_TRANSLATIONS');
  process.exit(1);
}
const endIndex = startIndex + endMatch.index;

const existingBlock = code.substring(startIndex, endIndex);

// Build entries that don't already exist
const entriesToAdd = [];
for (const [k, v] of Object.entries(newTranslations)) {
  const escapedKey = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escapedVal = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const testPattern = `'${escapedKey}':`;
  if (!existingBlock.includes(testPattern)) {
    entriesToAdd.push(`  '${escapedKey}': '${escapedVal}',`);
  }
}

console.log('Entries to add:', entriesToAdd.length);

if (entriesToAdd.length > 0) {
  const insertion = '\n' + entriesToAdd.join('\n');
  code = code.substring(0, endIndex) + insertion + code.substring(endIndex);
  fs.writeFileSync(servicePath, code, 'utf8');
  console.log('Successfully updated language.service.ts with additional translations');
} else {
  console.log('No new entries to add');
}
