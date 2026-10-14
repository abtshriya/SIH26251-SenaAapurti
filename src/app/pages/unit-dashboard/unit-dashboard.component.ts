import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LogisticsService, UnitIndent, ConvoyItem, WeatherStationData, StrategicAlert } from '../../services/logistics.service';
import { UnitDatabaseService } from '../../services/unit-database.service';

import { ThemeService, FontSize } from '../../services/theme.service';

export type UnitTab =
  | 'dashboard'
  | 'inventory'
  | 'consumption'
  | 'requests'
  | 'logistics'
  | 'route-weather'
  | 'ai-insights'
  | 'reports'
  | 'settings';

export interface LocalInventoryItem {
  id: string;
  item: string;
  category: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Ammo)' | 'Class IX (Spares)' | 'Medical & Clothing';
  quantity: string;
  safetyStock: string;
  reorderLevel: string;
  daysRemaining: number;
  stockoutPrediction: string;
  status: 'Adequate' | 'Low' | 'Critical' | 'Surplus';
  received: string;
  issued: string;
  damaged: string;
  expired: string;
}

@Component({
  selector: 'app-unit-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './unit-dashboard.component.html',
  styleUrl: './unit-dashboard.component.css'
})
export class UnitDashboardComponent implements OnInit {
  authService = inject(AuthService);
  logisticsService = inject(LogisticsService);
  themeService = inject(ThemeService);
  unitDbService = inject(UnitDatabaseService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:8000/api/v1';

  setFont(size: FontSize) {
    this.themeService.setFontSize(size);
  }

  filterByStatus(status: string) {
    this.invStatusFilter = status;
  }

  get totalInventoryCount(): number {
    return this.unitInventoryList.length;
  }

  get adequateInventoryCount(): number {
    return this.unitInventoryList.filter(i => i.status === 'Adequate').length;
  }

  get lowInventoryCount(): number {
    return this.unitInventoryList.filter(i => i.status === 'Low').length;
  }

  get surplusInventoryCount(): number {
    return this.unitInventoryList.filter(i => i.status === 'Surplus').length;
  }

  get criticalInventoryCount(): number {
    return this.unitInventoryList.filter(i => i.status === 'Critical').length;
  }

  // Active Tab
  activeTab: UnitTab = 'dashboard';
  sidebarCollapsed = false;

  // Header & Status
  currentDate = '';
  lastSync = 'Synced via ASCON SATCOM Grid (14 Corps)';
  searchQuery = '';
  showNotifications = false;

  // 2.1 Dashboard Quick Actions & Modals
  feedbackMsg = '';

  // Topbar Actions
  toggleNotifications(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showNotifications && !target.closest('.topbar-notif-wrap')) {
      this.closeNotifications();
    }
  }

  goToNotifAlert(alt?: StrategicAlert) {
    this.closeNotifications();
    if (alt && alt.type) {
      this.aiFilter = alt.type;
    }
    this.setTab('ai-insights');
  }

  goToNotifRequests() {
    this.closeNotifications();
    this.setTab('requests');
  }

