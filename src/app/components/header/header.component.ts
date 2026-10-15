import { Component, inject, computed, HostListener, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ThemeService, FontSize } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { UnitDatabaseService, ArmyUnit, ArmyCommand } from '../../services/unit-database.service';
import { LayoutService } from '../../services/layout.service';
import { LogisticsService } from '../../services/logistics.service';
import { FAQ_CATEGORIES } from '../../data/faq.data';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs/operators';

export interface SitemapItem {
  title: string;
  desc: string;
  code: string;
  route?: string;
  sectionId?: string;
  externalUrl?: string;
  queryParams?: Record<string, any>;
}

export interface SitemapCategory {
  id: string;
  title: string;
  badge: string;
  icon: string;
  items: SitemapItem[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Module' | 'Unit' | 'Command' | 'FAQ' | 'Public' | 'Auth' | 'External';
  icon: string;
  route?: string;
  queryParams?: Record<string, any>;
  sectionId?: string;
  externalUrl?: string;
  badge?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  langService = inject(LanguageService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  unitDbService = inject(UnitDatabaseService);
  layoutService = inject(LayoutService);
  logisticsService = inject(LogisticsService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.faqDropdownOpen = false;
      this.importantLinksOpen = false;
      this.mobileMenuOpen = false;
      this.showNotifications = false;
      this.userProfileOpen = false;
      this.commandProfileOpen = false;
    });
  }

  searchQuery = '';
  searchFocused = false;
  searchDropdownOpen = false;
  showPortalMenu = false;
  mobileMenuOpen = false;
  showUnitSelectorModal = false;
  showCommandSelectorModal = false;
  commandModalSearchQuery = '';
  showSitemapModal = false;
  sitemapSearchQuery = '';
  sitemapSelectedCategory = 'all';
  userProfileOpen = false;
  commandProfileOpen = false;
  tacticalModulesOpen = false;
  modalSearchQuery = '';
  modalSelectedCommand = 'All';
  faqDropdownOpen = false;
  faqCategories = FAQ_CATEGORIES;
  importantLinksOpen = false;
  showNotifications = false;
  unreadNotificationsCount = 4;

  tacticalModules = [
    { id: 'dashboard', label: 'Command Dashboard', route: '/command/dashboard', tag: 'LIVE', tagClass: 'live', desc: 'Real-time strategic operational posture & readiness' },
    { id: 'units', label: 'Unit Network', route: '/command/units', desc: 'Formations, corps & station garrison directory' },
    { id: 'inventory', label: 'National Inventory', route: '/command/inventory', desc: 'Central ordnance echelons, munitions & depot reserves' },
    { id: 'forecasting', label: 'Demand & Forecasting', route: '/command/forecasting', desc: 'Predictive seasonal consumption & stockpile AI models' },
    { id: 'logistics', label: 'Logistics Movement', route: '/command/logistics', desc: 'Active convoys, choke points & transit corridors' },
    { id: 'intelligence', label: 'Route & Weather Intel', route: '/command/intelligence', desc: 'High-altitude passes, avalanche alerts & satellite feeds' },
    { id: 'recommendations', label: 'Strategic Advisory', route: '/command/recommendations', tag: '4', tagClass: 'alert', desc: 'C4ISR high-priority logistical intervention alerts' },
    { id: 'simulation', label: 'What-If Simulation', route: '/command/simulation', desc: 'Conflict theater war-gaming & disruption response' },
    { id: 'reports', label: 'Reports & Analytics', route: '/command/reports', desc: 'Executive intelligence briefings & audit trails' },
    { id: 'settings', label: 'Admin Settings', route: '/command/settings', desc: 'ASCON encryption protocols & access authorization' }
  ];

