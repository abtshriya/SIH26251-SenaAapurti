import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, MilitaryUser } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  authService = inject(AuthService);
  langService = inject(LanguageService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  portalMode: 'command' | 'unit' = 'command';
  authAction: 'login' | 'register' = 'login';

  // Login Form Model
  serviceNo = '';
  password = '';
  captchaInput = '';
  currentCaptcha = '7K9X2';
  rememberMe = true;
  loginError = '';
  showOtpStep = false;
  otpCode = '';

  // Register Form Model
  regName = '';
  regServiceNo = '';
  regRank = 'Major';
  regUnit = '';
  regCommand = 'Northern Command';
  regEmail = '';
  regPassword = '';
  regConfirmPassword = '';
  regSuccessMsg = '';

  ranks = [
    'Captain',
    'Major',
    'Lieutenant Colonel',
    'Colonel',
    'Brigadier',
    'Major General',
    'Lieutenant General',
    'Subedar Major'
  ];

  commands = [
    'Northern Command (Udhampur)',
    'Eastern Command (Kolkata)',
    'Western Command (Chandimandir)',
    'Southern Command (Pune)',
    'South Western Command (Jaipur)',
    'Central Command (Lucknow)',
    'Army Training Command (ARTRAC)'
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['portal'] === 'unit') {
        this.portalMode = 'unit';
      } else if (params['portal'] === 'command') {
        this.portalMode = 'command';
      }
      this.refreshCaptcha();
    });
  }

  setPortal(mode: 'command' | 'unit') {
    this.portalMode = mode;
    this.loginError = '';
    this.showOtpStep = false;
  }

  setAction(action: 'login' | 'register') {
    this.authAction = action;
    this.loginError = '';
    this.regSuccessMsg = '';
  }

  refreshCaptcha() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.currentCaptcha = res;
    this.captchaInput = '';
  }

  fillDemoCommand() {
    this.portalMode = 'command';
    this.serviceNo = 'IC-48291X';
    this.password = 'Command@Secure2026';
    this.captchaInput = this.currentCaptcha;
  }

  fillDemoUnit() {
    this.portalMode = 'unit';
    this.serviceNo = 'IC-71044A';
    this.password = 'Unit@Ready2026';
    this.captchaInput = this.currentCaptcha;
  }

  submitLogin() {
    this.loginError = '';

    if (!this.serviceNo.trim()) {
      this.loginError = 'Please enter your Army Service Number.';
      return;
    }

    if (!this.password.trim()) {
      this.loginError = 'Please enter your defense password or security PIN.';
      return;
    }

    if (this.captchaInput.toUpperCase() !== this.currentCaptcha) {
      this.loginError = 'Security Captcha mismatch. Please re-enter the code.';
      this.refreshCaptcha();
      return;
    }

    // Advance to simulated 2FA OTP
    this.showOtpStep = true;
    this.otpCode = '4829'; // Default demo OTP
  }

  verifyOtpAndLogin() {
    if (this.portalMode === 'command') {
      const user: MilitaryUser = {
        serviceNo: this.serviceNo.trim(),
        name: this.serviceNo === 'IC-48291X' ? 'Lt Gen V. K. Rawat, PVSM, AVSM' : 'Col R. S. Verma',
        rank: this.serviceNo === 'IC-48291X' ? 'Lieutenant General' : 'Colonel',
        unit: 'Master General of Sustenance (MGS) Branch, Army HQ',
        command: 'Integrated HQ of MoD (Army)',
        role: 'command',
        clearanceLevel: 'TOP SECRET - STRATEGIC'
      };
      this.authService.login(user);
    } else {
      const user: MilitaryUser = {
        serviceNo: this.serviceNo.trim(),
        name: this.serviceNo === 'IC-71044A' ? 'Major Amit Sharma' : 'Major K. P. Singh',
        rank: 'Major',
        unit: '14 RAJPUT (MECHANISED)',
        command: 'Northern Command (14 Corps - Leh)',
        role: 'unit',
        clearanceLevel: 'SECRET - OPERATIONAL'
      };
      this.authService.login(user);
    }
  }

  submitRegister() {
    if (!this.regName || !this.regServiceNo || !this.regUnit || !this.regEmail || !this.regPassword) {
      alert('Please fill in all mandatory military registration fields.');
      return;
    }

    if (this.regPassword !== this.regConfirmPassword) {
      alert('Password and Confirm Password do not match.');
      return;
    }

    this.regSuccessMsg = `Enrollment application registered for ${this.regRank} ${this.regName} (${this.regServiceNo}). Forwarded to Command Security Officer for authorization. You may now test login with the demo credentials.`;
    this.authAction = 'login';
  }
}
