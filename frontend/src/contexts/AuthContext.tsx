'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  sub?: string;
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
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        // Verificar si el token es válido
        const decoded = jwtDecode<User>(storedToken);
        const expiryTime = (decoded as any).exp * 1000;
        
        if (expiryTime > Date.now()) {
          setToken(storedToken);
          setUser(decoded);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  // Verificar expiración del token
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<any>(token);
      const expiryTime = decoded.exp * 1000;
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
      const decoded = jwtDecode<User>(newToken);
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(decoded);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Intentar hacer logout en el backend
      const logoutUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/auth/logout` 
        : '/api/auth/logout';
      
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
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  const handleUpdateToken = (newToken: string) => {
    try {
      const decoded = jwtDecode<User>(newToken);
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(decoded);
      
      console.log('Token actualizado:', new Date().toLocaleString());
      console.log('Nuevo token expira:', new Date((decoded as any).exp * 1000).toLocaleString());
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