const fs = require('fs');

// 1. Load full_merged_master.json
const master = JSON.parse(fs.readFileSync('scripts/full_merged_master.json', 'utf8'));

// 2. Add explicit overrides & screenshot guarantees
const explicitExtras = {
  "Severe Cold Wave Forecast": "भीषण शीतलहर का पूर्वानुमान",
  "Severe Cold Wave Forecast (-34°C) along Siachen - DBO Highway": "सियाचिन - डीबीओ राजमार्ग पर भीषण शीतलहर का पूर्वानुमान (-34°C)",
  "Predicted 28% Surge in Class I Rations & Winter Heating Fuel": "वर्ग I राशन एवं शीतकालीन हीटिंग ईंधन में 28% उछाल का पूर्वानुमान",
  "T-90 Tank Air Filtration Spares Reached Re-Order Threshold": "T-90 टैंक एयर फिल्ट्रेशन स्पेयर पुनः आदेश सीमा पर पहुंचे",
  "Zojila Pass Upper Sector Landslide Hazard Triggered": "ज़ोजिला दर्रा ऊपरी सेक्टर भूस्खलन खतरा सक्रिय हुआ",

  // Details
  "Satellite radar indicates 140 km/h blizzard winds starting in 36 hours. Road transit over Khardung La will be closed for at least 48 hours.": "उपग्रह रडार 36 घंटों में 140 किमी/घंटा की बर्फीली आंधी चलने का संकेत देता है। खारदुंग ला पर सड़क पारगमन कम से कम 48 घंटों के लिए बंद रहेगा।",
  "AI consumption prediction models detect early onset of mountain frost and deployment expansion along LAC border pickets.": "एआई खपत पूर्वानुमान मॉडल एलएसी सीमा चौकियों पर पर्वतीय पाले की शीघ्र शुरुआत और तैनाती विस्तार का पता लगाते हैं।",
  "Intense sandstorm operations accelerated filtration element wear to 84% of monthly buffer at 2 Armoured Regiment.": "तीव्र रेत के तूफान संचालन ने 2 आर्मर्ड रेजिमेंट में फिल्ट्रेशन तत्व घिसाव को मासिक बफर के 84% तक तेज कर दिया।",
  "Intense sandstorm operations accelerated filtration element wear to 84% of monthly buffer at 2 ARMOURED REGIMENT.": "तीव्र रेत के तूफान संचालन ने 2 आर्मर्ड रेजिमेंट में फिल्ट्रेशन तत्व घिसाव को मासिक बफर के 84% तक तेज कर दिया।",
  "Convoy HIMALAYA-9 encountered fresh rockfall and icing at Km 84. Upper axis temporarily restricted.": "काफिला हिमालय-9 को किमी 84 पर ताजी चट्टान गिरने और बर्फ जमने का सामना करना पड़ा। ऊपरी अक्ष अस्थायी रूप से प्रतिबंधित है।",

  // Recommended actions
  "Preposition 18,000L sub-zero POL and 300 emergency medical plasma packs to Partapur & Shyok forward nodes via Convoy GARUDA-01 immediately.": "काफिला गरुड़-01 के माध्यम से तुरंत परतापुर एवं श्योक अग्रिम नोड्स पर 18,000 लीटर सब-जीरो पीओएल और 300 आपातकालीन मेडिकल प्लाज्मा पैक पहले से तैनात करें।",
  "Augment Narangi-Tawang convoy frequency from bi-weekly to tri-weekly. Dispatch additional 40 tonnes dry rations.": "नारंगी-तवांग काफिले की आवृत्ति द्वि-साप्ताहिक से बढ़ाकर त्रि-साप्ताहिक करें। अतिरिक्त 40 टन सूखा राशन रवाना करें।",
  "Trigger automatic release order from COD Jabalpur for 120 filter assemblies via Convoy CHETAK-2.": "काफिला चेतक-2 के माध्यम से 120 फिल्टर असेंबली हेतु सीओडी जबलपुर से स्वचालित रिलीज ऑर्डर जारी करें।",
  "Activate BRO Secondary Tunnel Bypass at Nilgrath. Re-route 34 vehicles with military police escort.": "नीलग्रथ पर बीआरओ द्वितीयक सुरंग बाईपास सक्रिय करें। सैन्य पुलिस सुरक्षा के साथ 34 वाहनों को पुनः मार्ग दें।",

  // Badges & Labels
  "Demand Surge": "मांग में उछाल",
  "Stock Critical": "स्टॉक संकटपूर्ण",
  "Route Disruption": "मार्ग व्यवधान",
  "Weather Risk": "मौसम जोखिम",
  "Convoy Bottleneck": "काफिला गतिरोध",
  "Critical": "अति-गंभीर",
  "High": "उच्च",
  "Medium": "मध्यम",
  "Low": "निम्न",
  "Informational": "सूचनात्मक",
  "AUTHORIZED": "अधिकृत",
  "AWAITING AUTHORIZATION": "अनुमोदन की प्रतीक्षा",
  "ACTION REQUIRED": "कार्रवाई आवश्यक",
  "ALL DIRECTIVES SYNCED": "सभी निर्देश सिंक किए गए",
  "Recommended Action:": "अनुशंसित कार्रवाई:",
  "Authorize Suggested Action": "सुझाई गई कार्रवाई अधिकृत करें",
  "✓ Authorized & Synced in DB": "✓ अधिकृत एवं डेटाबेस में सिंक",
  "View Explanation Panel": "विवरण पैनल देखें",
  "Critical Logistics Alerts": "गंभीर रसद अलर्ट",

  // Locations & Theaters
  "Tawang Sector (Arunachal)": "तवांग सेक्टर (अरुणाचल)",
  "Desert Sector (Rajasthan)": "रेगिस्तानी सेक्टर (राजस्थान)",
  "Zojila Axis": "ज़ोजिला अक्ष",
  "Ladakh - Siachen Axis": "लद्दाख - सियाचिन अक्ष",
  "Eastern Command": "पूर्वी कमान",
  "Western Command": "पश्चिमी कमान",
  "Northern Command": "उत्तरी कमान",
  "Southern Command": "दक्षिणी कमान",
  "Central Command": "मध्य कमान",
  "South Western Command": "दक्षिण पश्चिमी कमान",
  "Training Command (ARTRAC)": "प्रशिक्षण कमान (आरट्रैक)",
  "Army Training Command": "सेना प्रशिक्षण कमान",
  "2 Armoured Regiment": "2 आर्मर्ड रेजिमेंट",
  "2 ARMOURED REGIMENT": "2 आर्मर्ड रेजिमेंट",
  "8 GARHWAL RIFLES": "8 गढ़वाल राइफल्स",
  "3 PARA (SF) & 14 RAJPUT": "3 पैरा (एसएफ) एवं 14 राजपूत",

  // Supply types
  "Class I Rations & Kerosene Fuel": "वर्ग I राशन एवं केरोसिन ईंधन",
  "Class I Rations & Winter Heating Fuel": "वर्ग I राशन एवं शीतकालीन हीटिंग ईंधन",
  "Class IX T-90 High-Dust Filtration Assemblies": "वर्ग IX T-90 उच्च-धूल फिल्ट्रेशन असेंबली",
  "Class III Winter Sub-Zero POL & Fresh Medical Plasma": "वर्ग III शीतकालीन सब-जीरो पीओएल एवं ताजा मेडिकल प्लाज्मा"
};

