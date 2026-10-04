import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LogisticsService, UnitIndent } from '../../services/logistics.service';

@Component({
  selector: 'app-unit-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './unit-dashboard.component.html',
  styleUrl: './unit-dashboard.component.css'
})
export class UnitDashboardComponent {
  authService = inject(AuthService);
  logisticsService = inject(LogisticsService);

  activeTab: 'inventory' | 'create-indent' | 'in-transit' | 'emergency-sos' = 'inventory';

  // New Indent Form
  newCategory: 'Class I (Rations)' | 'Class III (POL)' | 'Class V (Ammo)' | 'Class IX (Spares)' | 'ECC / Winter Clothing' = 'Class III (POL)';
  newItemDesc = '';
  newQuantity = '';
  newUrgency: 'Routine' | 'Operational Priority 1' | 'SOS Emergency' = 'Routine';
  newRemarks = '';
  indentSuccessMsg = '';

  // Emergency SOS Form
  sosSector = 'Post Alpha-12 (Shyok Defended Sector)';
  sosItem = 'Class V Ammunition & Cold Injury Plasma Packs';
  sosCoordinates = '34.2218° N, 77.8921° E';
  sosReason = 'Avalanche cut off secondary track; forward picket isolated';
  sosSuccess = false;

  setActiveTab(tab: 'inventory' | 'create-indent' | 'in-transit' | 'emergency-sos') {
    this.activeTab = tab;
    this.indentSuccessMsg = '';
  }

  applyAiRecommendation(category: any, desc: string, qty: string) {
    this.newCategory = category;
    this.newItemDesc = desc;
    this.newQuantity = qty;
    this.newRemarks = 'Auto-calculated based on -25°C 7-day temperature forecast.';
    this.activeTab = 'create-indent';
  }

  submitNewIndent() {
    if (!this.newItemDesc.trim() || !this.newQuantity.trim()) {
      alert('Please fill in Item Description and Requested Quantity.');
      return;
    }

    const created = this.logisticsService.addIndent({
      unitName: this.authService.currentUser()?.unit || '14 RAJPUT (MECHANISED)',
      category: this.newCategory,
      itemDescription: this.newItemDesc,
      requestedQty: this.newQuantity,
      urgency: this.newUrgency,
      remarks: this.newRemarks
    });

    this.indentSuccessMsg = `Requisition Voucher #${created.id} generated and transmitted to Northern Command Supply Depot.`;
    this.newItemDesc = '';
    this.newQuantity = '';
    this.newRemarks = '';
  }

  acknowledgeDelivery(id: string) {
    alert(`Consignment verified and entered into 14 Rajput Regimental Stores Ledger. RV #${id}-ACK issued.`);
  }

  submitEmergencySos() {
    this.sosSuccess = true;
  }
}
