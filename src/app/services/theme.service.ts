import { Injectable, signal } from '@angular/core';

export type FontSize = 'sm' | 'md' | 'lg';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  fontSize = signal<FontSize>('md');
  highContrast = signal<boolean>(false);

  constructor() {
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

    if (this.highContrast()) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }
}
