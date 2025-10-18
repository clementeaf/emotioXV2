import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import thankYouScreen from '../../api/domains/thankYouScreen/thankYouScreen.api';
import type { ThankYouScreen, ApiResponse } from '../../types/api.types';

export const useThankYouScreen = (researchId: string) => {
  return useQuery({
    queryKey: ['thankYouScreen', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<ThankYouScreen>>(
        thankYouScreen.getByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useSaveThankYouScreen = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<ThankYouScreen> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<ThankYouScreen>>(
        thankYouScreen.save(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['thankYouScreen', researchId] });
      const previousThankYouScreen = queryClient.getQueryData(['thankYouScreen', researchId]);
      
      const optimisticThankYouScreen: ThankYouScreen = {
        id: `temp-${Date.now()}`,
        researchId,
        isEnabled: data.isEnabled ?? true,
        title: data.title || '¡Gracias por participar!',
        message: data.message || 'Tu participación es muy valiosa para nosotros.',
        buttonText: data.buttonText || 'Finalizar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['thankYouScreen', researchId], {
        success: true,
        data: optimisticThankYouScreen
      });
      
      return { previousThankYouScreen };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['thankYouScreen', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousThankYouScreen) {
        queryClient.setQueryData(['thankYouScreen', researchId], context.previousThankYouScreen);
      }
    },
  });
};

export const useDeleteThankYouScreen = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        thankYouScreen.delete(researchId)
      );
      return response.data;
    },
    onMutate: async (researchId) => {
      await queryClient.cancelQueries({ queryKey: ['thankYouScreen', researchId] });
      const previousThankYouScreen = queryClient.getQueryData(['thankYouScreen', researchId]);
      
      queryClient.setQueryData(['thankYouScreen', researchId], {
        success: false,
        data: null
      });
      
      return { previousThankYouScreen };
    },
    onError: (_err, researchId, context) => {
      if (context?.previousThankYouScreen) {
        queryClient.setQueryData(['thankYouScreen', researchId], context.previousThankYouScreen);
      }
    },
  });
};
