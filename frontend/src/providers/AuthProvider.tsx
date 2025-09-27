'use client';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { apiClient } from '@/config/api';
import { updateApiToken } from '@/api/config/axios';
import { useAuth as useNewAuth } from '@/api';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize from the new auth hook
  const { user, token, isAuthenticated } = newAuth;

  // Configurar token en ambos clientes API cuando esté disponible
  useEffect(() => {
    if (token) {
      console.log('AuthProvider: Configurando token:', token.substring(0, 20) + '...');
      apiClient.setAuthToken(token);
      updateApiToken(token);
    } else {
      console.log('AuthProvider: Limpiando token');
      apiClient.clearAuthToken();
      updateApiToken(null);
    }
  }, [token]);

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_type');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_type');
  };

  const restoreSession = useCallback(async (): Promise<boolean> => {
    return isAuthenticated;
  }, [isAuthenticated]);

  const login = useCallback(async (newToken: string, rememberMe: boolean) => {
    try {
      setIsTransitioning(true);
      const tokenParts = newToken.split('.');
      if (tokenParts.length !== 3) throw new Error('Token inválido');

      const payload = JSON.parse(atob(tokenParts[1]));
      const userData: User = {
        id: payload.id || payload.sub,
        email: payload.email,
        name: payload.name
      };

      // Save to storage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', newToken);
      storage.setItem('user', JSON.stringify(userData));
      storage.setItem('auth_type', rememberMe ? 'local' : 'session');

      // Update tokens
      apiClient.setAuthToken(newToken);
      updateApiToken(newToken);

      setAuthError(null);
      window.location.href = '/dashboard';
    } catch (error) {
      clearStorage();
      setAuthError('Error al procesar el login');
      setIsTransitioning(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsTransitioning(true);
      clearStorage();
      apiClient.clearAuthToken();
      updateApiToken(null);
      setAuthError(null);
      window.location.href = '/login';
    } catch (error) {
      clearStorage();
      apiClient.clearAuthToken();
      updateApiToken(null);
      setIsTransitioning(false);
    }
  }, []);

  useEffect(() => {
    setAuthLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      authLoading,
      authError,
      login,
      logout,
      clearError,
      restoreSession
    }}>
      {isTransitioning && <LoadingScreen />}
      {children}
    </AuthContext.Provider>
  );
};