  modalFilteredUnits(): ArmyUnit[] {
    return this.unitDbService.allUnits.filter(u => {
      const matchCmd = this.modalSelectedCommand === 'All' || u.command.toLowerCase().includes(this.modalSelectedCommand.toLowerCase());
      const matchSearch = !this.modalSearchQuery || 
        u.name.toLowerCase().includes(this.modalSearchQuery.toLowerCase()) ||
        u.station.toLowerCase().includes(this.modalSearchQuery.toLowerCase()) ||
        u.sector.toLowerCase().includes(this.modalSearchQuery.toLowerCase()) ||
        u.corps.toLowerCase().includes(this.modalSearchQuery.toLowerCase());
      return matchCmd && matchSearch;
    });
  }
  importantLinks = [
    { title: 'Indian Army', key: 'linkIndianArmy', url: 'https://indianarmy.nic.in' },
    { title: 'Army Ordnance Corps (AOC)', key: 'linkAoc', url: 'https://joinindianarmy.nic.in' },
    { title: 'Ministry of Defence', key: 'linkMod', url: 'https://mod.gov.in' },
    { title: 'Government e-Marketplace (GeM)', key: 'linkGem', url: 'https://gem.gov.in' },
    { title: 'Central Public Procurement Portal (CPPP)', key: 'linkCppp', url: 'https://eprocure.gov.in/eprocure/app' },
    { title: 'Border Roads Organisation (BRO)', key: 'linkBro', url: 'https://bro.gov.in' },
    { title: 'India Meteorological Department (IMD)', key: 'linkImd', url: 'https://mausam.imd.gov.in' }
  ];

