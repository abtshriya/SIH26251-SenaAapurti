import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AuthComponent } from './pages/auth/auth.component';
import { CommandDashboardComponent } from './pages/command-dashboard/command-dashboard.component';
import { UnitDashboardComponent } from './pages/unit-dashboard/unit-dashboard.component';
import { PublicInfoComponent } from './pages/public-info/public-info.component';

export const routes: Routes = [
  // 1. MASTER / INTRO WEBSITE
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // 2. PUBLIC INFORMATION PAGES
  { path: 'about', component: PublicInfoComponent, data: { section: 'about' } },
  { path: 'ai-logistics', component: PublicInfoComponent, data: { section: 'ai-logistics' } },
  { path: 'features', component: PublicInfoComponent, data: { section: 'features' } },
  { path: 'guidelines', component: PublicInfoComponent, data: { section: 'guidelines' } },
  { path: 'support', component: PublicInfoComponent, data: { section: 'support' } },
  { path: 'downloads', component: PublicInfoComponent, data: { section: 'downloads' } },
  { path: 'contact', component: PublicInfoComponent, data: { section: 'contact' } },

  // 3. LOGIN / REGISTER PORTAL
  { path: 'auth', component: AuthComponent },
  { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth', pathMatch: 'full' },

  // 4. COMMAND / ADMIN DASHBOARD
  { path: 'command-dashboard', component: CommandDashboardComponent },

  // 5. UNIT DASHBOARD
  { path: 'unit-dashboard', component: UnitDashboardComponent },

  // Wildcard
  { path: '**', redirectTo: '' }
];