  onTopSearch() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes('convoy') || q.includes('garuda') || q.includes('himalaya') || q.includes('chetak') || q.includes('shipment')) {
      this.logisticsSearch = this.searchQuery;
      this.setTab('logistics');
    } else if (q.includes('weather') || q.includes('pass') || q.includes('zoji') || q.includes('khardung') || q.includes('snow') || q.includes('temp')) {
      this.weatherSearch = this.searchQuery;
      this.setTab('route-weather');
    } else if (q.includes('alert') || q.includes('surge') || q.includes('freeze') || q.includes('sitrep') || q.includes('hazard')) {
      this.aiFilter = 'All';
      this.setTab('ai-insights');
    } else if (q.includes('indent') || q.includes('requisition') || q.includes('voucher') || q.includes('req')) {
      this.setTab('requests');
    } else {
      this.invSearch = this.searchQuery;
      this.setTab('inventory');
    }
  }

  // 2.2 Inventory State
  invSearch = '';
  invCategoryFilter = 'All';
  invStatusFilter = 'All';
  selectedInvItem: LocalInventoryItem | null = null;
  showAddReceiptModal = false;
  showRecordConsumptionModal = false;
  showReportDamageModal = false;

  // Receipt Modal State
  newReceiptCategory: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Ammo)' | 'Class IX (Spares)' | 'Medical & Clothing' = 'Class III (POL)';
  newReceiptItemId = 'UI-POL-01';
  newReceiptQty = '';
  newReceiptRvNo = 'RV-14R-8924';
  newReceiptDepot = 'COD Pathankot / FSD Leh';
  newReceiptDate = '2026-10-14';
  newReceiptNotes = 'Incoming convoy consignment verified and inspected.';

  // Consumption / Issue Modal State
  newIssueCategory: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Ammo)' | 'Class IX (Spares)' | 'Medical & Clothing' = 'Class III (POL)';
  newIssueItemId = 'UI-POL-01';
  newIssueQty = '';
  newIssuePurpose = 'Daily Bukhari Space Heaters & Prime Genset Run';
  newIssueDate = '2026-10-14';
  newIssueRecipient = 'Bravo Company / Forward Defended Post 4A';

  get itemsForReceiptCategory(): LocalInventoryItem[] {
    return this.unitInventoryList.filter(i => i.category === this.newReceiptCategory);
  }

  get itemsForIssueCategory(): LocalInventoryItem[] {
    return this.unitInventoryList.filter(i => i.category === this.newIssueCategory);
  }

  openAddReceiptModal(item?: LocalInventoryItem) {
    this.showAddReceiptModal = true;
    this.newReceiptRvNo = `RV-14R-${Math.floor(1000 + Math.random() * 9000)}`;
    this.newReceiptDate = new Date().toISOString().split('T')[0];
    if (item) {
      this.newReceiptCategory = item.category;
      this.newReceiptItemId = item.id;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeAddReceiptModal() {
    this.showAddReceiptModal = false;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  submitAddReceipt() {
    if (!this.newReceiptQty.trim()) {
      alert('Please enter the received quantity.');
      return;
    }
    const item = this.unitInventoryList.find(i => i.id === this.newReceiptItemId);
    if (item) {
      const numAdded = parseFloat(this.newReceiptQty) || 0;
      const currentNum = parseFloat(item.quantity.replace(/,/g, '')) || 0;
      const unitMatch = item.quantity.match(/[a-zA-Z°%]+/g);
      const unitStr = unitMatch ? unitMatch.join(' ') : '';

      if (numAdded > 0) {
        const newTotal = currentNum + numAdded;
        item.quantity = `${newTotal.toLocaleString()} ${unitStr}`.trim();

        const currentReceivedNum = parseFloat(item.received.replace(/,/g, '')) || 0;
        item.received = `${(currentReceivedNum + numAdded).toLocaleString()} ${unitStr}`.trim();

        this.http.post<any>(`${this.API_BASE}/inventory/receipt`, {
          item_sku: item.id,
          quantity: numAdded,
          depot: 'COD Pathankot',
          officer: 'Quartermaster Storeman',
          remarks: this.newReceiptNotes || 'Store receipt verified'
        }).pipe(
          catchError(() => of(null))
        ).subscribe();
      }
      this.feedbackMsg = `Store Receipt Voucher #${this.newReceiptRvNo} verified. Added ${this.newReceiptQty} to ${item.item}.`;
    } else {
      this.feedbackMsg = `Store Receipt Voucher #${this.newReceiptRvNo} logged into 14 Rajput Regimental Ledger.`;
    }
    this.closeAddReceiptModal();
    this.newReceiptQty = '';
    setTimeout(() => this.feedbackMsg = '', 7000);
  }

  openRecordConsumptionModal(item?: LocalInventoryItem) {
    this.showRecordConsumptionModal = true;
    this.newIssueDate = new Date().toISOString().split('T')[0];
    if (item) {
      this.newIssueCategory = item.category;
      this.newIssueItemId = item.id;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeRecordConsumptionModal() {
    this.showRecordConsumptionModal = false;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  submitRecordConsumption() {
    if (!this.newIssueQty.trim()) {
      alert('Please enter the issue quantity.');
      return;
    }
    const item = this.unitInventoryList.find(i => i.id === this.newIssueItemId);
    if (item) {
      const numIssued = parseFloat(this.newIssueQty) || 0;
      const currentNum = parseFloat(item.quantity.replace(/,/g, '')) || 0;
      const unitMatch = item.quantity.match(/[a-zA-Z°%]+/g);
      const unitStr = unitMatch ? unitMatch.join(' ') : '';

      if (numIssued > 0 && currentNum >= numIssued) {
        const newTotal = currentNum - numIssued;
        item.quantity = `${newTotal.toLocaleString()} ${unitStr}`.trim();

        const currentIssuedNum = parseFloat(item.issued.replace(/,/g, '')) || 0;
        item.issued = `${(currentIssuedNum + numIssued).toLocaleString()} ${unitStr}`.trim();

        this.http.post<any>(`${this.API_BASE}/inventory/consume`, {
          item_sku: item.id,
          quantity: numIssued,
          purpose: this.newIssuePurpose || 'Daily Troop Operations',
          remarks: `Issued to ${this.newIssueRecipient}`
        }).pipe(
          catchError(() => of(null))
        ).subscribe();
      }
      this.feedbackMsg = `Issue Voucher IV-${Math.floor(1000 + Math.random() * 9000)} approved. Issued ${this.newIssueQty} of ${item.item} to ${this.newIssueRecipient}.`;
    } else {
      this.feedbackMsg = `Daily consumption voucher approved and debited from Regimental Stores.`;
    }
    this.closeRecordConsumptionModal();
    this.newIssueQty = '';
    setTimeout(() => this.feedbackMsg = '', 7000);
  }

  openLedgerCard(item: LocalInventoryItem) {
    this.selectedInvItem = item;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeLedgerCard() {
    this.selectedInvItem = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  // Inventory Table for 14 Rajput
  unitInventoryList: LocalInventoryItem[] = [
    {
      id: 'UI-POL-01',
      item: 'Sub-Zero High Speed Diesel (Winter Grade -40°C)',
      category: 'Class III (POL)',
      quantity: '16,200 Litres',
      safetyStock: '10,000 Litres',
      reorderLevel: '12,000 Litres',
      daysRemaining: 48,
      stockoutPrediction: 'Safe (48 Days Buffer)',
      status: 'Adequate',
      received: '24,000 L',
      issued: '7,800 L',
      damaged: '0 L',
      expired: '0 L'
    },
    {
      id: 'UI-RAT-02',
      item: 'High Altitude MRE Ration Packs (Caloric 3,800 kcal)',
      category: 'Class I (Rations)',
      quantity: '4,200 Packs',
      safetyStock: '2,500 Packs',
      reorderLevel: '3,000 Packs',
      daysRemaining: 55,
      stockoutPrediction: 'Optimal Winter Stocking',
      status: 'Adequate',
      received: '5,000 Packs',
      issued: '800 Packs',
      damaged: '12 Packs',
      expired: '0 Packs'
    },
    {
      id: 'UI-AM-03',
      item: '7.62x51mm NATO & AK Ammunition Sealed Tins',
      category: 'Class V (Ammo)',
      quantity: '120,000 Rounds',
      safetyStock: '80,000 Rounds',
      reorderLevel: '95,000 Rounds',
      daysRemaining: 90,
      stockoutPrediction: '100% Combat Reserve',
      status: 'Adequate',
      received: '120,000 Rnds',
      issued: '0 Rnds',
      damaged: '0 Rnds',
      expired: '0 Rnds'
    },
    {
      id: 'UI-SPR-04',
      item: 'BMP-II Track Pins & Rubber Suspension Pads',
      category: 'Class IX (Spares)',
      quantity: '12 Sets',
      safetyStock: '16 Sets',
      reorderLevel: '18 Sets',
      daysRemaining: 18,
      stockoutPrediction: 'Depletion Warning (Convoy in transit)',
      status: 'Low',
      received: '20 Sets',
      issued: '8 Sets',
      damaged: '2 Sets',
      expired: '0 Sets'
    },
    {
      id: 'UI-MED-05',
      item: 'Glacier Multi-Layer ECC Warm Suits',
      category: 'Medical & Clothing',
      quantity: '450 Suits',
      safetyStock: '300 Suits',
      reorderLevel: '350 Suits',
      daysRemaining: 65,
      stockoutPrediction: 'Safe Buffer',
      status: 'Adequate',
      received: '500 Suits',
      issued: '50 Suits',
      damaged: '0 Suits',
      expired: '0 Suits'
    }
  ];

  // 2.3 Consumption Telematics & AI Demand State
  consumptionFilterCat = 'All';
  consumptionPeriod = 'Daily';
  activeChartMetric: 'ALL' | 'POL' | 'RATIONS' | 'AMMO' = 'ALL';
  chartTimeHorizon: '11D' | '14D' | '30D' = '11D';
  showTempCorrelation = true;
  showConfidenceCorridor = true;

  // High-precision daily telemetry records (D-6 to D+4)
  telemetryDailyRecords = [
    {
      id: 'D-6',
      dayLabel: 'D-6',
      calendarDate: '07 Oct',
      isToday: false,
      isForecast: false,
      polLpd: 375,
      rationsPacks: 1320,
      ammoRounds: 210,
      tempCelsius: 3,
      generatorLoad: 68,
      bukhariHours: 12,
      fleetActive: 6,
      statusBadge: 'Normal Baseline',
      statusClass: 'badge-ok',
      x: 95,
      polY: 172,
      ratY: 132,
      ammoY: 108,
      tempY: 80,
      gensetBurn: 165,
      bukhariBurn: 110,
      fleetBurn: 65,
      auxBurn: 35
    },
    {
      id: 'D-5',
      dayLabel: 'D-5',
      calendarDate: '08 Oct',
      isToday: false,
      isForecast: false,
      polLpd: 395,
      rationsPacks: 1350,
      ammoRounds: 280,
      tempCelsius: 1,
      generatorLoad: 72,
      bukhariHours: 14,
      fleetActive: 7,
      statusBadge: 'Pre-Freeze Routine',
      statusClass: 'badge-ok',
      x: 170,
      polY: 164,
      ratY: 124,
      ammoY: 96,
      tempY: 92,
      gensetBurn: 175,
      bukhariBurn: 120,
      fleetBurn: 68,
      auxBurn: 32
    },
    {
      id: 'D-4',
      dayLabel: 'D-4',
      calendarDate: '09 Oct',
      isToday: false,
      isForecast: false,
      polLpd: 420,
      rationsPacks: 1390,
      ammoRounds: 480,
      tempCelsius: -2,
      generatorLoad: 78,
      bukhariHours: 16,
      fleetActive: 9,
      statusBadge: 'Range Zeroing & BMP Run',
      statusClass: 'badge-info',
      x: 245,
      polY: 154,
      ratY: 116,
      ammoY: 80,
      tempY: 110,
      gensetBurn: 185,
      bukhariBurn: 128,
      fleetBurn: 72,
      auxBurn: 35
    },
    {
      id: 'D-3',
      dayLabel: 'D-3',
      calendarDate: '10 Oct',
      isToday: false,
      isForecast: false,
      polLpd: 385,
      rationsPacks: 1340,
      ammoRounds: 160,
      tempCelsius: -4,
      generatorLoad: 75,
      bukhariHours: 16,
      fleetActive: 5,
      statusBadge: 'Garrison Routine',
      statusClass: 'badge-ok',
      x: 320,
      polY: 168,
      ratY: 128,
      ammoY: 112,
      tempY: 122,
      gensetBurn: 170,
      bukhariBurn: 118,
      fleetBurn: 65,
      auxBurn: 32
    },
    {
      id: 'D-2',
      dayLabel: 'D-2',
      calendarDate: '11 Oct',
      isToday: false,
      isForecast: false,
      polLpd: 445,
      rationsPacks: 1410,
      ammoRounds: 290,
      tempCelsius: -9,
      generatorLoad: 85,
      bukhariHours: 19,
      fleetActive: 8,
      statusBadge: 'Sub-Zero Idle Tests',
      statusClass: 'badge-info',
      x: 395,
      polY: 144,
      ratY: 104,
      ammoY: 76,
      tempY: 152,
      gensetBurn: 195,
      bukhariBurn: 135,
      fleetBurn: 76,
      auxBurn: 39
    },
    {
      id: 'D-1',
      dayLabel: 'D-1',
      calendarDate: '12 Oct',
      isToday: false,
      isForecast: false,
      polLpd: 468,
      rationsPacks: 1430,
      ammoRounds: 210,
      tempCelsius: -14,
      generatorLoad: 89,
      bukhariHours: 21,
      fleetActive: 10,
      statusBadge: 'Convoy Supply Inflow',
      statusClass: 'badge-info',
      x: 470,
      polY: 135,
      ratY: 94,
      ammoY: 66,
      tempY: 182,
      gensetBurn: 205,
      bukhariBurn: 142,
      fleetBurn: 80,
      auxBurn: 41
    },
    {
      id: 'D-0',
      dayLabel: 'D-0 (TODAY)',
      calendarDate: '13 Oct',
      isToday: true,
      isForecast: false,
      polLpd: 492,
      rationsPacks: 1460,
      ammoRounds: 340,
      tempCelsius: -18,
      generatorLoad: 92,
      bukhariHours: 24,
      fleetActive: 11,
      statusBadge: 'Continuous Freeze Run',
      statusClass: 'badge-amber',
      x: 545,
      polY: 125,
      ratY: 82,
      ammoY: 54,
      tempY: 206,
      gensetBurn: 215,
      bukhariBurn: 148,
      fleetBurn: 84,
      auxBurn: 45
    },
    // AI Forecast Horizon
    {
      id: 'D+1',
      dayLabel: 'D+1 (EST)',
      calendarDate: '14 Oct',
      isToday: false,
      isForecast: true,
      polLpd: 525,
      rationsPacks: 1485,
      ammoRounds: 260,
      tempCelsius: -22,
      generatorLoad: 95,
      bukhariHours: 24,
      fleetActive: 12,
      statusBadge: 'AI Proj: Cold Front',
      statusClass: 'badge-amber',
      x: 620,
      polY: 112,
      ratY: 72,
      ammoY: 46,
      tempY: 230,
      gensetBurn: 228,
      bukhariBurn: 158,
      fleetBurn: 90,
      auxBurn: 49
    },
    {
      id: 'D+2',
      dayLabel: 'D+2 (EST)',
      calendarDate: '15 Oct',
      isToday: false,
      isForecast: true,
      polLpd: 560,
      rationsPacks: 1515,
      ammoRounds: 280,
      tempCelsius: -26,
      generatorLoad: 98,
      bukhariHours: 24,
      fleetActive: 12,
      statusBadge: 'Depot Resupply Ceiling',
      statusClass: 'badge-red',
      x: 695,
      polY: 98,
      ratY: 62,
      ammoY: 38,
      tempY: 254,
      gensetBurn: 242,
      bukhariBurn: 168,
      fleetBurn: 96,
      auxBurn: 54
    },
    {
      id: 'D+3',
      dayLabel: 'D+3 (EST)',
      calendarDate: '16 Oct',
      isToday: false,
      isForecast: true,
      polLpd: 595,
      rationsPacks: 1545,
      ammoRounds: 310,
      tempCelsius: -29,
      generatorLoad: 100,
      bukhariHours: 24,
      fleetActive: 14,
      statusBadge: 'AI Proj: Blizzard Windchill',
      statusClass: 'badge-red',
      x: 770,
      polY: 84,
      ratY: 50,
      ammoY: 30,
      tempY: 272,
      gensetBurn: 256,
      bukhariBurn: 178,
      fleetBurn: 102,
      auxBurn: 59
    },
    {
      id: 'D+4',
      dayLabel: 'D+4 (EST)',
      calendarDate: '17 Oct',
      isToday: false,
      isForecast: true,
      polLpd: 630,
      rationsPacks: 1580,
      ammoRounds: 330,
      tempCelsius: -33,
      generatorLoad: 100,
      bukhariHours: 24,
      fleetActive: 14,
      statusBadge: 'Peak Surge Envelope (+28%)',
      statusClass: 'badge-red',
      x: 845,
      polY: 70,
      ratY: 38,
      ammoY: 22,
      tempY: 296,
      gensetBurn: 270,
      bukhariBurn: 188,
      fleetBurn: 108,
      auxBurn: 64
    }
  ];

  // Currently selected point for interactive HUD inspection (Defaults to Today)
  selectedTelemetryPoint: any = this.telemetryDailyRecords[6];

  setChartMetric(metric: 'ALL' | 'POL' | 'RATIONS' | 'AMMO') {
    this.activeChartMetric = metric;
  }

  inspectTelemetryPoint(point: any) {
    this.selectedTelemetryPoint = point;
  }

  requestFormError = '';

  // Modal helper methods with body scroll lock
  openCreateRequestModal() {
    this.showCreateRequestModal = true;
    this.requestFormError = '';
    if (!this.newReqItem) {
      this.newReqItem = 'Sub-Zero High Speed Diesel (Winter Grade -40°C)';
    }
    if (!this.newReqQty) {
      this.newReqQty = '12,000 Litres';
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeCreateRequestModal() {
    this.showCreateRequestModal = false;
    this.requestFormError = '';
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  openTrackModal(request: UnitIndent) {
    this.selectedRequest = request;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeTrackModal() {
    this.selectedRequest = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  advanceIndent(ind: UnitIndent) {
    if (ind.status === 'Pending HQ Approval') {
      this.logisticsService.approveIndent(ind.id);
      ind.status = 'Approved by DGOS';
      this.feedbackMsg = `Indent #${ind.id} approved by DGOS Northern Command.`;
    } else if (ind.status === 'Approved by DGOS') {
      this.logisticsService.dispatchIndent(ind.id);
      ind.status = 'Dispatched from COD';
      this.feedbackMsg = `Indent #${ind.id} dispatched from COD Pathankot with Convoy escort.`;
    } else if (ind.status === 'Dispatched from COD') {
      this.logisticsService.deliverIndent(ind.id);
      ind.status = 'Delivered';
      this.feedbackMsg = `Indent #${ind.id} received and ledger verified at 14 Rajput Regimental Base.`;
    }
    setTimeout(() => this.feedbackMsg = '', 6000);
  }

  autoFillPreWinterIndent() {
    this.newReqCategory = 'Class III (POL)';
    this.newReqItem = 'Arctic Grade Sub-Zero Diesel (-40°C HSD Pre-Winter Buffer)';
    this.newReqQty = '25,000 Litres';
    this.newReqPriority = 'Operational Priority 1';
    this.newReqDate = '2026-10-25';
    this.newReqReason = 'AI Telematics Winter Surge model predicts +28% burn rate. Pre-stocking prior to Zoji La pass closure.';
    this.newReqNotes = 'Direct replenishment to Bulk Fuel Installation (BFI) Depot 14 Rajput.';
    this.openCreateRequestModal();
  }
  // 2.4 Supply Requests State
  showCreateRequestModal = false;
  selectedRequest: UnitIndent | null = null;
  newReqCategory: any = 'Class III (POL)';
  newReqItem = '';
  newReqQty = '';
  newReqPriority: any = 'Operational Priority 1';
  newReqDate = '2026-10-15';
  newReqReason = 'Pre-winter storage replenishment for forward platoon post';
  newReqNotes = '';

  // 2.5 Logistics State & Filters
  selectedShipment: ConvoyItem | null = null;
  logisticsSearch: string = '';
  logisticsCargoFilter: string = 'All';
  logisticsStatusFilter: string = 'All';
  logisticsViewMode: 'cards' | 'table' = 'cards';

  filteredConvoys(): ConvoyItem[] {
    return this.logisticsService.convoys().filter(c => {
      const q = this.logisticsSearch.trim().toLowerCase();
      const matchSearch = !q ||
        c.callsign.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        c.destination.toLowerCase().includes(q) ||
        c.cargoType.toLowerCase().includes(q) ||
        c.route.toLowerCase().includes(q);
      const matchCargo = this.logisticsCargoFilter === 'All' || c.cargoType.toLowerCase().includes(this.logisticsCargoFilter.toLowerCase());
      const matchStatus = this.logisticsStatusFilter === 'All' || c.status === this.logisticsStatusFilter;
      return matchSearch && matchCargo && matchStatus;
    });
  }

  inspectConvoy(c: ConvoyItem) {
    this.selectedShipment = c;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeConvoyModal() {
    this.selectedShipment = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  getPassedCheckpointsCount(c: ConvoyItem): number {
    return c.checkpoints?.filter(cp => cp.passed).length || 0;
  }

  getTotalCheckpointsCount(c: ConvoyItem): number {
    return c.checkpoints?.length || 0;
  }

  getTotalTonnage(): number {
    return this.logisticsService.convoys().reduce((sum, c) => sum + (c.tonnage || 0), 0);
  }

  getTotalTrucks(): number {
    return this.logisticsService.convoys().reduce((sum, c) => sum + (c.vehiclesCount || 0), 0);
  }

  getCheckpointProgressPercent(c: ConvoyItem): number {
    const total = this.getTotalCheckpointsCount(c);
    if (!total) return 0;
    return Math.round((this.getPassedCheckpointsCount(c) / total) * 100);
  }

  getReroutedConvoysCount(): number {
    return this.logisticsService.convoys().filter(c => c.status === 'Rerouted').length;
  }

  // 2.6 Route & Weather State
  weatherSearch = '';
  weatherAccessibilityFilter = 'All';
  selectedPass: WeatherStationData | null = null;

  inspectPass(st: WeatherStationData) {
    this.selectedPass = st;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closePassModal() {
    this.selectedPass = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  viewAxisInLogistics(route: string) {
    this.closePassModal();
    this.logisticsSearch = route;
    this.setTab('logistics');
  }

  get openPassesCount(): number {
    return this.logisticsService.weatherStations().filter(st => st.accessibility === 'Open').length;
  }

  get chainsPassesCount(): number {
    return this.logisticsService.weatherStations().filter(st => st.accessibility === 'Chains Required').length;
  }

  get restrictedPassesCount(): number {
    return this.logisticsService.weatherStations().filter(st => st.accessibility.includes('Restric')).length;
  }

  filteredWeatherStations(): WeatherStationData[] {
    return this.logisticsService.weatherStations().filter(st => {
      const q = this.weatherSearch.trim().toLowerCase();
      const matchSearch = !q ||
        st.passName.toLowerCase().includes(q) ||
        st.location.toLowerCase().includes(q) ||
        st.alert.toLowerCase().includes(q) ||
        (st.alternativeRoute && st.alternativeRoute.toLowerCase().includes(q));

      let matchFilter = true;
      if (this.weatherAccessibilityFilter === 'Open') {
        matchFilter = st.accessibility === 'Open';
      } else if (this.weatherAccessibilityFilter === 'Chains Required') {
        matchFilter = st.accessibility === 'Chains Required';
      } else if (this.weatherAccessibilityFilter === 'Convoy Restricted') {
        matchFilter = st.accessibility.includes('Restric');
      }
      return matchSearch && matchFilter;
    });
  }

  getRestrictedPassesCount(): number {
    return this.restrictedPassesCount;
  }

  // 2.7 AI Insights State
  aiFilter = 'All';
  expandedContingencies: { [key: string]: boolean } = {};
  approvedDirectives = new Set<string>();

  isDirectiveApproved(alertId: string): boolean {
    return this.approvedDirectives.has(alertId);
  }

  toggleContingency(alertId: string) {
    this.expandedContingencies[alertId] = !this.expandedContingencies[alertId];
  }

  filteredAlerts(): StrategicAlert[] {
    return this.logisticsService.alerts().filter(alt => {
      if (this.aiFilter === 'All') return true;
      return alt.type === this.aiFilter;
    });
  }

  executeAlertAction(alt: StrategicAlert) {
    this.approvedDirectives.add(alt.id);
    this.feedbackMsg = `Quartermaster Directive Issued [${alt.id}]: Action approved — "${alt.recommendedAction.slice(0, 60)}..." Dispatched to operations log.`;
    setTimeout(() => {
      if (this.feedbackMsg.includes(alt.id)) {
        this.feedbackMsg = '';
      }
    }, 7000);
  }

  executeAlternativeAction(alt: StrategicAlert, coa: string) {
    this.approvedDirectives.add(alt.id);
    this.feedbackMsg = `Secondary Directive Issued [${alt.id}]: COA approved — "${coa.slice(0, 60)}..." Dispatched to field units.`;
    setTimeout(() => {
      if (this.feedbackMsg.includes(alt.id)) {
        this.feedbackMsg = '';
      }
    }, 7000);
  }

  // 2.8 Reports State
  reportType = 'Daily Logistics';
  reportDateRange = 'Last 7 Days';
  reportDownloadNotice = '';
  selectedReportPreview: any | null = null;

  reportsList = [
    {
      id: 'REP-2026-10-06-A',
      title: 'Daily Logistics & Fuel Balance Log',
      category: 'POL & Consumption',
      period: 'Today (06 Oct 2026)',
      authorizingOfficer: 'Major Amit Sharma (QM)',
      status: 'Signed & Reconciled',
      classification: 'RESTRICTED',
      recordsCount: 42,
      fileSize: '2.4 MB'
    },
    {
      id: 'REP-2026-Q3-WST',
      title: 'Pre-Winter Stocking Verification Statement',
      category: 'Winter Buffers',
      period: 'Q3 2026',
      authorizingOfficer: 'Col R. S. Shekhawat (CO)',
      status: '100% Reserve Verified',
      classification: 'CONFIDENTIAL',
      recordsCount: 118,
      fileSize: '5.1 MB'
    },
    {
      id: 'REP-2026-AM-AUD',
      title: 'Class V Munitions & Arms Audit Ledger',
      category: 'Ammunition & Armament',
      period: 'Sep - Oct 2026',
      authorizingOfficer: 'Lt Col V. Nair (Ordnance)',
      status: 'Signed & Reconciled',
      classification: 'SECRET',
      recordsCount: 64,
      fileSize: '3.8 MB'
    },
    {
      id: 'REP-2026-FLT-STS',
      title: 'Convoy Transport & Mechanical Fitness Report',
      category: 'Fleet Readiness',
      period: 'Week 40 (2026)',
      authorizingOfficer: 'Capt D. S. Chauhan (EME)',
      status: 'Certified Airworthy / Roadworthy',
      classification: 'RESTRICTED',
      recordsCount: 28,
      fileSize: '1.9 MB'
    }
  ];

  openReportPreview(rep: any) {
    this.selectedReportPreview = rep;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  closeReportPreview() {
    this.selectedReportPreview = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  downloadReportCSV(rep?: any) {
    const filename = rep ? rep.id : `${this.unitDbService.selectedUnit().name.replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Ledger`;
    const items = rep ? [rep] : this.reportsList;
    const header = ['Report ID', 'Document Title', 'Category', 'Period', 'Authorizing Officer', 'Classification', 'Audit Status', 'Records', 'Size'];
    const rows = items.map(r => [r.id, `"${r.title}"`, `"${r.category}"`, `"${r.period}"`, `"${r.authorizingOfficer}"`, r.classification, `"${r.status}"`, r.recordsCount, r.fileSize]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.reportDownloadNotice = `Downloaded ${filename}.csv with official DGOS digital ledger seal.`;
    setTimeout(() => this.reportDownloadNotice = '', 6000);
  }

  // 2.9 Terminal Settings State
  autoSosBroadcast = true;
  convoySmsAlerts = true;
  batteryOptimization = true;
  offlineCache = true;
  asconSyncInterval = '30 Seconds';
  activeSigningKey = 'SHA-256: 14R-QM-71044A-2026-REV1 (VALID)';
  keyRevCount = 1;
  settingsSaved = false;

  rekeyTerminal() {
    this.keyRevCount++;
    this.activeSigningKey = `SHA-256: 14R-QM-71044A-2026-REV${this.keyRevCount} (VALID & VERIFIED)`;
    this.feedbackMsg = `ASCON Crypto Key refreshed: SHA-256 Token #14R-QM-71044A-2026-REV${this.keyRevCount} verified with Army Cyber Node.`;
    setTimeout(() => this.feedbackMsg = '', 7000);
  }

  syncInventoryWithDb() {
    this.http.get<any>(`${this.API_BASE}/inventory/status`).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data && Array.isArray(data.inventory)) {
        const rajputStocks = data.inventory.filter((inv: any) => inv.depot_id === 'UNIT-RAJPUT' || inv.depot_id === 'DEPOT-LEH');
        if (rajputStocks.length > 0) {
          this.unitInventoryList.forEach(localItem => {
            const match = rajputStocks.find((s: any) => s.sku_id === localItem.id);
            if (match) {
              const unitMatch = localItem.quantity.match(/[a-zA-Z°%]+/g);
              const unitStr = unitMatch ? unitMatch.join(' ') : '';
              localItem.quantity = `${match.quantity_on_hand.toLocaleString()} ${unitStr}`.trim();
              localItem.daysRemaining = Math.round(match.quantity_on_hand / 35);
              const qtyNum = match.quantity_on_hand;
              const safeNum = parseFloat(localItem.safetyStock.replace(/,/g, '')) || 0;
              const reorderNum = parseFloat(localItem.reorderLevel.replace(/,/g, '')) || 0;
              localItem.status = qtyNum <= safeNum ? 'Critical' : (qtyNum <= reorderNum ? 'Low' : 'Adequate');
            }
          });
        }
      }
    });
  }

  ngOnInit() {
    this.syncInventoryWithDb();
    this.currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    this.route.params.subscribe(params => {
      if (params['tab']) {
        this.setTab(params['tab'] as UnitTab, false);
      }
    });
  }

  setTab(tab: UnitTab, navigate = true) {
    this.activeTab = tab;
    this.feedbackMsg = '';
    if (navigate) {
      this.router.navigate(['/unit', tab]);
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  filteredInventory(): LocalInventoryItem[] {
    return this.unitInventoryList.filter(item => {
      const matchSearch = !this.invSearch || item.item.toLowerCase().includes(this.invSearch.toLowerCase());
      const matchCat = this.invCategoryFilter === 'All' || item.category === this.invCategoryFilter;
      const matchStatus = this.invStatusFilter === 'All' || item.status === this.invStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }

  acknowledgedConvoys = new Set<string>();

  isConvoyAcknowledged(id: string): boolean {
    return this.acknowledgedConvoys.has(id);
  }

  submitNewRequest() {
    if (!this.newReqItem.trim() || !this.newReqQty.trim()) {
      this.requestFormError = 'Please fill in Item Nomenclature and Requested Quantity.';
      return;
    }
    this.requestFormError = '';

    const created = this.logisticsService.addIndent({
      unitName: this.unitDbService.selectedUnit().name || this.authService.currentUser()?.unit || '14 RAJPUT (MECHANISED)',
      category: this.newReqCategory,
      itemDescription: this.newReqItem,
      requestedQty: this.newReqQty,
      urgency: this.newReqPriority,
      requiredBy: this.newReqDate,
      reason: this.newReqReason,
      remarks: this.newReqNotes
    });

    this.feedbackMsg = `Supply Requisition #${created.id} generated and transmitted to Northern Command Supply Depot.`;
    this.closeCreateRequestModal();
    this.newReqItem = '';
    this.newReqQty = '';
    this.setTab('requests');
  }

  @HostListener('window:keydown.escape')
  handleEscape() {
    this.closeConvoyModal();
    this.closeCreateRequestModal();
    this.closeTrackModal();
    this.closeReportPreview();
    this.closeAddReceiptModal();
    this.closeRecordConsumptionModal();
    this.closeLedgerCard();
    this.closeNotifications();
    this.closePassModal();
  }

  acknowledgeDelivery(shipmentId: string) {
    this.acknowledgedConvoys.add(shipmentId);
    this.logisticsService.acknowledgeConvoy(shipmentId);
    this.feedbackMsg = `Consignment verified and entered into ${this.unitDbService.selectedUnit().name} Regimental Stores Ledger. Voucher RV-${shipmentId}-ACK signed.`;
    setTimeout(() => {
      if (this.feedbackMsg.includes(shipmentId)) {
        this.feedbackMsg = '';
      }
    }, 7000);
  }

  triggerSosEmergency() {
    const sos = this.logisticsService.addIndent({
      unitName: this.unitDbService.selectedUnit().name || '14 RAJPUT (MECHANISED)',
      category: 'Class III (POL)',
      itemDescription: 'EMERGENCY SOS: 12,000L Sub-Zero HSD & Medical Oxygen Cylinders',
      requestedQty: 'Emergency Air-Drop Packet',
      urgency: 'SOS Emergency',
      requiredBy: 'Immediate',
      reason: 'Forward platoon post cut off by avalanche drift',
      remarks: 'Task emergency IAF Mi-17V5 airlift sortie'
    });
    alert(`EMERGENCY SOS REQUISITION #${sos.id} BROADCAST ON DEFENSE FLASH PRIORITY TO ARMY HQ & IAF AIR COMMAND!`);
    this.setTab('requests');
  }

  exportReport(format: 'PDF' | 'CSV' | 'Print', rep?: any) {
    if (format === 'Print') {
      window.print();
      return;
    }
    if (format === 'CSV') {
      this.downloadReportCSV(rep);
      return;
    }
    const title = rep ? rep.title : this.reportType;
    this.reportDownloadNotice = `Generating unit PDF report for "${title}" (${this.reportDateRange}). Verification stamp appended.`;
    setTimeout(() => {
      window.print();
    }, 400);
    setTimeout(() => this.reportDownloadNotice = '', 6000);
  }

  saveUnitSettings() {
    this.settingsSaved = true;
    this.feedbackMsg = 'Tactical Terminal & ASCON Node C4ISR Parameters successfully saved and encrypted into Local Flash Storage.';
    setTimeout(() => this.settingsSaved = false, 4000);
    setTimeout(() => {
      if (this.feedbackMsg.includes('Flash Storage')) {
        this.feedbackMsg = '';
      }
    }, 6000);
  }
}
