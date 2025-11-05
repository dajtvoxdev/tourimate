import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Force Vietnamese SMS/flows where supported
auth.languageCode = 'vi';

// Global recaptcha verifier (single instance)
let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaWidgetId: number | null = null;

// Setup reCAPTCHA - simple like the example
export const setupRecaptcha = () => {
  // If already created, reuse to avoid re-render errors
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }
  // Ensure container exists (created by JSX)
  const root = document.getElementById('recaptcha-root');
  if (!root) {
    throw new Error('recaptcha-root element not found');
  }
  const container = document.getElementById('recaptcha-container');
  if (!container) {
    const fresh = document.createElement('div');
    fresh.id = 'recaptcha-container';
    fresh.style.display = 'none';
    root.appendChild(fresh);
  }
  // Create a new verifier instance
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
  });
  // Render once to capture widget id for reliable resets
  try {
    (recaptchaVerifier as any).render?.().then((id: number) => { recaptchaWidgetId = id ?? null; }).catch(() => {});
  } catch {}
  return recaptchaVerifier;
};

export const clearRecaptcha = () => {
  try {
    // Try Firebase API first
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch {}
      recaptchaVerifier = null;
    }
    // Reset specific widget if possible
    try {
      const gr = (window as any).grecaptcha;
      if (gr && typeof gr.reset === 'function') {
        if (recaptchaWidgetId !== null) {
          try { gr.reset(recaptchaWidgetId); } catch {}
        } else {
          try { gr.reset(); } catch {}
        }
      }
    } catch {}
    recaptchaWidgetId = null;
    // Fully replace the container element to avoid stale DOM
    try {
      const root = document.getElementById('recaptcha-root');
      const existing = document.getElementById('recaptcha-container');
      if (root && existing) {
        try { root.removeChild(existing); } catch {}
        const fresh = document.createElement('div');
        fresh.id = 'recaptcha-container';
        fresh.style.display = 'none';
        root.appendChild(fresh);
      }
    } catch {}
    // Also remove any grecaptcha global badge if present
    const badge = document.querySelector('.grecaptcha-badge') as HTMLElement | null;
    if (badge && badge.parentElement) {
      try { badge.parentElement.removeChild(badge); } catch {}
    }
  } catch {}
};

// Normalize phone number to +84 format
const normalizePhoneNumber = (phoneNumber: string): string => {
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+84')) {
    return cleaned;
  }
  if (cleaned.startsWith('84')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.substring(1);
  }
  return '+84' + cleaned;
};

// Send OTP - simple like the example
export const sendOTP = async (phoneNumber: string): Promise<string> => {
  try {
    // Ensure verifier exists and widget id is known
    const appVerifier = setupRecaptcha();
    try {
      if (recaptchaWidgetId !== null && (window as any).grecaptcha?.reset) {
        (window as any).grecaptcha.reset(recaptchaWidgetId);
      }
    } catch {}
    // For invisible mode, kick off verification to ensure a fresh token
    try { await (appVerifier as any).verify?.(); } catch {}
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log('Sending OTP to:', normalizedPhone);
    // Send OTP with timeout guard
    const result = await Promise.race([
      signInWithPhoneNumber(auth, normalizedPhone, appVerifier),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
    ]);
    console.log('OTP sent successfully');
    return (result as any).verificationId as string;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw new Error(error.message || 'Gửi OTP thất bại. Vui lòng thử lại.');
  }
};

// Verify OTP
export const verifyOTP = async (verificationId: string, otp: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
  }
};

// Get ID token
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }
  return await user.getIdToken();
};