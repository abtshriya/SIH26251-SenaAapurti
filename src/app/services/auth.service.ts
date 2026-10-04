import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export type UserRole = 'command' | 'unit' | 'guest';

export interface MilitaryUser {
  serviceNo: string;
  name: string;
  rank: string;
  unit: string;
  command: string;
  role: 'command' | 'unit';
  clearanceLevel: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<MilitaryUser | null>(null);

  // Preset accounts for seamless demonstration
  readonly DEMO_COMMAND_USER: MilitaryUser = {
    serviceNo: 'IC-48291X',
    name: 'Lt Gen V. K. Rawat, PVSM, AVSM',
    rank: 'Lieutenant General',
    unit: 'Master General of Sustenance (MGS) Branch, Army HQ',
    command: 'Integrated HQ of MoD (Army)',
    role: 'command',
    clearanceLevel: 'TOP SECRET - STRATEGIC'
  };

  readonly DEMO_UNIT_USER: MilitaryUser = {
    serviceNo: 'IC-71044A',
    name: 'Major Amit Sharma',
    rank: 'Major',
    unit: '14 RAJPUT (MECHANISED)',
    command: 'Northern Command (14 Corps - Leh)',
    role: 'unit',
    clearanceLevel: 'SECRET - OPERATIONAL'
  };

  constructor(private router: Router) {
    // Check if session exists in memory
    const saved = sessionStorage.getItem('sena_user');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch (e) {
        sessionStorage.removeItem('sena_user');
      }
    }
  }

  login(user: MilitaryUser) {
    this.currentUser.set(user);
    sessionStorage.setItem('sena_user', JSON.stringify(user));
    if (user.role === 'command') {
      this.router.navigate(['/command-dashboard']);
    } else {
      this.router.navigate(['/unit-dashboard']);
    }
  }

  loginAsDemoCommand() {
    this.login(this.DEMO_COMMAND_USER);
  }

  loginAsDemoUnit() {
    this.login(this.DEMO_UNIT_USER);
  }

  logout() {
    this.currentUser.set(null);
    sessionStorage.removeItem('sena_user');
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  isCommandAdmin(): boolean {
    return this.currentUser()?.role === 'command';
  }

  isUnitUser(): boolean {
    return this.currentUser()?.role === 'unit';
  }
}
