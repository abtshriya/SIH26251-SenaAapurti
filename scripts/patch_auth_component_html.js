const fs = require('fs');
let html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', 'utf8');

const mappings = [
  ['DEFENSE LOGISTICS ACCESS & AUTHENTICATION PORTAL', "{{ langService.t('DEFENSE LOGISTICS ACCESS & AUTHENTICATION PORTAL') }}"],
  ['Sign In', "{{ langService.t('Sign In') }}"],
  ['Register New Account', "{{ langService.t('Register New Account') }}"],
  ['Forgot Password', "{{ langService.t('Forgot Password') }}"],
  ['Forgot Password?', "{{ langService.t('Forgot Password?') }}"],
  ['Access Denied Test', "{{ langService.t('Access Denied Test') }}"],
  ['Official Defense Authentication Gateway', "{{ langService.t('Official Defense Authentication Gateway') }}"],
  ['Select your operational echelon to access the authorized logistics command center.', "{{ langService.t('Select your operational echelon to access the authorized logistics command center.') }}"],
  ['Fast Evaluation Fill:', "{{ langService.t('Fast Evaluation Fill:') }}"],
  ['Fill Command Admin (Lt Gen Rawat)', "{{ langService.t('Fill Command Admin (Lt Gen Rawat)') }}"],
  ['Fill Unit Officer (Maj Sharma - 14 Rajput)', "{{ langService.t('Fill Unit Officer (Maj Sharma - 14 Rajput)') }}"],
  ['COMMAND / ADMIN', "{{ langService.t('COMMAND / ADMIN') }}"],
  ['UNIT PORTAL', "{{ langService.t('UNIT PORTAL') }}"],
  ['User ID / Official Service Number', "{{ langService.t('User ID / Official Service Number') }}"],
  ['Commissioned Officers, JCOs & authorized Logisticians', "{{ langService.t('Commissioned Officers, JCOs & authorized Logisticians') }}"],
  ['Password', "{{ langService.t('Password') }}"],
  ['CAPTCHA / Security Verification', "{{ langService.t('CAPTCHA / Security Verification') }}"],
  ['↻ Refresh', "{{ langService.t('↻ Refresh') }}"],
  ['Remember Me', "{{ langService.t('Remember Me') }}"],
  ['LOGIN & PROCEED TO BIOMETRICS', "{{ langService.t('LOGIN & PROCEED TO BIOMETRICS') }}"],
  ['← Back to Main Website', "{{ langService.t('← Back to Main Website') }}"],
  ['LEVEL-3 BIOMETRIC CLEARANCE', "{{ langService.t('LEVEL-3 BIOMETRIC CLEARANCE') }}"],
  ['Biometric Login: Scan Using FACE ID', "{{ langService.t('Biometric Login: Scan Using FACE ID') }}"],
  ['DEFENSE OPTICAL SENSOR READY', "{{ langService.t('DEFENSE OPTICAL SENSOR READY') }}"],
  ['Click "Scan Using Face ID" to initialize camera or biometric match', "{{ langService.t('Click \"Scan Using Face ID\" to initialize camera or biometric match') }}"],
  ['SCAN USING FACE ID', "{{ langService.t('SCAN USING FACE ID') }}"],
  ['AUTHENTICATING FACIAL BIOMETRICS...', "{{ langService.t('AUTHENTICATING FACIAL BIOMETRICS...') }}"],
  ['✓ FACE ID VERIFIED', "{{ langService.t('✓ FACE ID VERIFIED') }}"],
  ['📸 Enroll / Update My Face ID', "{{ langService.t('📸 Enroll / Update My Face ID') }}"],
  ['Manual Override → OTP', "{{ langService.t('Manual Override → OTP') }}"],
  ['← Back to Login Credentials', "{{ langService.t('← Back to Login Credentials') }}"],
  ['Defense 2-Factor Authentication', "{{ langService.t('Defense 2-Factor Authentication') }}"],
  ['DEFENSE CARRIER DISPATCH TERMINAL', "{{ langService.t('DEFENSE CARRIER DISPATCH TERMINAL') }}"],
  ['DISPATCH NODE:', "{{ langService.t('DISPATCH NODE:') }}"],
  ['TTL VALIDITY:', "{{ langService.t('TTL VALIDITY:') }}"],
  ['300 SECONDS', "{{ langService.t('300 SECONDS') }}"],
  ['STATUS:', "{{ langService.t('STATUS:') }}"],
  ['[DEFENSE SMS RECEIVED ON HANDSET]', "{{ langService.t('[DEFENSE SMS RECEIVED ON HANDSET]') }}"],
  ['Want OTP dispatched to your specific phone number?', "{{ langService.t('Want OTP dispatched to your specific phone number?') }}"],
  ['Update & Dispatch', "{{ langService.t('Update & Dispatch') }}"],
  ['Enter 4-Digit Security OTP', "{{ langService.t('Enter 4-Digit Security OTP') }}"],
  ['← Back to Face Scan', "{{ langService.t('← Back to Face Scan') }}"],
  ['Authorize & Enter Dashboard', "{{ langService.t('Authorize & Enter Dashboard') }}"],
  ['Select Registration Type', "{{ langService.t('Select Registration Type') }}"],
  ['Register a forward tactical unit or a headquarters logistics administration account.', "{{ langService.t('Register a forward tactical unit or a headquarters logistics administration account.') }}"],
  ['Unit Registration', "{{ langService.t('Unit Registration') }}"],
  ['Admin Registration', "{{ langService.t('Admin Registration') }}"],
  ['Unit Name', "{{ langService.t('Unit Name') }}"],
  ['Unit ID', "{{ langService.t('Unit ID') }}"],
  ['Formation / Region', "{{ langService.t('Formation / Region') }}"],
  ['Location / Forward Sector', "{{ langService.t('Location / Forward Sector') }}"],
  ['Authorized Officer', "{{ langService.t('Authorized Officer') }}"],
  ['Contact Details', "{{ langService.t('Contact Details') }}"],
  ['Official Email', "{{ langService.t('Official Email') }}"],
  ['Username', "{{ langService.t('Username') }}"],
  ['Confirm Password', "{{ langService.t('Confirm Password') }}"],
  ['Verification Code (Enter 7K9X2)', "{{ langService.t('Verification Code (Enter 7K9X2)') }}"],
  ['REGISTER UNIT', "{{ langService.t('REGISTER UNIT') }}"],
  ['Official ID / Service No', "{{ langService.t('Official ID / Service No') }}"],
  ['Full Name', "{{ langService.t('Full Name') }}"],
  ['Designation', "{{ langService.t('Designation') }}"],
  ['Command / Organization', "{{ langService.t('Command / Organization') }}"],
  ['Contact', "{{ langService.t('Contact') }}"],
  ['REGISTER ADMIN', "{{ langService.t('REGISTER ADMIN') }}"],
  ['Already registered? Back to Sign In', "{{ langService.t('Already registered? Back to Sign In') }}"],
  ['Reset Defense Terminal Password', "{{ langService.t('Reset Defense Terminal Password') }}"],
  ['Recover access to your account via official defense registered email or service credentials.', "{{ langService.t('Recover access to your account via official defense registered email or service credentials.') }}"],
  ['Username / Official Email', "{{ langService.t('Username / Official Email') }}"],
  ['Verification Code', "{{ langService.t('Verification Code') }}"],
  ['Dispatch Verification OTP', "{{ langService.t('Dispatch Verification OTP') }}"],
  ['Enter 4-Digit OTP (Simulated: 7741)', "{{ langService.t('Enter 4-Digit OTP (Simulated: 7741)') }}"],
  ['New Password', "{{ langService.t('New Password') }}"],
  ['Confirm New Password', "{{ langService.t('Confirm New Password') }}"],
  ['RESET PASSWORD', "{{ langService.t('RESET PASSWORD') }}"],
  ['← Back to Sign In', "{{ langService.t('← Back to Sign In') }}"],
  ['403 - ACCESS RESTRICTED', "{{ langService.t('403 - ACCESS RESTRICTED') }}"],
  ['INSUFFICIENT SECURITY CLEARANCE LEVEL', "{{ langService.t('INSUFFICIENT SECURITY CLEARANCE LEVEL') }}"],
  ['Your Authenticated Role:', "{{ langService.t('Your Authenticated Role:') }}"],
  ['Required Theater Clearance:', "{{ langService.t('Required Theater Clearance:') }}"],
  ['SECRET / DEFCON-1 LEVEL AUTHORIZATION', "{{ langService.t('SECRET / DEFCON-1 LEVEL AUTHORIZATION') }}"],
  ['Terminal Identity:', "{{ langService.t('Terminal Identity:') }}"],
  ['This resource is segregated under Military Cryptographic Policy. Your identity does not possess the operational credentials required for this sector.', "{{ langService.t('This resource is segregated under Military Cryptographic Policy. Your identity does not possess the operational credentials required for this sector.') }}"],
  ['Return to Home', "{{ langService.t('Return to Home') }}"],
  ['Return to Dashboard', "{{ langService.t('Return to Dashboard') }}"],
  ['Restricted Official Defense Network. All terminal transactions are cryptographically recorded under the Official Secrets Act 1923.', "{{ langService.t('Restricted Official Defense Network. All terminal transactions are cryptographically recorded under the Official Secrets Act 1923.') }}"],
  ['Optical facial verification required for', "{{ langService.t('Optical facial verification required for') }}"],
  ['before granting access to strategic logistics ledger.', "{{ langService.t('before granting access to strategic logistics ledger.') }}"],
  ['Cryptographic OTP dispatched to authorized military handset for', "{{ langService.t('Cryptographic OTP dispatched to authorized military handset for') }}"]
];

