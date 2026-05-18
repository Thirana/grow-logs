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
  restoreSession: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user, accessToken) => {
    setAccessToken(accessToken);
    // Set a session indicator the middleware can read. The actual refresh_token is
    // HTTP-only on the API origin and never visible to Next.js middleware.
    document.cookie = '_gl_session=1; path=/; max-age=604800; SameSite=Lax';
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    clearAccessToken();
    document.cookie = '_gl_session=; path=/; max-age=0; SameSite=Lax';
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  // Used by AuthGuard to restore the session after a page reload — the token
  // was already recovered from sessionStorage by lib/api.ts at module load time.
  restoreSession: (user) => set({ user, isAuthenticated: true }),
}));
