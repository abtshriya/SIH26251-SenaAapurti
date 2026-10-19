const fs = require('fs');
let html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', 'utf8');

// Precise tag text replacements
const tagReplacements = [
  // Top brand title
  ['<span class="text-white">Sena</span><span class="text-saffron">Aapurti</span>', '<span class="text-white">{{ langService.t(\'titleSena\') }}</span><span class="brand-word-gap" *ngIf="langService.currentLang() === \'hi\'">&nbsp;</span><span class="text-saffron">{{ langService.t(\'titleAapurti\') }}</span>'],
  ['<h2 class="auth-title">', '<h2 class="auth-title" [class.hindi-title]="langService.currentLang() === \'hi\'">'],
  ['<span class="auth-sub">DEFENSE LOGISTICS ACCESS & AUTHENTICATION PORTAL</span>', '<span class="auth-sub">{{ langService.t(\'DEFENSE LOGISTICS ACCESS & AUTHENTICATION PORTAL\') }}</span>'],

  // Sub-nav buttons
  ['>Sign In<', '>{{ langService.t(\'Sign In\') }}<'],
  ['>Register New Account<', '>{{ langService.t(\'Register New Account\') }}<'],
  ['>Forgot Password<', '>{{ langService.t(\'Forgot Password\') }}<'],
  ['>Access Denied Test<', '>{{ langService.t(\'Access Denied Test\') }}<'],

  // Login welcome banner
  ['<h3>Official Defense Authentication Gateway</h3>', '<h3>{{ langService.t(\'Official Defense Authentication Gateway\') }}</h3>'],
  ['<p>Select your operational echelon to access the authorized logistics command center.</p>', '<p>{{ langService.t(\'Select your operational echelon to access the authorized logistics command center.\') }}</p>'],

  // Fast demo buttons
  ['<span class="demo-tag">Fast Evaluation Fill:</span>', '<span class="demo-tag">{{ langService.t(\'Fast Evaluation Fill:\') }}</span>'],
  ['<span>Fill Command Admin (Lt Gen Rawat)</span>', '<span>{{ langService.t(\'Fill Command Admin (Lt Gen Rawat)\') }}</span>'],
  ['<span>Fill Unit Officer (Maj Sharma - 14 Rajput)</span>', '<span>{{ langService.t(\'Fill Unit Officer (Maj Sharma - 14 Rajput)\') }}</span>'],

  // Role selector
  ['<span>COMMAND / ADMIN</span>', '<span>{{ langService.t(\'COMMAND / ADMIN\') }}</span>'],
  ['<span>UNIT PORTAL</span>', '<span>{{ langService.t(\'UNIT PORTAL\') }}</span>'],

  // Error banner
  ['{{ loginError }}', '{{ langService.t(loginError) }}'],

  // Form labels & buttons
  ['<label class="form-label" for="serviceNo">User ID / Official Service Number</label>', '<label class="form-label" for="serviceNo">{{ langService.t(\'User ID / Official Service Number\') }}</label>'],
  ['<span class="field-help">Commissioned Officers, JCOs & authorized Logisticians</span>', '<span class="field-help">{{ langService.t(\'Commissioned Officers, JCOs & authorized Logisticians\') }}</span>'],
  ['<label class="form-label" for="password">Password</label>', '<label class="form-label" for="password">{{ langService.t(\'Password\') }}</label>'],
  ['<label class="form-label">CAPTCHA / Security Verification</label>', '<label class="form-label">{{ langService.t(\'CAPTCHA / Security Verification\') }}</label>'],
  ['title="Military Security Captcha"', '[title]="langService.t(\'Military Security Captcha\')"'],
  ['>↻ Refresh<', '>↻ {{ langService.t(\'Refresh\') }}<'],
  ['title="Refresh Captcha"', '[title]="langService.t(\'Refresh Captcha\')"'],
  ['<span>Remember Me</span>', '<span>{{ langService.t(\'Remember Me\') }}</span>'],
  ['Forgot Password?</button>', '{{ langService.t(\'Forgot Password?\') }}</button>'],
  ['<span>LOGIN & PROCEED TO BIOMETRICS</span>', '<span>{{ langService.t(\'LOGIN & PROCEED TO BIOMETRICS\') }}</span>'],
  ['class="back-home-link">← Back to Main Website</a>', 'class="back-home-link">{{ langService.t(\'← Back to Main Website\') }}</a>'],

  // Face ID screen
  ['<span>LEVEL-3 BIOMETRIC CLEARANCE</span>', '<span>{{ langService.t(\'LEVEL-3 BIOMETRIC CLEARANCE\') }}</span>'],
  ['<h4 class="face-title">Biometric Login: Scan Using FACE ID</h4>', '<h4 class="face-title">{{ langService.t(\'Biometric Login: Scan Using FACE ID\') }}</h4>'],
  ['<div class="fallback-status-text">DEFENSE OPTICAL SENSOR READY</div>', '<div class="fallback-status-text">{{ langService.t(\'DEFENSE OPTICAL SENSOR READY\') }}</div>'],
  ['<div class="fallback-subtext">Click "Scan Using Face ID" to initialize camera or biometric match</div>', '<div class="fallback-subtext">{{ langService.t(\'Click "Scan Using Face ID" to initialize camera or biometric match\') }}</div>'],
  ['<span>SCAN USING FACE ID</span>', '<span>{{ langService.t(\'SCAN USING FACE ID\') }}</span>'],
  ['<span>AUTHENTICATING FACIAL BIOMETRICS...</span>', '<span>{{ langService.t(\'AUTHENTICATING FACIAL BIOMETRICS...\') }}</span>'],
  ['<span>✓ FACE ID VERIFIED</span>', '<span>{{ langService.t(\'✓ FACE ID VERIFIED\') }}</span>'],
  ['📸 Enroll / Update My Face ID', '📸 {{ langService.t(\'Enroll / Update My Face ID\') }}'],
  ['Manual Override → OTP', '{{ langService.t(\'Manual Override → OTP\') }}'],
  ['← Back to Login Credentials', '{{ langService.t(\'← Back to Login Credentials\') }}'],

  // OTP screen
  ['<h4 class="otp-title">Defense 2-Factor Authentication</h4>', '<h4 class="otp-title">{{ langService.t(\'Defense 2-Factor Authentication\') }}</h4>'],
  ['<span>DEFENSE CARRIER DISPATCH TERMINAL</span>', '<span>{{ langService.t(\'DEFENSE CARRIER DISPATCH TERMINAL\') }}</span>'],
  ['<span class="stat-label">DISPATCH NODE:</span>', '<span class="stat-label">{{ langService.t(\'DISPATCH NODE:\') }}</span>'],
  ['<span class="stat-label">TTL VALIDITY:</span>', '<span class="stat-label">{{ langService.t(\'TTL VALIDITY:\') }}</span>'],
  ['<span class="stat-val text-gold">300 SECONDS</span>', '<span class="stat-val text-gold">300 {{ langService.t(\'SECONDS\') }}</span>'],
  ['<span class="stat-label">STATUS:</span>', '<span class="stat-label">{{ langService.t(\'STATUS:\') }}</span>'],
  ['<div class="sms-tag">[DEFENSE SMS RECEIVED ON HANDSET]</div>', '<div class="sms-tag">{{ langService.t(\'[DEFENSE SMS RECEIVED ON HANDSET]\') }}</div>'],
  ['<div class="phone-drawer-label">Want OTP dispatched to your specific phone number?</div>', '<div class="phone-drawer-label">{{ langService.t(\'Want OTP dispatched to your specific phone number?\') }}</div>'],
  ['>Update & Dispatch<', '>{{ langService.t(\'Update & Dispatch\') }}<'],
  ['<label class="form-label">Enter 4-Digit Security OTP</label>', '<label class="form-label">{{ langService.t(\'Enter 4-Digit Security OTP\') }}</label>'],
  ['← Back to Face Scan', '{{ langService.t(\'← Back to Face Scan\') }}'],
  ['Authorize & Enter Dashboard', '{{ langService.t(\'Authorize & Enter Dashboard\') }}'],

  // Register screen
  ['<h3>Select Registration Type</h3>', '<h3>{{ langService.t(\'Select Registration Type\') }}</h3>'],
  ['<p>Register a forward tactical unit or a headquarters logistics administration account.</p>', '<p>{{ langService.t(\'Register a forward tactical unit or a headquarters logistics administration account.\') }}</p>'],
  ['<span>Unit Registration</span>', '<span>{{ langService.t(\'Unit Registration\') }}</span>'],
  ['<span>Admin Registration</span>', '<span>{{ langService.t(\'Admin Registration\') }}</span>'],
  ['{{ regSuccessMsg }}', '{{ langService.t(regSuccessMsg) }}'],
  ['<label class="form-label">Unit Name</label>', '<label class="form-label">{{ langService.t(\'Unit Name\') }}</label>'],
  ['<label class="form-label">Unit ID</label>', '<label class="form-label">{{ langService.t(\'Unit ID\') }}</label>'],
  ['<label class="form-label">Formation / Region</label>', '<label class="form-label">{{ langService.t(\'Formation / Region\') }}</label>'],
  ['<label class="form-label">Location / Forward Sector</label>', '<label class="form-label">{{ langService.t(\'Location / Forward Sector\') }}</label>'],
  ['<label class="form-label">Authorized Officer</label>', '<label class="form-label">{{ langService.t(\'Authorized Officer\') }}</label>'],
  ['<label class="form-label">Contact Details</label>', '<label class="form-label">{{ langService.t(\'Contact Details\') }}</label>'],
  ['<label class="form-label">Official Email</label>', '<label class="form-label">{{ langService.t(\'Official Email\') }}</label>'],
  ['<label class="form-label">Username</label>', '<label class="form-label">{{ langService.t(\'Username\') }}</label>'],
  ['<label class="form-label">Confirm Password</label>', '<label class="form-label">{{ langService.t(\'Confirm Password\') }}</label>'],
  ['<label class="form-label">Verification Code (Enter 7K9X2)</label>', '<label class="form-label">{{ langService.t(\'Verification Code (Enter 7K9X2)\') }}</label>'],
  ['<span>REGISTER UNIT</span>', '<span>{{ langService.t(\'REGISTER UNIT\') }}</span>'],
  ['<label class="form-label">Official ID / Service No</label>', '<label class="form-label">{{ langService.t(\'Official ID / Service No\') }}</label>'],
  ['<label class="form-label">Full Name</label>', '<label class="form-label">{{ langService.t(\'Full Name\') }}</label>'],
  ['<label class="form-label">Designation</label>', '<label class="form-label">{{ langService.t(\'Designation\') }}</label>'],
  ['<label class="form-label">Command / Organization</label>', '<label class="form-label">{{ langService.t(\'Command / Organization\') }}</label>'],
  ['<label class="form-label">Contact</label>', '<label class="form-label">{{ langService.t(\'Contact\') }}</label>'],
  ['<span>REGISTER ADMIN</span>', '<span>{{ langService.t(\'REGISTER ADMIN\') }}</span>'],
  ['Already registered? Back to Sign In', '{{ langService.t(\'Already registered? Back to Sign In\') }}'],

  // Forgot password
  ['<h3>Reset Defense Terminal Password</h3>', '<h3>{{ langService.t(\'Reset Defense Terminal Password\') }}</h3>'],
  ['<p>Recover access to your account via official defense registered email or service credentials.</p>', '<p>{{ langService.t(\'Recover access to your account via official defense registered email or service credentials.\') }}</p>'],
  ['{{ forgotSuccessMsg }}', '{{ langService.t(forgotSuccessMsg) }}'],
  ['{{ forgotError }}', '{{ langService.t(forgotError) }}'],
  ['<label class="form-label">Username / Official Email</label>', '<label class="form-label">{{ langService.t(\'Username / Official Email\') }}</label>'],
  ['<label class="form-label">Verification Code</label>', '<label class="form-label">{{ langService.t(\'Verification Code\') }}</label>'],
  ['Dispatch Verification OTP', '{{ langService.t(\'Dispatch Verification OTP\') }}'],
  ['<label class="form-label">Enter 4-Digit OTP (Simulated: 7741)</label>', '<label class="form-label">{{ langService.t(\'Enter 4-Digit OTP (Simulated: 7741)\') }}</label>'],
  ['<label class="form-label">New Password</label>', '<label class="form-label">{{ langService.t(\'New Password\') }}</label>'],
  ['<label class="form-label">Confirm New Password</label>', '<label class="form-label">{{ langService.t(\'Confirm New Password\') }}</label>'],
  ['RESET PASSWORD', '{{ langService.t(\'RESET PASSWORD\') }}'],
  ['← Back to Sign In', '{{ langService.t(\'← Back to Sign In\') }}'],

  // 403 screen
  ['<h3 class="unauth-code">403 - ACCESS RESTRICTED</h3>', '<h3 class="unauth-code">{{ langService.t(\'403 - ACCESS RESTRICTED\') }}</h3>'],
  ['<h4 class="unauth-headline">INSUFFICIENT SECURITY CLEARANCE LEVEL</h4>', '<h4 class="unauth-headline">{{ langService.t(\'INSUFFICIENT SECURITY CLEARANCE LEVEL\') }}</h4>'],
  ['<span class="role-label">Your Authenticated Role:</span>', '<span class="role-label">{{ langService.t(\'Your Authenticated Role:\') }}</span>'],
  ['<span class="role-label">Required Theater Clearance:</span>', '<span class="role-label">{{ langService.t(\'Required Theater Clearance:\') }}</span>'],
  ['<span class="role-val text-red">SECRET / DEFCON-1 LEVEL AUTHORIZATION</span>', '<span class="role-val text-red">{{ langService.t(\'SECRET / DEFCON-1 LEVEL AUTHORIZATION\') }}</span>'],
  ['<span class="role-label">Terminal Identity:</span>', '<span class="role-label">{{ langService.t(\'Terminal Identity:\') }}</span>'],
  ['This resource is segregated under Military Cryptographic Policy. Your identity does not possess the operational credentials required for this sector.', '{{ langService.t(\'This resource is segregated under Military Cryptographic Policy. Your identity does not possess the operational credentials required for this sector.\') }}'],
  ['Return to Home', '{{ langService.t(\'Return to Home\') }}'],
  ['Return to Dashboard', '{{ langService.t(\'Return to Dashboard\') }}'],
  ['Restricted Official Defense Network. All terminal transactions are cryptographically recorded under the Official Secrets Act 1923.', '{{ langService.t(\'Restricted Official Defense Network. All terminal transactions are cryptographically recorded under the Official Secrets Act 1923.\') }}']
];

