import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import welcomeScreen from '../../api/domains/welcomeScreen/welcomeScreen.api';
import type { WelcomeScreen, ApiResponse } from '../../types/api.types';

export const useWelcomeScreen = (researchId: string) => {
  return useQuery({
    queryKey: ['welcomeScreen', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<WelcomeScreen>>(
        welcomeScreen.getByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useSaveWelcomeScreen = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<WelcomeScreen> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<WelcomeScreen>>(
        welcomeScreen.save(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['welcomeScreen', researchId] });
      const previousWelcomeScreen = queryClient.getQueryData(['welcomeScreen', researchId]);
      
      const optimisticWelcomeScreen: WelcomeScreen = {
        id: `temp-${Date.now()}`,
        researchId,
        isEnabled: data.isEnabled ?? true,
        title: data.title || '',
        message: data.message || '',
        startButtonText: data.startButtonText || 'Comenzar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['welcomeScreen', researchId], {
        success: true,
        data: optimisticWelcomeScreen
      });
      
      return { previousWelcomeScreen };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['welcomeScreen', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousWelcomeScreen) {
        queryClient.setQueryData(['welcomeScreen', researchId], context.previousWelcomeScreen);
      }
    },
  });
};

export const useUpdateWelcomeScreen = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<WelcomeScreen> 
    }) => {
      const response = await axiosInstance.put<ApiResponse<WelcomeScreen>>(
        welcomeScreen.update(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['welcomeScreen', researchId] });
      const previousWelcomeScreen = queryClient.getQueryData(['welcomeScreen', researchId]);
      
      queryClient.setQueryData(['welcomeScreen', researchId], (old: any) => ({
        ...old,
        data: { ...old?.data, ...data, updatedAt: new Date().toISOString() }
      }));
      
      return { previousWelcomeScreen };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['welcomeScreen', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousWelcomeScreen) {
        queryClient.setQueryData(['welcomeScreen', researchId], context.previousWelcomeScreen);
      }
    },
  });
};

export const useDeleteWelcomeScreen = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        welcomeScreen.delete(researchId)
      );
      return response.data;
    },
    onMutate: async (researchId) => {
      await queryClient.cancelQueries({ queryKey: ['welcomeScreen', researchId] });
      const previousWelcomeScreen = queryClient.getQueryData(['welcomeScreen', researchId]);
      
      queryClient.setQueryData(['welcomeScreen', researchId], {
        success: false,
        data: null
      });
      
      return { previousWelcomeScreen };
    },
    onError: (_err, researchId, context) => {
      if (context?.previousWelcomeScreen) {
        queryClient.setQueryData(['welcomeScreen', researchId], context.previousWelcomeScreen);
      }
    },
  });
};
