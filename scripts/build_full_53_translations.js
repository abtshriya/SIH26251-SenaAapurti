const fs = require('fs');

const units = JSON.parse(fs.readFileSync('scripts/parsed_53_units.json', 'utf8'));
const dict = { ...JSON.parse(fs.readFileSync('scripts/sena_targeted_translations.json', 'utf8')) };

function translateAltitude(str) {
  if (!str) return '';
  return str.replace(/\((\d+[\d,]*)\s*ft\)/gi, '($1 फीट)')
            .replace(/\((\d+[\d,]*)\s*feet\)/gi, '($1 फीट)');
}

// Full dictionary of translations for the 53 units and their locations/sectors
const unitTranslations = {
  // Northern Command
  'Leh, Ladakh': 'लेह, लद्दाख',
  'Eastern Ladakh / Shyok Axis (11,500 ft)': 'पूर्वी लद्दाख / श्योक अक्ष (11,500 फीट)',
  'Partapur / Siachen Base Camp, Ladakh': 'परतापुर / सियाचिन बेस कैंप, लद्दाख',
  'Saltoro Ridge & Highest Battlefield in the World (18,800 ft)': 'साल्टोरो रिज एवं विश्व का सबसे ऊंचा युद्धक्षेत्र (18,800 फीट)',
  'Dras / Kargil, Ladakh': 'द्रास / कारगिल, लद्दाख',
  'NH-1D Zojila-Kargil Defense Axis (10,800 ft)': 'एनएच-1डी ज़ोजिला-कारगिल रक्षा अक्ष (10,800 फीट)',
  'NH-1D Zojila-Kargil Defense Axis (18,800 ft)': 'एनएच-1डी ज़ोजिला-कारगिल रक्षा अक्ष (18,800 फीट)',
  'Chushul / Nyoma, Eastern Ladakh': 'चुशूल / न्योमा, पूर्वी लद्दाख',
  'Spanggur Gap & Pangong Tso South Bank (15,200 ft)': 'स्पंगुर गैप एवं पैंगोंग त्सो दक्षिणी तट (15,200 फीट)',
  'DS-DBO Road / Galwan River Axis, Ladakh': 'डीएस-डीबीओ रोड / गलवान नदी अक्ष, लद्दाख',
  'Galwan Valley & Sub-Sector North (14,000 ft)': 'गलवान घाटी एवं सब-सेक्टर उत्तर (14,000 फीट)',
  'Baramulla Cantonment, J&K': 'बारामूला छावनी, जम्मू एवं कश्मीर',
  'Baramulla & Uri Line of Control (LoC) Sector': 'बारामूला एवं उरी नियंत्रण रेखा (LoC) सेक्टर',
  'Kupwara / Chowkibal, J&K': 'कुपवाड़ा / चौकीबल, जम्मू एवं कश्मीर',
  'Shamshabari Ridge & Keran / Machhal LoC Sectors': 'शमशाबरी रिज एवं केरन / मच्छल नियंत्रण रेखा सेक्टर',
  'Rajouri Military Station, J&K': 'राजौरी सैन्य स्टेशन, जम्मू एवं कश्मीर',
  'Rajouri & Poonch Pir Panjal Sector (LoC)': 'राजौरी एवं पुंछ पीर पंजाल सेक्टर (नियंत्रण रेखा)',
  'Nagrota Cantonment, Jammu, J&K': 'नगरोटा छावनी, जम्मू, जम्मू एवं कश्मीर',
  'Jammu Plains & Chenab River Defense Sector': 'जम्मू मैदान एवं चिनाब नदी रक्षा सेक्टर',
  'Udhampur Military Station, J&K': 'उधमपुर सैन्य स्टेशन, जम्मू एवं कश्मीर',
  'HQ Northern Command Operational Core & NH-44 Grid': 'मुख्यालय उत्तरी कमान परिचालन कोर एवं एनएच-44 ग्रिड',
  'Ganderbal / Wular Lake, J&K': 'गांदरबल / वुलर झील, जम्मू एवं कश्मीर',
  'Kashmir Valley Counter-Terrorism Operations': 'कश्मीर घाटी आतंकवाद विरोधी अभियान',
  'Chatha / Satwari, Jammu': 'चट्ठा / सतवारी, जम्मू',
  'Jammu-Akhnoor Plains & Chicken Neck Sector': 'जम्मू-अखनूर मैदान एवं चिकन्स नेक सेक्टर',

  // Western Command
  'Chandimandir Cantonment, Panchkula, Haryana': 'चंडीमंदिर छावनी, पंचकूला, हरियाणा',
  'Western Theater Operational Direction Core': 'पश्चिमी थिएटर परिचालन निर्देशन कोर',
  'Ambala Cantonment, Haryana': 'अंबाला छावनी, हरियाणा',
  'GT Road Corridor & Strategic Strike Deployment': 'जीटी रोड गलियारा एवं सामरिक स्ट्राइक तैनाती',
  'Jalandhar Cantonment, Punjab': 'जालंधर छावनी, पंजाब',
  'Beas & Sutlej River Line Defense Axis': 'ब्यास एवं सतलुज नदी रेखा रक्षा अक्ष',
  'Pathankot Military Station, Punjab': 'पठानकोट सैन्य स्टेशन, पंजाब',
  'Ravi River Corridor & Shakargarh Bulge Axis': 'रावी नदी गलियारा एवं शकरगढ़ उभार अक्ष',
  'Mamun Cantonment, Pathankot, Punjab': 'मामून छावनी, पठानकोट, पंजाब',
  'Dhar Kalan Foothills & Jammu Railhead Link': 'धार कलां तलहटी एवं जम्मू रेलहेड लिंक',
  'Patiala Military Station, Punjab': 'पटियाला सैन्य स्टेशन, पंजाब',
  'Malwa Strategic Reserve & Southern Punjab Axis': 'मालवा सामरिक रिजर्व एवं दक्षिणी पंजाब अक्ष',
  'Ferozepur Cantonment, Punjab': 'फिरोजपुर छावनी, पंजाब',
  'Hussainiwala Border & Sutlej River Defense Line': 'हुसैनीवाला सीमा एवं सतलुज नदी रक्षा रेखा',
  'Amritsar Cantonment, Punjab': 'अमृतसर छावनी, पंजाब',
  'Attari-Wagah Border & Grand Trunk Defense Line': 'अटारी-वाघा सीमा एवं ग्रैंड ट्रंक रक्षा रेखा',

  // Eastern Command
  'Fort William, Kolkata, West Bengal': 'फोर्ट विलियम, कोलकाता, पश्चिम बंगाल',
  'Eastern Theater HQ & Siliguri Corridor Oversight': 'पूर्वी थिएटर मुख्यालय एवं सिलीगुड़ी गलियारा निगरानी',
  'Dimapur / Rangapahar, Nagaland': 'दीमापुर / रंगापहाड़, नागालैंड',
  'Nagaland, Manipur & Indo-Myanmar Border Corridor': 'नागालैंड, मणिपुर एवं भारत-म्यांमार सीमा गलियारा',
  'Tezpur Military Station, Assam': 'तेजपुर सैन्य स्टेशन, असम',
  'Brahmaputra North Bank & Kameng Footprint': 'ब्रह्मपुत्र उत्तरी तट एवं कामेंग पदचिह्न',
  'Tenga Valley / Bomdila, Arunachal Pradesh': 'तेंगा घाटी / बोमडिला, अरुणाचल प्रदेश',
  'Tawang Sector & Sela Tunnel Axis (13,700 ft)': 'तवांग सेक्टर एवं सेला टनल अक्ष (13,700 फीट)',
  'Panagarh Military Station, West Bengal': 'पनागढ़ सैन्य स्टेशन, पश्चिम बंगाल',
  'Strategic Mountain Strike Thrust Deployment': 'सामरिक पर्वतीय स्ट्राइक तैनाती',
  'Sukna / Siliguri, West Bengal': 'सुकना / सिलीगुड़ी, पश्चिम बंगाल',
  'Chicken\'s Neck / Siliguri Strategic Corridor': 'चिकन नेक / सिलीगुड़ी सामरिक गलियारा',
  'Gangtok / Sherathang, Sikkim': 'गंगटोक / शेराथांग, सिक्किम',
  'Nathu La & Cho La High-Altitude Axis (14,140 ft)': 'नाथू ला एवं चो ला उच्च तुंगता अक्ष (14,140 फीट)',
  'Binnaguri Cantonment, West Bengal': 'बिन्नागुड़ी छावनी, पश्चिम बंगाल',
  'Dooars Plains & Indo-Bhutan Frontier Axis': 'डुअर्स मैदान एवं भारत-भूटान सीमा अक्ष',
  'Walong / Kibithu, Arunachal Pradesh': 'वालोंग / किबिथू, अरुणाचल प्रदेश',
  'Lohit Valley & First Sun Rays Border Axis (8,200 ft)': 'लोहित घाटी एवं प्रथम सूर्य किरण सीमा अक्ष (8,200 फीट)',

  // Southern Command
  'Pune Cantonment, Maharashtra': 'पुणे छावनी, महाराष्ट्र',
  'Southern Theater Strategic Command & Tri-Services Node': 'दक्षिणी थिएटर सामरिक कमान एवं त्रि-सेवा नोड',
  'Jodhpur Military Station, Rajasthan': 'जोधपुर सैन्य स्टेशन, राजस्थान',
  'Thar Desert Operational Direction Axis': 'थार रेगिस्तान परिचालन निर्देशन अक्ष',
  'Deep Desert Reconnaissance & Raiding Tactics': 'गहन रेगिस्तान टोही एवं छापेमारी रणनीति',
  'Pokhran / Jaisalmer, Rajasthan': 'पोखरण / जैसलमेर, राजस्थान',
  'Deep Thar Desert Sand Sea & Tank Battleground': 'गहन थार रेगिस्तान बालू समुद्र एवं टैंक रणभूमि',
  'Longewala Border Post, Thar, Rajasthan': 'लोंगेवाला सीमा चौकी, थार, राजस्थान',
  'Longewala Sand Ridge (Historic 1971 Defense Axis)': 'लोंगेवाला बालू कटक (ऐतिहासिक 1971 रक्षा अक्ष)',
  'Bhopal Military Station, Madhya Pradesh': 'भोपाल सैन्य स्टेशन, मध्य प्रदेश',
  'Peninsular & Central Strategic Strike Reserve': 'प्रायद्वीपीय एवं मध्य सामरिक स्ट्राइक रिजर्व',
  'Babina / Jhansi Military Station, UP': 'बबीना / झांसी सैन्य स्टेशन, उत्तर प्रदेश',
  'Heavy Armor Firing Ranges & Rapid Shock Columns': 'भारी बख्तरबंद फायरिंग रेंज एवं त्वरित शॉक कॉलम',
  'Secunderabad / Hyderabad, Telangana': 'सिकंदराबाद / हैदराबाद, तेलंगाना',
  'Amphibious & Rapid Airborne Reaction Force': 'उभयचर एवं त्वरित हवाई प्रतिक्रिया बल',
  'Khadki / Pune, Maharashtra': 'खड़की / पुणे, महाराष्ट्र',
  'Combat Engineering, Mine Warfare & Bridging Training': 'युद्ध इंजीनियरिंग, माइन युद्ध एवं ब्रिजिंग प्रशिक्षण',

  // South Western Command
  'Jaipur Military Station, Rajasthan': 'जयपुर सैन्य स्टेशन, राजस्थान',
  'Western Border Semi-Desert Pivot & Mechanised Core': 'पश्चिमी सीमा अर्ध-रेगिस्तानी धुरी एवं मैकेनाइज्ड कोर',
  'Mathura Cantonment, Uttar Pradesh': 'मथुरा छावनी, उत्तर प्रदेश',
  'Strategic Armoured & Mechanised Strike Thrust': 'सामरिक बख्तरबंद एवं मैकेनाइज्ड स्ट्राइक थ्रस्ट',
  'Bathinda Military Station, Punjab': 'बठिंडा सैन्य स्टेशन, पंजाब',
  'Malwa Plains & Rajasthan Border Transition Corridor': 'मालवा मैदान एवं राजस्थान सीमा संक्रमण गलियारा',
  'Sri Ganganagar Military Station, Rajasthan': 'श्री गंगानगर सैन्य स्टेशन, राजस्थान',
  'Indira Gandhi Canal Defense Barrier & Border Outposts': 'इंदिरा गांधी नहर रक्षा बैरियर एवं सीमा चौकियां',
  'Bikaner Military Station, Rajasthan': 'बीकानेर सैन्य स्टेशन, राजस्थान',
  'Fast Sand-Track Maneuver & Night Firing Group': 'फास्ट सैंड-ट्रैक पैंतरेबाज़ी एवं रात्रि फायरिंग ग्रुप',

  // Central Command
  'Dilkusha Cantonment, Lucknow, UP': 'दिलकुशा छावनी, लखनऊ, उत्तर प्रदेश',
  'Central LAC (Uttarakhand) & National Depot Network': 'केंद्रीय एलएसी (उत्तराखंड) एवं राष्ट्रीय डिपो नेटवर्क',
  'Joshimath / Badrinath, Uttarakhand': 'जोशीमठ / बद्रीनाथ, उत्तराखंड',
  'Barahoti Plains & Mana Pass Axis (18,192 ft)': 'बाराहोती मैदान एवं माणा दर्रा अक्ष (18,192 फीट)',
  'Pithoragarh / Dharchula, Uttarakhand': 'पिथौरागढ़ / धारचूला, उत्तराखंड',
  'Lipulekh Pass & Kalapani Tri-junction (17,060 ft)': 'लिपुलेख दर्रा एवं कालापानी ट्राई-जंक्शन (17,060 फीट)',
  'Agra Cantonment, Uttar Pradesh': 'आगरा छावनी, उत्तर प्रदेश',
  'National Heavy Armour Spares & Airborne Parachute Depot': 'राष्ट्रीय भारी बख्तरबंद स्पेयर एवं एयरबोर्न पैराशूट डिपो',
  'Kanpur Cantonment, Uttar Pradesh': 'कानपुर छावनी, उत्तर प्रदेश',
  'National Small Arms, Ammunition & Cold-Climate Clothing Hub': 'राष्ट्रीय लघु शस्त्र, गोला-बारूद एवं शीतकालीन वस्त्र केंद्र',
  'Ranikhet, Almora District, Uttarakhand': 'रानीखेत, अल्मोड़ा जिला, उत्तराखंड',
  'Pine Forest Hill Station (6,100 ft) & Mountain Infantry Crucible': 'चीड़ वन हिल स्टेशन (6,100 फीट) एवं पर्वतीय इन्फैंट्री केंद्र',

  // Additional 53 Unit Station and Sector variants
  'Sukna / Siliguri Corridor, West Bengal': 'सुकना / सिलीगुड़ी गलियारा, पश्चिम बंगाल',
  'Siliguri "Chicken\'s Neck" Corridor & Sikkim Axis': 'सिलीगुड़ी "चिकन नेक" गलियारा एवं सिक्किम अक्ष',
  'Jang / Sela Axis, Tawang, Arunachal': 'जंग / सेला अक्ष, तवांग, अरुणाचल',
  'Jaswant Garh & Bum La Pass Border Post': 'जसवंत गढ़ एवं बुम ला दर्रा सीमा चौकी',
  'Khasa / Amritsar, Punjab': 'खासा / अमृतसर, पंजाब',
  'Attari-Wagah International Border Grid': 'अटारी-वाघा अंतर्राष्ट्रीय सीमा ग्रिड',
  'Ambala Military Station, Haryana': 'अंबाला सैन्य स्टेशन, हरियाणा',
  'Main Battle Tank Armoured Maneuver': 'मुख्य युद्धक टैंक बख्तरबंद पैंतरेबाज़ी',
  'Tezpur Military Station, Sonitpur, Assam': 'तेजपुर सैन्य स्टेशन, शोणितपुर, असम',
  'Brahmaputra Valley & Kameng Frontier Lifeline': 'ब्रह्मपुत्र घाटी एवं कामेंग सीमांत जीवनरेखा',
  'Rangapahar Cantonment, Dimapur, Nagaland': 'रंगापहाड़ छावनी, दीमापुर, नागालैंड',
  'Indo-Myanmar Border & Counter-Insurgency Matrix': 'भारत-म्यांमार सीमा एवं उग्रवाद विरोधी मैट्रिक्स',
  'Jorhat / Dimapur, Assam': 'जोरहाट / दीमापुर, असम',
  'Deep Jungle Infiltration & Mountain Airborne Operations': 'सघन जंगल घुसपैठ एवं पर्वतीय हवाई अभियान',
  'Bengdubi / Siliguri Corridor, West Bengal': 'बेंगडूबी / सिलीगुड़ी गलियारा, पश्चिम बंगाल',
  'Teesta River Bridging & Mountain Axis Mobility': 'तीस्ता नदी ब्रिजिंग एवं पर्वतीय अक्ष गतिशीलता',
  'Jaisalmer / Jodhpur, Rajasthan': 'जैसलमेर / जोधपुर, राजस्थान',
  'Thar Desert / Western Border Operational Grid': 'थार रेगिस्तान / पश्चिमी सीमा परिचालन ग्रिड',
  'Gangtok / Nathu La, Sikkim': 'गंगटोक / नाथू ला, सिक्किम',
  'Nathu La & Doklam Plateau Gateway (14,140 ft)': 'नाथू ला एवं डोकलाम पठार प्रवेश द्वार (14,140 फीट)',
  'Beas & Sutlej Riverine Defensive Network': 'ब्यास एवं सतलुज नदी रक्षा नेटवर्क',

  // Training & Joint Commands & HQ
  'Dehradun, Uttarakhand': 'देहरादून, उत्तराखंड',
  'Cradle of Military Leadership & Chetwode Building': 'सैन्य नेतृत्व की पालना एवं चेटवोड भवन',
  'Gulmarg / Sonamarg, J&K': 'गुलमर्ग / सोनमर्ग, जम्मू एवं कश्मीर',
  'Alpine Mountain Warfare & Glacial Survival (9,000 to 14,000 ft)': 'अल्पाइन पर्वतीय युद्ध एवं हिमनद उत्तरजीविता (9,000 से 14,000 फीट)',
  'Vairengte, Kolasib District, Mizoram': 'वैरांगते, कोलासिब जिला, मिजोरम',
  '"Fight the Guerrilla as a Guerrilla" Dense Jungle Crucible': '"गुरिल्ला से गुरिल्ला की तरह लड़ें" सघन जंगल प्रशिक्षण',
  'Khadakwasla, Pune, Maharashtra': 'खड़कवासला, पुणे, महाराष्ट्र',
  'Khadakwasla Lake & Sudan Block Cradle of Military Jointness': 'खड़कवासला झील एवं सूडान ब्लॉक सैन्य संयुक्तता का पालना',
  'Port Blair, South Andaman': 'पोर्ट ब्लेयर, दक्षिण अंडमान',
  'Bay of Bengal & Malacca Strait Island Archipelago': 'बंगाल की खाड़ी एवं मलक्का जलडमरूमध्य द्वीपसमूह',
  'Sena Bhawan, New Delhi': 'सेना भवन, नई दिल्ली',
  'National Strategic Command & C4ISR Core': 'राष्ट्रीय सामरिक कमान एवं C4ISR कोर',
  'South Block, New Delhi': 'साउथ ब्लॉक, नई दिल्ली',
  'National Military Convoy & Multi-Modal Railway Airhead Grid': 'राष्ट्रीय सैन्य काफिला एवं बहु-मॉडल रेलवे एयरहेड ग्रिड',
  'Delhi Cantonment, New Delhi': 'दिल्ली छावनी, नई दिल्ली',
  'Heavy Armoured Overhaul & Electronic Sensor Calibration': 'भारी बख्तरबंद ओवरहाल एवं इलेक्ट्रॉनिक सेंसर कैलिब्रेशन'
};

