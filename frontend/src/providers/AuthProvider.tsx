'use client';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { apiClient } from '@/config/api';
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Configurar token en el cliente API cuando esté disponible
  useEffect(() => {
    if (token) {
      setTimeout(() => {
        apiClient.setAuthToken(token);
      }, 100);
    } else {
      apiClient.clearAuthToken();
    }
  }, [token]);

  const saveToStorage = (rememberMe: boolean, data: { token: string; user: User }) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', data.token);
    storage.setItem('user', JSON.stringify(data.user));
    storage.setItem('auth_type', rememberMe ? 'local' : 'session');
  };

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_type');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_type');
  };

  const restoreSession = useCallback(async (): Promise<boolean> => {
    try {
      if (token) {
        return true;
      }

      let storedToken = localStorage.getItem('token');
      let authType = 'local';

      if (!storedToken) {
        storedToken = sessionStorage.getItem('token');
        authType = 'session';
      }

      if (!storedToken) {
        return false;
      }

      try {
        const tokenParts = storedToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Token inválido');
        }

        const payload = JSON.parse(atob(tokenParts[1]));

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          clearStorage();
          return false;
        }

        const userData: User = {
          id: payload.id || payload.sub,
          email: payload.email,
          name: payload.name
        };

        setToken(storedToken);
        setUser(userData);

        return true;
      } catch (error) {
        console.error('Error al decodificar token:', error);
        clearStorage();
        return false;
      }
    } catch (error) {
      console.error('Error al restaurar sesión:', error);
      return false;
    }
  }, [token]);

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

      saveToStorage(rememberMe, { token: newToken, user: userData });
      setToken(newToken);
      setUser(userData);
      setAuthError(null);

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error en login:', error);
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
      setUser(null);
      setToken(null);
      setAuthError(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error durante el logout:', error);
      clearStorage();
      setUser(null);
      setToken(null);
      setIsTransitioning(false);
    }
  }, []);

  useEffect(() => {
    try {
      const authType = localStorage.getItem('auth_type');
      const storage = authType === 'session' ? sessionStorage : localStorage;
      const storedToken = storage.getItem('token');
      const storedUser = storage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
      clearStorage();
    } finally {
      setAuthLoading(false);
    }
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
