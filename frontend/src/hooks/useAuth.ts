'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { authAPI } from '../lib/api';

interface AuthResponse {
  token: string | undefined;
  user: { id: string | undefined; email: string | undefined; name: string | undefined; };
}

export const useAuth = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🎯 CARGAR TOKEN DEL LOCALSTORAGE AL MONTAR
  useEffect(() => {
    const loadAuthFromStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken) {
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
      } finally {
        setAuthLoading(false);
      }
    };

    loadAuthFromStorage();
  }, []);

  const loginMutation = useMutation<
    AuthResponse,
    Error,
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      const response = await authAPI.login({ email, password });
      const data = response.data as { token?: string; user?: { id?: string; email?: string; name?: string } };
      const authData = {
        token: data.token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.name
        }
      };

      if (authData.token) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        setToken(authData.token);
        setUser(authData.user);
      }

      router.push('/dashboard');
      return authData;
    }
  });

  const logoutMutation = useMutation<
    { message: string },
    Error,
    void
  >({
    mutationFn: async () => {
      const response = await authAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      return { message: (response.data as { message?: string })?.message || 'Sesión cerrada correctamente' };
    }
  });

  return {
    token,
    user,
    authLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error
  };
};
