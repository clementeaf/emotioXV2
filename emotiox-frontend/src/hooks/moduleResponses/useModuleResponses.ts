import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import moduleResponses from '../../api/domains/moduleResponses/moduleResponses.api';
import type { ModuleResponse, ApiResponse } from '../../types/api.types';

export const useModuleResponsesByResearch = (researchId: string) => {
  return useQuery({
    queryKey: ['moduleResponses', 'research', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<ModuleResponse[]>>(
        moduleResponses.getResponsesByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useModuleResponsesGroupedByQuestion = (researchId: string) => {
  return useQuery({
    queryKey: ['moduleResponses', 'grouped', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        moduleResponses.getResponsesGroupedByQuestion(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useModuleResponsesForParticipant = (researchId: string, participantId: string) => {
  return useQuery({
    queryKey: ['moduleResponses', 'participant', researchId, participantId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<ModuleResponse[]>>(
        moduleResponses.getResponsesForParticipant(researchId, participantId)
      );
      return response.data;
    },
    enabled: !!researchId && !!participantId,
  });
};

export const useSaveModuleResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ModuleResponse>) => {
      const response = await axiosInstance.post<ApiResponse<ModuleResponse>>(
        moduleResponses.saveResponse(),
        data
      );
      return response.data;
    },
    onMutate: async (data) => {
      if (data.researchId) {
        await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'research', data.researchId] });
        await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'grouped', data.researchId] });
        
        const previousResearchResponses = queryClient.getQueryData(['moduleResponses', 'research', data.researchId]);
        const previousGroupedResponses = queryClient.getQueryData(['moduleResponses', 'grouped', data.researchId]);
        
        const optimisticResponse: ModuleResponse = {
          id: `temp-${Date.now()}`,
          researchId: data.researchId!,
          participantId: data.participantId!,
          questionKey: data.questionKey || '',
          questionId: data.questionId || '',
          response: data.response || '',
          moduleType: data.moduleType || 'smartvoc',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        queryClient.setQueryData(['moduleResponses', 'research', data.researchId], (old: any) => ({
          ...old,
          data: [...(old?.data || []), optimisticResponse]
        }));
        
        return { previousResearchResponses, previousGroupedResponses };
      }
    },
    onSuccess: (data, originalData) => {
      if (originalData.researchId) {
        queryClient.setQueryData(['moduleResponses', 'research', originalData.researchId], (old: any) => ({
          ...old,
          data: old?.data?.map((response: ModuleResponse) => 
            response.id.startsWith('temp-') ? data.data : response
          ) || [data.data]
        }));
      }
    },
    onError: (_err, data, context) => {
      if (data.researchId && context?.previousResearchResponses) {
        queryClient.setQueryData(['moduleResponses', 'research', data.researchId], context.previousResearchResponses);
      }
      if (data.researchId && context?.previousGroupedResponses) {
        queryClient.setQueryData(['moduleResponses', 'grouped', data.researchId], context.previousGroupedResponses);
      }
    },
  });
};

export const useUpdateModuleResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      responseId, 
      data 
    }: { 
      responseId: string; 
      data: Partial<ModuleResponse> 
    }) => {
      const response = await axiosInstance.put<ApiResponse<ModuleResponse>>(
        moduleResponses.updateResponse(responseId),
        data
      );
      return response.data;
    },
    onMutate: async ({ data }) => {
      if (data.researchId) {
        await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'research', data.researchId] });
        await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'grouped', data.researchId] });
        
        const previousResearchResponses = queryClient.getQueryData(['moduleResponses', 'research', data.researchId]);
        const previousGroupedResponses = queryClient.getQueryData(['moduleResponses', 'grouped', data.researchId]);
        
        queryClient.setQueryData(['moduleResponses', 'research', data.researchId], (old: any) => ({
          ...old,
          data: old?.data?.map((response: ModuleResponse) => 
            response.id === data.id ? { ...response, ...data, updatedAt: new Date().toISOString() } : response
          ) || []
        }));
        
        return { previousResearchResponses, previousGroupedResponses };
      }
    },
    onSuccess: (data, { data: originalData }) => {
      if (originalData.researchId) {
        queryClient.setQueryData(['moduleResponses', 'research', originalData.researchId], (old: any) => ({
          ...old,
          data: old?.data?.map((response: ModuleResponse) => 
            response.id === data.data.id ? data.data : response
          ) || []
        }));
      }
    },
    onError: (_err, { data }, context) => {
      if (data.researchId && context?.previousResearchResponses) {
        queryClient.setQueryData(['moduleResponses', 'research', data.researchId], context.previousResearchResponses);
      }
      if (data.researchId && context?.previousGroupedResponses) {
        queryClient.setQueryData(['moduleResponses', 'grouped', data.researchId], context.previousGroupedResponses);
      }
    },
  });
};

export const useDeleteAllModuleResponses = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      participantId 
    }: { 
      researchId: string; 
      participantId: string; 
    }) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        moduleResponses.deleteAllResponses(researchId, participantId)
      );
      return response.data;
    },
    onMutate: async ({ researchId, participantId }) => {
      await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'research', researchId] });
      await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'grouped', researchId] });
      await queryClient.cancelQueries({ queryKey: ['moduleResponses', 'participant', researchId, participantId] });
      
      const previousResearchResponses = queryClient.getQueryData(['moduleResponses', 'research', researchId]);
      const previousGroupedResponses = queryClient.getQueryData(['moduleResponses', 'grouped', researchId]);
      const previousParticipantResponses = queryClient.getQueryData(['moduleResponses', 'participant', researchId, participantId]);
      
      queryClient.setQueryData(['moduleResponses', 'research', researchId], (old: any) => ({
        ...old,
        data: old?.data?.filter((response: ModuleResponse) => response.participantId !== participantId) || []
      }));
      
      queryClient.setQueryData(['moduleResponses', 'participant', researchId, participantId], {
        success: true,
        data: []
      });
      
      return { previousResearchResponses, previousGroupedResponses, previousParticipantResponses };
    },
    onError: (_err, { researchId, participantId }, context) => {
      if (context?.previousResearchResponses) {
        queryClient.setQueryData(['moduleResponses', 'research', researchId], context.previousResearchResponses);
      }
      if (context?.previousGroupedResponses) {
        queryClient.setQueryData(['moduleResponses', 'grouped', researchId], context.previousGroupedResponses);
      }
      if (context?.previousParticipantResponses) {
        queryClient.setQueryData(['moduleResponses', 'participant', researchId, participantId], context.previousParticipantResponses);
      }
    },
  });
};

export const useSmartVOCResults = (researchId: string) => {
  return useQuery({
    queryKey: ['moduleResponses', 'smartvoc', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        moduleResponses.getSmartVOCResults(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useCPVResults = (researchId: string) => {
  return useQuery({
    queryKey: ['moduleResponses', 'cpv', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        moduleResponses.getCPVResults(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useTrustFlowResults = (researchId: string) => {
  return useQuery({
    queryKey: ['moduleResponses', 'trustflow', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        moduleResponses.getTrustFlowResults(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};