// Placeholders
const phReplacements = [
  ['placeholder="e.g. IC-48291X or IC-71044A"', '[placeholder]="langService.t(\'e.g. IC-48291X or IC-71044A\')"'],
  ['placeholder="Enter Code"', '[placeholder]="langService.t(\'Enter Code\')"'],
  ['placeholder="Enter code"', '[placeholder]="langService.t(\'Enter code\')"'],
  ['placeholder="4829"', '[placeholder]="langService.t(\'4829\')"'],
  ['placeholder="7741"', '[placeholder]="langService.t(\'7741\')"'],
  ['placeholder="7K9X2"', '[placeholder]="langService.t(\'7K9X2\')"'],
  ['placeholder="e.g. 14 RAJPUT (MECHANISED)"', '[placeholder]="langService.t(\'e.g. 14 RAJPUT (MECHANISED)\')"'],
  ['placeholder="e.g. UN-14RM-LEH"', '[placeholder]="langService.t(\'e.g. UN-14RM-LEH\')"'],
  ['placeholder="e.g. FDL Shyok Valley - 14 Corps"', '[placeholder]="langService.t(\'e.g. FDL Shyok Valley - 14 Corps\')"'],
  ['placeholder="e.g. Major Amit Sharma"', '[placeholder]="langService.t(\'e.g. Major Amit Sharma\')"'],
  ['placeholder="e.g. +91 94190 XXXXX / ASCON 2841"', '[placeholder]="langService.t(\'e.g. +91 94190 XXXXX / ASCON 2841\')"'],
  ['placeholder="officer.unit&#64;army.nic.in"', '[placeholder]="langService.t(\'officer.unit@army.nic.in\')"'],
  ['placeholder="e.g. IC-71044A"', '[placeholder]="langService.t(\'e.g. IC-71044A\')"'],
  ['placeholder="e.g. IC-48291X"', '[placeholder]="langService.t(\'e.g. IC-48291X\')"'],
  ['placeholder="e.g. Lt Gen V. K. Rawat"', '[placeholder]="langService.t(\'e.g. Lt Gen V. K. Rawat\')"'],
  ['placeholder="e.g. DGOS Directorate / MGS Branch"', '[placeholder]="langService.t(\'e.g. DGOS Directorate / MGS Branch\')"'],
  ['placeholder="admin.dgos&#64;nic.in"', '[placeholder]="langService.t(\'admin.dgos@nic.in\')"'],
  ['placeholder="e.g. +91 11 2301 XXXX"', '[placeholder]="langService.t(\'e.g. +91 11 2301 XXXX\')"'],
  ['placeholder="e.g. rawat.vk"', '[placeholder]="langService.t(\'e.g. rawat.vk\')"'],
  ['placeholder="e.g. IC-48291X or officer&#64;army.nic.in"', '[placeholder]="langService.t(\'e.g. IC-48291X or officer@army.nic.in\')"']
];

let applied = 0;
for (const [target, repl] of tagReplacements) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    applied++;
  } else {
    console.warn('Tag target not found:', target.substring(0, 40));
  }
}
console.log('Applied tag replacements:', applied);

let appliedPh = 0;
for (const [target, repl] of phReplacements) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    appliedPh++;
  }
}
console.log('Applied ph replacements:', appliedPh);

fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', html, 'utf8');
