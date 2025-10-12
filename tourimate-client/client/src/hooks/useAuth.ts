import { useState, useEffect, useCallback } from 'react';

interface UserProfile {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: string;
  acceptEmailMarketing: boolean;
  isPhoneVerified: boolean;
  avatar?: string;
  address?: string;
  city?: string;
  country: string;
  dateOfBirth?: string;
  bio?: string;
  gender?: string;
  website?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181";

// Global state storage
let globalAuthState: AuthState = {
  isLoggedIn: false,
  user: null,
  isLoading: false,
  error: null,
};

let listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const getStoredUser = (): UserProfile | null => {
  try {
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredUser = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem('userProfile', JSON.stringify(user));
  } else {
    localStorage.removeItem('userProfile');
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refreshTokenExpiresAt');
  localStorage.removeItem('userProfile');
};

const fetchUserProfile = async (): Promise<UserProfile | null> => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      clearStoredAuth();
      return null;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data as UserProfile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
};

const initializeAuth = async () => {
  const token = localStorage.getItem('accessToken');
  const storedUser = getStoredUser();

  if (!token) {
    globalAuthState = {
      isLoggedIn: false,
      user: null,
      isLoading: false,
      error: null,
    };
    notifyListeners();
    return;
  }

  // If we have a stored user and token, use it immediately for better UX
  if (storedUser) {
    globalAuthState = {
      isLoggedIn: true,
      user: storedUser,
      isLoading: true, // Still loading to refresh data
      error: null,
    };
    notifyListeners();
  }

  // Then fetch fresh data from API
  const freshUser = await fetchUserProfile();
  
  if (freshUser) {
    setStoredUser(freshUser);
    globalAuthState = {
      isLoggedIn: true,
      user: freshUser,
      isLoading: false,
      error: null,
    };
  } else {
    globalAuthState = {
      isLoggedIn: false,
      user: null,
      isLoading: false,
      error: 'Failed to load user profile',
    };
  }
  
  notifyListeners();
};

// Initialize on module load
initializeAuth();

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(globalAuthState);

  useEffect(() => {
    const listener = () => setState({ ...globalAuthState });
    listeners.add(listener);
    
    // Set initial state
    setState({ ...globalAuthState });

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const login = useCallback(async (tokens: { accessToken: string; refreshToken: string; expiresAt: string }) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('refreshTokenExpiresAt', tokens.expiresAt);
    
    await initializeAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearStoredAuth();
      globalAuthState = {
        isLoggedIn: false,
        user: null,
        isLoading: false,
        error: null,
      };
      notifyListeners();
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    globalAuthState.isLoading = true;
    notifyListeners();
    
    await initializeAuth();
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshProfile,
    isAdmin: state.user?.role === 'Admin',
    isTourGuide: state.user?.role === 'TourGuide' || state.user?.role === 'Admin',
  };
};

// Storage event listener for cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === 'accessToken' || e.key === 'userProfile') {
    initializeAuth();
  }
});
