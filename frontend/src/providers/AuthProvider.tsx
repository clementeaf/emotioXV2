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
      console.log('🔑 [AuthProvider] Configurando token en cliente API:', token.substring(0, 20) + '...');
      // Agregar un pequeño delay para asegurar que se configure correctamente
      setTimeout(() => {
        apiClient.setAuthToken(token);
        console.log('🔑 [AuthProvider] Token configurado en cliente API');
      }, 100);
    } else {
      console.log('🔑 [AuthProvider] Limpiando token del cliente API');
      apiClient.clearAuthToken();
    }
  }, [token]);

  // Función simple para guardar en storage
  const saveToStorage = (rememberMe: boolean, data: { token: string; user: User }) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', data.token);
    storage.setItem('user', JSON.stringify(data.user));
    storage.setItem('auth_type', rememberMe ? 'local' : 'session');
  };

  // Función simple para limpiar storage
  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_type');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_type');
  };

  // Intentar restaurar una sesión desde localStorage/sessionStorage
  const restoreSession = useCallback(async (): Promise<boolean> => {
    console.log('Intentando restaurar sesión...');
    try {
      // Si ya hay un token en el contexto, no es necesario restaurar
      if (token) {
        console.log('Ya existe una sesión activa');
        return true;
      }

      // Buscar token en localStorage primero
      let storedToken = localStorage.getItem('token');
      let authType = 'local';

      // Si no está en localStorage, intentar en sessionStorage
      if (!storedToken) {
        storedToken = sessionStorage.getItem('token');
        authType = 'session';
      }

      // Si no hay token en ningún storage, no podemos restaurar
      if (!storedToken) {
        console.log('No se encontró ningún token almacenado');
        return false;
      }

      try {
        // Decodificar el token para verificar si es válido
        const tokenParts = storedToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Token inválido');
        }

        const payload = JSON.parse(atob(tokenParts[1]));

        // Verificar si el token ha expirado
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('Token expirado, no se puede restaurar la sesión');
          clearStorage();
          return false;
        }

        // Token válido, extraer datos del usuario
        const userData: User = {
          id: payload.id || payload.sub,
          email: payload.email,
          name: payload.name
        };

        // Actualizar estado
        setToken(storedToken);
        setUser(userData);

        console.log('Sesión restaurada exitosamente');
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
    console.log('Iniciando login con token:', newToken.substring(0, 10) + '...');
    try {
      setIsTransitioning(true);
      // Decodificar el token
      const tokenParts = newToken.split('.');
      if (tokenParts.length !== 3) throw new Error('Token inválido');

      const payload = JSON.parse(atob(tokenParts[1]));
      const userData: User = {
        id: payload.id || payload.sub,
        email: payload.email,
        name: payload.name
      };

      console.log('Datos del usuario extraídos:', userData);

      // Guardar en storage
      saveToStorage(rememberMe, { token: newToken, user: userData });

      // Actualizar estado
      setToken(newToken);
      setUser(userData);
      setAuthError(null);

      console.log('Login completado exitosamente');
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
    console.log('Iniciando logout');
    try {
      setIsTransitioning(true);
      // Limpiar almacenamiento
      clearStorage();
      // Limpiar estado
      setUser(null);
      setToken(null);
      setAuthError(null);
      console.log('Logout completado');
      // Redirigir a la página de login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error durante el logout:', error);
      // Asegurar la limpieza incluso si hay error
      clearStorage();
      setUser(null);
      setToken(null);
      setIsTransitioning(false);
    }
  }, []);

  // Cargar estado inicial
  useEffect(() => {
    console.log('Cargando estado inicial de autenticación');
    try {
      const authType = localStorage.getItem('auth_type');
      const storage = authType === 'session' ? sessionStorage : localStorage;

      const storedToken = storage.getItem('token');
      const storedUser = storage.getItem('user');

      console.log('[AuthProvider] Datos encontrados:', {
        authType,
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        tokenLength: storedToken?.length
      });

      if (storedToken && storedUser) {
        console.log('Encontrados datos almacenados');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        console.log('No se encontraron datos almacenados');
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
