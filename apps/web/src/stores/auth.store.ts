import { create } from 'zustand';
import { clearAccessToken, setAccessToken } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    clearAccessToken();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
