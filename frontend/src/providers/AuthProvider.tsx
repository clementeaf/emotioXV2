'use client';

import { useAuth as useNewAuth, useLogout as useNewLogout } from '@/api';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  authLoading: boolean;
  authError: string | null;
  login: (token: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  restoreSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const newAuth = useNewAuth();
  const logoutMutation = useNewLogout();
  const [authError, setAuthError] = useState<string | null>(null);

  const { user, token, isAuthenticated, isLoading } = newAuth;

  // This login method is kept for compatibility but the real login happens through useLogin hook
  const login = useCallback(async (newToken: string, rememberMe: boolean) => {
    // This is mainly for legacy compatibility - the actual login should use useLogin hook
    console.warn('AuthProvider login called - consider using useLogin hook directly');
    try {
      const tokenParts = newToken.split('.');
      if (tokenParts.length !== 3) throw new Error('Token inválido');

      const payload = JSON.parse(atob(tokenParts[1]));
      const userData: User = {
        id: payload.id || payload.sub,
        email: payload.email,
        name: payload.name
      };

      // Save to storage (the new auth hooks will pick this up)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', newToken);
      storage.setItem('user', JSON.stringify(userData));
      storage.setItem('auth_type', rememberMe ? 'local' : 'session');

      setAuthError(null);
      // Force reload to trigger the new auth hook
      window.location.reload();
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setAuthError('Error al procesar el login');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // The mutation handles cleanup even on error
    }
  }, [logoutMutation]);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    return isAuthenticated;
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      authLoading: isLoading,
      authError,
      login,
      logout,
      clearError,
      restoreSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
