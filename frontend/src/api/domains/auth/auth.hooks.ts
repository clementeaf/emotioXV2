/**
 * Auth Domain Hooks - React Query implementation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from './auth.api';
import { updateApiToken } from '@/api/config/axios';
import type { LoginRequest, RegisterRequest, User } from './auth.types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Hook for login
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update axios token
      updateApiToken(data.token);

      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Show success message
      toast.success('Inicio de sesión exitoso');

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });
}

/**
 * Hook for register
 */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
    onSuccess: (data) => {
      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update axios token
      updateApiToken(data.token);

      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Show success message
      toast.success('Registro exitoso');

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al registrarse';
      toast.error(message);
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Clear axios token
      updateApiToken(null);

      // Clear all queries
      queryClient.clear();

      // Show success message
      toast.success('Sesión cerrada');

      // Redirect to login
      router.push('/login');
    },
    onError: (error: any) => {
      // Even if logout fails on backend, clear local session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      updateApiToken(null);
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    },
  });
}

/**
 * Hook for getting user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!localStorage.getItem('token'), // Only fetch if token exists
  });
}

/**
 * Hook for checking auth status
 */
export function useAuth() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  let user: User | null = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  return {
    isAuthenticated: !!token,
    user,
    token,
  };
}

/**
 * Hook for protecting routes
 */
export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated && typeof window !== 'undefined') {
    router.push('/login');
    return { isAuthenticated: false, isLoading: true };
  }

  return { isAuthenticated, isLoading: false };
}