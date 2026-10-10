import { Injectable, signal } from '@angular/core';

export type FontSize = 'sm' | 'md' | 'lg';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  fontSize = signal<FontSize>('md');
  highContrast = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedFont = localStorage.getItem('sena_font_size') as FontSize;
        if (savedFont && (savedFont === 'sm' || savedFont === 'md' || savedFont === 'lg')) {
          this.fontSize.set(savedFont);
        }
        const savedContrast = localStorage.getItem('sena_high_contrast');
        if (savedContrast === 'true') {
          this.highContrast.set(true);
        }
      } catch (e) {
        // LocalStorage fallback
      }
    }
    this.applyClasses();
  }

  setFontSize(size: FontSize) {
    this.fontSize.set(size);
    this.applyClasses();
  }

  toggleHighContrast() {
    this.highContrast.update(val => !val);
    this.applyClasses();
  }

  private applyClasses() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    root.classList.add(`font-scale-${this.fontSize()}`);

    // Direct root inline font-size for immediate visual responsiveness across all rem units
    if (this.fontSize() === 'sm') {
      root.style.fontSize = '13.5px';
      root.style.setProperty('--base-font-size', '13.5px');
      root.style.setProperty('--font-scale-factor', '0.84');
    } else if (this.fontSize() === 'lg') {
      root.style.fontSize = '19.5px';
      root.style.setProperty('--base-font-size', '19.5px');
      root.style.setProperty('--font-scale-factor', '1.22');
    } else {
      root.style.fontSize = '16px';
      root.style.setProperty('--base-font-size', '16px');
      root.style.setProperty('--font-scale-factor', '1.0');
    }

    if (this.highContrast()) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('sena_font_size', this.fontSize());
        localStorage.setItem('sena_high_contrast', String(this.highContrast()));
      } catch (e) {}
    }
  }
}
