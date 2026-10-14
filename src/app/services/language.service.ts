import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'hi';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<Language>('en');

  constructor() {
    try {
      const saved = localStorage.getItem('sena_lang') as Language;
      if (saved === 'en' || saved === 'hi') {
        this.currentLang.set(saved);
      }
    } catch {
      // Local storage unavailable
    }
  }

  private translations: Record<Language, Record<string, string>> = {
    en: {
      // Top utility
      contactUs: 'Contact Us',
      feedback: 'Feedback',
      sitemap: 'Sitemap',
      skipContent: 'Skip to Main Content',
      screenReader: 'Screen Reader Access',
      langToggle: 'हिंदी में देखें',

      // Brand Header
      titleSena: 'Sena',
      titleAapurti: 'Aapurti',
      subtitle: 'Predictive Logistics & Forward Supply',
      authority: 'INDIAN ARMY | GOVERNMENT OF INDIA',
      searchPlaceholder: 'Search...',
      searchBtn: 'Search',

      // Navigation
      navHome: 'Home',
      navKnowSena: 'Know SenaAapurti',
      navAbout: 'About SenaAapurti',
      navAboutContact: 'About & Contact',
      navAiLogistics: 'AI in Military Logistics',
      navFeatures: 'Features',
      navGuidelines: 'User Guidelines',
      navFaq: 'FAQ',
      navSupport: 'Support',
      navDownloads: 'Downloads',
      navImportantLinks: 'Important Links',
      navContact: 'Contact Us',
      navPortals: 'Portals Access',
      commandPortalNav: 'Command Portal',
      unitPortalNav: 'Unit Portal',

      // Marquee Ticker
      liveUpdates: 'LIVE UPDATES',
      ticker1Prefix: 'Northern Command:',
      ticker1Text: 'Zojila Axis Convoy Column 42 cleared for high-altitude transit with continuous GPS telemetry',
      ticker2Prefix: 'Central Ordnance:',
      ticker2Text: 'Automated Class V munitions replenishment vouchers dispatched to Eastern theater',
      ticker3Prefix: 'POL Reserves:',
      ticker3Text: 'Advance winter fuel stocking at Siachen staging bases verified at 100% capacity',
      ticker4Prefix: 'SenaAapurti C4ISR:',
      ticker4Text: '7 Operational Commands interconnected on secure edge network • 24x7 Control Room Active',

      // FAQ Categories in Nav
      'faqCat_general': 'General & Getting Started',
      'faqCat_platform-features': 'Platform Features & Capabilities',
      'faqCat_ai-intelligence': 'AI & Predictive Intelligence',
      'faqCat_logistics-operations': 'Logistics Operations & Tracking',
      'faqCat_user-guidelines': 'User Guides & Access',
      'faqCat_support': 'Troubleshooting & Support',

      // Important Links in Nav
      linkIndianArmy: 'Indian Army',
      linkAoc: 'Army Ordnance Corps (AOC)',
      linkMod: 'Ministry of Defence',
      linkGem: 'Government e-Marketplace (GeM)',
      linkCppp: 'Central Public Procurement Portal (CPPP)',
      linkBro: 'Border Roads Organisation (BRO)',
      linkImd: 'India Meteorological Department (IMD)',

      // Hero
      heroOfficialBadge: 'भारतीय सेना आपूर्ति • INDIAN ARMY LOGISTICS',
      heroHeadline: 'Predictive Logistics & Forward Supply',
      heroDesc: 'Autonomous AI supply chain intelligence synchronizing Central Ordnance Depots to high-altitude forward pickets.',
      heroAccessPortal: 'Access Portal',
      heroExplore: 'Explore SenaAapurti',

      // Statistics / Impact
      metricRegisteredUnits: 'Registered Units',
      metricRegisteredUnitsSub: 'Connected across all 7 Commands',
      metricActiveMovements: 'Active Logistics Movements',
      metricActiveMovementsSub: 'Convoys and air-drops synchronized',
      metricSupplyReadiness: 'Supply Readiness',
      metricSupplyReadinessSub: 'Across all forward formations',
      metricPredictiveCoverage: 'Predictive Coverage',
      metricPredictiveCoverageSub: 'Northern & Eastern border defense',

      // Strategic Mandate & Core Pillars
      mandateTag: 'STRATEGIC MANDATE & CAPABILITIES',
      mandateTitle: 'Mission & Four Pillars of Supply Superiority',
      mandateLead: 'Bridging the critical divide between Strategic Depots and Forward Localities through autonomous AI orchestration and real-time telemetry',
      mandateEthosHindi: 'सदैव आपूर्ति • सदैव समर्थन',
      mandateEthosEng: 'INTELLIGENT SUPPLY • ASSURED READINESS',
      mandateDefcon: 'ACTIVE THEATER READINESS',
      mandateHeadline: 'Anticipatory Combat Sustenance',
      mandatePara: 'is the Indian Army\'s centralized AI-driven predictive logistics orchestration platform. It eliminates supply chain friction and guarantees uninterrupted combat sustenance across northern and eastern border theaters—automating multi-echelon demand projections for Rations (Class I), POL Fuel (Class III), Munitions (Class V), and Equipment Spares (Class IX).',
      mandateStat1Label: 'Multi-Command Visibility',
      mandateStat2Label: 'Critical Stockout Tolerance',
      mandateStat2Val: 'Zero',
      mandateStat3Label: 'Predictive Buffer Warning',
      mandateStat3Val: '30–90D',
      pillar1Badge: 'PILLAR 01',
      pillar1Heading: 'Predict Demand',
      pillar2Badge: 'PILLAR 02',
      pillar2Heading: 'Optimize Movement',
      pillar3Badge: 'PILLAR 03',
      pillar3Heading: 'Ensure Availability',
      pillar4Badge: 'PILLAR 04',
      pillar4Heading: 'Strengthen Readiness',

      // Jarvis Autonomous C4ISR Workflow
      jarvisPill: 'AUTONOMOUS C4ISR WORKFLOW',
      jarvisTitle: 'How SenaAapurti Operates',
      jarvisActive: 'ACTIVE',
      workflowStage_1: 'Unit Telemetry',
      workflowStage_2: 'Data Fusion',
      workflowStage_3: 'AI Forecasting',
      workflowStage_4: 'Risk Analysis',
      workflowStage_5: 'Route Dispatch',
      workflowStage_6: 'Assured Delivery',

      // Official Circulars & News
      newsTag: 'OFFICIAL CIRCULARS',
      newsTitle: 'Defense Information & Bulletin',
      newsLead: 'DGOS directives, system enhancements, and critical operational circulars',
      newsTabAnnouncements: 'Announcements',
      newsTabUpdates: 'System Updates',
      newsTabNotices: 'Important Notices',
      circ1Tag: 'CIRCULAR 42/2026',
      circ1Clearance: 'UNCLASSIFIED // DEFENSE WIDE',
      circ1Title: 'Winter Stocking Verification for Northern & Eastern Theaters Completed',
      circ1Desc: 'The Master General of Sustenance (MGS) branch has certified 100% pre-positioning of Sub-Zero HSD and high-altitude sustenance across 14, 15, 16, and 4 Corps ahead of seasonal mountain pass blockages.',
      circ1Date: 'Published: 04 October 2026 • DGOS Directorate',
      circ1Auth: 'VERIFIED BY MGS HQ',
      circ2Tag: 'SYSTEM RELEASE V4.8',
      circ2Clearance: 'ASCON C4ISR PROTOCOL',
      circ2Title: 'Deployment of Neural Pass Weather Forecasting along Sela Tunnel Axis',
      circ2Desc: 'SenaAapurti v4.8 activates automated IMD Doppler radar integration predicting black ice and snowfall probabilities 72 hours in advance for Eastern Command convoys.',
      circ2Date: 'Published: 01 October 2026 • Army Cyber Logistics Group',
      circ2Auth: 'SYSTEM UPGRADE APPLIED',
      circ3Tag: 'FLASH NOTICE',
      circ3Clearance: 'MANDATORY COMPLIANCE',
      circ3Title: 'Migration of Field Indent Vouchers to Cryptographic ASCON Signatures',
      circ3Desc: 'All Regimental Quartermasters must file replenishment indents exclusively through the SenaAapurti Unit Portal. Physical handwritten indents stand deprecated under Army Order AO-18/2026.',
      circ3Date: 'Published: 28 September 2026 • Adjutant General\'s Branch',
      circ3Auth: 'STATUTORY DIRECTIVE',

      // Downloads Section
      dlTag: 'PUBLICATIONS & ASSETS',
      dlTitle: 'Official Defense Downloads & Documentation',
      dlLead: 'Download official defense manuals, quick-start setup cards, and tactical mobile applications',
      dlBtnPdf: 'Download PDF',
      dlBtnApk: 'Download APK',
      dl1Title: 'User Manuals: SenaAapurti Comprehensive Manual v4.8',
      dl1Desc: 'Complete 180-page reference manual for Command and Unit logisticians detailing system operation.',
      dl1Meta: 'PDF • 8.4 MB • Official Defense Manual',
      dl2Title: 'Quick Start Guide: Tactical Field Terminal Setup',
      dl2Desc: 'Step-by-step quick guide for setting up field tablet clients and ASCON satellite transponders.',
      dl2Meta: 'PDF • 2.1 MB • Quick Start Card',
      dl3Title: 'Mobile App: Ruggedized Android Field Client APK',
      dl3Desc: 'Official APK for military handheld terminals with offline store scanning capabilities.',
      dl3Meta: 'APK • 42 MB • Version 3.4.1',
      dl4Title: 'Documentation: Technical Architecture & API Whitepaper',
      dl4Desc: 'Classified technical overview of cryptographic handshakes, ASCON protocols, and database schema.',
      dl4Meta: 'PDF • 4.8 MB • Army Cyber Logistics',

      // Support & Help Centre
      supTag: '24x7 TECHNICAL SUPPORT',
      supTitle: 'Support & Help Centre',
      supLead: 'Round-the-clock defense logistics assistance, issue tracking, and automated response hotlines',
      supReportIssue: 'Report an Operational Issue',
      supAsconOnline: 'ASCON DESK ONLINE',
      supOfficerName: 'Officer / Operator Name',
      supServiceNo: 'Army Service Number',
      supCategory: 'Issue Category',
      supCatVoucher: 'Voucher Tracking / Requisition Delay',
      supCatConvoy: 'Convoy GPS Telemetry Offline',
      supCatStock: 'Depot Stock Reconciliation Discrepancy',
      supCatSec: 'Account Security / Access Permissions',
      supIssueDetails: 'Issue Details & Reference #',
      supSubmitTicket: 'Submit Support Ticket ➔',
      supHotlines: 'Help Centre & Technical Hotlines',
      supActive247: '24x7 ACTIVE',
      supHl1Label: 'Army HQ 24x7 Control Room',
      supHl1Sub: 'Toll-free across all military circles',
      supHl2Label: 'Northern Command Ops Cell',
      supHl2Sub: 'Dedicated secure defense exchange',
      supHl3Label: 'Technical Helpdesk (Signal Corps)',
      supHl3Sub: 'Ticketing response SLA: < 30 mins',
      supHl4Label: 'Class V Munitions Emergency Hotline',
      supHl4Sub: 'Immediate replenishment authorization',

      // About & Official Contact Directory
      aboutTag: 'DGOS SUSTENANCE MANDATE',
      aboutTitle: 'About SenaAapurti & Official Contact',
      aboutLead: 'The Sovereign AI Predictive Logistics Continuum of the Indian Army',
      aboutHqBadge: 'INTEGRATED HQ OF MoD (ARMY) • MGS BRANCH',
      aboutPanelTitle: 'Autonomous Defense Sustenance',
      aboutStatement: 'is the centralized AI-powered logistics backbone engineered by the Directorate General of Ordnance Services (DGOS). It connects operational commands, Central Ordnance Depots, and extreme high-altitude forward pickets into a real-time predictive replenishment network.',
      tenet1Title: '30–90D Anticipatory Buffers',
      tenet1Desc: 'Neural demand forecasting before winter pass closures',
      tenet2Title: 'Zero Critical Stockouts',
      tenet2Desc: 'Autonomous inventory rebalancing across Class I to IX stores',
      tenet3Title: 'ASCON Military Encryption',
      tenet3Desc: 'Certified military-grade telemetry on sovereign infrastructure',
      govDgos: 'DGOS Secretariat',
      govCyber: 'Army Cyber Group',
      govCert: 'CERT-In Audited',
      hubSecretariats: 'Principal Secretariats',
      secMgsLabel: 'Master General of Sustenance (MGS)',
      secMgsText: 'South Block, Integrated HQ of MoD (Army), New Delhi - 110011',
      secDgosLabel: 'Directorate General of Ordnance Services (DGOS)',
      secDgosText: 'West Block IV, RK Puram, New Delhi - 110066',
      sec247Label: '24x7 Control Cell & Helpdesk',
      sec247Text: '1800-11-SENA (7362) • ASCON-NET Node 4481',
      secGatewaysLabel: 'Official Electronic Gateways',
      quickChannel: 'Official Communication Channel',
      fieldNameRank: 'Full Name & Rank',
      fieldDefEmail: 'Defense Email ID',
      fieldMsg: 'Message / Query',
      btnTransmit: 'Transmit Communication ➔',

      // Footer
      footerMotto: 'सशक्त आपूर्ति, सुरक्षित भारत',
      footerSubMotto: 'SUPPORTING OUR FORCES, STRENGTHENING THE NATION.',
      footerDesc: 'Automated Predictive Logistics & Ordnance Sustenance Platform of the Indian Army. Enabling seamless supply synchronization from Strategic Depots to Forward Defended Localities across high-altitude and desert battlefronts.',
      certCompliant: 'CERT-In Compliant',
      certAdc: 'Army Data Centre (ADC)',
      certGov: 'Govt of India',
      colNavPortals: 'Navigation & Portals',
      footHome: 'Home Portal',
      footAbout: 'About SenaAapurti',
      footAiLogistics: 'AI & Predictive Algorithms',
      footFeatures: 'Defense Capabilities',
      footCommand: 'Command / Admin Portal',
      footUnit: 'Unit Requisition Portal',
      colResources: 'Resources & SOPs',
      footSop: 'Standard Operating Procedures (SOPs)',
      footWinter: 'Winter Stocking Protocol 2026',
      footManual: 'Army Logistics Manual v4.2',
      footApk: 'Field Tablet APK (Offline Client)',
      footBarcode: 'Indent Templates & Barcodes',
      footTicket: 'Logistics Ticket System',
      colOpsRoom: '24x7 Logistics Ops Room',
      labelHelpline: 'Helpline:',
      labelArmyWan: 'Army WAN:',
      labelHqs: 'HQs:',
      labelEmail: 'Email:',
      footerManaged: 'Portal Content Managed by DGOS, Indian Army | Last Updated: 04 October 2026',
      footTerms: 'Terms of Use',
      footPrivacy: 'Privacy Policy',
      footSecurity: 'Security Guidelines',
      footWebmaster: 'Contact Webmaster',
      copyright: '© 2026 SenaAapurti Portal, Indian Army, Ministry of Defence, Government of India. All Rights Reserved.'
    },
    hi: {
      // Top utility
      contactUs: 'संपर्क करें',
      feedback: 'प्रतिक्रिया',
      sitemap: 'साइटमैप',
      skipContent: 'मुख्य सामग्री पर जाएं',
      screenReader: 'स्क्रीन रीडर एक्सेस',
      langToggle: 'View in English',

      // Brand Header
      titleSena: 'सेना',
      titleAapurti: 'आपूर्ति',
      subtitle: 'पूर्वानुमानित रसद एवं अग्रिम आपूर्ति',
      authority: 'भारतीय सेना | भारत सरकार',
      searchPlaceholder: 'खोजें...',
      searchBtn: 'खोजें',

      // Navigation
      navHome: 'होम',
      navKnowSena: 'सेना आपूर्ति को जानें',
      navAbout: 'सेना आपूर्ति के बारे में',
      navAboutContact: 'परिचय एवं संपर्क सूत्र',
      navAiLogistics: 'सैन्य रसद में एआई',
      navFeatures: 'विशेषताएं',
      navGuidelines: 'उपयोगकर्ता दिशानिर्देश',
      navFaq: 'सामान्य प्रश्न (FAQ)',
      navSupport: 'सहायता',
      navDownloads: 'डाउनलोड',
      navImportantLinks: 'महत्वपूर्ण लिंक',
      navContact: 'संपर्क सूत्र',
      navPortals: 'पोर्टल एक्सेस',
      commandPortalNav: 'कमांड पोर्टल',
      unitPortalNav: 'यूनिट पोर्टल',

      // Marquee Ticker
      liveUpdates: 'ताज़ा अपडेट',
      ticker1Prefix: 'उत्तरी कमान:',
      ticker1Text: 'ज़ोजिला अक्ष पर काफिला कॉलम 42 निरंतर जीपीएस टेलीमेट्री के साथ उच्च पर्वतीय पारगमन हेतु रवाना।',
      ticker2Prefix: 'केंद्रीय आयुध:',
      ticker2Text: 'पूर्वी थिएटर हेतु स्वचालित वर्ग-V गोला-बारूद पुनःपूर्ति वाउचर प्रेषित।',
      ticker3Prefix: 'पीओएल भंडार:',
      ticker3Text: 'सियाचिन बेस कैंप्स पर अग्रिम शीतकालीन ईंधन भंडार का 100% क्षमता पर सत्यापन।',
      ticker4Prefix: 'सेना आपूर्ति C4ISR:',
      ticker4Text: '7 परिचालन कमानें सुरक्षित नेटवर्क पर परस्पर संबद्ध • 24x7 नियंत्रण कक्ष सक्रिय।',

      // FAQ Categories in Nav
      'faqCat_general': 'सामान्य एवं प्रारंभिक जानकारी',
      'faqCat_platform-features': 'प्लेटफ़ॉर्म विशेषताएं एवं क्षमताएं',
      'faqCat_ai-intelligence': 'एआई एवं पूर्वानुमानित बुद्धिमत्ता',
      'faqCat_logistics-operations': 'रसद संचालन एवं ट्रैकिंग',
      'faqCat_user-guidelines': 'उपयोगकर्ता गाइड एवं एक्सेस',
      'faqCat_support': 'समस्या निवारण एवं सहायता',

      // Important Links in Nav
      linkIndianArmy: 'भारतीय सेना',
      linkAoc: 'सेना आयुध कोर (AOC)',
      linkMod: 'रक्षा मंत्रालय',
      linkGem: 'गवर्नमेंट ई-मार्केटप्लेस (GeM)',
      linkCppp: 'केंद्रीय लोक खरीद पोर्टल (CPPP)',
      linkBro: 'सीमा सड़क संगठन (BRO)',
      linkImd: 'भारत मौसम विज्ञान विभाग (IMD)',

      // Hero
      heroOfficialBadge: 'भारतीय सेना आपूर्ति • INDIAN ARMY LOGISTICS',
      heroHeadline: 'पूर्वानुमानित रसद एवं अग्रिम आपूर्ति',
      heroDesc: 'स्वायत्त एआई आपूर्ति श्रृंखला बुद्धिमत्ता जो केंद्रीय आयुध डिपो से उच्च तुंगता वाली अग्रिम चौकियों तक निर्बाध आपूर्ति समन्वित करती है।',
      heroAccessPortal: 'पोर्टल एक्सेस करें',
      heroExplore: 'सेना आपूर्ति अन्वेषण करें',

      // Statistics / Impact
      metricRegisteredUnits: 'पंजीकृत इकाइयाँ',
      metricRegisteredUnitsSub: 'सभी 7 कमानों में परस्पर जुड़ी हुई',
      metricActiveMovements: 'सक्रिय रसद आवागमन',
      metricActiveMovementsSub: 'काफिले एवं एयर-ड्रॉप समकालिक',
      metricSupplyReadiness: 'आपूर्ति तत्परता',
      metricSupplyReadinessSub: 'सभी अग्रिम संरचनाओं में सुनिश्चित',
      metricPredictiveCoverage: 'पूर्वानुमानित कवरेज',
      metricPredictiveCoverageSub: 'उत्तरी एवं पूर्वी सीमा रक्षा',

      // Strategic Mandate & Core Pillars
      mandateTag: 'रणनीतिक अधिदेश एवं क्षमताएं',
      mandateTitle: 'मिशन एवं आपूर्ति उत्कृष्टता के चार स्तंभ',
      mandateLead: 'स्वायत्त एआई समन्वय और रीयल-टाइम टेलीमेट्री के माध्यम से रणनीतिक डिपो और अग्रिम क्षेत्रों के बीच अंतर को पाटना',
      mandateEthosHindi: 'सदैव आपूर्ति • सदैव समर्थन',
      mandateEthosEng: 'INTELLIGENT SUPPLY • ASSURED READINESS',
      mandateDefcon: 'सक्रिय थिएटर तत्परता',
      mandateHeadline: 'पूर्वानुमानित युद्ध संपोषण',
      mandatePara: 'भारतीय सेना का केंद्रीयकृत एआई-संचालित पूर्वानुमानित रसद समन्वय मंच है। यह आपूर्ति श्रृंखला की बाधाओं को समाप्त करता है और उत्तरी व पूर्वी सीमावर्ती थिएटरों में निर्बाध युद्ध संपोषण की गारंटी देता है—राशन (वर्ग I), ईंधन पीओएल (वर्ग III), गोला-बारूद (वर्ग V), और उपकरण स्पेयर (वर्ग IX) के बहुस्तरीय मांग अनुमानों को स्वचालित करता है।',
      mandateStat1Label: 'बहु-कमान दृश्यता',
      mandateStat2Label: 'महत्वपूर्ण कमी सहिष्णुता',
      mandateStat2Val: 'शून्य',
      mandateStat3Label: 'अग्रिम बफर चेतावनी',
      mandateStat3Val: '30–90 दिन',
      pillar1Badge: 'स्तंभ ०१',
      pillar1Heading: 'मांग का पूर्वानुमान',
      pillar2Badge: 'स्तंभ ०२',
      pillar2Heading: 'सटीक आवागमन',
      pillar3Badge: 'स्तंभ ०३',
      pillar3Heading: 'उपलब्धता सुनिश्चितता',
      pillar4Badge: 'स्तंभ ०४',
      pillar4Heading: 'परिचालन तत्परता',

      // Jarvis Autonomous C4ISR Workflow
      jarvisPill: 'स्वायत्त C4ISR कार्यप्रणाली',
      jarvisTitle: 'सेना आपूर्ति कैसे कार्य करती है',
      jarvisActive: 'सक्रिय',
      workflowStage_1: 'यूनिट टेलीमेट्री',
      workflowStage_2: 'डेटा एकीकरण',
      workflowStage_3: 'एआई पूर्वानुमान',
      workflowStage_4: 'जोखिम विश्लेषण',
      workflowStage_5: 'मार्ग प्रेषण',
      workflowStage_6: 'सुनिश्चित वितरण',

      // Official Circulars & News
      newsTag: 'आधिकारिक परिपत्र',
      newsTitle: 'रक्षा सूचना एवं बुलेटिन',
      newsLead: 'डीजीओएस निर्देश, प्रणाली संवर्द्धन और महत्वपूर्ण परिचालन परिपत्र',
      newsTabAnnouncements: 'घोषणाएँ',
      newsTabUpdates: 'सिस्टम अपडेट',
      newsTabNotices: 'महत्वपूर्ण सूचनाएं',
      circ1Tag: 'परिपत्र 42/2026',
      circ1Clearance: 'अवर्गीकृत // रक्षा व्यापी',
      circ1Title: 'उत्तरी एवं पूर्वी थिएटरों के लिए शीतकालीन भंडारण सत्यापन पूर्ण',
      circ1Desc: 'मास्टर जनरल ऑफ सस्टिनेंस (MGS) शाखा ने मौसमी पर्वतीय दर्रे बंद होने से पहले 14, 15, 16 और 4 कोर में सब-जीरो एचएसडी और उच्च तुंगता राशन के 100% अग्रिम भंडारण को प्रमाणित किया है।',
      circ1Date: 'प्रकाशित: 04 अक्टूबर 2026 • डीजीओएस निदेशालय',
      circ1Auth: 'एमजीएस मुख्यालय द्वारा सत्यापित',
      circ2Tag: 'सिस्टम रिलीज v4.8',
      circ2Clearance: 'एस्कॉन C4ISR प्रोटोकॉल',
      circ2Title: 'सेला सुरंग अक्ष पर न्यूरल दर्रा मौसम पूर्वानुमान की तैनाती',
      circ2Desc: 'सेना आपूर्ति v4.8 स्वचालित आईएमडी डॉपलर रडार एकीकरण को सक्रिय करता है जो पूर्वी कमान के काफिलों हेतु 72 घंटे पहले बर्फबारी की संभावना का पूर्वानुमान लगाता है।',
      circ2Date: 'प्रकाशित: 01 अक्टूबर 2026 • सेना साइबर लॉजिस्टिक्स ग्रुप',
      circ2Auth: 'सिस्टम अपग्रेड लागू',
      circ3Tag: 'तात्कालिक सूचना',
      circ3Clearance: 'अनिवार्य अनुपालन',
      circ3Title: 'फील्ड मांग वाउचरों का क्रिप्टोग्राफ़िक एस्कॉन हस्ताक्षरों में स्थानांतरण',
      circ3Desc: 'सभी रेजिमेंटल क्वार्टरमास्टरों को विशेष रूप से सेना आपूर्ति यूनिट पोर्टल के माध्यम से पुनःपूर्ति मांग पत्र दाखिल करना होगा। सेना आदेश AO-18/2026 के तहत हस्तलिखित मांग पत्र बंद कर दिए गए हैं।',
      circ3Date: 'प्रकाशित: 28 सितंबर 2026 • एडजुटेंट जनरल शाखा',
      circ3Auth: 'वैधानिक निर्देश',

      // Downloads Section
      dlTag: 'प्रकाशन एवं संपत्तियां',
      dlTitle: 'आधिकारिक रक्षा डाउनलोड एवं दस्तावेज़',
      dlLead: 'आधिकारिक रक्षा नियमावली, त्वरित शुरुआत गाइड और सामरिक मोबाइल एप्लिकेशन डाउनलोड करें',
      dlBtnPdf: 'पीडीएफ डाउनलोड करें',
      dlBtnApk: 'एपीके डाउनलोड करें',
      dl1Title: 'उपयोगकर्ता नियमावली: सेना आपूर्ति समग्र मैनुअल v4.8',
      dl1Desc: 'कमान और यूनिट रसद अधिकारियों के लिए प्रणाली संचालन का 180 पृष्ठों का संपूर्ण संदर्भ मैनुअल।',
      dl1Meta: 'पीडीएफ • 8.4 एमबी • आधिकारिक रक्षा नियमावली',
      dl2Title: 'त्वरित शुरुआत गाइड: सामरिक फील्ड टर्मिनल सेटअप',
      dl2Desc: 'फील्ड टैबलेट और एस्कॉन उपग्रह ट्रांसपोंडर स्थापित करने के लिए चरण-दर-चरण त्वरित गाइड।',
      dl2Meta: 'पीडीएफ • 2.1 एमबी • त्वरित शुरुआत कार्ड',
      dl3Title: 'मोबाइल ऐप: रग्डाइज्ड एंड्रॉइड फील्ड क्लाइंट एपीके',
      dl3Desc: 'सैन्य हैंडहेल्ड टर्मिनलों के लिए ऑफ़लाइन स्टोर स्कैनिंग सुविधाओं से युक्त आधिकारिक एपीके।',
      dl3Meta: 'एपीके • 42 एमबी • संस्करण 3.4.1',
      dl4Title: 'दस्तावेज़ीकरण: तकनीकी वास्तुकला एवं एपीआई श्वेतपत्र',
      dl4Desc: 'क्रिप्टोग्राफ़िक हैंडशेक, एस्कॉन प्रोटोकॉल और डेटाबेस स्कीमा का तकनीकी अवलोकन।',
      dl4Meta: 'पीडीएफ • 4.8 एमबी • आर्मी साइबर लॉजिस्टिक्स',

      // Support & Help Centre
      supTag: '24x7 तकनीकी सहायता',
      supTitle: 'सहायता एवं सहायता केंद्र',
      supLead: 'चोबीसों घंटे रक्षा रसद सहायता, समस्या निवारण और स्वचालित हेल्पलाइन',
      supReportIssue: 'परिचालन समस्या दर्ज करें',
      supAsconOnline: 'एस्कॉन डेस्क ऑनलाइन',
      supOfficerName: 'अधिकारी / ऑपरेटर का नाम',
      supServiceNo: 'सेना सेवा संख्या',
      supCategory: 'समस्या श्रेणी',
      supCatVoucher: 'वाउचर ट्रैकिंग / मांग में देरी',
      supCatConvoy: 'काफिला जीपीएस टेलीमेट्री ऑफलाइन',
      supCatStock: 'डिपो स्टॉक समाधान विसंगति',
      supCatSec: 'खाता सुरक्षा / पहुंच अनुमति',
      supIssueDetails: 'समस्या विवरण एवं संदर्भ संख्या',
      supSubmitTicket: 'सहायता टिकट दर्ज करें ➔',
      supHotlines: 'सहायता केंद्र एवं तकनीकी हेल्पलाइन',
      supActive247: '24x7 सक्रिय',
      supHl1Label: 'सेना मुख्यालय 24x7 नियंत्रण कक्ष',
      supHl1Sub: 'सभी सैन्य सर्किलों में टोल-फ्री',
      supHl2Label: 'उत्तरी कमान ऑप्स सेल',
      supHl2Sub: 'समर्पित सुरक्षित रक्षा एक्सचेंज',
      supHl3Label: 'तकनीकी हेल्पडेस्क (सिग्नल कोर)',
      supHl3Sub: 'टिकट प्रतिक्रिया समय: < 30 मिनट',
      supHl4Label: 'वर्ग-V गोला-बारूद आपातकालीन हेल्पलाइन',
      supHl4Sub: 'त्वरित पुनःपूर्ति प्राधिकरण',

      // About & Official Contact Directory
      aboutTag: 'डीजीओएस संपोषण अधिदेश',
      aboutTitle: 'सेना आपूर्ति के बारे में एवं आधिकारिक संपर्क',
      aboutLead: 'भारतीय सेना की संप्रभु एआई पूर्वानुमानित रसद प्रणाली',
      aboutHqBadge: 'रक्षा मंत्रालय का एकीकृत मुख्यालय (सेना) • एमजीएस शाखा',
      aboutPanelTitle: 'स्वायत्त रक्षा संपोषण',
      aboutStatement: 'आयुध सेवा महानिदेशालय (DGOS) द्वारा विकसित केंद्रीयकृत एआई-संचालित रसद आधारशिला है। यह परिचालन कमानों, केंद्रीय आयुध डिपो और उच्च तुंगता वाली अग्रिम चौकियों को एक रीयल-टाइम पूर्वानुमानित पुनःपूर्ति नेटवर्क से जोड़ती है।',
      tenet1Title: '30–90 दिन अग्रिम बफर',
      tenet1Desc: 'शीतकालीन दर्रे बंद होने से पूर्व न्यूरल मांग पूर्वानुमान',
      tenet2Title: 'शून्य गंभीर कमी',
      tenet2Desc: 'वर्ग I से IX तक सभी स्टोर्स में स्वायत्त इन्वेंटरी पुनर्संतुलन',
      tenet3Title: 'एस्कॉन सैन्य एन्क्रिप्शन',
      tenet3Desc: 'संप्रभु बुनियादी ढांचे पर प्रमाणित सैन्य-ग्रेड टेलीमेट्री',
      govDgos: 'डीजीओएस सचिवालय',
      govCyber: 'आर्मी साइबर ग्रुप',
      govCert: 'सर्ट-इन ऑडिटेड',
      hubSecretariats: 'प्रमुख सचिवालय',
      secMgsLabel: 'मास्टर जनरल ऑफ सस्टिनेंस (MGS)',
      secMgsText: 'साउथ ब्लॉक, रक्षा मंत्रालय का एकीकृत मुख्यालय (सेना), नई दिल्ली - 110011',
      secDgosLabel: 'आयुध सेवा महानिदेशालय (DGOS)',
      secDgosText: 'वेस्ट ब्लॉक IV, आरके पुरम, नई दिल्ली - 110066',
      sec247Label: '24x7 नियंत्रण सेल एवं हेल्पडेस्क',
      sec247Text: '1800-11-SENA (7362) • एस्कॉन-नेट नोड 4481',
      secGatewaysLabel: 'आधिकारिक इलेक्ट्रॉनिक गेटवे',
      quickChannel: 'आधिकारिक संचार माध्यम',
      fieldNameRank: 'पूरा नाम एवं पद',
      fieldDefEmail: 'रक्षा ईमेल आईडी',
      fieldMsg: 'संदेश / प्रश्न',
      btnTransmit: 'संचार प्रेषित करें ➔',

      // Footer
      footerMotto: 'सशक्त आपूर्ति, सुरक्षित भारत',
      footerSubMotto: 'हमारे बलों का संबल, राष्ट्र की सुरक्षा।',
      footerDesc: 'भारतीय सेना का स्वचालित पूर्वानुमानित रसद एवं आयुध संपोषण मंच। उच्च तुंगता और रेगिस्तानी युद्धक्षेत्रों में रणनीतिक डिपो से अग्रिम चौकियों तक निर्बाध आपूर्ति समन्वय को सक्षम बनाता है।',
      certCompliant: 'सर्ट-इन अनुपालन',
      certAdc: 'सेना डेटा केंद्र (ADC)',
      certGov: 'भारत सरकार',
      colNavPortals: 'नेविगेशन एवं पोर्टल',
      footHome: 'मुख्य पोर्टल',
      footAbout: 'सेना आपूर्ति के बारे में',
      footAiLogistics: 'एआई एवं पूर्वानुमानित एल्गोरिदम',
      footFeatures: 'रक्षा क्षमताएं',
      footCommand: 'कमांड / एडमिन पोर्टल',
      footUnit: 'यूनिट मांग पोर्टल',
      colResources: 'संसाधन एवं एसओपी',
      footSop: 'मानक संचालन प्रक्रियाएं (SOPs)',
      footWinter: 'शीतकालीन भंडारण प्रोटोकॉल 2026',
      footManual: 'सेना रसद नियमावली v4.2',
      footApk: 'फील्ड टैबलेट एपीके (ऑफलाइन क्लाइंट)',
      footBarcode: 'मांग टेम्पलेट एवं बारकोड',
      footTicket: 'रसद टिकट प्रणाली',
      colOpsRoom: '24x7 रसद संचालन कक्ष',
      labelHelpline: 'हेल्पलाइन:',
      labelArmyWan: 'आर्मी WAN:',
      labelHqs: 'मुख्यालय:',
      labelEmail: 'ईमेल:',
      footerManaged: 'पोर्टल सामग्री प्रबंधन: डीजीओएस, भारतीय सेना | अंतिम अद्यतन: 04 अक्टूबर 2026',
      footTerms: 'उपयोग की शर्तें',
      footPrivacy: 'गोपनीयता नीति',
      footSecurity: 'सुरक्षा दिशानिर्देश',
      footWebmaster: 'वेबमास्टर से संपर्क करें',
      copyright: '© 2026 सेना आपूर्ति पोर्टल, भारतीय सेना, रक्षा मंत्रालय, भारत सरकार। सर्वाधिकार सुरक्षित।'
    }
  };

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    try {
      localStorage.setItem('sena_lang', lang);
    } catch {
      // Local storage unavailable
    }
  }

  toggleLanguage() {
    const next = this.currentLang() === 'en' ? 'hi' : 'en';
    this.setLanguage(next);
  }

  t(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
  }
}

