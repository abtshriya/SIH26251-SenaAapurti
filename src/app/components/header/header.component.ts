import { Component, inject, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ThemeService, FontSize } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { UnitDatabaseService, ArmyUnit } from '../../services/unit-database.service';
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
  router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.faqDropdownOpen = false;
      this.importantLinksOpen = false;
      this.mobileMenuOpen = false;
    });
  }

  searchQuery = '';
  showPortalMenu = false;
  mobileMenuOpen = false;
  showUnitSelectorModal = false;
  faqDropdownOpen = false;
  faqCategories = FAQ_CATEGORIES;
  importantLinksOpen = false;
  importantLinks = [
    { title: 'Indian Army', url: 'https://indianarmy.nic.in' },
    { title: 'Army Ordnance Corps (AOC)', url: 'https://aocrecruitment.gov.in/' },
    { title: 'Ministry of Defence', url: 'https://mod.gov.in' },
    { title: 'Government e-Marketplace (GeM)', url: 'https://gem.gov.in' },
    { title: 'Central Public Procurement Portal (CPPP)', url: 'https://eprocure.gov.in/eprocure/app' },
    { title: 'Border Roads Organisation (BRO)', url: 'https://bro.gov.in' },
    { title: 'India Meteorological Department (IMD)', url: 'https://mausam.imd.gov.in' }
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
    if (!this.searchQuery.trim()) return;
    alert(`Searching SenaAapurti defense repository for: "${this.searchQuery}"`);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.faq-dropdown-item')) {
      this.faqDropdownOpen = false;
    }
    if (!target.closest('.links-dropdown-item')) {
      this.importantLinksOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.faqDropdownOpen = false;
    this.importantLinksOpen = false;
  }
}
