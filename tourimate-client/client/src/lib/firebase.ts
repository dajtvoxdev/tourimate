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

// Setup reCAPTCHA - simple like the example
export const setupRecaptcha = () => {
  // If already created, reuse to avoid re-render errors
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }
  // Ensure container is clean
  const el = document.getElementById('recaptcha-container');
  if (el) el.innerHTML = '';
  // Create a single verifier instance
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
  });
  return recaptchaVerifier;
};

export const clearRecaptcha = () => {
  try {
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch {}
      recaptchaVerifier = null;
    }
    // Reset grecaptcha widgets if available
    try {
      const gr = (window as any).grecaptcha;
      if (gr && typeof gr.reset === 'function') {
        gr.reset();
      }
    } catch {}
    const el = document.getElementById('recaptcha-container');
    if (el) el.innerHTML = '';
    // Also remove any sibling DOM that grecaptcha may have injected
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
    // Reuse existing verifier or create once
    const appVerifier = recaptchaVerifier || setupRecaptcha();
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log('Sending OTP to:', normalizedPhone);
    // Send OTP
    const result = await signInWithPhoneNumber(auth, normalizedPhone, appVerifier);
    console.log('OTP sent successfully');
    return result.verificationId;
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