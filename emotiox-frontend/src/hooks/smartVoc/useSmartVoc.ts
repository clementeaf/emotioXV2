import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import smartVoc from '../../api/domains/smartVoc/smartVoc.api';
import type { SmartVOCForm, ApiResponse } from '../../types/api.types';

export const useSmartVOC = (researchId: string) => {
  return useQuery({
    queryKey: ['smartVoc', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<SmartVOCForm>>(
        smartVoc.getByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useCreateSmartVOC = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<SmartVOCForm> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<SmartVOCForm>>(
        smartVoc.create(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['smartVoc', researchId] });
      const previousSmartVOC = queryClient.getQueryData(['smartVoc', researchId]);
      
      const optimisticSmartVOC: SmartVOCForm = {
        id: `temp-${Date.now()}`,
        researchId,
        title: data.title || 'Formulario SmartVOC',
        description: data.description || '',
        questions: data.questions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['smartVoc', researchId], {
        success: true,
        data: optimisticSmartVOC
      });
      
      return { previousSmartVOC };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['smartVoc', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousSmartVOC) {
        queryClient.setQueryData(['smartVoc', researchId], context.previousSmartVOC);
      }
    },
  });
};

export const useUpdateSmartVOC = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      formId, 
      data 
    }: { 
      researchId: string; 
      formId: string; 
      data: Partial<SmartVOCForm> 
    }) => {
      const response = await axiosInstance.put<ApiResponse<SmartVOCForm>>(
        smartVoc.update(researchId, formId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['smartVoc', researchId] });
      const previousSmartVOC = queryClient.getQueryData(['smartVoc', researchId]);
      
      queryClient.setQueryData(['smartVoc', researchId], (old: any) => ({
        ...old,
        data: { ...old?.data, ...data, updatedAt: new Date().toISOString() }
      }));
      
      return { previousSmartVOC };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['smartVoc', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousSmartVOC) {
        queryClient.setQueryData(['smartVoc', researchId], context.previousSmartVOC);
      }
    },
  });
};

export const useDeleteSmartVOC = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        smartVoc.delete(researchId)
      );
      return response.data;
    },
    onMutate: async (researchId) => {
      await queryClient.cancelQueries({ queryKey: ['smartVoc', researchId] });
      const previousSmartVOC = queryClient.getQueryData(['smartVoc', researchId]);
      
      queryClient.setQueryData(['smartVoc', researchId], {
        success: false,
        data: null
      });
      
      return { previousSmartVOC };
    },
    onError: (_err, researchId, context) => {
      if (context?.previousSmartVOC) {
        queryClient.setQueryData(['smartVoc', researchId], context.previousSmartVOC);
      }
    },
  });
};