// Title & Placeholders
const placeholderMappings = [
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
  ['placeholder="officer.unit@army.nic.in"', '[placeholder]="langService.t(\'officer.unit@army.nic.in\')"'],
  ['placeholder="e.g. IC-71044A"', '[placeholder]="langService.t(\'e.g. IC-71044A\')"'],
  ['placeholder="e.g. IC-48291X"', '[placeholder]="langService.t(\'e.g. IC-48291X\')"'],
  ['placeholder="e.g. Lt Gen V. K. Rawat"', '[placeholder]="langService.t(\'e.g. Lt Gen V. K. Rawat\')"'],
  ['placeholder="e.g. DGOS Directorate / MGS Branch"', '[placeholder]="langService.t(\'e.g. DGOS Directorate / MGS Branch\')"'],
  ['placeholder="admin.dgos@nic.in"', '[placeholder]="langService.t(\'admin.dgos@nic.in\')"'],
  ['placeholder="e.g. +91 11 2301 XXXX"', '[placeholder]="langService.t(\'e.g. +91 11 2301 XXXX\')"'],
  ['placeholder="e.g. rawat.vk"', '[placeholder]="langService.t(\'e.g. rawat.vk\')"'],
  ['placeholder="e.g. IC-48291X or officer@army.nic.in"', '[placeholder]="langService.t(\'e.g. IC-48291X or officer@army.nic.in\')"']
];

let applied = 0;
for (const [target, repl] of mappings) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    applied++;
  }
}
console.log('Applied text mappings:', applied);

let appliedPh = 0;
for (const [target, repl] of placeholderMappings) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    appliedPh++;
  }
}
console.log('Applied placeholder mappings:', appliedPh);

fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', html, 'utf8');
