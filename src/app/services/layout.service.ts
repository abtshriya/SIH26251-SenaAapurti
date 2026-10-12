import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  /**
   * Tracks whether the Command / Tactical sidebar is collapsed.
   */
  sidebarCollapsed = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }
}
