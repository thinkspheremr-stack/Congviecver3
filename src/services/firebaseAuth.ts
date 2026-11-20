import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive scope
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache (MANDATORY: Never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged in to Firebase but token is not in memory, needs explicit sign-in to get fresh Drive access token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface GoogleSignInResult {
  token: string;
  user: User | null;
  cancelled?: boolean;
}

const POPUP_CANCEL_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

export const getFriendlyAuthErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ đăng nhập Google (popup). Vui lòng cho phép popup cho trang này rồi thử lại.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng khi đăng nhập Google. Vui lòng kiểm tra Internet và thử lại.';
    case 'auth/unauthorized-domain':
      return 'Tên miền hiện tại chưa được cấp phép đăng nhập Firebase Auth.';
    case 'auth/account-exists-with-different-credential':
      return 'Tài khoản này đã tồn tại với phương thức đăng nhập khác.';
    default:
      return (error as { message?: string })?.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.';
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    return null;
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy access token từ Google. Vui lòng thử đăng nhập lại.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code || '';
    if (POPUP_CANCEL_CODES.has(code)) {
      // Người dùng tự đóng cửa sổ đăng nhập hoặc có yêu cầu popup trùng lặp -> xử lý nhẹ nhàng, không báo lỗi
      return null;
    }
    throw new Error(getFriendlyAuthErrorMessage(error));
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Compatibility aliases
export const signInWithGoogleDrive = async (): Promise<GoogleSignInResult> => {
  const res = await googleSignIn();
  if (!res) {
    return { token: '', user: null, cancelled: true };
  }
  return { token: res.accessToken, user: res.user, cancelled: false };
};
export const signOutGoogle = logout;
export const getStoredDriveToken = (): string | null => cachedAccessToken;
export const setStoredDriveToken = (token: string | null): void => {
  cachedAccessToken = token;
};
