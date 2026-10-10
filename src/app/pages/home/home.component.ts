import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

interface WorkflowStage {
  step: number;
  name: string;
  icon: string;
  tagline: string;
  inputs: string;
  algorithm: string;
  output: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  langService = inject(LanguageService);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // Carousel State
  currentSlideIndex = signal<number>(0);
  private autoSlideTimer: any;

  slides: CarouselSlide[] = [
    {
      id: 0,
      image: '/images/sena_convoy_ladakh.jpg',
      title: 'HIGH-ALTITUDE CONVOY SURVEILLANCE',
      subtitle: 'All-terrain Stallion logistical columns navigating high-altitude Himalayan mountain passes with real-time GPS telemetry',
      tag: 'NORTHERN COMMAND'
    },
    {
      id: 1,
      image: '/images/sena_depot_ammo.jpg',
      title: 'STRATEGIC ORDNANCE MUNITIONS DEPOT',
      subtitle: 'Automated Class V munitions and ordnance staging with digital vault tracking and secure inventory controls',
      tag: 'CENTRAL ORDNANCE'
    },
    {
      id: 2,
      image: '/images/sena_air_drop.jpg',
      title: 'TACTICAL AIR-DROP & HELILIFT MISSIONS',
      subtitle: 'Rotary-wing precision resupply drops sustaining isolated Siachen glacier pickets and extreme forward outposts',
      tag: 'AIR RESUPPLY'
    },
    {
      id: 3,
      image: '/images/sena_pol_refuel.jpg',
      title: 'FORWARD COMBAT REFUELLING & POL RESUPPLY',
      subtitle: 'Army Service Corps high-capacity bowsers ensuring uninterrupted fuel reserves for mechanized combat formations',
      tag: 'POL LOGISTICS'
    },
    {
      id: 4,
      image: '/images/sena_bridge_convoy.jpg',
      title: 'ENGINEER BRIDGING & MOBILITY AXIS',
      subtitle: 'Heavy recovery vehicles and bridging trains breaching fast-flowing Himalayan rivers to maintain forward supply routes',
      tag: 'MOBILITY CORRIDORS'
    },
    {
      id: 5,
      image: '/images/sena_winter_stocking.jpg',
      title: 'ADVANCE WINTER STOCKING & SENSOR AUDIT',
      subtitle: 'Pre-winter high-altitude stockpile audits with mobile rugged terminals across Eastern and Northern theaters',
      tag: 'WINTER STOCKING'
    },
    {
      id: 6,
      image: '/images/sena_eme_workshop.jpg',
      title: 'CORPS OF EME FORWARD REPAIR DEPOT',
      subtitle: 'Mobile technical maintenance echelons providing continuous operational readiness and heavy engine overhauls',
      tag: 'EME SUSTENANCE'
    },
    {
      id: 7,
      image: '/images/sena_hero_convoy.jpg',
      title: 'INTELLIGENT SUPPLY. ASSURED READINESS.',
      subtitle: 'Synchronizing Northern & Eastern Theater Forward Formations with Real-Time Predictive Telematics',
      tag: 'OPERATIONAL LOGISTICS'
    },
    {
      id: 8,
      image: '/images/sena_depot_smart.jpg',
      title: 'DIGITAL ORDNANCE DEPOTS & INVENTORY INTEL',
      subtitle: 'Automated Class I to IX inventory management with RFID, AGVs and zero-delay issue vouchers',
      tag: 'SMART DEPOTS'
    },
    {
      id: 9,
      image: '/images/sena_winter_convoy.jpg',
      title: 'EXTREME HIGH-ALTITUDE WINTER STOCKING',
      subtitle: 'AI-driven weather hazard avoidance for Siachen, Zojila, Kargil and Ladakh supply corridors',
      tag: 'ALL-WEATHER READINESS'
    }
  ];

  // Mission / Introduction Active Tab
  activeMissionTab: 'what-is' | 'problem' | 'mission' | 'readiness' = 'what-is';

  // How SenaAapurti Works - Animated & Minimal Pipeline
  selectedStageIndex = 0;
  private workflowAnimTimer: any;
  isWorkflowPlaying = signal<boolean>(true);

