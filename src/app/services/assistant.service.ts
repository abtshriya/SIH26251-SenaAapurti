import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  category?: string;
  status?: string;
  trackingData?: any;
}

export interface QuickActionCategory {
  title: string;
  options: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1/assistant';

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  historyStack = signal<ChatMessage[][]>([]);

  constructor() {
    this.resetConversation();
  }

  toggleChat() {
    this.isOpen.update(open => !open);
  }

  openChat() {
    this.isOpen.set(true);
  }

  closeChat() {
    this.isOpen.set(false);
  }

  resetConversation() {
    const initialWelcome: ChatMessage = {
      id: 'msg-welcome-1',
      sender: 'assistant',
      text: "Jai Hind\nI'm SenaAapurti Assistant,\nand I'm here to answer any questions\nyou may have about Sena Aapurti\nlogistics, supply requisitions, and inventory support.\n\nHow can I assist you today?",
      timestamp: this.formatCurrentTime()
    };

    const initialPrompt: ChatMessage = {
      id: 'msg-welcome-2',
      sender: 'assistant',
      text: 'Your Question is regarding ?',
      timestamp: this.formatCurrentTime(),
      quickReplies: [
        'CHECK REQUISITION STATUS',
        'NEW INDENT',
        'DEPOT CONTACT',
        'VENDOR PORTAL SUPPORT',
        'ELIGIBILITY',
        'LOGIN/ PASSWORD'
      ]
    };

    this.messages.set([initialWelcome, initialPrompt]);
    this.historyStack.set([[initialWelcome, initialPrompt]]);
  }

  goBack() {
    const stack = this.historyStack();
    if (stack.length > 1) {
      // Pop current state and restore previous
      const updated = stack.slice(0, stack.length - 1);
      this.historyStack.set(updated);
      this.messages.set([...updated[updated.length - 1]]);
    } else {
      this.resetConversation();
    }
  }

  async sendMessage(userInput: string) {
    const trimmed = userInput.trim();
    if (!trimmed || this.isLoading()) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: this.formatCurrentTime()
    };

    // Append user message
    const currentList = [...this.messages(), userMsg];
    this.messages.set(currentList);
    this.isLoading.set(true);

