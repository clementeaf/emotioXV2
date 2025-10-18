import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import eyeTrackingRecruit from '../../api/domains/eyeTrackingRecruit/eyeTrackingRecruit.api';
import type { EyeTrackingRecruitConfig, Participant, ApiResponse } from '../../types/api.types';

export const useEyeTrackingRecruitConfig = (researchId: string) => {
  return useQuery({
    queryKey: ['eyeTrackingRecruit', 'config', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<EyeTrackingRecruitConfig>>(
        eyeTrackingRecruit.getConfigByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useCreateEyeTrackingRecruitConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<EyeTrackingRecruitConfig> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<EyeTrackingRecruitConfig>>(
        eyeTrackingRecruit.createConfig(researchId),
        data
      );
      return response.data;
    },
    onMutate: async ({ researchId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['eyeTrackingRecruit', 'config', researchId] });
      const previousConfig = queryClient.getQueryData(['eyeTrackingRecruit', 'config', researchId]);
      
      const optimisticConfig: EyeTrackingRecruitConfig = {
        id: `temp-${Date.now()}`,
        researchId,
        isEnabled: data.isEnabled ?? true,
        settings: {},
        maxParticipants: data.maxParticipants || 10,
        requirements: data.requirements || '',
        instructions: data.instructions || 'Instrucciones para participantes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['eyeTrackingRecruit', 'config', researchId], {
        success: true,
        data: optimisticConfig
      });
      
      return { previousConfig };
    },
    onSuccess: (data, { researchId }) => {
      queryClient.setQueryData(['eyeTrackingRecruit', 'config', researchId], data);
    },
    onError: (_err, { researchId }, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['eyeTrackingRecruit', 'config', researchId], context.previousConfig);
      }
    },
  });
};

export const useUpdateEyeTrackingRecruitConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      researchId, 
      data 
    }: { 
      researchId: string; 
      data: Partial<EyeTrackingRecruitConfig> 
    }) => {
      const response = await axiosInstance.put<ApiResponse<EyeTrackingRecruitConfig>>(
        eyeTrackingRecruit.updateConfig(researchId),
        data
      );
      return response.data;
    },
    onSuccess: (_, { researchId }) => {
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', 'config', researchId] });
    },
  });
};

export const useDeleteEyeTrackingRecruitConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        eyeTrackingRecruit.delete(researchId)
      );
      return response.data;
    },
    onSuccess: (_, researchId) => {
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', 'config', researchId] });
    },
  });
};

export const useCreateParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      configId, 
      data 
    }: { 
      configId: string; 
      data: Partial<Participant> 
    }) => {
      const response = await axiosInstance.post<ApiResponse<Participant>>(
        eyeTrackingRecruit.createParticipant(configId),
        data
      );
      return response.data;
    },
    onMutate: async ({ configId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['eyeTrackingRecruit', 'participants', configId] });
      const previousParticipants = queryClient.getQueryData(['eyeTrackingRecruit', 'participants', configId]);
      
      const optimisticParticipant: Participant = {
        id: `temp-${Date.now()}`,
        researchId: configId,
        name: data.name || 'Nuevo Participante',
        email: data.email || '',
        status: (data.status as 'active' | 'completed' | 'cancelled') || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['eyeTrackingRecruit', 'participants', configId], (old: any) => ({
        ...old,
        data: [...(old?.data || []), optimisticParticipant]
      }));
      
      return { previousParticipants };
    },
    onSuccess: (data, { configId }) => {
      queryClient.setQueryData(['eyeTrackingRecruit', 'participants', configId], (old: any) => ({
        ...old,
        data: old?.data?.map((participant: Participant) => 
          participant.id.startsWith('temp-') ? data.data : participant
        ) || [data.data]
      }));
    },
    onError: (_err, { configId }, context) => {
      if (context?.previousParticipants) {
        queryClient.setQueryData(['eyeTrackingRecruit', 'participants', configId], context.previousParticipants);
      }
    },
  });
};

export const useUpdateParticipantStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      participantId, 
      status 
    }: { 
      participantId: string; 
      status: string; 
    }) => {
      const response = await axiosInstance.patch<ApiResponse<Participant>>(
        eyeTrackingRecruit.updateParticipantStatus(participantId),
        { status }
      );
      return response.data;
    },
    onMutate: async ({ participantId, status }) => {
      // Invalidar todas las queries de participantes para actualizar el estado optimistamente
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', 'participants'] });
      
      // Actualizar optimistamente el estado del participante en todas las queries relevantes
      queryClient.setQueriesData(
        { queryKey: ['eyeTrackingRecruit', 'participants'] },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((participant: Participant) => 
              participant.id === participantId 
                ? { ...participant, status, updatedAt: new Date().toISOString() }
                : participant
            )
          };
        }
      );
    },
    onSuccess: (data) => {
      // Confirmar la actualización con los datos reales
      queryClient.setQueriesData(
        { queryKey: ['eyeTrackingRecruit', 'participants'] },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((participant: Participant) => 
              participant.id === data.data.id ? data.data : participant
            )
          };
        }
      );
    },
  });
};

export const useGetParticipants = (configId: string) => {
  return useQuery({
    queryKey: ['eyeTrackingRecruit', 'participants', configId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Participant[]>>(
        eyeTrackingRecruit.getParticipants(configId)
      );
      return response.data;
    },
    enabled: !!configId,
  });
};

export const useGetStats = (configId: string) => {
  return useQuery({
    queryKey: ['eyeTrackingRecruit', 'stats', configId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        eyeTrackingRecruit.getStats(configId)
      );
      return response.data;
    },
    enabled: !!configId,
  });
};

export const useGenerateLink = () => {
  return useMutation({
    mutationFn: async (configId: string) => {
      const response = await axiosInstance.post<ApiResponse<{ link: string; token: string }>>(
        eyeTrackingRecruit.generateLink(configId)
      );
      return response.data;
    },
  });
};

export const useGetActiveLinks = (configId: string) => {
  return useQuery({
    queryKey: ['eyeTrackingRecruit', 'links', configId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any[]>>(
        eyeTrackingRecruit.getActiveLinks(configId)
      );
      return response.data;
    },
    enabled: !!configId,
  });
};

export const useDeactivateLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await axiosInstance.patch<ApiResponse<void>>(
        eyeTrackingRecruit.deactivateLink(token)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', 'links'] });
    },
  });
};

export const useValidateLink = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await axiosInstance.get<ApiResponse<{ valid: boolean; configId: string }>>(
        eyeTrackingRecruit.validateLink(token)
      );
      return response.data;
    },
  });
};

export const useGetResearchSummary = (researchId: string) => {
  return useQuery({
    queryKey: ['eyeTrackingRecruit', 'summary', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        eyeTrackingRecruit.getResearchSummary(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useRegisterPublicParticipant = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post<ApiResponse<Participant>>(
        eyeTrackingRecruit.registerPublicParticipant(),
        data
      );
      return response.data;
    },
  });
};

export const useUpdatePublicParticipantStatus = () => {
  return useMutation({
    mutationFn: async ({ 
      participantId, 
      status 
    }: { 
      participantId: string; 
      status: string; 
    }) => {
      const response = await axiosInstance.patch<ApiResponse<Participant>>(
        eyeTrackingRecruit.updatePublicParticipantStatus(participantId),
        { status }
      );
      return response.data;
    },
  });
};