for (const [k, v] of Object.entries(explicitExtras)) {
  master[k] = v;
}

console.log('Total entries in final master dictionary:', Object.keys(master).length);

// 3. Read original language.service.ts
const langServicePath = 'src/app/services/language.service.ts';
let code = fs.readFileSync(langServicePath, 'utf8');
const isCrlf = code.includes('\r\n');
const nl = isCrlf ? '\r\n' : '\n';

// Extract the section after DASHBOARD_TRANSLATIONS closing brace
const classStartIdx = code.indexOf('@Injectable({');
if (classStartIdx === -1) {
  console.error('Could not find @Injectable in language.service.ts');
  process.exit(1);
}

// Generate new DASHBOARD_TRANSLATIONS block
const dtLines = ['export const DASHBOARD_TRANSLATIONS: Record<string, string> = {'];
for (const [k, v] of Object.entries(master)) {
  const escK = k.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  const escV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  dtLines.push(`  '${escK}': '${escV}',`);
}
dtLines.push('};');
const newDtCode = dtLines.join(nl);

// Read the class part
let classPart = code.substring(classStartIdx);

// Now construct the complete new methods for LanguageService:
// We will replace methods from `setLanguage` down to the end of the class.
const setLangIdx = classPart.indexOf('setLanguage(lang: Language) {');
if (setLangIdx === -1) {
  console.error('Could not find setLanguage in classPart');
  process.exit(1);
}

