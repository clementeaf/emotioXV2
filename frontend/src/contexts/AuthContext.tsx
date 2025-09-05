'use client';

import { getApiUrl } from '@/api/dynamic-endpoints';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { JwtPayload } from '@/types/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Cargar token al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        // Verificar si el token es válido
        const decoded = jwtDecode<JwtPayload>(storedToken);
        const expiryTime = decoded.exp ? decoded.exp * 1000 : 0;

        if (expiryTime > Date.now()) {
          setToken(storedToken);
          setUser({
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role
          });
        } else {
            localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Verificar expiración del token
  useEffect(() => {
    if (!token) { return; }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expiryTime = decoded.exp ? decoded.exp * 1000 : 0;
      const timeUntilExpiry = expiryTime - Date.now();

      if (timeUntilExpiry <= 0) {
        handleLogout();
        return;
      }

      // Programar logout para cuando expire el token
      const logoutTimeout = setTimeout(handleLogout, timeUntilExpiry);
      return () => clearTimeout(logoutTimeout);
    } catch (error) {
      console.error('Error al verificar la expiración del token:', error);
      handleLogout();
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      });

      // Forzar la redirección al dashboard usando replace y asegurando que la navegación sea inmediata
      router.replace('/dashboard');
      router.refresh(); // Forzar la actualización de la navegación
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      // Intentar hacer logout en el backend
      const logoutUrl = getApiUrl('auth/logout');

      if (token) {
        await fetch(logoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error al hacer logout en el servidor:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      router.replace('/login');
      router.refresh(); // Forzar la actualización de la navegación
    }
  };

  const handleUpdateToken = (newToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      });

    } catch (error) {
      console.error('Error al actualizar el token:', error);
    }
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    login: handleLogin,
    logout: handleLogout,
    updateToken: handleUpdateToken,
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
