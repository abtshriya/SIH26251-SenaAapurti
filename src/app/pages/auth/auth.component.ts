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

  // Current sub-route mode
  mode: 'login' | 'register' | 'forgot-password' | 'unauthorized' = 'login';
  portalMode: 'command' | 'unit' = 'command';
  regType: 'unit' | 'admin' = 'unit';

  // Login Form Model
  serviceNo = '';
  password = '';
  captchaInput = '';
  currentCaptcha = '7K9X2';
  rememberMe = true;
  loginError = '';
  showOtpStep = false;
  otpCode = '';

  // Unit Registration Model
  unitRegName = '';
  unitRegId = '';
  unitRegFormation = 'Northern Command (14 Corps)';
  unitRegLocation = 'Leh - Ladakh Forward Picket';
  unitRegAuthOfficer = '';
  unitRegContact = '';
  unitRegEmail = '';
  unitRegUsername = '';
  unitRegPassword = '';
  unitRegConfirmPassword = '';
  unitRegCaptcha = '';

  // Admin Registration Model
  adminRegId = '';
  adminRegName = '';
  adminRegDesignation = 'Director General of Ordnance Services (DGOS)';
  adminRegCommand = 'Integrated HQ of MoD (Army)';
  adminRegEmail = '';
  adminRegContact = '';
  adminRegUsername = '';
  adminRegPassword = '';
  adminRegConfirmPassword = '';
  adminRegCaptcha = '';

  // Forgot Password Model
  forgotUsernameEmail = '';
  forgotCaptcha = '';
  forgotOtp = '';
  forgotOtpSent = false;
  forgotNewPassword = '';
  forgotConfirmPassword = '';
  forgotSuccessMsg = '';
  forgotError = '';

  regSuccessMsg = '';

  formations = [
    'Northern Command (14 Corps - Leh)',
    'Northern Command (15 Corps - Srinagar)',
    'Northern Command (16 Corps - Nagrota)',
    'Eastern Command (4 Corps - Tezpur)',
    'Eastern Command (33 Corps - Sukna)',
    'Western Command (2 Corps - Ambala)',
    'Southern Command (12 Corps - Jodhpur)',
    'South Western Command (1 Corps - Mathura)',
    'Central Command Depots'
  ];

  adminCommands = [
    'Integrated HQ of MoD (Army) - New Delhi',
    'DGOS Directorate (Army Ordnance Corps)',
    'Master General of Sustenance (MGS) Branch',
    'Northern Command HQ (Udhampur)',
    'Eastern Command HQ (Kolkata)',
    'Western Command HQ (Chandimandir)',
    'Southern Command HQ (Pune)',
    'South Western Command HQ (Jaipur)',
    'Central Command HQ (Lucknow)'
  ];

  ngOnInit() {
    // Read route data
    this.route.data.subscribe(data => {
      if (data['mode']) {
        this.mode = data['mode'];
      }
    });

    this.route.url.subscribe(segments => {
      if (segments.length > 0) {
        const last = segments[segments.length - 1].path;
        if (['login', 'register', 'forgot-password', 'unauthorized'].includes(last)) {
          this.mode = last as any;
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['portal'] === 'unit') {
        this.portalMode = 'unit';
      } else if (params['portal'] === 'command') {
        this.portalMode = 'command';
      }
      this.refreshCaptcha();
    });
  }

  setMode(m: 'login' | 'register' | 'forgot-password' | 'unauthorized') {
    this.mode = m;
    this.loginError = '';
    this.regSuccessMsg = '';
    this.forgotSuccessMsg = '';
    this.forgotError = '';
    this.showOtpStep = false;
    this.router.navigate([`/auth/${m}`]);
  }

  setPortal(mode: 'command' | 'unit') {
    this.portalMode = mode;
    this.loginError = '';
    this.showOtpStep = false;
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
    this.password = 'CommandHQ@2026';
    this.captchaInput = this.currentCaptcha;
    this.loginError = '';
  }

  fillDemoUnit() {
    this.portalMode = 'unit';
    this.serviceNo = 'IC-71044A';
    this.password = 'RajputRegt@2026';
    this.captchaInput = this.currentCaptcha;
    this.loginError = '';
  }

  submitLogin() {
    this.loginError = '';

    if (!this.serviceNo.trim()) {
      this.loginError = 'Please enter your Official Service Number / User ID.';
      return;
    }
    if (!this.password.trim()) {
      this.loginError = 'Please enter your security access password.';
      return;
    }
    if (this.captchaInput.trim().toUpperCase() !== this.currentCaptcha.toUpperCase()) {
      this.loginError = 'Security verification code is incorrect. Please try again.';
      this.refreshCaptcha();
      return;
    }

    // Step 2: 2FA OTP simulation
    this.showOtpStep = true;
    this.otpCode = '4829';
  }

  verifyOtpAndLogin() {
    if (!this.otpCode || this.otpCode.length < 4) {
      this.loginError = 'Please enter the 4-digit verification code received on defense terminal.';
      return;
    }

    const user: MilitaryUser = this.portalMode === 'command' ? {
      serviceNo: this.serviceNo || 'IC-48291X',
      name: 'Lt Gen V. K. Rawat, PVSM, AVSM',
      rank: 'Lieutenant General',
      role: 'command',
      unit: 'Master General of Sustenance (MGS), Army HQ',
      command: 'Integrated HQ of MoD (Army)',
      clearanceLevel: 'TOP SECRET - STRATEGIC'
    } : {
      serviceNo: this.serviceNo || 'IC-71044A',
      name: 'Major Amit Sharma',
      rank: 'Major',
      role: 'unit',
      unit: '14 RAJPUT (MECHANISED)',
      command: 'Northern Command (14 Corps - Leh)',
      clearanceLevel: 'SECRET - OPERATIONAL'
    };

    this.authService.login(user);
    if (this.portalMode === 'command') {
      this.router.navigate(['/command/dashboard']);
    } else {
      this.router.navigate(['/unit/dashboard']);
    }
  }

  submitUnitRegister() {
    if (!this.unitRegName || !this.unitRegId || !this.unitRegAuthOfficer || !this.unitRegEmail || !this.unitRegPassword) {
      alert('Please fill in all required fields for Unit Registration.');
      return;
    }
    if (this.unitRegPassword !== this.unitRegConfirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    this.regSuccessMsg = `Unit Registration for "${this.unitRegName} (${this.unitRegId})" submitted successfully to DGOS Logistics Cell. Verification email sent to ${this.unitRegEmail}.`;
    setTimeout(() => {
      this.setMode('login');
      this.portalMode = 'unit';
    }, 2500);
  }

  submitAdminRegister() {
    if (!this.adminRegId || !this.adminRegName || !this.adminRegEmail || !this.adminRegPassword) {
      alert('Please fill in all required fields for Command/Admin Registration.');
      return;
    }
    if (this.adminRegPassword !== this.adminRegConfirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    this.regSuccessMsg = `Admin Officer Registration for "${this.adminRegName} (${this.adminRegId})" submitted for clearance authorization. Approval notification will be routed to ${this.adminRegEmail}.`;
    setTimeout(() => {
      this.setMode('login');
      this.portalMode = 'command';
    }, 2500);
  }

  requestForgotOtp() {
    if (!this.forgotUsernameEmail.trim()) {
      this.forgotError = 'Please provide your registered Username or Official Email ID.';
      return;
    }
    this.forgotError = '';
    this.forgotOtpSent = true;
    this.forgotOtp = '7741';
  }

  submitResetPassword() {
    if (!this.forgotOtp) {
      this.forgotError = 'Please enter the verification OTP.';
      return;
    }
    if (!this.forgotNewPassword || this.forgotNewPassword.length < 6) {
      this.forgotError = 'Password must be at least 6 characters.';
      return;
    }
    if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.forgotError = 'Passwords do not match.';
      return;
    }
    this.forgotError = '';
    this.forgotSuccessMsg = 'Password successfully reset! You can now log into your defense portal with your new credentials.';
    setTimeout(() => {
      this.setMode('login');
    }, 2000);
  }
}
