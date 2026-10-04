import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LogisticsService, ConvoyItem, StrategicAlert } from '../../services/logistics.service';

@Component({
  selector: 'app-command-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './command-dashboard.component.html',
  styleUrl: './command-dashboard.component.css'
})
export class CommandDashboardComponent {
  authService = inject(AuthService);
  logisticsService = inject(LogisticsService);

  activeTab: 'overview' | 'convoys' | 'ai-alerts' | 'simulation' | 'approvals' = 'overview';

  // Simulator controls
  selectedScenario = 'Zojila Pass Avalanche & Extreme Cold Wave';
  simIntensity = 65;
  enableAirlift = true;
  simRan = false;

  scenarios = [
    'Zojila Pass Avalanche & Extreme Cold Wave',
    'Eastern Theater Rapid Mobilization & Mountain Frost',
    'Western Desert Sandstorm & Heavy Armor Exercises',
    'High-Altitude Siachen Forward Picket Replenishment'
  ];

  theaters = [
    { name: 'Northern Command (Udhampur)', status: 'Optimal', readiness: 97.2, alertLevel: 'DEFCON 2', corps: '14, 15, 16 Corps' },
    { name: 'Eastern Command (Kolkata)', status: 'Optimal', readiness: 95.8, alertLevel: 'DEFCON 3', corps: '3, 4, 33 Corps' },
    { name: 'Western Command (Chandimandir)', status: 'Optimal', readiness: 98.1, alertLevel: 'DEFCON 3', corps: '2, 9, 11 Corps' },
    { name: 'Southern Command (Pune)', status: 'Normal', readiness: 96.0, alertLevel: 'DEFCON 4', corps: '12, 21 Corps' },
    { name: 'South Western Command (Jaipur)', status: 'Optimal', readiness: 95.4, alertLevel: 'DEFCON 4', corps: '1, 10 Corps' },
    { name: 'Central Command (Lucknow)', status: 'Normal', readiness: 98.7, alertLevel: 'DEFCON 4', corps: 'Central Depots' }
  ];

  depots = [
    { name: 'COD Pathankot', stockLevel: '96%', classStocked: 'Class III & IX', throughput: '1,420 Tons/Day', status: 'Active' },
    { name: 'COD Agra', stockLevel: '94%', classStocked: 'Class IX Spares & Aerial Drops', throughput: '980 Tons/Day', status: 'Active' },
    { name: 'COD Jabalpur', stockLevel: '97%', classStocked: 'Class V Heavy Ammunition', throughput: '2,100 Tons/Day', status: 'Active' },
    { name: 'COD Narangi (Guwahati)', stockLevel: '91%', classStocked: 'Class I, III & V Eastern', throughput: '1,250 Tons/Day', status: 'Active' },
    { name: 'COD Delhi Cantt', stockLevel: '98%', classStocked: 'Strategic Defense Reserve', throughput: '850 Tons/Day', status: 'Active' }
  ];

  selectedConvoy: ConvoyItem | null = null;
  alertActionSuccess = '';

  setActiveTab(tab: 'overview' | 'convoys' | 'ai-alerts' | 'simulation' | 'approvals') {
    this.activeTab = tab;
  }

  inspectConvoy(convoy: ConvoyItem) {
    this.selectedConvoy = convoy;
  }

  triggerReroute(convoy: ConvoyItem) {
    convoy.status = 'Rerouted';
    convoy.route = convoy.route + ' [Bypass Activated via BRO Secondary Link]';
    alert(`Rerouting order transmitted to convoy ${convoy.callsign} via ASCON tactical network.`);
  }

  approveIndent(id: string) {
    this.logisticsService.approveIndent(id);
    alert(`Requisition ${id} has been formally authorized by DGOS Directorate.`);
  }

  dispatchIndent(id: string) {
    this.logisticsService.dispatchIndent(id);
    alert(`Consignment dispatch order issued for Requisition ${id}.`);
  }

  runScenarioSimulation() {
    this.simRan = true;
    this.logisticsService.runSimulation(this.selectedScenario, this.simIntensity, this.enableAirlift);
  }

  executeAlertRemedy(alertItem: StrategicAlert) {
    this.alertActionSuccess = `Automated remediation order dispatched for Alert ${alertItem.id}: "${alertItem.recommendedAction}"`;
    setTimeout(() => {
      this.alertActionSuccess = '';
    }, 6000);
  }
}
