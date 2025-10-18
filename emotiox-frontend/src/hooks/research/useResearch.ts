import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import research from '../../api/domains/research/research.api';
import type { Research, ApiResponse } from '../../types/api.types';

export const useResearchList = () => {
  return useQuery({
    queryKey: ['research'],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Research[]>>(
        research.getAll()
      );
      return response.data;
    },
  });
};

export const useResearch = (id: string) => {
  return useQuery({
    queryKey: ['research', id],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Research>>(
        research.getById(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateResearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (researchData: { 
      name: string; 
      companyId: string; 
      technique: string; 
      type?: string;
      description?: string;
      status?: 'draft' | 'in-progress' | 'completed' | 'cancelled'; 
      stage?: string; 
    }) => {
      const response = await axiosInstance.post<ApiResponse<Research>>(
        research.create(),
        researchData
      );
      return response.data;
    },
    onMutate: async (researchData) => {
      console.log('🚀 OPTIMISTIC CREATE - Starting');
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['research'] });
      
      // Snapshot previous value
      const previousResearch = queryClient.getQueryData(['research']);
      
      // Create optimistic research
      const optimisticResearch: Research = {
        id: `temp-${Date.now()}`,
        name: researchData.name,
        companyId: researchData.companyId,
        technique: researchData.technique,
        status: (researchData.status as 'draft' | 'in-progress' | 'completed' | 'cancelled') || 'draft',
        stage: researchData.stage || 'basic-info',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Optimistically update cache
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => {
        const updated = [...(old?.data || []), optimisticResearch];
        console.log('🚀 OPTIMISTIC CREATE - Updated list:', updated.length, 'items');
        return {
          ...old,
          data: updated
        };
      });
      
      return { previousResearch };
    },
    onSuccess: (data) => {
      console.log('🚀 CREATE SUCCESS - Replacing optimistic with real data');
      
      // Replace optimistic research with real data
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id.startsWith('temp-') ? data.data : research
        ) || [data.data]
      }));
      
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['research'] });
    },
    onError: (error, _researchData, context) => {
      console.error('🚀 CREATE ERROR - Rolling back:', error);
      
      // Rollback on error
      if (context?.previousResearch) {
        queryClient.setQueryData(['research'], context.previousResearch);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['research'] });
    },
  });
};

export const useUpdateResearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Research> }) => {
      const response = await axiosInstance.put<ApiResponse<Research>>(
        research.update(id),
        data
      );
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['research'] });
      await queryClient.cancelQueries({ queryKey: ['research', id] });
      
      const previousResearch = queryClient.getQueryData(['research']);
      const previousResearchItem = queryClient.getQueryData(['research', id]);
      
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id === id ? { ...research, ...data, updatedAt: new Date().toISOString() } : research
        ) || []
      }));
      
      queryClient.setQueryData(['research', id], (old: ApiResponse<Research> | undefined) => ({
        ...old,
        data: { ...old?.data, ...data, updatedAt: new Date().toISOString() }
      }));
      
      return { previousResearch, previousResearchItem };
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id === id ? data.data : research
        ) || []
      }));
      queryClient.setQueryData(['research', id], data);
    },
    onError: (_err, { id: _id }, context) => {
      if (context?.previousResearch) {
        queryClient.setQueryData(['research'], context.previousResearch);
      }
      if (context?.previousResearchItem) {
        queryClient.setQueryData(['research', _id], context.previousResearchItem);
      }
    },
  });
};

export const useDeleteResearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        research.delete(id)
      );
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['research'] });
      const previousResearch = queryClient.getQueryData(['research']);
      
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.filter((research: Research) => research.id !== id) || []
      }));
      
      return { previousResearch };
    },
    onError: (_err, _id, context) => {
      if (context?.previousResearch) {
        queryClient.setQueryData(['research'], context.previousResearch);
      }
    },
  });
};

export const useUpdateResearchStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await axiosInstance.patch<ApiResponse<Research>>(
        research.updateStatus(id),
        { status }
      );
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['research'] });
      await queryClient.cancelQueries({ queryKey: ['research', id] });
      
      const previousResearch = queryClient.getQueryData(['research']);
      const previousResearchItem = queryClient.getQueryData(['research', id]);
      
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id === id ? { ...research, status, updatedAt: new Date().toISOString() } : research
        ) || []
      }));
      
      queryClient.setQueryData(['research', id], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: { ...old?.data, status, updatedAt: new Date().toISOString() }
      }));
      
      return { previousResearch, previousResearchItem };
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id === id ? data.data : research
        ) || []
      }));
      queryClient.setQueryData(['research', id], data);
    },
    onError: (_err, { id: _id }, context) => {
      if (context?.previousResearch) {
        queryClient.setQueryData(['research'], context.previousResearch);
      }
      if (context?.previousResearchItem) {
        queryClient.setQueryData(['research', _id], context.previousResearchItem);
      }
    },
  });
};

export const useUpdateResearchStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const response = await axiosInstance.patch<ApiResponse<Research>>(
        research.updateStage(id),
        { stage }
      );
      return response.data;
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['research'] });
      await queryClient.cancelQueries({ queryKey: ['research', id] });
      
      const previousResearch = queryClient.getQueryData(['research']);
      const previousResearchItem = queryClient.getQueryData(['research', id]);
      
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id === id ? { ...research, stage, updatedAt: new Date().toISOString() } : research
        ) || []
      }));
      
      queryClient.setQueryData(['research', id], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: { ...old?.data, stage, updatedAt: new Date().toISOString() }
      }));
      
      return { previousResearch, previousResearchItem };
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['research'], (old: ApiResponse<Research[]> | undefined) => ({
        ...old,
        data: old?.data?.map((research: Research) => 
          research.id === id ? data.data : research
        ) || []
      }));
      queryClient.setQueryData(['research', id], data);
    },
    onError: (_err, { id: _id }, context) => {
      if (context?.previousResearch) {
        queryClient.setQueryData(['research'], context.previousResearch);
      }
      if (context?.previousResearchItem) {
        queryClient.setQueryData(['research', _id], context.previousResearchItem);
      }
    },
  });
};
