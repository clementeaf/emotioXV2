import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import cognitiveTask from '../../api/domains/cognitiveTask/cognitiveTask.api';
import type { CognitiveTask, ApiResponse, S3UploadResponse } from '../../types/api.types';

export const useCognitiveTask = (researchId: string) => {
  return useQuery({
    queryKey: ['cognitiveTask', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<CognitiveTask>>(
        cognitiveTask.getByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useCreateCognitiveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<CognitiveTask> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<CognitiveTask>>(
        cognitiveTask.create(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['cognitiveTask', researchId] });
      const previousCognitiveTask = queryClient.getQueryData(['cognitiveTask', researchId]);
      
      const optimisticCognitiveTask: CognitiveTask = {
        id: `temp-${Date.now()}`,
        researchId,
        isEnabled: data.isEnabled ?? true,
        questions: data.questions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['cognitiveTask', researchId], {
        success: true,
        data: optimisticCognitiveTask
      });
      
      return { previousCognitiveTask };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['cognitiveTask', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousCognitiveTask) {
        queryClient.setQueryData(['cognitiveTask', researchId], context.previousCognitiveTask);
      }
    },
  });
};

export const useUpdateCognitiveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<CognitiveTask> 
    }) => {
      const response = await axiosInstance.put<ApiResponse<CognitiveTask>>(
        cognitiveTask.update(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['cognitiveTask', researchId] });
      const previousCognitiveTask = queryClient.getQueryData(['cognitiveTask', researchId]);
      
      queryClient.setQueryData(['cognitiveTask', researchId], (old: any) => ({
        ...old,
        data: { ...old?.data, ...data, updatedAt: new Date().toISOString() }
      }));
      
      return { previousCognitiveTask };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['cognitiveTask', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousCognitiveTask) {
        queryClient.setQueryData(['cognitiveTask', researchId], context.previousCognitiveTask);
      }
    },
  });
};

export const useDeleteCognitiveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        cognitiveTask.delete(researchId)
      );
      return response.data;
    },
    onMutate: async (researchId) => {
      await queryClient.cancelQueries({ queryKey: ['cognitiveTask', researchId] });
      const previousCognitiveTask = queryClient.getQueryData(['cognitiveTask', researchId]);
      
      queryClient.setQueryData(['cognitiveTask', researchId], {
        success: false,
        data: null
      });
      
      return { previousCognitiveTask };
    },
    onError: (_err, researchId, context) => {
      if (context?.previousCognitiveTask) {
        queryClient.setQueryData(['cognitiveTask', researchId], context.previousCognitiveTask);
      }
    },
  });
};

export const useGetUploadUrl = () => {
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      fileName, 
      fileType 
    }: { 
      researchId: string; 
      fileName: string; 
      fileType: string; 
    }) => {
      const response = await axiosInstance.post<ApiResponse<S3UploadResponse>>(
        cognitiveTask.getUploadUrl(researchId),
        { fileName, fileType }
      );
      return response.data;
    },
  });
};