  workflowStages: WorkflowStage[] = [
    {
      step: 1,
      name: 'Unit Telemetry',
      icon: '🛡️',
      tagline: 'Forward Unit Ingestion',
      inputs: 'Forward regiment inventory & burn rate sensors',
      algorithm: 'Cryptographic ASCON Edge Telemetry Sync',
      output: 'Live unit burn rates'
    },
    {
      step: 2,
      name: 'Data Fusion',
      icon: '🔀',
      tagline: 'Battlefield Intel Fusion',
      inputs: 'Satellite feeds, IMD weather radar & BRO pass closures',
      algorithm: 'Geospatial Alignment & Signal Normalization',
      output: 'Common Operating Logistics Picture'
    },
    {
      step: 3,
      name: 'AI Forecasting',
      icon: '🧠',
      tagline: 'Neural Demand Projection',
      inputs: '15-year seasonal curves & cold-wave mobilization scale',
      algorithm: 'Deep LSTM Neural Demand Engine',
      output: '30–90 day forward buffer reserves'
    },
    {
      step: 4,
      name: 'Risk Analysis',
      icon: '⚠️',
      tagline: 'Choke Point & Hazard AI',
      inputs: 'Snow depth, avalanche risks & route bottlenecks',
      algorithm: 'Dynamic Bayesian Risk Scoring',
      output: 'Prioritized defense risk matrix'
    },
    {
      step: 5,
      name: 'Route Dispatch',
      icon: '⚡',
      tagline: 'Convoy Fleet Optimizer',
      inputs: 'Vehicle tonnages, pass transit windows & fuel capacity',
      algorithm: 'MILP Multi-Echelon Routing Heuristic',
      output: 'Optimized convoy transit corridors'
    },
    {
      step: 6,
      name: 'Assured Delivery',
      icon: '🎯',
      tagline: 'Picket Sustenance Assurance',
      inputs: 'Automated COD release vouchers & forward delivery',
      algorithm: 'Autonomous Military Supply Assurance',
      output: 'Zero critical stockout fulfillment'
    }
  ];

  // 8 Core Features
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

  // News / Information Section Active Tab
  activeNewsTab: 'announcements' | 'updates' | 'notices' = 'announcements';

  // Support Ticket Form Model
  ticketName = '';
  ticketServiceNo = '';
  ticketCategory = 'Voucher Tracking';
  ticketMessage = '';
  ticketSuccess = '';

  // Contact Form Model
  contactName = '';
  contactEmail = '';
  contactSubject = '';
  contactMsg = '';
  contactSuccess = '';

  ngOnInit() {
    this.startAutoSlide();
    this.startWorkflowAnimation();
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          this.scrollToSection(fragment);
        }, 100);
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    this.stopWorkflowAnimation();
  }

  startWorkflowAnimation() {
    this.stopWorkflowAnimation();
    this.workflowAnimTimer = setInterval(() => {
      if (this.isWorkflowPlaying()) {
        this.selectedStageIndex = (this.selectedStageIndex + 1) % this.workflowStages.length;
      }
    }, 3200);
  }

  stopWorkflowAnimation() {
    if (this.workflowAnimTimer) {
      clearInterval(this.workflowAnimTimer);
    }
  }

  selectStage(idx: number) {
    this.selectedStageIndex = idx;
  }

  toggleWorkflowPlay() {
    this.isWorkflowPlaying.update(p => !p);
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      this.nextSlide();
    }, 120000); // Dynamic transition automatically every 2 minutes
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
        this.router.navigate(['/command/dashboard']);
      } else {
        this.router.navigate(['/unit/dashboard']);
      }
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { portal } });
    }
  }

  openFeatureModal(feature: FeatureItem) {
    this.selectedFeature = feature;
  }

  closeFeatureModal() {
    this.selectedFeature = null;
  }

  scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  submitTicket() {
    if (!this.ticketName || !this.ticketServiceNo || !this.ticketMessage) {
      alert('Please fill in your name, service number, and query details.');
      return;
    }
    const ticketId = 'TKT-LOG-' + Math.floor(10000 + Math.random() * 90000);
    this.ticketSuccess = `Helpdesk Ticket #${ticketId} registered with the 24x7 Army Logistics Control Cell. An automated priority SMS has been dispatched.`;
    this.ticketMessage = '';
  }

  submitContact() {
    if (!this.contactName || !this.contactEmail || !this.contactMsg) {
      alert('Please fill in all mandatory contact form fields.');
      return;
    }
    this.contactSuccess = 'Thank you for contacting Integrated HQ of MoD (Army). Your communication has been dispatched to the DGOS Secretariat.';
    this.contactName = '';
    this.contactEmail = '';
    this.contactSubject = '';
    this.contactMsg = '';
  }

  downloadManual(filename: string) {
    alert(`Initiating secure download of official defense document: "${filename}". Verification hash matched.`);
  }
}
