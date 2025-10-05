export type LoginRequest = {
  phoneNumberE164: string;
  password: string;
};

export type RegisterRequest = {
  phoneNumberE164: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptEmailMarketing: boolean;
  email?: string;
  firebaseIdToken: string;
};

export type ForgotStartRequest = {
  phoneNumberE164: string;
};

export type ForgotVerifyRequest = {
  phoneNumberE164: string;
  firebaseIdToken: string;
  newPassword: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7181";

// Token storage helpers
const tokenStore = {
  get access() {
    return localStorage.getItem("accessToken") || "";
  },
  set access(v: string) {
    if (v) localStorage.setItem("accessToken", v); else localStorage.removeItem("accessToken");
  },
  get refresh() {
    return localStorage.getItem("refreshToken") || "";
  },
  set refresh(v: string) {
    if (v) localStorage.setItem("refreshToken", v); else localStorage.removeItem("refreshToken");
  },
  set refreshExpiry(dt: string) {
    if (dt) localStorage.setItem("refreshTokenExpiresAt", dt); else localStorage.removeItem("refreshTokenExpiresAt");
  }
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const baseHeaders = {
    "Content-Type": "application/json",
    ...(tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {}),
  } as Record<string, string>;

  let res = await fetch(`${API_BASE}${path}`, {
    headers: { ...baseHeaders, ...(init?.headers || {}) },
    ...init,
  });

  // Auto refresh once on 401
  if (res.status === 401 && tokenStore.refresh) {
    try {
      const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokenStore.refresh }),
      });
      if (refreshed.ok) {
        const data = await refreshed.json() as { accessToken: string; expiresIn: number };
        tokenStore.access = data.accessToken;
        res = await fetch(`${API_BASE}${path}`, {
          headers: { ...baseHeaders, Authorization: `Bearer ${tokenStore.access}`, ...(init?.headers || {}) },
          ...init,
        });
      }
    } catch {}
  }
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw json;
    return json as T;
  } catch (e) {
    if (!res.ok) throw new Error(text || res.statusText);
    return {} as T;
  }
}

export const AuthApi = {
  login: (data: LoginRequest) =>
    http<{ accessToken: string; expiresIn: number; refreshToken: string; refreshTokenExpiresAt: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  register: (data: RegisterRequest) =>
    http<{ accessToken: string; expiresIn: number; refreshToken: string; refreshTokenExpiresAt: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  forgotStart: (data: ForgotStartRequest) =>
    http<any>("/api/auth/start", { method: "POST", body: JSON.stringify(data) }),
  forgotVerify: (data: ForgotVerifyRequest) =>
    http<void>("/api/auth/forgot/verify", { method: "POST", body: JSON.stringify(data) }),
  checkPhoneExists: (phoneNumberE164: string) =>
    http<{ exists: boolean }>(`/api/auth/exists?phoneNumberE164=${encodeURIComponent(phoneNumberE164)}`),
  refresh: (refreshToken: string) =>
    http<{ accessToken: string; expiresIn: number; refreshToken: string; refreshTokenExpiresAt: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    }),
  logout: (refreshToken: string) =>
    http<void>("/api/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),
};



