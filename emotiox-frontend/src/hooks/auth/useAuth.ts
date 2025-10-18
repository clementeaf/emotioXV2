import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import auth from '../../api/domains/auth/auth.api';
import type { AuthResponse, ApiResponse } from '../../types/api.types';

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        auth.login(),
        credentials
      );
      return response.data;
    },
    onMutate: async (credentials) => {
      await queryClient.cancelQueries({ queryKey: ['auth', 'profile'] });
      const previousProfile = queryClient.getQueryData(['auth', 'profile']);
      
      queryClient.setQueryData(['auth', 'profile'], {
        success: true,
        data: {
          id: 'temp',
          email: credentials.email,
          name: 'Cargando...',
          role: 'user'
        }
      });
      
      return { previousProfile };
    },
    onError: (_err, _credentials, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['auth', 'profile'], context.previousProfile);
      }
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string }) => {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        auth.register(),
        userData
      );
      return response.data;
    },
    onMutate: async (userData) => {
      await queryClient.cancelQueries({ queryKey: ['auth', 'profile'] });
      const previousProfile = queryClient.getQueryData(['auth', 'profile']);
      
      queryClient.setQueryData(['auth', 'profile'], {
        success: true,
        data: {
          id: 'temp',
          email: userData.email,
          name: userData.name,
          role: 'user'
        }
      });
      
      return { previousProfile };
    },
    onSuccess: (data) => {
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
        queryClient.setQueryData(['auth', 'profile'], data);
      }
    },
    onError: (_err, _userData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['auth', 'profile'], context.previousProfile);
      }
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(auth.logout());
      return response.data;
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      queryClient.clear();
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<AuthResponse['user']>>(
        auth.getProfile()
      );
      return response.data;
    },
    enabled: !!localStorage.getItem('token') || !!sessionStorage.getItem('token'),
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post<ApiResponse<{ token: string }>>(
        auth.refreshToken()
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
    },
  });
};
