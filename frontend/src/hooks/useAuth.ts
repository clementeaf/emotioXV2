'use client';

import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../lib/api';
import type { User, APIResponse, AuthResponse } from '../lib/api';

export const useAuth = () => {
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

  const currentUser = validateOTPMutation.data?.user ? {
    id: validateOTPMutation.data.user.id,
    email: validateOTPMutation.data.user.email
  } : null;

  return {
    requestOTP: (email: string) => requestOTPMutation.mutate(email),
    validateOTP: (email: string, otp: string) => 
      validateOTPMutation.mutate({ email, otp }),
    logout: () => logoutMutation.mutate(),
    isLoading: 
      requestOTPMutation.isPending || 
      validateOTPMutation.isPending || 
      logoutMutation.isPending,
    error: 
      requestOTPMutation.error?.message || 
      validateOTPMutation.error?.message || 
      logoutMutation.error?.message || null,
    user: currentUser,
    token: validateOTPMutation.data?.token || null,
    message: 
      requestOTPMutation.data?.message || 
      logoutMutation.data?.message
  };
};

export default useAuth; 