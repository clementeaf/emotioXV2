'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { User, AuthResponse } from '@/types/auth';

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  exp: number;
}

interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOTP: (email: string) => Promise<void>;
  validateOTP: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (newToken: string) => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Recuperar token del localStorage al iniciar
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<JWTPayload>(storedToken);
        const now = Date.now() / 1000;
        
        if (decoded.exp > now) {
          setToken(storedToken);
          setUser({
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
          });
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const requestOTP = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al solicitar el código OTP');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateOTP = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/validate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Código OTP inválido');
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [token, router]);

  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    requestOTP,
    validateOTP,
    logout,
    updateToken
  };
} 