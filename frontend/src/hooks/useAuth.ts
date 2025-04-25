'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authAPI } from '../lib/api';
// <<< Comentar import AuthResponse si ya no se usa >>>
// import type { AuthResponse } from '../lib/api';

// <<< Definir AuthResponse localmente si es necesario >>>
interface AuthResponse { 
  token: string | undefined;
  user: { id: string | undefined; email: string | undefined; name: string | undefined; };
}

export const useAuth = () => {
  const router = useRouter();

  // <<< Eliminar requestOTPMutation >>>
  /*
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
  */

  // <<< Eliminar validateOTPMutation >>>
  /*
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
  */

  const loginMutation = useMutation<
    AuthResponse,
    Error,
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      const response = await authAPI.login({ email, password });
      // <<< Asumir que response.data tiene token y user opcionalmente >>>
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
      return { message: (response.data as { message?: string })?.message || 'Sesión cerrada correctamente' };
    }
  });

  // <<< Ajustar currentUser y currentToken >>>
  const currentUser = loginMutation.data?.user || null;
  const currentToken = loginMutation.data?.token || null;

  return {
    // <<< Eliminar requestOTP y validateOTP del retorno >>>
    // requestOTP: (email: string) => requestOTPMutation.mutate(email),
    // validateOTP: (email: string, otp: string) => 
    //   validateOTPMutation.mutate({ email, otp }),
    login: (email: string, password: string) =>
      loginMutation.mutate({ email, password }),
    logout: () => logoutMutation.mutate(),
    // <<< Ajustar isLoading y error >>>
    isLoading: 
      // requestOTPMutation.isPending || 
      // validateOTPMutation.isPending ||
      loginMutation.isPending ||
      logoutMutation.isPending,
    error: 
      // requestOTPMutation.error?.message || 
      // validateOTPMutation.error?.message ||
      loginMutation.error?.message ||
      logoutMutation.error?.message || null,
    user: currentUser,
    token: currentToken,
    isAuthenticated: !!currentToken,
    // <<< Ajustar message >>>
    message: 
      // requestOTPMutation.data?.message || 
      logoutMutation.data?.message
  };
};

export default useAuth; 