// Add all unit names transliteration
const unitNamesHindi = {
  '14 RAJPUT (MECHANISED)': '14 राजपूत (मैकेनाइज्ड)',
  '102 INFANTRY BRIGADE ("SIACHEN BRIGADE")': '102 इन्फैंट्री ब्रिगेड ("सियाचिन ब्रिगेड")',
  '8 MOUNTAIN DIVISION ("FOREVER IN OPERATIONS")': '8 माउंटेन डिवीजन ("सदैव तत्पर")',
  '3 INFANTRY DIVISION ("TRISHUL DIVISION")': '3 इन्फैंट्री डिवीजन ("त्रिशूल डिवीजन")',
  '114 INDEPENDENT INFANTRY BRIGADE': '114 इंडिपेंडेंट इन्फैंट्री ब्रिगेड',
  '19 INFANTRY DIVISION ("DAGGER DIVISION")': '19 इन्फैंट्री डिवीजन ("डैगर डिवीजन")',
  '28 INFANTRY DIVISION ("VAJR DIVISION")': '28 इन्फैंट्री डिवीजन ("वज्र डिवीजन")',
  '25 INFANTRY DIVISION ("ACE OF SPADES DIVISION")': '25 इन्फैंट्री डिवीजन ("हुकुम का इक्का डिवीजन")',
  '16 CORPS ("WHITE KNIGHT CORPS")': '16 कोर ("व्हाइट नाइट कोर")',
  'HQ NORTHERN COMMAND ("PARAM UTKARSH")': 'मुख्यालय उत्तरी कमान ("परम उत्कर्ष")',
  '15 CORPS ("CHINAR CORPS")': '15 कोर ("चिनार कोर")',
  '10 INFANTRY DIVISION ("RAPID")': '10 इन्फैंट्री डिवीजन ("रैपिड")',
  'HQ WESTERN COMMAND ("SARVADA VIJAYI")': 'मुख्यालय पश्चिमी कमान ("सर्वदा विजयी")',
  'HQ 2 CORPS ("KHARGA CORPS")': 'मुख्यालय 2 कोर ("खडगा कोर")',
  'HQ 11 CORPS ("VAJRA CORPS")': 'मुख्यालय 11 कोर ("वज्र कोर")',
  'HQ 9 CORPS ("RISING STAR CORPS")': 'मुख्यालय 9 कोर ("राइजिंग स्टार कोर")',
  '1 ARMOURED DIVISION ("BLACK ARMOUR")': '1 आर्मर्ड डिवीजन ("ब्लैक आर्मर")',
  '14 RAPID (STRIKE DIVISION)': '14 रैपिड (स्ट्राइक डिवीजन)',
  '7 INFANTRY DIVISION ("GOLDEN ARROW DIVISION")': '7 इन्फैंट्री डिवीजन ("गोल्डन एरो डिवीजन")',
  '15 INFANTRY DIVISION ("PANTHERS DIVISION")': '15 इन्फैंट्री डिवीजन ("पैंथर्स डिवीजन")',
  'HQ EASTERN COMMAND ("VEERTA AUR SHAURYA")': 'मुख्यालय पूर्वी कमान ("वीरता और शौर्य")',
  'HQ 3 CORPS ("SPEAR CORPS")': 'मुख्यालय 3 कोर ("स्पीयर कोर")',
  'HQ 4 CORPS ("GAJRAJ CORPS")': 'मुख्यालय 4 कोर ("गजराज कोर")',
  '5 MOUNTAIN DIVISION ("BALL OF FIRE")': '5 माउंटेन डिवीजन ("बॉल ऑफ फायर")',
  'HQ 17 CORPS ("BRAHMASTRA CORPS")': 'मुख्यालय 17 कोर ("ब्रह्मास्त्र कोर")',
  'HQ 33 CORPS ("TRISHAKTI CORPS")': 'मुख्यालय 33 कोर ("त्रिशक्ति कोर")',
  '17 MOUNTAIN DIVISION ("BLACK CAT DIVISION")': '17 माउंटेन डिवीजन ("ब्लैक कैट डिवीजन")',
  '20 MOUNTAIN DIVISION ("KIRPAN DIVISION")': '20 माउंटेन डिवीजन ("कृपाण डिवीजन")',
  '2 MOUNTAIN DIVISION ("DAO DIVISION")': '2 माउंटेन डिवीजन ("दाओ डिवीजन")',
  'HQ SOUTHERN COMMAND ("SARVADA VIJAYEE")': 'मुख्यालय दक्षिणी कमान ("सर्वदा विजयी")',
  'HQ 12 CORPS ("BATTLE AXE CORPS")': 'मुख्यालय 12 कोर ("बैटल एक्स कोर")',
  '11 RAPID (STRIKE DIVISION)': '11 रैपिड (स्ट्राइक डिवीजन)',
  '10 PARA (SPECIAL FORCES - "DESERT SCORPIONS")': '10 पैरा (विशेष बल - "डेजर्ट स्कॉर्पियन्स")',
  '23 PUNJAB ("LONGEWALA HEROES")': '23 पंजाब ("लोंगेवाला हीरोज")',
  'HQ 21 CORPS ("SUDARSHAN CHAKRA CORPS")': 'मुख्यालय 21 कोर ("सुदर्शन चक्र कोर")',
  '31 ARMOURED DIVISION ("WHITE TIGER DIVISION")': '31 आर्मर्ड डिवीजन ("व्हाइट टाइगर डिवीजन")',
  '54 INFANTRY DIVISION ("BISON DIVISION")': '54 इन्फैंट्री डिवीजन ("बाइसन डिवीजन")',
  'BOMBAY ENGINEER GROUP & CENTRE (BEG)': 'बॉम्बे इंजीनियर ग्रुप एवं सेंटर (BEG)',
  'HQ SOUTH WESTERN COMMAND ("SAPTA SHAKTI")': 'मुख्यालय दक्षिण पश्चिमी कमान ("सप्त शक्ति")',
  'HQ 1 CORPS ("STRIKE ONE")': 'मुख्यालय 1 कोर ("स्ट्राइक वन")',
  'HQ 10 CORPS ("CHETAK CORPS")': 'मुख्यालय 10 कोर ("चेतक कोर")',
  '16 INFANTRY DIVISION': '16 इन्फैंट्री डिवीजन',
  '75 ARMOURED REGIMENT': '75 आर्मर्ड रेजिमेंट',
  'HQ CENTRAL COMMAND ("SURYA COMMAND")': 'मुख्यालय मध्य कमान ("सूर्य कमान")',
  '9 INDEPENDENT MOUNTAIN BRIGADE': '9 इंडिपेंडेंट माउंटेन ब्रिगेड',
  '14 INDEPENDENT MOUNTAIN BRIGADE': '14 इंडिपेंडेंट माउंटेन ब्रिगेड',
  'CENTRAL ORDNANCE DEPOT (COD AGRA)': 'सेंट्रल ऑर्डनेंस डिपो (सीओडी आगरा)',
  'CENTRAL ORDNANCE DEPOT (COD KANPUR)': 'सेंट्रल ऑर्डनेंस डिपो (सीओडी कानपुर)',
  'KUMAON REGIMENTAL CENTRE (KRC)': 'कुमाऊं रेजिमेंटल सेंटर (KRC)',
  'INDIAN MILITARY ACADEMY (IMA)': 'भारतीय सैन्य अकादमी (आईएमए)',
  'HIGH ALTITUDE WARFARE SCHOOL (HAWS)': 'उच्च तुंगता युद्ध विद्यालय (HAWS)',
  'COUNTER INSURGENCY & JUNGLE WARFARE SCHOOL (CIJWS)': 'काउंटर इंसर्जेंसी एवं जंगल वारफेयर स्कूल (CIJWS)',
  'NATIONAL DEFENCE ACADEMY (NDA)': 'राष्ट्रीय रक्षा अकादमी (एनडीए)',
  '108 MOUNTAIN BRIGADE / AMPHIBIOUS GROUP': '108 माउंटेन ब्रिगेड / उभयचर समूह',
  'INTEGRATED DEFENSE HQ (ARMY HQ)': 'एकीकृत रक्षा मुख्यालय (सेना मुख्यालय)',
  'DIRECTORATE GENERAL OF OPERATIONAL LOGISTICS (DGOL)': 'महानिदेशालय परिचालन रसद (DGOL)',
  '505 ARMY BASE WORKSHOP (EME)': '505 आर्मी बेस वर्कशॉप (EME)'
};

// Merge into dict
Object.assign(dict, unitTranslations, unitNamesHindi);

// Also generate every composite string: `${u.station} • ${u.sector}`
units.forEach(u => {
  const comp = `${u.station} • ${u.sector}`;
  const stTr = dict[u.station] || u.station;
  const secTr = dict[u.sector] || translateAltitude(u.sector);
  dict[comp] = `${stTr} • ${secTr}`;

  // Also officer / commander
  if (u.commanderRankName) {
    // e.g. Col Harshwardhan Joshi -> कर्नल हर्षवर्धन जोशी
    // If not in dict, keep or transliterate
  }
});

console.log('Total keys in merged dict:', Object.keys(dict).length);
fs.writeFileSync('scripts/sena_full_merged_translations.json', JSON.stringify(dict, null, 2));
console.log('Saved scripts/sena_full_merged_translations.json');
