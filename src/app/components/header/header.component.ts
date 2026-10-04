import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ThemeService, FontSize } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

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

  searchQuery = '';
  showPortalMenu = false;
  mobileMenuOpen = false;

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
}