const beforeSetLang = classPart.substring(0, setLangIdx);

const newMethods = `setLanguage(lang: Language) {
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
    if (lang === 'hi') {
      return this.translateText(key);
    }
    return this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
  }

  translateText(text: string): string {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return text;

    // 1. Direct dictionary match (exact full label, sentence, or phrase)
    if (DASHBOARD_TRANSLATIONS[trimmed]) {
      return text.replace(trimmed, DASHBOARD_TRANSLATIONS[trimmed]);
    }
    if (this.translations['hi']?.[trimmed]) {
      return text.replace(trimmed, this.translations['hi'][trimmed]);
    }

    // 2. Delimiter-separated composite translation (e.g. "Western Command • Desert Sector (Rajasthan)")
    if (trimmed.includes(' • ')) {
      const parts = trimmed.split(' • ');
      const translatedParts = parts.map(p => this.translateText(p));
      const res = translatedParts.join(' • ');
      if (res !== trimmed) return text.replace(trimmed, res);
    }
    if (trimmed.includes(' | ')) {
      const parts = trimmed.split(' | ');
      const translatedParts = parts.map(p => this.translateText(p));
      const res = translatedParts.join(' | ');
      if (res !== trimmed) return text.replace(trimmed, res);
    }
    if (trimmed.includes(' / ')) {
      const parts = trimmed.split(' / ');
      const translatedParts = parts.map(p => this.translateText(p));
      const res = translatedParts.join(' / ');
      if (res !== trimmed) return text.replace(trimmed, res);
    }

    // 3. Dynamic patterns (timestamps, dates, counters, status badges)
    const mToday = trimmed.match(/^Today\\s+(\\d\\d:\\d\\d)\\s*hrs$/i);
    if (mToday) return text.replace(trimmed, \`आज \${mToday[1]} बजे\`);

    const mTimeHrs = trimmed.match(/^(\\d\\d:\\d\\d)\\s*hrs$/i);
    if (mTimeHrs) return text.replace(trimmed, \`\${mTimeHrs[1]} बजे\`);

    const mMin = trimmed.match(/^(\\d+)\\s+mins?\\s+ago$/i);
    if (mMin) return text.replace(trimmed, \`\${mMin[1]} मिनट पहले\`);

    const mHr = trimmed.match(/^(\\d+)\\s+hrs?\\s+ago$/i);
    if (mHr) return text.replace(trimmed, mHr[1] === '1' ? '1 घंटा पहले' : \`\${mHr[1]} घंटे पहले\`);

    const mDay = trimmed.match(/^(\\d+)\\s+days?\\s+ago$/i);
    if (mDay) return text.replace(trimmed, \`\${mDay[1]} दिन पहले\`);

    const mHrsMins = trimmed.match(/^(\\d+)\\s+hrs?\\s+(\\d+)\\s+mins?$/i);
    if (mHrsMins) return text.replace(trimmed, \`\${mHrsMins[1]} घंटे \${mHrsMins[2]} मिनट\`);

    const mHrsOnly = trimmed.match(/^(\\d+)\\s+hrs?$/i);
    if (mHrsOnly) return text.replace(trimmed, \`\${mHrsOnly[1]} घंटे\`);

    const mMinsOnly = trimmed.match(/^(\\d+)\\s+mins?$/i);
    if (mMinsOnly) return text.replace(trimmed, \`\${mMinsOnly[1]} मिनट\`);

    const mSync = trimmed.match(/^Sync:\\s*(.*)$/i);
    if (mSync) return text.replace(trimmed, 'सिंक: ' + this.translateText(mSync[1]));

    const mEta = trimmed.match(/^ETA\\s*(.*)$/i);
    if (mEta) return text.replace(trimmed, 'आगमन: ' + this.translateText(mEta[1]));

    const mPriority = trimmed.match(/^([A-Za-z]+)\\s+PRIORITY$/i);
    if (mPriority) return text.replace(trimmed, \`\${this.translateText(mPriority[1])} प्राथमिकता\`);

    const mPending = trimmed.match(/^([A-Za-z0-9]+)\\s+PENDING$/i);
    if (mPending) return text.replace(trimmed, \`\${this.translateText(mPending[1])} लंबित\`);

    const mActiveCount = trimmed.match(/^(\\d+)\\s+ACTIVE$/i);
    if (mActiveCount) return text.replace(trimmed, \`\${mActiveCount[1]} सक्रिय\`);

    const mTriggers = trimmed.match(/^(\\d+)\\s+TRIGGERS$/i);
    if (mTriggers) return text.replace(trimmed, \`\${mTriggers[1]} ट्रिगर\`);

    const mConf = trimmed.match(/^(\\d+(\\.\\d+)?)%\\s+CONFIDENCE$/i);
    if (mConf) return text.replace(trimmed, \`\${mConf[1]}% विश्वास\`);

    const mProb = trimmed.match(/^(\\d+(\\.\\d+)?)%\\s+PROBABILITY$/i);
    if (mProb) return text.replace(trimmed, \`\${mProb[1]}% संभाव्यता\`);

    const mElev = trimmed.match(/^Elevation:\\s*(.*)$/i);
    if (mElev) return text.replace(trimmed, 'ऊंचाई: ' + mElev[1]);

    const mReq = trimmed.match(/^(\\d+)\\s+req$/i);
    if (mReq) return text.replace(trimmed, \`\${mReq[1]} मांग पत्र\`);

    const mTrucks = trimmed.match(/^(\\d+)\\s+Trucks$/i);
    if (mTrucks) return text.replace(trimmed, \`\${mTrucks[1]} ट्रक\`);

    const mItems = trimmed.match(/^(\\d+)\\s+Items$/i);
    if (mItems) return text.replace(trimmed, \`\${mItems[1]} आइटम\`);

    const mDays = trimmed.match(/^(\\d+)\\s+Days$/i);
    if (mDays) return text.replace(trimmed, \`\${mDays[1]} दिन\`);

    const mKmH = trimmed.match(/^(\\d+)\\s+km\\/h$/i);
    if (mKmH) return text.replace(trimmed, \`\${mKmH[1]} किमी/घंटा\`);

    const mAllPasses = trimmed.match(/^All Passes \\((\\d+)\\)$/i);
    if (mAllPasses) return text.replace(trimmed, \`सभी दर्रे (\${mAllPasses[1]})\`);

    const mAllCargo = trimmed.match(/^All Cargo \\((\\d+)\\)$/i);
    if (mAllCargo) return text.replace(trimmed, \`सभी कार्गो (\${mAllCargo[1]})\`);

    const mAllCmds = trimmed.match(/^All Commands \\((\\d+)\\)$/i);
    if (mAllCmds) return text.replace(trimmed, \`सभी कमान (\${mAllCmds[1]})\`);

    const mAllPortals = trimmed.match(/^All Portals \\((\\d+)\\)$/i);
    if (mAllPortals) return text.replace(trimmed, \`सभी पोर्टल (\${mAllPortals[1]})\`);

    const mAllAdv = trimmed.match(/^All Advisories \\((\\d+)\\)$/i);
    if (mAllAdv) return text.replace(trimmed, \`सभी परामर्श (\${mAllAdv[1]})\`);

    const mActiveConv = trimmed.match(/^ACTIVE CONVOYS \\((\\d+)\\)$/i);
    if (mActiveConv) return text.replace(trimmed, \`सक्रिय काफिले (\${mActiveConv[1]})\`);

    const mCritAlerts = trimmed.match(/^Critical Logistics Alerts \\((\\d+)\\)$/i);
    if (mCritAlerts) return text.replace(trimmed, \`गंभीर रसद अलर्ट (\${mCritAlerts[1]})\`);

    // 4. Label with colon (e.g. "Recommended Action: ...")
    const colonIdx = trimmed.indexOf(': ');
    if (colonIdx > 0 && colonIdx < 35) {
      const prefix = trimmed.substring(0, colonIdx + 1);
      const rest = trimmed.substring(colonIdx + 2);
      const transPrefix = DASHBOARD_TRANSLATIONS[prefix] || (DASHBOARD_TRANSLATIONS[prefix.slice(0, -1)] ? DASHBOARD_TRANSLATIONS[prefix.slice(0, -1)] + ':' : prefix);
      const transRest = this.translateText(rest);
      if (transPrefix !== prefix || transRest !== rest) {
        return text.replace(trimmed, \`\${transPrefix} \${transRest}\`);
      }
    }

    return text;
  }

  private isTranslating = false;
  private observer: MutationObserver | null = null;
  private originalTextMap = new Map<Node, string>();

  private initDomTranslator() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Reactively run when currentLang changes
    effect(() => {
      const lang = this.currentLang();
      this.applyDomTranslations(lang);
    });

    // Observe DOM mutations to translate dynamic changes (route / tab / modal changes)
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => {
        if (this.currentLang() === 'hi' && !this.isTranslating) {
          this.debounceTranslate();
        }
      });

      const startObserver = () => {
        if (document.body && this.observer) {
          this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false
          });
        }
      };

      if (document.body) {
        startObserver();
      } else {
        window.addEventListener('DOMContentLoaded', startObserver);
      }
    }
  }

  private debounceTimer: any = null;
  private debounceTranslate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.currentLang() === 'hi') {
        this.applyDomTranslations('hi');
      }
    }, 120);
  }

  private applyDomTranslations(lang: Language) {
    if (typeof document === 'undefined' || !document.body) return;
    this.isTranslating = true;

    try {
      if (lang === 'en') {
        // Restore original English text
        this.originalTextMap.forEach((origText, node) => {
          if (node.parentNode) {
            node.textContent = origText;
          }
        });
        this.originalTextMap.clear();

        // Also restore placeholder and title attributes
        document.querySelectorAll<HTMLElement>('[data-orig-placeholder]').forEach(el => {
          const orig = el.getAttribute('data-orig-placeholder');
          if (orig) {
            el.setAttribute('placeholder', orig);
            el.removeAttribute('data-orig-placeholder');
          }
        });
        document.querySelectorAll<HTMLElement>('[data-orig-title]').forEach(el => {
          const orig = el.getAttribute('data-orig-title');
          if (orig) {
            el.setAttribute('title', orig);
            el.removeAttribute('data-orig-title');
          }
        });
        return;
      }

      // Translate placeholders on inputs and textareas
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]').forEach(el => {
        const ph = el.getAttribute('placeholder');
        if (ph && !el.hasAttribute('data-orig-placeholder')) {
          el.setAttribute('data-orig-placeholder', ph);
          const tr = this.translateText(ph);
          if (tr !== ph) el.setAttribute('placeholder', tr);
        }
      });

      // Walk text nodes and translate
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'textarea', 'input', 'code', 'pre', 'select'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('.not-translatable') || parent.isContentEditable) {
              return NodeFilter.FILTER_REJECT;
            }
            const text = node.textContent?.trim();
            if (!text || text.length < 2) return NodeFilter.FILTER_SKIP;
            // Ignore pure numeric or symbol strings
            if (/^[\\d\\s.,:;()#%•|+\\-\\/°℃'"]+$/.test(text)) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodes: Node[] = [];
      let curr = walker.nextNode();
      while (curr) {
        nodes.push(curr);
        curr = walker.nextNode();
      }

      for (const node of nodes) {
        const raw = node.textContent || '';
        const translated = this.translateText(raw);
        if (translated !== raw) {
          if (!this.originalTextMap.has(node)) {
            this.originalTextMap.set(node, raw);
          }
          node.textContent = translated;
        }
      }
    } finally {
      this.isTranslating = false;
    }
  }
}
`;

// Combine whole file
const headerPart = `import { Injectable, signal, effect, computed } from '@angular/core';

export type Language = 'en' | 'hi';

${newDtCode}

`;

const finalCode = headerPart + beforeSetLang.trim() + '\n  ' + newMethods.trim() + '\n';
fs.writeFileSync(langServicePath, finalCode, 'utf8');
console.log('Successfully wrote updated language.service.ts!');
