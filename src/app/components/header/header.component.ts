import { Component, inject, computed, HostListener, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ThemeService, FontSize } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { UnitDatabaseService, ArmyUnit } from '../../services/unit-database.service';
import { LayoutService } from '../../services/layout.service';
import { LogisticsService } from '../../services/logistics.service';
import { FAQ_CATEGORIES } from '../../data/faq.data';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs/operators';

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
  showPortalMenu = false;
  mobileMenuOpen = false;
  showUnitSelectorModal = false;
  userProfileOpen = false;
  commandProfileOpen = false;
  modalSearchQuery = '';
  modalSelectedCommand = 'All';
  faqDropdownOpen = false;
  faqCategories = FAQ_CATEGORIES;
  importantLinksOpen = false;
  showNotifications = false;
  unreadNotificationsCount = 4;

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
    if (mode === 'command') {
      return '/images/sena_bhawan_delhi.jpg';
    }
    if (mode === 'unit') {
      return this.unitDbService.selectedUnit().bgImage;
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

  onSearch() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return;
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
      } else {
        this.router.navigate(['/command', 'inventory']);
      }
    } else {
      this.router.navigate(['/know-sena-aapurti']);
    }
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
    }
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  goToAlerts() {
    this.showNotifications = false;
    this.router.navigate(['/command', 'recommendations']);
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
    }
  }

  closeCommandProfile() {
    this.commandProfileOpen = false;
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
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.faqDropdownOpen = false;
    this.importantLinksOpen = false;
    this.showNotifications = false;
    this.userProfileOpen = false;
    this.commandProfileOpen = false;
  }
}

