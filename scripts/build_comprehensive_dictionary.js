const fs = require('fs');

const master = JSON.parse(fs.readFileSync('scripts/master_merged_translations.json', 'utf8'));
const stillMissing = JSON.parse(fs.readFileSync('scripts/still_missing_user_facing.json', 'utf8'));

// Common military dictionary fragments and patterns
const translationsMap = {};

// Helper to translate or transliterate standard military expressions
function autoTranslate(s) {
  const trimmed = s.trim();
  if (master[trimmed]) return master[trimmed];

  // Specific phrases
  const rules = [
    // Ranks & titles
    [/^General\s+(.*)$/i, 'जनरल $1'],
    [/^Lt\s*Gen(?:eral)?\s+(.*)$/i, 'लेफ्टिनेंट जनरल $1'],
    [/^Maj\s*Gen(?:eral)?\s+(.*)$/i, 'मेजर जनरल $1'],
    [/^Brig(?:adier)?\s+(.*)$/i, 'ब्रिगेडियर $1'],
    [/^Col(?:onel)?\s+(.*)$/i, 'कर्नल $1'],
    [/^Lt\s*Col(?:onel)?\s+(.*)$/i, 'लेफ्टिनेंट कर्नल $1'],
    [/^Maj(?:or)?\s+(.*)$/i, 'मेजर $1'],
    [/^Capt(?:ain)?\s+(.*)$/i, 'कैप्टन $1'],
    [/^Sub(?:edar)?\s+Major\s+(.*)$/i, 'सूबेदार मेजर $1'],
    [/^Sub(?:edar)?\s+(.*)$/i, 'सूबेदार $1'],
    [/^Nb\s+Sub(?:edar)?\s+(.*)$/i, 'नायब सूबेदार $1'],
    [/^Hav(?:ildar)?\s+(.*)$/i, 'हवलदार $1'],
    [/^Naik\s+(.*)$/i, 'नायक $1'],
    [/^Sepoy\s+(.*)$/i, 'सिपाही $1'],

    // Common UI buttons and actions
    [/^A\+$/, 'A+'],
    [/^A\-$/, 'A-'],
    [/^ACTIVE$/, 'सक्रिय'],
    [/^ALL$/, 'सभी'],
    [/^ALL CLEAR$/, 'सभी सुरक्षित'],
    [/^ACTIONS$/, 'कार्रवाई'],
    [/^STATUS$/, 'स्थिति'],
    [/^CRITICAL$/, 'अति-गंभीर'],
    [/^HIGH$/, 'उच्च'],
    [/^MEDIUM$/, 'मध्यम'],
    [/^LOW$/, 'निम्न'],
    [/^ADEQUATE$/, 'पर्याप्त'],
    [/^HEALTHY$/, 'स्वस्थ'],
    [/^WARNING$/, 'चेतावनी'],
    [/^SURPLUS$/, 'अधिशेष'],
    [/^DEPLETED$/, 'क्षीण'],
    [/^ROUTINE$/, 'नियमित'],
    [/^AUTHORIZED$/, 'अधिकृत'],
    [/^REJECTED$/, 'अस्वीकृत'],
    [/^PENDING$/, 'लंबित'],
    [/^DELIVERED$/, 'वितरित'],
    [/^IN-TRANSIT$/, 'मार्ग में'],

    // Parenthesized numbers like "All Passes (6)"
    [/^All Passes \((.*)\)$/i, 'सभी दर्रे ($1)'],
    [/^All Cargo \((.*)\)$/i, 'सभी कार्गो ($1)'],
    [/^All Commands \((.*)\)$/i, 'सभी कमान ($1)'],
    [/^All Portals \((.*)\)$/i, 'सभी पोर्टल ($1)'],
    [/^All Advisories \((.*)\)$/i, 'सभी परामर्श ($1)'],
    [/^ACTIVE CONVOYS \((.*)\)$/i, 'सक्रिय काफिले ($1)'],
    [/^Critical Logistics Alerts \((.*)\)$/i, 'गंभीर रसद अलर्ट ($1)'],
    [/^ACTIVE CONVOYS$/i, 'सक्रिय काफिले'],
    [/^ACTIVE DUTY • DEFCON 2$/i, 'सक्रिय ड्यूटी • डेफकॉन 2'],
    [/^ACTIVE LOGISTICS$/i, 'सक्रिय रसद'],
    [/^ADVISORY STATUS:$/i, 'सलाहकार स्थिति:'],
    [/^AFFECTED UNITS$/i, 'प्रभावित इकाइयां'],
    [/^AHQ$/i, 'सेना मुख्यालय (AHQ)'],
    [/^ANC$/i, 'एएनसी (ANC - अंडमान और निकोबार कमान)'],
    [/^ANC Tri-Service$/i, 'एएनसी त्रि-सेवा कमान'],
    [/^APEX FORMATION$/i, 'शीर्ष फॉर्मेशन'],
    [/^ASSIGNED FORMATION$/i, 'सौंपी गई फॉर्मेशन'],
    [/^ATAL TUNNEL OPEN$/i, 'अटल सुरंग खुली है'],
    [/^ATGM Missiles:$/i, 'एटीजीएम मिसाइलें:'],
    [/^AUTHORIZING OFFICER$/i, 'प्राधिकरण अधिकारी'],
    [/^AVAILABLE & VERIFIED$/i, 'उपलब्ध एवं सत्यापित'],
    [/^AXIS LOAD$/i, 'अक्ष भार'],
    [/^ALL-WEATHER 4-LANE$/i, 'सर्व-मौसम 4-लेन'],
    [/^ALL-WEATHER TRANSIT$/i, 'सर्व-मौसम पारगमन'],
    [/^ALT: (.*)$/i, 'ऊंचाई: $1'],

    // Cantonments and stations
    [/^(.*)\s+Cantonment,\s*(.*)$/i, '$1 छावनी, $2'],
    [/^(.*)\s+Cantonment$/i, '$1 छावनी'],
    [/^(.*)\s+Military Station,\s*(.*)$/i, '$1 सैन्य स्टेशन, $2'],
    [/^(.*)\s+Military Station$/i, '$1 सैन्य स्टेशन'],
    [/^(.*)\s+Garrison$/i, '$1 गैरिसन'],

    // Formations
    [/^(.*)\s+Corps$/i, '$1 कोर'],
    [/^(.*)\s+Division$/i, '$1 डिवीजन'],
    [/^(.*)\s+Brigade$/i, '$1 ब्रिगेड'],
    [/^(.*)\s+Regiment$/i, '$1 रेजिमेंट'],
    [/^(.*)\s+Battalion$/i, '$1 बटालियन'],
    [/^(.*)\s+Command$/i, '$1 कमान'],

    // Unit / logistics terms
    [/^Days of Supply$/i, 'आपूर्ति दिवस (DOS)'],
    [/^Days of Supply \(DOS\)$/i, 'आपूर्ति दिवस (DOS)'],
    [/^Central Ordnance Depot\s+(.*)$/i, 'केंद्रीय आयुध डिपो $1'],
    [/^Central Ordnance Depot$/i, 'केंद्रीय आयुध डिपो'],
    [/^Forward Supply Depot\s+(.*)$/i, 'अग्रिम आपूर्ति डिपो $1'],
    [/^Forward Supply Depot$/i, 'अग्रिम आपूर्ति डिपो'],
    [/^Field Ammunition Depot$/i, 'फील्ड गोला-बारूद डिपो'],
    [/^Ammunition Depot$/i, 'गोला-बारूद डिपो'],
    [/^Safety Stock$/i, 'सुरक्षा स्टॉक'],
    [/^Re-order Threshold$/i, 'पुनः आदेश सीमा'],
    [/^Re-Order Threshold$/i, 'पुनः आदेश सीमा'],
    [/^Re-Order Level$/i, 'पुनः आदेश स्तर'],
    [/^Reorder Level$/i, 'पुनः आदेश स्तर'],
    [/^Reorder Threshold$/i, 'पुनः आदेश सीमा'],
    [/^Current Stock$/i, 'वर्तमान स्टॉक'],
    [/^Authorized Scale$/i, 'अधिकृत पैमाना'],
    [/^Deficit$/i, 'घाटा'],
    [/^Surplus$/i, 'अधिशेष'],
    [/^Depletion$/i, 'रिक्तीकरण'],
    [/^Burn Rate$/i, 'दैनिक खपत दर']
  ];

  for (const [re, rep] of rules) {
    if (re.test(trimmed)) {
      return trimmed.replace(re, rep);
    }
  }

  return null;
}

// Generate translations for stillMissing
let autoCount = 0;
for (const s of stillMissing) {
  const trans = autoTranslate(s);
  if (trans) {
    translationsMap[s] = trans;
    autoCount++;
  }
}

console.log('Automatically rule-translated:', autoCount);
console.log('Remaining needing specific translation:', stillMissing.length - autoCount);
fs.writeFileSync('scripts/rule_translations.json', JSON.stringify(translationsMap, null, 2), 'utf8');
