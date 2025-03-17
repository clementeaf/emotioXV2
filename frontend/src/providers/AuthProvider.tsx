'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

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
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (newToken: string) => void;
  clearError: () => void;
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
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decoded = jwtDecode<User>(storedToken);
          const expiryTime = (decoded as any).exp * 1000;
          
          if (expiryTime > Date.now()) {
            // Verificar si el token es válido con el backend
            const response = await fetch('https://fww0ghfvga.execute-api.us-east-1.amazonaws.com/users/me', {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              console.log('Token válido encontrado, inicializando sesión');
              setToken(storedToken);
              setUser(decoded);
            } else {
              throw new Error('Token inválido');
            }
          } else {
            throw new Error('Token expirado');
          }
        } catch (error) {
          console.error('Error al inicializar la sesión:', error);
          localStorage.removeItem('token');
          setError('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Verificar expiración del token y renovarlo si es necesario
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<any>(token);
      const expiryTime = decoded.exp * 1000;
      const timeUntilExpiry = expiryTime - Date.now();
      const renewalTime = timeUntilExpiry - (5 * 60 * 1000); // Renovar 5 minutos antes de expirar

      if (timeUntilExpiry <= 0) {
        handleLogout();
        return;
      }

      // Programar renovación del token
      const renewalTimeout = setTimeout(async () => {
        try {
          // Aquí iría la lógica para renovar el token con el backend
          // Por ahora solo manejamos la expiración
          console.log('Token próximo a expirar');
        } catch (error) {
          console.error('Error al renovar el token:', error);
        }
      }, renewalTime);

      // Programar logout para cuando expire el token
      const logoutTimeout = setTimeout(handleLogout, timeUntilExpiry);

      return () => {
        clearTimeout(renewalTimeout);
        clearTimeout(logoutTimeout);
      };
    } catch (error) {
      console.error('Error al verificar la expiración del token:', error);
      handleLogout();
    }
  }, [token]);

  const handleLogin = async (newToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Iniciando proceso de login...');
      const decoded = jwtDecode<User>(newToken);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(decoded);
      console.log('Login exitoso, token almacenado');
      
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
      if (token) {
        const response = await fetch('https://fww0ghfvga.execute-api.us-east-1.amazonaws.com/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cerrar sesión en el servidor');
        }
      }
    } catch (error) {
      console.error('Error al hacer logout en el servidor:', error);
      setError('Error al cerrar sesión. Los datos locales han sido limpiados.');
    } finally {
      localStorage.removeItem('token');
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
      localStorage.setItem('token', newToken);
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