  // Reactively track current URL to determine portal mode
  private navEvents = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects || e.url)
    ),
    { initialValue: this.router.url }
  );

  portalMode = computed<'public' | 'command' | 'unit'>(() => {
    const url = this.navEvents() || this.router.url;
    if (url.startsWith('/command')) return 'command';
    if (url.startsWith('/unit')) return 'unit';
    return 'public';
  });

  isFaqActive = computed<boolean>(() => {
    const url = this.navEvents() || this.router.url;
    return url.startsWith('/faq');
  });

  // Dynamic header background image based on portal
  headerBgImage = computed<string>(() => {
    const mode = this.portalMode();
    if (mode === 'unit') {
      return this.unitDbService.selectedUnit().bgImage || '/images/sena_header_panoramic_slice.jpg';
    }
    return '/images/sena_header_panoramic_slice.jpg';
  });

  setFont(size: FontSize) {
    this.themeService.setFontSize(size);
  }

  toggleContrast() {
    this.themeService.toggleHighContrast();
  }

  toggleLang() {
    this.langService.toggleLanguage();
  }

  onSearchFocus() {
    this.searchFocused = true;
    if (this.searchQuery.trim().length >= 1) {
      this.searchDropdownOpen = true;
    }
  }

  onSearchBlur() {
    this.searchFocused = false;
  }

  onSearchInput() {
    this.searchDropdownOpen = this.searchQuery.trim().length >= 1;
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchDropdownOpen = false;
  }

  openFullSearchDirectory() {
    this.showSitemapModal = true;
    this.sitemapSearchQuery = this.searchQuery;
    this.sitemapSelectedCategory = 'all';
    this.searchDropdownOpen = false;
  }

  liveSearchResults(): SearchResultItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];
    const seen = new Set<string>();

    const addResult = (item: SearchResultItem) => {
      const key = (item.title + '|' + (item.route || item.sectionId || item.externalUrl || '')).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
    };

    // 1. Search Sitemap modules & pages
    for (const cat of this.sitemapCategories) {
      for (const itm of cat.items) {
        if (
          itm.title.toLowerCase().includes(q) ||
          itm.desc.toLowerCase().includes(q) ||
          itm.code.toLowerCase().includes(q)
        ) {
          const categoryName: SearchResultItem['category'] =
            cat.id === 'command' || cat.id === 'unit' ? 'Module' :
            cat.id === 'auth' ? 'Auth' :
            cat.id === 'external' ? 'External' : 'Public';

          addResult({
            id: itm.code,
            title: itm.title,
            subtitle: itm.desc,
            category: categoryName,
            icon: cat.icon,
            route: itm.route,
            queryParams: itm.queryParams,
            sectionId: itm.sectionId,
            externalUrl: itm.externalUrl,
            badge: itm.code
          });
        }
      }
    }

    // 2. Search Units
    for (const u of this.unitDbService.allUnits) {
      if (
        u.name.toLowerCase().includes(q) ||
        u.station.toLowerCase().includes(q) ||
        u.sector.toLowerCase().includes(q) ||
        u.corps.toLowerCase().includes(q) ||
        u.command.toLowerCase().includes(q)
      ) {
        addResult({
          id: u.id,
          title: u.name,
          subtitle: `${u.station} • ${u.sector} (${u.command})`,
          category: 'Unit',
          icon: '📍',
          route: '/unit/dashboard',
          badge: u.corps
        });
        if (results.length >= 10) break;
      }
    }

    // 3. Search Commands
    for (const cmd of this.unitDbService.allCommands) {
      if (
        cmd.name.toLowerCase().includes(q) ||
        cmd.hqStation.toLowerCase().includes(q) ||
        cmd.code.toLowerCase().includes(q) ||
        cmd.state.toLowerCase().includes(q)
      ) {
        addResult({
          id: cmd.code,
          title: cmd.name,
          subtitle: `HQ: ${cmd.hqStation}, ${cmd.state} • ${cmd.areaOfResponsibility}`,
          category: 'Command',
          icon: '🛡️',
          route: '/command/dashboard',
          badge: cmd.code
        });
      }
    }

    // 4. Search FAQs
    for (const cat of this.faqCategories) {
      for (const item of cat.items) {
        if (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
        ) {
          addResult({
            id: item.id,
            title: item.question,
            subtitle: `${cat.title} • ${item.badge || 'FAQ & Help Center'}`,
            category: 'FAQ',
            icon: '❓',
            route: `/faq/${cat.id}`,
            queryParams: { q: item.id },
            badge: cat.id.toUpperCase()
          });
          if (results.length >= 12) break;
        }
      }
    }

    return results.slice(0, 7);
  }

  navigateToSearchResult(item: SearchResultItem) {
    this.searchDropdownOpen = false;
    if (item.category === 'Unit') {
      const foundUnit = this.unitDbService.allUnits.find(u => u.id === item.id);
      if (foundUnit) {
        this.unitDbService.setSelectedUnit(foundUnit);
      }
    } else if (item.category === 'Command') {
      const foundCmd = this.unitDbService.allCommands.find(c => c.code === item.id);
      if (foundCmd) {
        this.unitDbService.setSelectedCommand(foundCmd);
      }
    }

    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (item.sectionId) {
      this.scrollToSection(item.sectionId);
    } else if (item.route) {
      this.router.navigate([item.route], { queryParams: item.queryParams });
    }
  }

  onSearch() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return;

    const results = this.liveSearchResults();
    if (results.length > 0) {
      this.navigateToSearchResult(results[0]);
      return;
    }

    const mode = this.portalMode();
    if (mode === 'unit') {
      if (q.includes('convoy') || q.includes('shipment') || q.includes('garuda') || q.includes('himalaya') || q.includes('logistics') || q.includes('truck')) {
        this.router.navigate(['/unit', 'logistics']);
      } else if (q.includes('weather') || q.includes('pass') || q.includes('snow') || q.includes('temp') || q.includes('zoji') || q.includes('khardung')) {
        this.router.navigate(['/unit', 'route-weather']);
      } else if (q.includes('indent') || q.includes('request') || q.includes('voucher') || q.includes('sos')) {
        this.router.navigate(['/unit', 'requests']);
      } else if (q.includes('surge') || q.includes('forecast') || q.includes('burn') || q.includes('fuel') || q.includes('ration') || q.includes('consumption')) {
        this.router.navigate(['/unit', 'consumption']);
      } else if (q.includes('intel') || q.includes('alert') || q.includes('hazard') || q.includes('sitrep')) {
        this.router.navigate(['/unit', 'ai-insights']);
      } else if (q.includes('report') || q.includes('ledger') || q.includes('audit')) {
        this.router.navigate(['/unit', 'reports']);
      } else if (q.includes('setting') || q.includes('profile') || q.includes('config')) {
        this.router.navigate(['/unit', 'settings']);
      } else {
        this.router.navigate(['/unit', 'inventory']);
      }
    } else if (mode === 'command') {
      if (q.includes('unit') || q.includes('formation') || q.includes('corps')) {
        this.router.navigate(['/command', 'units']);
      } else if (q.includes('convoy') || q.includes('shipment') || q.includes('movement')) {
        this.router.navigate(['/command', 'logistics']);
      } else if (q.includes('forecast') || q.includes('demand') || q.includes('burn')) {
        this.router.navigate(['/command', 'forecasting']);
      } else if (q.includes('intel') || q.includes('weather') || q.includes('pass')) {
        this.router.navigate(['/command', 'intelligence']);
      } else if (q.includes('simulation') || q.includes('scenario')) {
        this.router.navigate(['/command', 'simulation']);
      } else if (q.includes('report') || q.includes('analytics')) {
        this.router.navigate(['/command', 'reports']);
      } else if (q.includes('setting') || q.includes('admin') || q.includes('config')) {
        this.router.navigate(['/command', 'settings']);
      } else {
        this.router.navigate(['/command', 'inventory']);
      }
    } else {
      if (q.includes('faq') || q.includes('question') || q.includes('help') || q.includes('guide') || q.includes('dos') || q.includes('2fa') || q.includes('password')) {
        this.router.navigate(['/faq/general'], { queryParams: { q } });
      } else if (q.includes('feature') || q.includes('ai') || q.includes('capability') || q.includes('jarvis') || q.includes('autonomous')) {
        this.scrollToSection('core-capabilities');
      } else if (q.includes('download') || q.includes('app') || q.includes('apk') || q.includes('scanner') || q.includes('manual')) {
        this.scrollToSection('downloads');
      } else if (q.includes('about') || q.includes('dgos') || q.includes('history') || q.includes('mandate') || q.includes('mission')) {
        this.scrollToSection('about');
      } else if (q.includes('support') || q.includes('contact') || q.includes('helpline') || q.includes('ticket') || q.includes('feedback')) {
        this.scrollToSection('support');
      } else if (q.includes('login') || q.includes('register') || q.includes('auth') || q.includes('signin')) {
        this.router.navigate(['/auth']);
      } else if (q.includes('command') || q.includes('c2') || q.includes('headquarters')) {
        this.router.navigate(['/command/dashboard']);
      } else if (q.includes('unit') || q.includes('quartermaster')) {
        this.router.navigate(['/unit/dashboard']);
      } else {
        this.openFullSearchDirectory();
      }
    }
    this.searchDropdownOpen = false;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  scrollToSection(sectionId: string) {
    this.mobileMenuOpen = false;
    const currentUrl = this.router.url.split('#')[0].split('?')[0];
    if (currentUrl === '' || currentUrl === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate(['/'], { fragment: sectionId }).then(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            setTimeout(() => {
              const elRetry = document.getElementById(sectionId);
              if (elRetry) {
                elRetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 200);
          }
        }, 150);
      });
    }
  }

  toggleUnitSelector() {
    this.showUnitSelectorModal = !this.showUnitSelectorModal;
  }

  toggleCommandSelector() {
    this.showCommandSelectorModal = !this.showCommandSelectorModal;
  }

  modalFilteredCommands(): ArmyCommand[] {
    const q = this.commandModalSearchQuery.trim().toLowerCase();
    if (!q) return this.unitDbService.allCommands;
    return this.unitDbService.allCommands.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.hqStation.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      (c.shortName && c.shortName.toLowerCase().includes(q)) ||
      (c.areaOfResponsibility && c.areaOfResponsibility.toLowerCase().includes(q))
    );
  }

  selectCommand(cmd: ArmyCommand) {
    this.unitDbService.setSelectedCommand(cmd);
    this.showCommandSelectorModal = false;
  }

  toggleSitemapModal() {
    this.showSitemapModal = !this.showSitemapModal;
    if (this.showSitemapModal) {
      this.sitemapSearchQuery = '';
      this.sitemapSelectedCategory = 'all';
    }
  }

  closeSitemapModal() {
    this.showSitemapModal = false;
  }

  navigateToSitemapItem(item: SitemapItem) {
    this.closeSitemapModal();
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (item.sectionId) {
      this.scrollToSection(item.sectionId);
    } else if (item.route) {
      this.router.navigate([item.route], { queryParams: item.queryParams });
    }
  }

  sitemapCategories: SitemapCategory[] = [
    {
      id: 'command',
      title: 'Strategic Command & Control (C4ISR HQ)',
      badge: 'COMMAND PORTAL',
      icon: '🛡️',
      items: [
        { title: 'Command Dashboard (1.1)', desc: 'Real-time strategic operational posture, readiness & live map', route: '/command/dashboard', code: 'C2-01' },
        { title: 'Unit Network & Formations (1.2)', desc: 'Corps, divisions, brigades & station garrison directory', route: '/command/units', code: 'C2-02' },
        { title: 'National Central Inventory (1.3)', desc: 'Central ordnance echelons, munitions, Class I-V reserves', route: '/command/inventory', code: 'C2-03' },
        { title: 'Demand & Forecast Modeling (1.4)', desc: 'Seasonal AI consumption forecasts & replenishment projections', route: '/command/forecasting', code: 'C2-04' },
        { title: 'Logistics Convoy Movement (1.5)', desc: 'Active convoys, GPS telemetry, choke points & transit corridors', route: '/command/logistics', code: 'C2-05' },
        { title: 'Route Intelligence & Avalanche (1.6)', desc: 'High-altitude mountain passes, IMD snow telemetry & alerts', route: '/command/intelligence', code: 'C2-06' },
        { title: 'Strategic Advisory & Alerts (1.7)', desc: 'C4ISR priority alerts, DEFCON posture & logistical actions', route: '/command/recommendations', code: 'C2-07' },
        { title: 'What-If Simulation Engine (1.8)', desc: 'Conflict theater war-gaming, pass disruption & stock burn simulation', route: '/command/simulation', code: 'C2-08' },
        { title: 'Reports & Defense Analytics (1.9)', desc: 'Audited logistics statements, exportable CSV/PDF summaries', route: '/command/reports', code: 'C2-09' },
        { title: 'Admin & System Settings (1.10)', desc: 'ASCON encryption, security clearance & audit log configuration', route: '/command/settings', code: 'C2-10' },
      ]
    },
    {
      id: 'unit',
      title: 'Frontline Army Unit Logistics',
      badge: 'UNIT PORTAL',
      icon: '📍',
      items: [
        { title: 'Frontline Unit Dashboard (2.1)', desc: 'Unit readiness posture, days of supply & flash SOS alerts', route: '/unit/dashboard', code: 'UN-01' },
        { title: 'Unit Stores & Physical Ledger (2.2)', desc: 'Sub-depot store inventory, batch codes & item-level bin cards', route: '/unit/inventory', code: 'UN-02' },
        { title: 'Consumption & Days of Supply (2.3)', desc: 'Daily burn rate, winter scale calculation & reserve margins', route: '/unit/consumption', code: 'UN-03' },
        { title: 'Digital Supply Requisitions (2.4)', desc: 'Submit and track priority replenishment indents and e-vouchers', route: '/unit/requests', code: 'UN-04' },
        { title: 'Incoming Convoys & Tracking (2.5)', desc: 'Live inbound convoy milestones, driver telemetry & manifests', route: '/unit/logistics', code: 'UN-05' },
        { title: 'Route Hazards & Mountain Weather (2.6)', desc: 'Local sector pass status, sub-zero conditions & road closures', route: '/unit/route-weather', code: 'UN-06' },
        { title: 'Predictive Logistics Intel (2.7)', desc: 'Stock depletion AI warnings & dynamic reorder thresholds', route: '/unit/ai-insights', code: 'UN-07' },
        { title: 'Unit Reports & Daily Ledger (2.8)', desc: 'Daily consumption summaries, inspection vouchers & muster logs', route: '/unit/reports', code: 'UN-08' },
        { title: 'Unit Station & Profile Settings (2.9)', desc: 'Switch frontline garrisons (Leh, Tawang, Uri, etc.) & credentials', route: '/unit/settings', code: 'UN-09' },
      ]
    },
    {
      id: 'public',
      title: 'Public Portal & Knowledge Center',
      badge: 'PUBLIC ACCESS',
      icon: '🏛️',
      items: [
        { title: 'Official Home Page', desc: 'Main public entrance, mission highlights & national overview', sectionId: 'hero', code: 'PUB-01' },
        { title: 'Know SenaAapurti', desc: 'Comprehensive operational guide, architecture & user onboarding', route: '/know-sena-aapurti', code: 'PUB-02' },
        { title: 'Core Capabilities & Mission Pillars', desc: 'Real-time visibility, automated replenishment & high-altitude support', sectionId: 'core-capabilities', code: 'PUB-03' },
        { title: 'Autonomous Logistics Workflow (Jarvis HUD)', desc: 'Step-by-step operational pipeline from depot to forward post', sectionId: 'how-it-works', code: 'PUB-04' },
        { title: 'Downloads & Deployment Kits', desc: 'Android APK, Offline Barcode Scanner & Standard Ops Manual', sectionId: 'downloads', code: 'PUB-05' },
        { title: 'Help Center & Official FAQs', desc: 'Frequently asked questions across general, AI, and operations', route: '/faq/general', code: 'PUB-06' },
        { title: '24/7 Operations Support & Grievances', desc: 'Army WAN helpline, ASCON nodes & ticket submission portal', sectionId: 'support', code: 'PUB-07' },
        { title: 'About SenaAapurti & DGOS Directorate', desc: 'Ministry of Defence mandate, leadership & institutional history', sectionId: 'about', code: 'PUB-08' },
      ]
    },
    {
      id: 'auth',
      title: 'Secure Authentication & Access',
      badge: 'DEFENSE ACCESS',
      icon: '🔐',
      items: [
        { title: 'Strategic Command Officer Login', desc: 'Access C4ISR strategic command and national logistics network', route: '/auth', queryParams: { portal: 'command' }, code: 'AUTH-01' },
        { title: 'Unit Quartermaster Portal Login', desc: 'Access frontline unit inventory, daily consumption & indents', route: '/auth', queryParams: { portal: 'unit' }, code: 'AUTH-02' },
        { title: 'Official Defense Registration', desc: 'Register new authorized military officer or quartermaster account', route: '/auth/register', code: 'AUTH-03' },
        { title: 'ASCON Credential Reset', desc: 'Secure self-service password and military credential recovery', route: '/auth/forgot-password', code: 'AUTH-04' },
      ]
    },
    {
      id: 'external',
      title: 'Official External Defense Portals',
      badge: 'GOVERNMENT OF INDIA',
      icon: '🇮🇳',
      items: [
        { title: 'Indian Army Official Website', desc: 'Official portal of the Indian Army, headquarters & news', externalUrl: 'https://indianarmy.nic.in', code: 'GOV-01' },
        { title: 'Army Ordnance Corps (AOC)', desc: 'Official logistics, munitions & ordnance corps information', externalUrl: 'https://joinindianarmy.nic.in', code: 'GOV-02' },
        { title: 'Ministry of Defence (MoD)', desc: 'Apex government authority for Indian Armed Forces', externalUrl: 'https://mod.gov.in', code: 'GOV-03' },
        { title: 'Government e-Marketplace (GeM)', desc: 'National public procurement portal for defense supplies', externalUrl: 'https://gem.gov.in', code: 'GOV-04' },
        { title: 'Central Public Procurement (CPPP)', desc: 'Tender notifications, e-procurement & contracts', externalUrl: 'https://eprocure.gov.in/eprocure/app', code: 'GOV-05' },
        { title: 'Border Roads Organisation (BRO)', desc: 'Border infrastructure, road clearance & snow tunneling updates', externalUrl: 'https://bro.gov.in', code: 'GOV-06' },
        { title: 'India Meteorological Department (IMD)', desc: 'Official high-altitude weather bulletins, radar & forecasts', externalUrl: 'https://mausam.imd.gov.in', code: 'GOV-07' },
      ]
    }
  ];

  get sitemapTotalItemsCount(): number {
    return this.sitemapCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }

  modalFilteredSitemapCategories(): SitemapCategory[] {
    const q = this.sitemapSearchQuery.trim().toLowerCase();
    const cat = this.sitemapSelectedCategory;

    return this.sitemapCategories
      .filter(category => cat === 'all' || category.id === cat)
      .map(category => {
        if (!q) return category;
        const matchingItems = category.items.filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q)
        );
        return { ...category, items: matchingItems };
      })
      .filter(category => category.items.length > 0);
  }

  selectUnit(unit: ArmyUnit) {
    this.unitDbService.setSelectedUnit(unit);
    this.authService.currentUser.set({
      serviceNo: unit.serviceNo || 'IC-71044A',
      name: unit.officerName || 'Major Amit Sharma',
      rank: unit.officerRole || 'Quartermaster',
      unit: unit.name,
      command: `${unit.command} (${unit.corps})`,
      role: 'unit',
      clearanceLevel: 'SECRET - OPERATIONAL'
    });
    this.showUnitSelectorModal = false;
  }

  toggleFaqDropdown(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.faqDropdownOpen = !this.faqDropdownOpen;
    if (this.faqDropdownOpen) {
      this.importantLinksOpen = false;
    }
  }

  closeFaqDropdown() {
    this.faqDropdownOpen = false;
  }

  toggleImportantLinks(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.importantLinksOpen = !this.importantLinksOpen;
    if (this.importantLinksOpen) {
      this.faqDropdownOpen = false;
    }
  }

  closeImportantLinks() {
    this.importantLinksOpen = false;
  }

  onFaqSelect(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.mobileMenuOpen = false;
    setTimeout(() => {
      this.faqDropdownOpen = false;
    }, 120);
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  toggleNotifications(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.userProfileOpen = false;
      this.commandProfileOpen = false;
      this.tacticalModulesOpen = false;
    }
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  goToAlerts() {
    this.showNotifications = false;
    if (this.portalMode() === 'unit') {
      this.router.navigate(['/unit', 'ai-insights']);
    } else {
      this.router.navigate(['/command', 'recommendations']);
    }
  }

  goToSettings() {
    this.showNotifications = false;
    this.router.navigate(['/command', 'settings']);
  }

  get currentUnitUser() {
    const u = this.authService.currentUser();
    if (u && u.role === 'unit') {
      return u;
    }
    return this.authService.DEMO_UNIT_USER;
  }

  toggleUserProfile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.userProfileOpen = !this.userProfileOpen;
    if (this.userProfileOpen) {
      this.faqDropdownOpen = false;
      this.importantLinksOpen = false;
      this.showNotifications = false;
      this.commandProfileOpen = false;
      this.tacticalModulesOpen = false;
    }
  }

  closeUserProfile() {
    this.userProfileOpen = false;
  }

  get currentCommandUser() {
    const u = this.authService.currentUser();
    if (u && u.role === 'command') {
      return u;
    }
    return this.authService.DEMO_COMMAND_USER;
  }

  get commandShortName(): string {
    const name = this.currentCommandUser.name;
    return name.split(',')[0].trim();
  }

  get cleanUserName(): string {
    const u = this.authService.currentUser();
    if (!u?.name) return 'Authorized Officer';
    let name = u.name;
    if (name.includes(',')) {
      name = name.split(',')[0].trim();
    }
    if (u.rank) {
      const lowerRank = u.rank.toLowerCase();
      const lowerName = name.toLowerCase();
      if (lowerName.startsWith(lowerRank)) {
        name = name.slice(u.rank.length).trim();
      } else if (lowerName.startsWith('major ') && lowerRank.includes('major')) {
        name = name.replace(/^major\s+/i, '');
      } else if (lowerName.startsWith('lt gen ') || lowerName.startsWith('lt general ')) {
        name = name.replace(/^lt\s+gen(eral)?\s+/i, '');
      } else if (lowerName.startsWith('col ') || lowerName.startsWith('colonel ')) {
        name = name.replace(/^col(onel)?\s+/i, '');
      } else if (lowerName.startsWith('capt ') || lowerName.startsWith('captain ')) {
        name = name.replace(/^capt(ain)?\s+/i, '');
      }
    }
    return name || u.name;
  }

  get cleanUserRank(): string {
    const u = this.authService.currentUser();
    if (!u) return 'OFFICER';
    if (u.role === 'command') {
      return u.rank ? u.rank.toUpperCase() : 'C4ISR COMMAND';
    }
    return u.rank ? u.rank.toUpperCase() : 'UNIT QM';
  }

  get dashboardRoute(): string {
    return this.authService.isCommandAdmin() ? '/command/dashboard' : '/unit/dashboard';
  }

  get dashboardLabel(): string {
    return this.authService.isCommandAdmin() ? 'Command Dashboard' : 'Unit Dashboard';
  }

  toggleCommandProfile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.commandProfileOpen = !this.commandProfileOpen;
    if (this.commandProfileOpen) {
      this.faqDropdownOpen = false;
      this.importantLinksOpen = false;
      this.showNotifications = false;
      this.userProfileOpen = false;
      this.tacticalModulesOpen = false;
    }
  }

  closeCommandProfile() {
    this.commandProfileOpen = false;
  }

  toggleTacticalModules(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.tacticalModulesOpen = !this.tacticalModulesOpen;
    if (this.tacticalModulesOpen) {
      this.faqDropdownOpen = false;
      this.importantLinksOpen = false;
      this.showNotifications = false;
      this.userProfileOpen = false;
      this.commandProfileOpen = false;
    }
  }

  closeTacticalModules() {
    this.tacticalModulesOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (!target || !document.contains(target)) {
      return;
    }
    const targetEl = target as HTMLElement;
    if (!targetEl.closest('.faq-dropdown-item')) {
      this.faqDropdownOpen = false;
    }
    if (!targetEl.closest('.links-dropdown-item')) {
      this.importantLinksOpen = false;
    }
    if (!targetEl.closest('.notif-wrapper')) {
      this.showNotifications = false;
    }
    if (!targetEl.closest('.unit-profile-wrapper')) {
      this.userProfileOpen = false;
    }
    if (!targetEl.closest('.command-profile-wrapper')) {
      this.commandProfileOpen = false;
    }
    if (!targetEl.closest('.tactical-modules-wrapper')) {
      this.tacticalModulesOpen = false;
    }
    if (!targetEl.closest('.search-form')) {
      this.searchDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.searchDropdownOpen = false;
    this.faqDropdownOpen = false;
    this.importantLinksOpen = false;
    this.showNotifications = false;
    this.userProfileOpen = false;
    this.commandProfileOpen = false;
    this.tacticalModulesOpen = false;
    this.showUnitSelectorModal = false;
    this.showCommandSelectorModal = false;
    this.showSitemapModal = false;
  }
}

