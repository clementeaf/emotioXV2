import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import eyeTracking from '../../api/domains/eyeTracking/eyeTracking.api';
import type { EyeTrackingConfig, ApiResponse } from '../../types/api.types';

export const useEyeTracking = (researchId: string) => {
  return useQuery({
    queryKey: ['eyeTracking', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<EyeTrackingConfig>>(
        eyeTracking.getByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useCreateEyeTracking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<EyeTrackingConfig> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<EyeTrackingConfig>>(
        eyeTracking.create(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['eyeTracking', researchId] });
      const previousEyeTracking = queryClient.getQueryData(['eyeTracking', researchId]);
      
      const optimisticEyeTracking: EyeTrackingConfig = {
        id: `temp-${Date.now()}`,
        researchId,
        isEnabled: data.isEnabled ?? true,
        settings: {},
        calibrationRequired: data.calibrationRequired ?? true,
        recordingDuration: data.recordingDuration || 30,
        instructions: data.instructions || 'Mire fijamente a la pantalla durante la grabación',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['eyeTracking', researchId], {
        success: true,
        data: optimisticEyeTracking
      });
      
      return { previousEyeTracking };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['eyeTracking', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousEyeTracking) {
        queryClient.setQueryData(['eyeTracking', researchId], context.previousEyeTracking);
      }
    },
  });
};

export const useUpdateEyeTracking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<EyeTrackingConfig> 
    }) => {
      const response = await axiosInstance.put<ApiResponse<EyeTrackingConfig>>(
        eyeTracking.update(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['eyeTracking', researchId] });
      const previousEyeTracking = queryClient.getQueryData(['eyeTracking', researchId]);
      
      queryClient.setQueryData(['eyeTracking', researchId], (old: any) => ({
        ...old,
        data: { ...old?.data, ...data, updatedAt: new Date().toISOString() }
      }));
      
      return { previousEyeTracking };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['eyeTracking', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousEyeTracking) {
        queryClient.setQueryData(['eyeTracking', researchId], context.previousEyeTracking);
      }
    },
  });
};

export const useDeleteEyeTracking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        eyeTracking.delete(researchId)
      );
      return response.data;
    },
    onMutate: async (researchId) => {
      await queryClient.cancelQueries({ queryKey: ['eyeTracking', researchId] });
      const previousEyeTracking = queryClient.getQueryData(['eyeTracking', researchId]);
      
      queryClient.setQueryData(['eyeTracking', researchId], {
        success: false,
        data: null
      });
      
      return { previousEyeTracking };
    },
    onError: (_err, researchId, context) => {
      if (context?.previousEyeTracking) {
        queryClient.setQueryData(['eyeTracking', researchId], context.previousEyeTracking);
      }
    },
  });
};
