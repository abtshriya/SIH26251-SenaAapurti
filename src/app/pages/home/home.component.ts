import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

interface CarouselSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  tag: string;
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconSvg: string;
  category: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  langService = inject(LanguageService);
  authService = inject(AuthService);
  router = inject(Router);

  // Carousel State
  currentSlideIndex = signal<number>(0);
  private autoSlideTimer: any;

  slides: CarouselSlide[] = [
    {
      id: 0,
      image: '/images/sena_hero_convoy.jpg',
      title: 'INTELLIGENT SUPPLY. ASSURED READINESS.',
      subtitle: 'Synchronizing Northern & Eastern Theater Forward Formations with Real-Time Predictive Telematics',
      tag: 'OPERATIONAL LOGISTICS'
    },
    {
      id: 1,
      image: '/images/sena_depot_smart.jpg',
      title: 'DIGITAL ORDNANCE DEPOTS & INVENTORY INTEL',
      subtitle: 'Automated Class I to IX inventory management with RFID, AGVs and zero-delay issue vouchers',
      tag: 'SMART DEPOTS'
    },
    {
      id: 2,
      image: '/images/sena_winter_convoy.jpg',
      title: 'EXTREME HIGH-ALTITUDE WINTER STOCKING',
      subtitle: 'AI-driven weather hazard avoidance for Siachen, Zojila, Kargil and Ladakh supply corridors',
      tag: 'ALL-WEATHER READINESS'
    }
  ];

  // 8 Core Features from Reference Image
  featuresList: FeatureItem[] = [
    {
      id: 'demand',
      title: 'Predictive Demand Forecasting',
      description: 'Machine learning algorithms calculate unit burn rates for ammunition, winter POL and rations.',
      category: 'AI Analytics',
      iconSvg: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z'
    },
    {
      id: 'inventory',
      title: 'Inventory Intelligence',
      description: 'Real-time visibility across Central Ordnance Depots (CODs) down to Regimental Stores.',
      category: 'Asset Tracking',
      iconSvg: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'
    },
    {
      id: 'movement',
      title: 'Logistics Movement Tracking',
      description: 'GPS telemetry, transponder beacons and milestone checkposts along strategic military axes.',
      category: 'Fleet Operations',
      iconSvg: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 3.75v10.5'
    },
    {
      id: 'route',
      title: 'Route Optimization & Risk Analysis',
      description: 'Dynamic avoidance of avalanche hazards, flash flood passes and contested border choke points.',
      category: 'Terrain Intel',
      iconSvg: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
    },
    {
      id: 'weather',
      title: 'Weather & Terrain Intelligence',
      description: 'Direct meteorological sensor integration from Siachen, Leh and North-East high-altitude stations.',
      category: 'Meteorology',
      iconSvg: 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z'
    },
    {
      id: 'ai-rec',
      title: 'AI-driven Recommendations',
      description: 'Automated pre-allocation triggers for winter stocking buffers and emergency resupply priorities.',
      category: 'Decision Engine',
      iconSvg: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z'
    },
    {
      id: 'what-if',
      title: 'What-If Simulation',
      description: 'Stress-test defense supply resilience under multi-front mobilization and weather blockades.',
      category: 'Wargaming',
      iconSvg: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Defense executive intelligence, audit compliance, consumption analytics and wastage reduction.',
      category: 'Executive BI',
      iconSvg: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'
    }
  ];

  selectedFeature: FeatureItem | null = null;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.autoSlideTimer = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  stopAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  nextSlide() {
    this.currentSlideIndex.update(idx => (idx + 1) % this.slides.length);
  }

  prevSlide() {
    this.currentSlideIndex.update(idx => (idx - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number) {
    this.currentSlideIndex.set(index);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  navigateToPortal(portal: 'command' | 'unit') {
    if (this.authService.isLoggedIn()) {
      if (portal === 'command') {
        this.router.navigate(['/command-dashboard']);
      } else {
        this.router.navigate(['/unit-dashboard']);
      }
    } else {
      this.router.navigate(['/auth'], { queryParams: { portal } });
    }
  }

  openFeatureModal(feature: FeatureItem) {
    this.selectedFeature = feature;
  }

  closeFeatureModal() {
    this.selectedFeature = null;
  }
}