    try {
      // Try connecting to live FastAPI backend
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/chat`, {
          message: trimmed,
          session_id: 'WEB-SESSION-' + Date.now(),
          context: { client: 'Angular-SenaAapurti' }
        })
      );

      const assistantReply: ChatMessage = {
        id: 'asst-' + Date.now(),
        sender: 'assistant',
        text: response.response,
        timestamp: this.formatCurrentTime(),
        quickReplies: response.quick_replies || [],
        category: response.category,
        status: response.status,
        trackingData: response.tracking_data
      };

      const updatedList = [...currentList, assistantReply];
      this.messages.set(updatedList);
      this.historyStack.update(stack => [...stack, updatedList]);
    } catch {
      // Seamless offline fallback intelligence engine
      const offlineReply = this.generateFallbackResponse(trimmed);
      const assistantReply: ChatMessage = {
        id: 'asst-' + Date.now(),
        sender: 'assistant',
        text: offlineReply.text,
        timestamp: this.formatCurrentTime(),
        quickReplies: offlineReply.quickReplies,
        category: offlineReply.category,
        status: offlineReply.status,
        trackingData: offlineReply.trackingData
      };

      const updatedList = [...currentList, assistantReply];
      this.messages.set(updatedList);
      this.historyStack.update(stack => [...stack, updatedList]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private generateFallbackResponse(input: string): {
    text: string;
    quickReplies: string[];
    category: string;
    status: string;
    trackingData?: any;
  } {
    const lower = input.toLowerCase();

    // Security Filter
    if (lower.includes('classified') || lower.includes('secret') || lower.includes('troop movement') ||
        lower.includes('coordinates') || lower.includes('war plan') || lower.includes('strike')) {
      return {
        text: "Jai Hind.\n\n**SECURITY PROTOCOL ENFORCEMENT - ACCESS RESTRICTED**\n\n• In strict compliance with Indian Army Information Security and Defense Operational Protocols, queries concerning classified tactical movements, tactical deployments, operational grid references, or restricted command credentials cannot be displayed on this portal.\n• All tactical plans and classified movements are exclusively processed via encrypted **ASCON C4ISR terminals** under the DGMO.\n\nPlease restrict queries to authorized defense supply chain, depot inventory, and consignment tracking matters.",
        quickReplies: ['CHECK REQUISITION STATUS', 'NEW INDENT', 'DEPOT CONTACT', 'VENDOR PORTAL SUPPORT'],
        category: 'SECURITY_RESTRICTED',
        status: 'RESTRICTED'
      };
    }

    // Recruitment Filter
    if (lower.includes('join') || lower.includes('recruitment') || lower.includes('eligibility') ||
        lower.includes('rally') || lower.includes('officer entry') || lower.includes('agniveer')) {
      return {
        text: "Jai Hind.\n\n**NOTICE: REDIRECTION TO RECRUITMENT DIRECTORATE**\n\n• Sena Aapurti is the dedicated logistics, inventory, and supply chain portal of the Indian Army.\n• For all queries regarding recruitment rallies, eligibility criteria, Agniveer selection, and officer entries (NDA/CDS/TES/TGC), please visit the official recruitment portal:\n\n  - **Official Portal**: [Join Indian Army (joinindianarmy.nic.in)](https://joinindianarmy.nic.in)\n  - **Recruiting Directorate Helpdesk**: 011-26173215 / 011-26175473\n\nHow may I assist you with military supplies or depot requisitions?",
        quickReplies: ['CHECK REQUISITION STATUS', 'NEW INDENT', 'DEPOT CONTACT', 'VENDOR PORTAL SUPPORT'],
        category: 'OUT_OF_SCOPE_RECRUITMENT',
        status: 'SUCCESS'
      };
    }

    // Check Indent
    if (lower.includes('ind-2026-9041') || lower.includes('pol') || lower.includes('fuel')) {
      return {
        text: "Jai Hind.\n\n**REQUISITION CONSIGNMENT REPORT: IND-2026-9041**\n\n• **Requesting Unit**: 14 RAJPUT (MECHANISED)\n• **Stores Description**: Sub-Zero High Speed Diesel (Winter Grade -40°C)\n• **Indented Quantity**: 18,000 Litres\n• **Operational Urgency**: Operational Priority 1\n• **Consignment Status**: Approved by DGOS (Dispatched via Convoy GARUDA-01)\n• **Destination Axis**: FDL Leh Sector\n• **Projected Sustenance ETA**: Within 24 Hours\n\n**Next Action Guidance**:\n1. Confirm digital handover upon receipt using the cryptographically signed IAFZ-2026 receipt voucher.\n2. For priority escalations, contact the DGOS Movement Control Room.",
        quickReplies: ['TRACK ANOTHER INDENT', 'NEW INDENT', 'DEPOT CONTACT', 'RETURN TO MENU'],
        category: 'TRACKING_INDENT',
        status: 'SUCCESS',
        trackingData: { id: 'IND-2026-9041', item: 'Sub-Zero HSD', status: 'Approved & Dispatched' }
      };
    }

    if (lower.includes('ind-2026-9042') || lower.includes('spare') || lower.includes('track')) {
      return {
        text: "Jai Hind.\n\n**REQUISITION CONSIGNMENT REPORT: IND-2026-9042**\n\n• **Requesting Unit**: 14 RAJPUT (MECHANISED)\n• **Stores Description**: BMP-II Track Pins & Cold-Start Batteries\n• **Indented Quantity**: 48 Sets\n• **Operational Urgency**: Routine\n• **Consignment Status**: Dispatched from COD Agra via Convoy CHETAK-2\n• **Destination Axis**: EME Field Workshop (Leh)\n• **Projected Sustenance ETA**: In Transit (ETA 1 hr 15 mins)",
        quickReplies: ['TRACK ANOTHER INDENT', 'NEW INDENT', 'DEPOT CONTACT', 'RETURN TO MENU'],
        category: 'TRACKING_INDENT',
        status: 'SUCCESS'
      };
    }

    if (lower.includes('check requisition') || lower.includes('status') || lower.includes('indent')) {
      return {
        text: "Jai Hind.\n\n**SUPPLY REQUISITION TRACKING DESK**\n\nTo track a consignment or indent voucher, select an active reference number or enter your voucher ID:\n\n• `IND-2026-9041` : Winter POL Fuel (14 Rajput / Leh)\n• `IND-2026-9042` : BMP-II Spares & Tracks (COD Agra)\n• `IND-2026-9043` : Glacier Survival Kits (3 PARA SF / Siachen)\n• `IND-2026-9044` : 155mm Artillery Munitions (19 Arty / Drass)",
        quickReplies: ['IND-2026-9041', 'IND-2026-9042', 'IND-2026-9043', 'IND-2026-9044', 'NEW INDENT'],
        category: 'REQUISITION_MENU',
        status: 'SUCCESS'
      };
    }

    if (lower.includes('new indent') || lower.includes('indent procedure')) {
      return {
        text: "Jai Hind.\n\n**PROCEDURE: FILING A NEW DEFENSE REQUISITION (INDENT)**\n\nTo raise an authorized supply indent for forward replenishment, execute the following numbered steps:\n\n1. **Authenticate**: Log in to the **Unit Portal** using your Army Service Number and registered credentials.\n2. **Select Supply Class**:\n   - **Class I**: Combat Rations & Fresh Supplies (3500 kcal/pack)\n   - **Class III**: Sub-Zero High Speed Diesel (POL / Aviation Fuel)\n   - **Class V**: Munitions & Artillery Charges (UBL Replenishment)\n   - **Class IX**: Vehicle Spares, BMP Overhaul Assemblies & EME kits\n   - **Special Stores**: Extreme Cold Climate (ECC) Clothing & Medical Kits\n3. **Complete Digital Voucher IAFZ-2026**: Specify item SKU, required quantity, operational justification, and desired delivery date.\n4. **Sign & Transmit**: Apply your Regimental Quartermaster / OC digital token to submit into the DGOS predictive dispatch queue.",
        quickReplies: ['CLASS I (RATIONS)', 'CLASS III (FUEL)', 'CLASS V (MUNITIONS)', 'CLASS IX (SPARES)'],
        category: 'PROCEDURE_INDENT',
        status: 'SUCCESS'
      };
    }

    if (lower.includes('depot') || lower.includes('contact')) {
      return {
        text: "Jai Hind.\n\n**CENTRAL ORDNANCE DEPOTS (COD) & CONTROL ROOM DIRECTORY**\n\n• **24x7 Army HQ Logistics Ops Room**:\n  - Toll-Free: 1800-11-SENA (7362)\n  - ASCON Extension: Node 4481 / 4482\n  - Email: support.senaaapurti@nic.in\n\n• **Principal Holding Depots**:\n  - **COD Pathankot**: Northern Theater Forward Holding Depot\n  - **COD Narangi (Guwahati)**: Eastern Command Principal Railhead\n  - **COD Jabalpur**: National Munitions & Heavy Armament Repository\n  - **COD Agra**: Vehicle Spares & Armoured Maintenance Park\n  - **21 ABD Udhampur**: Advance Base Depot for J&K & Ladakh sectors",
        quickReplies: ['CHECK REQUISITION STATUS', 'NEW INDENT', 'VENDOR PORTAL SUPPORT', 'RETURN TO MENU'],
        category: 'DEPOT_DIRECTORY',
        status: 'SUCCESS'
      };
    }

    if (lower.includes('login') || lower.includes('password') || lower.includes('vendor') || lower.includes('gem')) {
      return {
        text: "Jai Hind.\n\n**VERIFICATION & PORTAL ACCESS SUPPORT**\n\n• **Defense Vendor Registration (GeM Defense Window)**:\n  1. Register on the Government e-Marketplace (GeM) Defense Portal (gem.gov.in).\n  2. Obtain OEM/Vendor Certification through DGQA.\n  3. Submit GSTIN, PAN, and Security Clearances to the DGOS Vendor Desk.\n\n• **Officer & Quartermaster Portal Login Issues**:\n  1. Access via authorized ASCON intranet or VPN Gateway.\n  2. For Step-Up MFA, verify your registered hardware YubiKey or military OTP token.\n  3. If your account is locked after 3 failed attempts, contact the Cyber Helpdesk at Node 4481.",
        quickReplies: ['CHECK REQUISITION STATUS', 'NEW INDENT', 'DEPOT CONTACT', 'RETURN TO MENU'],
        category: 'ACCESS_SUPPORT',
        status: 'SUCCESS'
      };
    }

    return {
      text: "Jai Hind.\n\nI'm **SenaAapurti Assistant**, and I'm here to answer any questions you may have about Indian Army logistics, defense supply requisitions, consignment tracking, and inventory support.\n\nHow can I assist you today?",
      quickReplies: ['CHECK REQUISITION STATUS', 'NEW INDENT', 'DEPOT CONTACT', 'VENDOR PORTAL SUPPORT'],
      category: 'GENERAL_ASSISTANCE',
      status: 'SUCCESS'
    };
  }

  private formatCurrentTime(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
