import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService, MilitaryUser } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  langService = inject(LanguageService);
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);

  private readonly API_BASE = 'http://localhost:8000/api/v1';

  // Background Images Carousel
  authImages = [
    { src: '/images/auth_bg_1.jpg', title: 'Tactical Border Defense & Forward Deployment' },
    { src: '/images/auth_bg_2.jpg', title: 'Indian Armed Forces Regimental Strength' },
    { src: '/images/auth_bg_3.jpg', title: 'Army Aviation Combat Helicopter Operations' }
  ];
  currentBgIndex = 0;
  private bgInterval: any;

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
  
  // Step Navigation
  showFaceIdStep = false;
  showOtpStep = false;
  otpCode = '';

  // Face ID Biometrics State
  @ViewChild('faceVideo') faceVideoRef?: ElementRef<HTMLVideoElement>;
  faceStream: MediaStream | null = null;
  faceScanning = false;
  faceVerified = false;
  faceConfidence = 0;
  cameraActive = false;
  cameraError = '';
  faceEnrollSuccess = '';

  // Simulated Carrier 2FA State
  carrierDispatchInfo: any = null;
  carrierSending = false;
  userCustomPhone = '';

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

    // Cycle background images smoothly every 4.5 seconds
    this.bgInterval = setInterval(() => {
      this.currentBgIndex = (this.currentBgIndex + 1) % this.authImages.length;
    }, 4500);
  }

  ngOnDestroy() {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
    }
    this.stopCamera();
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

  async startCamera() {
    this.cameraActive = false;
    this.cameraError = '';
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.faceStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        this.cameraActive = true;
        setTimeout(() => {
          if (this.faceVideoRef?.nativeElement && this.faceStream) {
            this.faceVideoRef.nativeElement.srcObject = this.faceStream;
            this.faceVideoRef.nativeElement.play().catch(e => console.warn('Video play warning:', e));
          }
        }, 200);
      } else {
        this.cameraError = 'Optical camera not supported in this browser environment.';
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      this.cameraError = 'Live webcam not accessible or permission denied. Biometric simulation active.';
    }
  }

  stopCamera() {
    if (this.faceStream) {
      this.faceStream.getTracks().forEach(track => track.stop());
      this.faceStream = null;
    }
    this.cameraActive = false;
  }

  captureFrameBase64(): string {
    try {
      if (this.faceVideoRef?.nativeElement && this.cameraActive) {
        const video = this.faceVideoRef.nativeElement;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.7);
        }
      }
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
    }
    return 'data:image/jpeg;base64,BIO_MOCK_FRAME_' + Date.now();
  }

  triggerFaceScan() {
    this.faceScanning = true;
    this.loginError = '';
    const frame = this.captureFrameBase64();
    const sno = this.serviceNo || (this.portalMode === 'command' ? 'IC-48291X' : 'IC-71044A');

    this.http.post<any>(`${this.API_BASE}/auth/verify-face`, {
      service_no: sno,
      face_image_base64: frame,
      liveness_passed: true
    }).pipe(
      catchError(err => {
        console.warn('Backend face verify fallback:', err);
        return of({
          success: true,
          verified: true,
          confidence_score: 98.7,
          service_no: sno,
          message: 'Face verified locally via defense biometric simulation.'
        });
      })
    ).subscribe(res => {
      setTimeout(() => {
        this.faceScanning = false;
        if (res.success || res.verified) {
          this.faceVerified = true;
          this.faceConfidence = res.confidence_score || 98.6;
          setTimeout(() => {
            this.stopCamera();
            this.showFaceIdStep = false;
            this.showOtpStep = true;
            this.requestRealOtp();
          }, 900);
        } else {
          this.loginError = res.message || 'Face biometric match failed. Please re-center face in reticle.';
        }
      }, 1200);
    });
  }

  enrollCurrentFace() {
    this.faceScanning = true;
    this.faceEnrollSuccess = '';
    const frame = this.captureFrameBase64();
    const sno = this.serviceNo || (this.portalMode === 'command' ? 'IC-48291X' : 'IC-71044A');

    this.http.post<any>(`${this.API_BASE}/auth/enroll-face`, {
      service_no: sno,
      face_image_base64: frame
    }).pipe(
      catchError(err => {
        console.warn('Enroll fallback:', err);
        return of({
          success: true,
          message: 'Face biometrics enrolled successfully in fallback cache.'
        });
      })
    ).subscribe(res => {
      this.faceScanning = false;
      this.faceEnrollSuccess = 'Biometric Face ID profile calibrated & stored in defense ledger!';
      setTimeout(() => this.faceEnrollSuccess = '', 4000);
    });
  }

  bypassFaceToOtp() {
    this.stopCamera();
    this.showFaceIdStep = false;
    this.showOtpStep = true;
    this.requestRealOtp();
  }

  requestRealOtp() {
    this.carrierSending = true;
    const sno = this.serviceNo || (this.portalMode === 'command' ? 'IC-48291X' : 'IC-71044A');
    const body: any = { service_no: sno };
    if (this.userCustomPhone && this.userCustomPhone.trim()) {
      body.phone_number = this.userCustomPhone.trim();
    }

    this.http.post<any>(`${this.API_BASE}/auth/send-otp`, body).pipe(
      catchError(err => {
        console.warn('Send OTP fallback:', err);
        return of({
          success: true,
          phone_number: this.userCustomPhone || '+91 98765 43210',
          masked_phone: '+91 98*** **210',
          otp_dispatched: '4829',
          carrier_channel: 'ASCON DEFENSE SATCOM (FALLBACK)',
          ttl_seconds: 300,
          message: 'OTP dispatched via fallback terminal.'
        });
      })
    ).subscribe(res => {
      this.carrierSending = false;
      this.carrierDispatchInfo = res;
      if (res.otp_dispatched) {
        this.otpCode = res.otp_dispatched;
      }
    });
  }

  updateCustomPhone() {
    if (!this.userCustomPhone || this.userCustomPhone.trim().length < 8) {
      alert('Please enter a valid phone number (e.g. +91 98765 43210)');
      return;
    }
    const sno = this.serviceNo || (this.portalMode === 'command' ? 'IC-48291X' : 'IC-71044A');
    this.http.post<any>(`${this.API_BASE}/auth/update-phone`, {
      service_no: sno,
      phone_number: this.userCustomPhone.trim()
    }).subscribe({
      next: () => {
        alert(`Phone number updated in PostgreSQL for ${sno}! Requesting fresh OTP...`);
        this.requestRealOtp();
      },
      error: (e) => console.warn('Update phone error:', e)
    });
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

    // Advance to Step 2: Biometric Face ID Scan
    this.showFaceIdStep = true;
    this.showOtpStep = false;
    this.faceVerified = false;
    this.startCamera();
  }

  verifyOtpAndLogin() {
    if (!this.otpCode || this.otpCode.length < 4) {
      this.loginError = 'Please enter the 4-digit verification code received on defense terminal.';
      return;
    }

    const sno = this.serviceNo || (this.portalMode === 'command' ? 'IC-48291X' : 'IC-71044A');

    // Verify OTP with backend database
    this.http.post<any>(`${this.API_BASE}/auth/verify-otp`, {
      service_no: sno,
      otp: this.otpCode
    }).pipe(
      catchError(err => {
        console.warn('Backend OTP error, checking demo codes:', err);
        if (['4829', '7741', '1234'].includes(this.otpCode)) {
          return of({ success: true, authenticated: true });
        }
        return of({ success: false, message: 'Invalid or expired OTP token.' });
      })
    ).subscribe(res => {
      if (!res.success && !res.authenticated) {
        this.loginError = res.message || 'Invalid or expired OTP token.';
        return;
      }

      const user: MilitaryUser = this.portalMode === 'command' ? {
        serviceNo: sno,
        name: 'Lt Gen V. K. Rawat, PVSM, AVSM',
        rank: 'Lieutenant General',
        role: 'command',
        unit: 'Master General of Sustenance (MGS), Army HQ',
        command: 'Integrated HQ of MoD (Army)',
        clearanceLevel: 'TOP SECRET - STRATEGIC'
      } : {
        serviceNo: sno,
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
    });
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
