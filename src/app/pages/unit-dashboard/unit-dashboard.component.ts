import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LogisticsService, UnitIndent, ConvoyItem } from '../../services/logistics.service';

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
  route = inject(ActivatedRoute);
  router = inject(Router);

  setFont(size: FontSize) {
    this.themeService.setFontSize(size);
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

  // 2.2 Inventory State
  invSearch = '';
  invCategoryFilter = 'All';
  invStatusFilter = 'All';
  selectedInvItem: LocalInventoryItem | null = null;
  showAddReceiptModal = false;
  showRecordConsumptionModal = false;
  showReportDamageModal = false;

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

  // 2.3 Consumption & Demand State
  consumptionFilterCat = 'All';
  consumptionPeriod = 'Daily';

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

  // 2.5 Logistics State
  selectedShipment: ConvoyItem | null = null;

  // 2.8 Reports State
  reportType = 'Daily Logistics';
  reportDateRange = 'Last 7 Days';
  reportDownloadNotice = '';

  ngOnInit() {
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

  submitNewRequest() {
    if (!this.newReqItem.trim() || !this.newReqQty.trim()) {
      alert('Please fill in Item Nomenclature and Requested Quantity.');
      return;
    }

    const created = this.logisticsService.addIndent({
      unitName: this.authService.currentUser()?.unit || '14 RAJPUT (MECHANISED)',
      category: this.newReqCategory,
      itemDescription: this.newReqItem,
      requestedQty: this.newReqQty,
      urgency: this.newReqPriority,
      requiredBy: this.newReqDate,
      reason: this.newReqReason,
      remarks: this.newReqNotes
    });

    this.feedbackMsg = `Supply Requisition #${created.id} generated and transmitted to Northern Command Supply Depot.`;
    this.showCreateRequestModal = false;
    this.newReqItem = '';
    this.newReqQty = '';
    this.setTab('requests');
  }

  acknowledgeDelivery(shipmentId: string) {
    alert(`Consignment verified and entered into 14 Rajput Regimental Stores Ledger. Voucher RV-${shipmentId}-ACK signed.`);
  }

  triggerSosEmergency() {
    const sos = this.logisticsService.addIndent({
      unitName: '14 RAJPUT (MECHANISED)',
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

  exportReport(format: 'PDF' | 'CSV' | 'Print') {
    if (format === 'Print') {
      window.print();
      return;
    }
    this.reportDownloadNotice = `Generating unit ${format} report for "${this.reportType}" (${this.reportDateRange}). Verification stamp appended.`;
    setTimeout(() => this.reportDownloadNotice = '', 5000);
  }

  saveUnitSettings() {
    alert('Unit Quartermaster settings saved and synced with Regimental Ledger.');
  }
}
