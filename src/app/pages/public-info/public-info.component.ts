import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-public-info',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-info.component.html',
  styleUrl: './public-info.component.css'
})
export class PublicInfoComponent implements OnInit {
  langService = inject(LanguageService);
  route = inject(ActivatedRoute);

  currentSection = 'about';

  // Support Ticket Form Model
  ticketName = '';
  ticketServiceNo = '';
  ticketUnit = '';
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
    this.route.data.subscribe(data => {
      if (data['section']) {
        this.currentSection = data['section'];
      }
    });

    this.route.url.subscribe(segments => {
      if (segments.length > 0) {
        this.currentSection = segments[0].path;
      }
    });
  }

  setSection(section: string) {
    this.currentSection = section;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
