'use client';

import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import tokenService from '@/services/tokenService';

interface User {
  email: string;
  name?: string;
  sub?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (newToken: string) => void;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Cargar token al iniciar
  useEffect(() => {
    const initializeAuth = async () => {
      // Verificar el tipo de almacenamiento utilizado (localStorage o sessionStorage)
      const storageType = localStorage.getItem('auth_storage_type') || 'local';
      console.log('Tipo de almacenamiento detectado:', storageType);
      
      // Buscar token en el almacenamiento correspondiente
      const storedToken = storageType === 'local' 
        ? localStorage.getItem('token') 
        : sessionStorage.getItem('token');
        
      if (storedToken) {
        try {
          console.log('Intentando inicializar con token almacenado:', storedToken.substring(0, 15) + '...');
          const decoded = jwtDecode<User>(storedToken);
          console.log('Token decodificado con éxito:', decoded);
          
          const expiryTime = (decoded as any).exp * 1000;
          const now = Date.now();
          console.log('Tiempo actual:', new Date(now).toLocaleString());
          console.log('Fecha de expiración del token:', new Date(expiryTime).toLocaleString());
          console.log('Tiempo restante:', Math.floor((expiryTime - now) / (1000 * 60 * 60)) + ' horas');
          
          if (expiryTime > now) {
            console.log('Token válido encontrado, inicializando sesión');
            setToken(storedToken);
            setUser(decoded);
            
            // Iniciar la renovación automática del token
            tokenService.startAutoRefresh();
            
            console.log('Sesión inicializada con token existente, expira:', new Date(expiryTime).toLocaleString());
          } else {
            throw new Error(`Token expirado: venció el ${new Date(expiryTime).toLocaleString()}`);
          }
        } catch (error) {
          console.error('Error al inicializar la sesión:', error);
          // Limpiar token del almacenamiento correspondiente
          if (storageType === 'local') {
            localStorage.removeItem('token');
          } else {
            sessionStorage.removeItem('token');
          }
          localStorage.removeItem('auth_storage_type');
          setError('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
    
    // Limpiar al desmontar el componente
    return () => {
      // Detener la renovación automática al desmontar
      tokenService.stopAutoRefresh();
    };
  }, []);

  // Función para renovar manualmente el token
  const handleRefreshToken = async (): Promise<boolean> => {
    try {
      const renewed = await tokenService.refreshTokenIfNeeded();
      
      if (renewed) {
        // Si se renovó el token, actualizar el estado
        const newToken = tokenService.getToken();
        if (newToken) {
          const decoded = jwtDecode<User>(newToken);
          setToken(newToken);
          setUser(decoded);
        }
      }
      
      return renewed;
    } catch (error) {
      console.error('Error al renovar token manualmente:', error);
      return false;
    }
  };

  const handleLogin = async (newToken: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Iniciando proceso de login con rememberMe:', rememberMe);
      const decoded = jwtDecode<User>(newToken);
      
      if (rememberMe) {
        // Si rememberMe es true, guardar en localStorage (persistente)
        localStorage.setItem('token', newToken);
        localStorage.setItem('auth_storage_type', 'local');
        console.log('Token almacenado en localStorage (sesión persistente)');
      } else {
        // Si rememberMe es false, guardar en sessionStorage (no persistente)
        sessionStorage.setItem('token', newToken);
        localStorage.setItem('auth_storage_type', 'session');
        console.log('Token almacenado en sessionStorage (sesión temporal)');
      }
      
      setToken(newToken);
      setUser(decoded);
      console.log('Login exitoso, token almacenado');
      
      // Iniciar la renovación automática del token
      tokenService.startAutoRefresh();
      
      // Redirigir al dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Error al iniciar sesión. Por favor, intenta nuevamente.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      console.log('Iniciando proceso de logout...');
      // Detener la renovación automática del token
      tokenService.stopAutoRefresh();
      
      // No es necesario hacer logout en el servidor
      // Simplemente limpiar los datos locales
    } catch (error) {
      console.error('Error durante el proceso de logout:', error);
      setError('Error al cerrar sesión. Los datos locales han sido limpiados.');
    } finally {
      // Limpiar token de ambos almacenamientos para mayor seguridad
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('auth_storage_type');
      
      setToken(null);
      setUser(null);
      setIsLoading(false);
      console.log('Logout completado, redirigiendo a login');
      router.replace('/login');
    }
  };

  const handleUpdateToken = (newToken: string) => {
    try {
      const decoded = jwtDecode<User>(newToken);
      
      // Obtener el tipo de almacenamiento actual
      const storageType = localStorage.getItem('auth_storage_type') || 'local';
      
      // Guardar el token en el almacenamiento correspondiente
      if (storageType === 'local') {
        localStorage.setItem('token', newToken);
      } else {
        sessionStorage.setItem('token', newToken);
      }
      
      setToken(newToken);
      setUser(decoded);
      setError(null);
      
      console.log('Token actualizado:', new Date().toLocaleString());
      console.log('Nuevo token expira:', new Date((decoded as any).exp * 1000).toLocaleString());
    } catch (error) {
      console.error('Error al actualizar el token:', error);
      setError('Error al actualizar la sesión');
    }
  };

  const clearError = () => setError(null);

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    updateToken: handleUpdateToken,
    clearError,
    refreshToken: handleRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export default AuthProvider; 