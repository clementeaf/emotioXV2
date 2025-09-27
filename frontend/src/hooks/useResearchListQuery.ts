/**
 * Research List Hook - TanStack Query Implementation
 * Gestión completa de research con optimistic updates nativos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import researchService from '../services/research.service';
import type {
  Research,
  CreateResearchRequest,
  UpdateResearchRequest,
  ResearchAPIResponse
} from '../types/research';

// Query keys
export const researchKeys = {
  all: ['research'] as const,
  lists: () => [...researchKeys.all, 'list'] as const,
  list: (filters?: any) => [...researchKeys.lists(), filters] as const,
  details: () => [...researchKeys.all, 'detail'] as const,
  detail: (id: string) => [...researchKeys.details(), id] as const,
};

/**
 * Hook principal para gestionar la lista de investigaciones
 */
export function useResearchListQuery() {
  const queryClient = useQueryClient();

  // Query para obtener la lista de investigaciones
  const listQuery = useQuery({
    queryKey: researchKeys.lists(),
    queryFn: researchService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para crear investigación
  const createMutation = useMutation({
    mutationFn: researchService.create,
    onMutate: async (newResearch: CreateResearchRequest) => {
      console.log('🚀 OPTIMISTIC CREATE - Starting');

      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });

      // Snapshot del estado anterior
      const previousResearches = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());

      // Obtener los datos del request basado en el tipo
      const researchData = 'basic' in newResearch ? newResearch.basic : newResearch;

      // Actualización optimista
      const optimisticResearch: ResearchAPIResponse = {
        id: `temp_${Date.now()}`,
        name: researchData.name || '',
        companyId: researchData.companyId || '',
        type: researchData.type || 'behavioural',
        technique: researchData.technique || '',
        description: researchData.description || '',
        targetParticipants: 0,
        objectives: [],
        tags: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ResearchAPIResponse[]>(researchKeys.lists(), (old) => {
        const updated = [...(old || []), optimisticResearch];
        console.log('🚀 OPTIMISTIC CREATE - Updated list:', updated.length, 'items');
        return updated;
      });

      return { previousResearches };
    },
    onError: (err, newResearch, context) => {
      console.error('🚀 CREATE ERROR - Rolling back:', err);
      // Rollback en caso de error
      if (context?.previousResearches) {
        queryClient.setQueryData(researchKeys.lists(), context.previousResearches);
      }
      toast.error('Error al crear la investigación');
    },
    onSuccess: (data) => {
      console.log('🚀 CREATE SUCCESS:', data);
      toast.success('Investigación creada correctamente');
    },
    onSettled: () => {
      // Refetch para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });

  // Mutation para actualizar investigación
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResearchRequest }) =>
      researchService.update(id, data),
    onMutate: async ({ id, data }) => {
      console.log('🚀 OPTIMISTIC UPDATE - Starting for ID:', id);

      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });
      const previousResearches = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());

      queryClient.setQueryData<ResearchAPIResponse[]>(researchKeys.lists(), (old) => {
        if (!old) return old;
        const updated = old.map((research) =>
          research.id === id
            ? { ...research, ...data, updatedAt: new Date().toISOString() }
            : research
        );
        console.log('🚀 OPTIMISTIC UPDATE - Updated list');
        return updated;
      });

      return { previousResearches };
    },
    onError: (err, variables, context) => {
      console.error('🚀 UPDATE ERROR - Rolling back:', err);
      if (context?.previousResearches) {
        queryClient.setQueryData(researchKeys.lists(), context.previousResearches);
      }
      toast.error('Error al actualizar la investigación');
    },
    onSuccess: () => {
      console.log('🚀 UPDATE SUCCESS');
      toast.success('Investigación actualizada correctamente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });

  // Mutation para eliminar investigación
  const deleteMutation = useMutation({
    mutationFn: researchService.delete,
    onMutate: async (id: string) => {
      console.log('🔥 OPTIMISTIC DELETE - Starting for ID:', id);

      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });

      // Snapshot del estado anterior
      const previousResearches = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());
      console.log('🔥 CURRENT DATA BEFORE DELETE:', previousResearches?.length, 'items');

      // Actualización optimista - eliminar de la lista inmediatamente
      queryClient.setQueryData<ResearchAPIResponse[]>(researchKeys.lists(), (old) => {
        const filtered = (old || []).filter(research => research.id !== id);
        console.log('🔥 OPTIMISTIC DELETE - Filtered list:', filtered.length, 'items');
        return filtered;
      });

      return { previousResearches };
    },
    onError: (err, id, context) => {
      console.error('🔥 DELETE ERROR - Rolling back:', err);
      // Rollback en caso de error
      if (context?.previousResearches) {
        queryClient.setQueryData(researchKeys.lists(), context.previousResearches);
      }
      toast.error('Error al eliminar la investigación');
    },
    onSuccess: () => {
      console.log('🔥 DELETE SUCCESS - Optimistic update confirmed');
      toast.success('Investigación eliminada correctamente');
    },
    onSettled: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });

  return {
    // Data
    researches: listQuery.data || [],
    total: listQuery.data?.length || 0,

    // States
    isLoading: listQuery.isLoading,
    error: listQuery.error,

    // Actions
    refetch: listQuery.refetch,
    createResearch: createMutation.mutateAsync,
    updateResearch: (id: string, data: UpdateResearchRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteResearch: deleteMutation.mutateAsync,

    // Loading states para mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook para obtener una investigación por ID
 */
export function useResearchByIdQuery(researchId: string) {
  const query = useQuery({
    queryKey: researchKeys.detail(researchId),
    queryFn: () => researchService.getById(researchId),
    enabled: !!researchId && researchId.trim() !== '',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Export para compatibilidad con código existente
export const useResearchList = useResearchListQuery;
export const useResearchById = useResearchByIdQuery;