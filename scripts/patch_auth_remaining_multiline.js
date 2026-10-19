const fs = require('fs');
let html = fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', 'utf8');

const strReplacements = [
  ['Sign In\r\n      </button>', "{{ langService.t('Sign In') }}\r\n      </button>"],
  ['Sign In\n      </button>', "{{ langService.t('Sign In') }}\n      </button>"],
  ['Register New Account\r\n      </button>', "{{ langService.t('Register New Account') }}\r\n      </button>"],
  ['Register New Account\n      </button>', "{{ langService.t('Register New Account') }}\n      </button>"],
  ['Forgot Password\r\n      </button>', "{{ langService.t('Forgot Password') }}\r\n      </button>"],
  ['Forgot Password\n      </button>', "{{ langService.t('Forgot Password') }}\n      </button>"],
  ['Access Denied Test\r\n      </button>', "{{ langService.t('Access Denied Test') }}\r\n      </button>"],
  ['Access Denied Test\n      </button>', "{{ langService.t('Access Denied Test') }}\n      </button>"],
  ['↻ Refresh', "↻ {{ langService.t('Refresh') }}"],
  ['Forgot Password?\r\n          </button>', "{{ langService.t('Forgot Password?') }}\r\n          </button>"],
  ['Forgot Password?\n          </button>', "{{ langService.t('Forgot Password?') }}\n          </button>"],
  ['<span *ngIf="!faceScanning && !faceVerified">SCAN USING FACE ID</span>', '<span *ngIf="!faceScanning && !faceVerified">{{ langService.t(\'SCAN USING FACE ID\') }}</span>'],
  ['<span *ngIf="faceScanning">AUTHENTICATING FACIAL BIOMETRICS...</span>', '<span *ngIf="faceScanning">{{ langService.t(\'AUTHENTICATING FACIAL BIOMETRICS...\') }}</span>'],
  ['<span *ngIf="faceVerified">✓ FACE ID VERIFIED</span>', '<span *ngIf="faceVerified">{{ langService.t(\'✓ FACE ID VERIFIED\') }}</span>'],
  ['Update & Dispatch\r\n              </button>', "{{ langService.t('Update & Dispatch') }}\r\n              </button>"],
  ['Update & Dispatch\n              </button>', "{{ langService.t('Update & Dispatch') }}\n              </button>"]
];

let applied = 0;
for (const [target, repl] of strReplacements) {
  if (html.includes(target)) {
    html = html.split(target).join(repl);
    applied++;
  }
}
console.log('Applied remaining auth replacements:', applied);
fs.writeFileSync('c:/Users/criya/SIH26251-SenaAapurti/src/app/pages/auth/auth.component.html', html, 'utf8');
