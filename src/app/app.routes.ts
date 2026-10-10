import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AuthComponent } from './pages/auth/auth.component';
import { CommandDashboardComponent } from './pages/command-dashboard/command-dashboard.component';
import { UnitDashboardComponent } from './pages/unit-dashboard/unit-dashboard.component';
import { PublicInfoComponent } from './pages/public-info/public-info.component';

export const routes: Routes = [
  // 0. MASTER / INTRO WEBSITE
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Redirect former standalone pages to Home sections
  { path: 'about', redirectTo: '', pathMatch: 'full' },
  { path: 'ai-logistics', redirectTo: '', pathMatch: 'full' },
  { path: 'features', redirectTo: '', pathMatch: 'full' },
  { path: 'guidelines', redirectTo: '', pathMatch: 'full' },
  { path: 'downloads', redirectTo: '', pathMatch: 'full' },
  { path: 'support', redirectTo: '', pathMatch: 'full' },
  { path: 'contact', redirectTo: '', pathMatch: 'full' },

  // ACCESS PORTAL
  { path: 'auth', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth/login', component: AuthComponent, data: { mode: 'login' } },
  { path: 'auth/register', component: AuthComponent, data: { mode: 'register' } },
  { path: 'auth/forgot-password', component: AuthComponent, data: { mode: 'forgot-password' } },
  { path: 'auth/unauthorized', component: AuthComponent, data: { mode: 'unauthorized' } },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },

  // 1. COMMAND / ADMIN DASHBOARD
  { path: 'command', redirectTo: 'command/dashboard', pathMatch: 'full' },
  { path: 'command/:tab', component: CommandDashboardComponent },
  { path: 'command-dashboard', redirectTo: 'command/dashboard', pathMatch: 'full' },

  // 2. UNIT DASHBOARD
  { path: 'unit', redirectTo: 'unit/dashboard', pathMatch: 'full' },
  { path: 'unit/:tab', component: UnitDashboardComponent },
  { path: 'unit-dashboard', redirectTo: 'unit/dashboard', pathMatch: 'full' },

  // Wildcard
  { path: '**', redirectTo: '' }
];
