import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'hi';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<Language>('en');

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
      navAbout: 'About SenaAapurti',
      navAboutContact: 'About & Contact',
      navAiLogistics: 'AI in Military Logistics',
      navFeatures: 'Features',
      navGuidelines: 'User Guidelines',
      navFaq: 'FAQ',
      navSupport: 'Support',
      navDownloads: 'Downloads',
      navContact: 'Contact Us',
      navPortals: 'Portals Access',

      // Hero
      heroTagline: 'INTELLIGENT SUPPLY. ASSURED READINESS.',
      heroPill1: 'Predict Demand',
      heroPill2: 'Optimize Movement',
      heroPill3: 'Ensure Availability',
      heroPill4: 'Strengthen Operational Readiness',

      // Mission banner
      missionText: 'SenaAapurti is an integrated, AI-powered logistics platform that enables real-time supply management, demand forecasting, route optimization and operational readiness for Indian Army units. It connects units, depots and command centres to ensure timely, efficient and secure delivery of critical supplies across all terrains.',

      // Portals
      commandPortalTitle: 'COMMAND / ADMIN PORTAL',
      commandPortalDesc: 'For Army Command, Logistics Headquarters and Authorized Administrators',
      unitPortalTitle: 'UNIT PORTAL',
      unitPortalDesc: 'For Individual Army Units and Formations',
      portalLoginBtn: 'Login',

      // Tagline
      footerMotto: 'सशक्त आपूर्ति, सुरक्षित भारत',
      footerSubMotto: 'SUPPORTING OUR FORCES, STRENGTHENING THE NATION.',
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
      navAbout: 'सेना आपूर्ति के बारे में',
      navAboutContact: 'परिचय एवं संपर्क सूत्र',
      navAiLogistics: 'सैन्य रसद में एआई',
      navFeatures: 'विशेषताएं',
      navGuidelines: 'उपयोगकर्ता दिशानिर्देश',
      navFaq: 'सामान्य प्रश्न (FAQ)',
      navSupport: 'सहायता',
      navDownloads: 'डाउनलोड',
      navContact: 'संपर्क सूत्र',
      navPortals: 'पोर्टल एक्सेस',

      // Hero
      heroTagline: 'बुद्धिमान आपूर्ति। सुनिश्चित तत्परता।',
      heroPill1: 'मांग का पूर्वानुमान',
      heroPill2: 'सटीक आवागमन',
      heroPill3: 'उपलब्धता सुनिश्चितता',
      heroPill4: 'परिचालन तत्परता सुदृढ़ीकरण',

      // Mission banner
      missionText: 'सेना आपूर्ति एक एकीकृत, एआई-संचालित रसद मंच है जो भारतीय सेना की इकाइयों के लिए रीयल-टाइम आपूर्ति प्रबंधन, मांग पूर्वानुमान, मार्ग अनुकूलन और परिचालन तत्परता को सक्षम बनाता है। यह सभी इलाकों में महत्वपूर्ण आपूर्ति का सुरक्षित व त्वरित वितरण सुनिश्चित करता है।',

      // Portals
      commandPortalTitle: 'कमांड / एडमिन पोर्टल',
      commandPortalDesc: 'सेना कमान, रसद मुख्यालय और अधिकृत प्रशासकों के लिए',
      unitPortalTitle: 'यूनिट पोर्टल',
      unitPortalDesc: 'व्यक्तिगत सेना इकाइयों और संरचनाओं के लिए',
      portalLoginBtn: 'लॉग इन करें',

      // Tagline
      footerMotto: 'सशक्त आपूर्ति, सुरक्षित भारत',
      footerSubMotto: 'हमारे बलों का संबल, राष्ट्र की सुरक्षा।',
      copyright: '© 2026 सेना आपूर्ति पोर्टल, भारतीय सेना, रक्षा मंत्रालय, भारत सरकार। सर्वाधिकार सुरक्षित।'
    }
  };

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
  }

  toggleLanguage() {
    this.currentLang.update(lang => lang === 'en' ? 'hi' : 'en');
  }

  t(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
  }
}
