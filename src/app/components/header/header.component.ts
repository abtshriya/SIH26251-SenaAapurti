import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ThemeService, FontSize } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { UnitDatabaseService, ArmyUnit } from '../../services/unit-database.service';
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

  searchQuery = '';
  showPortalMenu = false;
  mobileMenuOpen = false;
  showUnitSelectorModal = false;

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
    const currentUrl = this.router.url.split('#')[0];
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
}
