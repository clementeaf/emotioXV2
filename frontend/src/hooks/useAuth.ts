'use client';

import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../lib/api';
import type { User, APIResponse, AuthResponse } from '../lib/api';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();

  const requestOTPMutation = useMutation<
    { message: string },
    Error,
    string
  >({
    mutationFn: async (email) => {
      const response = await authAPI.requestOTP(email);
      return { message: response.data.message || 'OTP enviado correctamente' };
    }
  });

  const validateOTPMutation = useMutation<
    AuthResponse,
    Error,
    { email: string; otp: string }
  >({
    mutationFn: async ({ email, otp }) => {
      const response = await authAPI.validateOTP(email, otp);
      const { token, user } = response.data;
      const authData = {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      };
      if (authData.token) {
        localStorage.setItem('token', authData.token);
      }
      router.push('/dashboard');
      return authData;
    }
  });

  const loginMutation = useMutation<
    AuthResponse,
    Error,
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      const authData = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
      if (authData.token) {
        localStorage.setItem('token', authData.token);
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
      return { message: response.data.message || 'Sesión cerrada correctamente' };
    }
  });

  const currentUser = loginMutation.data?.user || validateOTPMutation.data?.user || null;

  return {
    requestOTP: (email: string) => requestOTPMutation.mutate(email),
    validateOTP: (email: string, otp: string) => 
      validateOTPMutation.mutate({ email, otp }),
    login: (email: string, password: string) =>
      loginMutation.mutate({ email, password }),
    logout: () => logoutMutation.mutate(),
    isLoading: 
      requestOTPMutation.isPending || 
      validateOTPMutation.isPending ||
      loginMutation.isPending ||
      logoutMutation.isPending,
    error: 
      requestOTPMutation.error?.message || 
      validateOTPMutation.error?.message ||
      loginMutation.error?.message ||
      logoutMutation.error?.message || null,
    user: currentUser,
    token: loginMutation.data?.token || validateOTPMutation.data?.token || null,
    message: 
      requestOTPMutation.data?.message || 
      logoutMutation.data?.message
  };
};

export default useAuth; 