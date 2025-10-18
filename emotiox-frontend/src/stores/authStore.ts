import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from './types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      _hasHydrated: false,

      setUser: (user: User) => {
        set({ user, isAuthenticated: true, _hasHydrated: true });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true, _hasHydrated: true });
      },

      setAuth: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true, _hasHydrated: true });
        localStorage.setItem('emotiox-auth', JSON.stringify({
          state: { user, token, isAuthenticated: true, _hasHydrated: true },
          version: 0
        }));
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false, token: null });
        localStorage.removeItem('emotiox-auth');
        sessionStorage.removeItem('token');
      }
    }),
    {
      name: 'emotiox-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        _hasHydrated: state._hasHydrated
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.token && state.user && state.isAuthenticated) {
            state._hasHydrated = true;
          } else {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
            state._hasHydrated = true;
          }
        }
      }
    }
  )
);
