/**
 * Screener Domain Hooks
 * TanStack Query hooks for screener functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { screenerApi } from './screener.api';
import type {
  ScreenerModel,
  ScreenerFormData,
  CreateScreenerRequest,
  UpdateScreenerRequest
} from './screener.types';

/**
 * Query keys for screener
 */
export const screenerKeys = {
  all: ['screener'] as const,
  byResearch: (researchId: string) => [...screenerKeys.all, 'research', researchId] as const,
  validation: (researchId: string) => [...screenerKeys.all, 'validation', researchId] as const,
};

/**
 * Hook to get screener data by research ID
 */
export function useScreenerData(researchId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: screenerKeys.byResearch(researchId || ''),
    queryFn: () => researchId ? screenerApi.getByResearchId(researchId) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateScreenerRequest) => screenerApi.create(data),
    onMutate: async (newScreener) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: screenerKeys.byResearch(newScreener.researchId) });

      // Snapshot previous value
      const previousScreener = queryClient.getQueryData<ScreenerModel | null>(
        screenerKeys.byResearch(newScreener.researchId)
      );

      // Optimistically update
      const optimisticScreener: ScreenerModel = {
        id: `temp_${Date.now()}`,
        researchId: newScreener.researchId,
        isEnabled: newScreener.isEnabled,
        title: newScreener.title,
        description: newScreener.description,
        questions: newScreener.questions || [],
        metadata: {
          ...newScreener.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      queryClient.setQueryData(
        screenerKeys.byResearch(newScreener.researchId),
        optimisticScreener
      );

      return { previousScreener };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: screenerKeys.byResearch(variables.researchId) });
      toast.success('Screener creado exitosamente');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousScreener !== undefined) {
        queryClient.setQueryData(
          screenerKeys.byResearch(variables.researchId),
          context.previousScreener
        );
      }

      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al crear Screener');
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: screenerKeys.byResearch(variables.researchId) });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ researchId, data }: { researchId: string; data: UpdateScreenerRequest }) =>
      screenerApi.update(researchId, data),
    onMutate: async ({ researchId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: screenerKeys.byResearch(researchId) });

      // Snapshot previous value
      const previousScreener = queryClient.getQueryData<ScreenerModel | null>(
        screenerKeys.byResearch(researchId)
      );

      // Optimistically update
      if (previousScreener) {
        const optimisticScreener: ScreenerModel = {
          ...previousScreener,
          ...data,
          metadata: {
            ...previousScreener.metadata,
            ...data.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        queryClient.setQueryData(
          screenerKeys.byResearch(researchId),
          optimisticScreener
        );
      }

      return { previousScreener };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: screenerKeys.byResearch(variables.researchId) });
      toast.success('Screener actualizado exitosamente');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousScreener !== undefined) {
        queryClient.setQueryData(
          screenerKeys.byResearch(variables.researchId),
          context.previousScreener
        );
      }

      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al actualizar Screener');
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: screenerKeys.byResearch(variables.researchId) });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (researchId: string) => screenerApi.delete(researchId),
    onSuccess: (_, researchId) => {
      queryClient.invalidateQueries({ queryKey: screenerKeys.byResearch(researchId) });
      toast.success('Screener eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al eliminar Screener');
    }
  });

  // Wrapper functions for easier use
  const createScreener = async (data: ScreenerFormData): Promise<ScreenerModel> => {
    if (!researchId) throw new Error('Research ID is required');

    const createData: CreateScreenerRequest = {
      researchId,
      isEnabled: data.isEnabled,
      title: data.title,
      description: data.description,
      questions: data.questions,
      metadata: data.metadata
    };

    return createMutation.mutateAsync(createData);
  };

  const updateScreener = async (data: Partial<ScreenerFormData>): Promise<ScreenerModel> => {
    if (!researchId) throw new Error('Research ID is required');

    const updateData: UpdateScreenerRequest = {
      isEnabled: data.isEnabled,
      title: data.title,
      description: data.description,
      questions: data.questions,
      metadata: data.metadata
    };

    return updateMutation.mutateAsync({ researchId, data: updateData });
  };

  const deleteScreener = async (): Promise<void> => {
    if (!researchId) throw new Error('Research ID is required');
    return deleteMutation.mutateAsync(researchId);
  };

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
    createScreener,
    updateScreener,
    deleteScreener,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for validating screener configuration
 */
export function useScreenerValidation(researchId: string | null) {
  return useQuery({
    queryKey: screenerKeys.validation(researchId || ''),
    queryFn: () => researchId ? screenerApi.validate(researchId) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

