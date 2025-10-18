import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import participants from '../../api/domains/participants/participants.api';
import type { Participant, ApiResponse } from '../../types/api.types';

export const useParticipants = () => {
  return useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Participant[]>>(
        participants.getAll()
      );
      return response.data;
    },
  });
};

export const useParticipant = (id: string) => {
  return useQuery({
    queryKey: ['participants', id],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Participant>>(
        participants.getById(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useParticipantLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { participantId: string; researchId: string }) => {
      const response = await axiosInstance.post<ApiResponse<{ token: string; participant: Participant }>>(
        participants.login(),
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data.token) {
        localStorage.setItem('participantToken', data.data.token);
      }
    },
  });
};

export const useCreateParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Participant>) => {
      const response = await axiosInstance.post<ApiResponse<Participant>>(
        participants.create(),
        data
      );
      return response.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['participants'] });
      const previousParticipants = queryClient.getQueryData(['participants']);
      
      const optimisticParticipant: Participant = {
        id: `temp-${Date.now()}`,
        name: data.name || 'Nuevo Participante',
        email: data.email || '',
        status: data.status || 'active',
        researchId: data.researchId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: [...(old?.data || []), optimisticParticipant]
      }));
      
      return { previousParticipants };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: old?.data?.map((participant: Participant) => 
          participant.id.startsWith('temp-') ? data.data : participant
        ) || [data.data]
      }));
    },
    onError: (_err, _data, context) => {
      if (context?.previousParticipants) {
        queryClient.setQueryData(['participants'], context.previousParticipants);
      }
    },
  });
};

export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        participants.delete(id)
      );
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['participants'] });
      const previousParticipants = queryClient.getQueryData(['participants']);
      
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: old?.data?.filter((participant: Participant) => participant.id !== id) || []
      }));
      
      return { previousParticipants };
    },
    onError: (_err, _id, context) => {
      if (context?.previousParticipants) {
        queryClient.setQueryData(['participants'], context.previousParticipants);
      }
    },
  });
};

export const useGenerateParticipants = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { researchId: string; count: number }) => {
      const response = await axiosInstance.post<ApiResponse<Participant[]>>(
        participants.generate(),
        data
      );
      return response.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['participants'] });
      const previousParticipants = queryClient.getQueryData(['participants']);
      
      const optimisticParticipants: Participant[] = Array.from({ length: data.count }, (_, index) => ({
        id: `temp-${Date.now()}-${index}`,
        name: `Participante ${index + 1}`,
        email: `participante${index + 1}@temp.com`,
        status: 'active',
        researchId: data.researchId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: [...(old?.data || []), ...optimisticParticipants]
      }));
      
      return { previousParticipants };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: old?.data?.filter((participant: Participant) => !participant.id.startsWith('temp-')) || []
      }));
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: [...(old?.data || []), ...data.data]
      }));
    },
    onError: (_err, _data, context) => {
      if (context?.previousParticipants) {
        queryClient.setQueryData(['participants'], context.previousParticipants);
      }
    },
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
        participants.deleteParticipant(researchId, participantId)
      );
      return response.data;
    },
    onMutate: async ({ participantId }) => {
      await queryClient.cancelQueries({ queryKey: ['participants'] });
      const previousParticipants = queryClient.getQueryData(['participants']);
      
      queryClient.setQueryData(['participants'], (old: ApiResponse<Participant[]> | undefined) => ({
        ...old,
        data: old?.data?.filter((participant: Participant) => participant.id !== participantId) || []
      }));
      
      return { previousParticipants };
    },
    onError: (_err, { participantId: _participantId }, context) => {
      if (context?.previousParticipants) {
        queryClient.setQueryData(['participants'], context.previousParticipants);
      }
    },
  });
};
