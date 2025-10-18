import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import researchInProgress from '../../api/domains/researchInProgress/researchInProgress.api';
import type { Participant, ApiResponse } from '../../types/api.types';

export const useParticipantsWithStatus = (researchId: string) => {
  return useQuery({
    queryKey: ['researchInProgress', 'participants', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Participant[]>>(
        researchInProgress.getParticipantsWithStatus(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useOverviewMetrics = (researchId: string) => {
  return useQuery({
    queryKey: ['researchInProgress', 'metrics', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<any>>(
        researchInProgress.getOverviewMetrics(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useParticipantsByResearch = (researchId: string) => {
  return useQuery({
    queryKey: ['researchInProgress', 'participantsByResearch', researchId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Participant[]>>(
        researchInProgress.getParticipantsByResearch(researchId)
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

export const useParticipantDetails = (researchId: string, participantId: string) => {
  return useQuery({
    queryKey: ['researchInProgress', 'participantDetails', researchId, participantId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Participant>>(
        researchInProgress.getParticipantDetails(researchId, participantId)
      );
      return response.data;
    },
    enabled: !!researchId && !!participantId,
  });
};

export const useDeleteParticipantFromResearch = () => {
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
        researchInProgress.deleteParticipant(researchId, participantId)
      );
      return response.data;
    },
    onMutate: async ({ researchId, participantId }) => {
      await queryClient.cancelQueries({ queryKey: ['researchInProgress', 'participants', researchId] });
      await queryClient.cancelQueries({ queryKey: ['researchInProgress', 'participantsByResearch', researchId] });
      await queryClient.cancelQueries({ queryKey: ['researchInProgress', 'metrics', researchId] });
      
      const previousParticipants = queryClient.getQueryData(['researchInProgress', 'participants', researchId]);
      const previousParticipantsByResearch = queryClient.getQueryData(['researchInProgress', 'participantsByResearch', researchId]);
      const previousMetrics = queryClient.getQueryData(['researchInProgress', 'metrics', researchId]);
      
      // Eliminar participante optimistamente de todas las queries
      queryClient.setQueryData(['researchInProgress', 'participants', researchId], (old: any) => ({
        ...old,
        data: old?.data?.filter((participant: Participant) => participant.id !== participantId) || []
      }));
      
      queryClient.setQueryData(['researchInProgress', 'participantsByResearch', researchId], (old: any) => ({
        ...old,
        data: old?.data?.filter((participant: Participant) => participant.id !== participantId) || []
      }));
      
      // Actualizar métricas optimistamente
      queryClient.setQueryData(['researchInProgress', 'metrics', researchId], (old: any) => ({
        ...old,
        data: {
          ...old?.data,
          totalParticipants: Math.max(0, (old?.data?.totalParticipants || 0) - 1),
          activeParticipants: Math.max(0, (old?.data?.activeParticipants || 0) - 1)
        }
      }));
      
      return { previousParticipants, previousParticipantsByResearch, previousMetrics };
    },
    onError: (_err, { researchId: _researchId, participantId: _participantId }, context) => {
      if (context?.previousParticipants) {
        queryClient.setQueryData(['researchInProgress', 'participants', _researchId], context.previousParticipants);
      }
      if (context?.previousParticipantsByResearch) {
        queryClient.setQueryData(['researchInProgress', 'participantsByResearch', _researchId], context.previousParticipantsByResearch);
      }
      if (context?.previousMetrics) {
        queryClient.setQueryData(['researchInProgress', 'metrics', _researchId], context.previousMetrics);
      }
    },
  });
};
