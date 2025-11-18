/**
 * Implicit Association Domain Hooks
 * TanStack Query hooks for implicit association functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { implicitAssociationApi } from './implicit-association.api';
import type {
  ImplicitAssociationModel,
  ImplicitAssociationFormData,
  CreateImplicitAssociationRequest,
  UpdateImplicitAssociationRequest
} from './implicit-association.types';

/**
 * Query keys for implicit association
 */
export const implicitAssociationKeys = {
  all: ['implicitAssociation'] as const,
  byResearch: (researchId: string) => [...implicitAssociationKeys.all, 'research', researchId] as const,
  validation: (researchId: string) => [...implicitAssociationKeys.all, 'validation', researchId] as const,
};

/**
 * Hook to get implicit association data by research ID
 */
export function useImplicitAssociationData(researchId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: implicitAssociationKeys.byResearch(researchId || ''),
    queryFn: () => researchId ? implicitAssociationApi.getByResearchId(researchId) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateImplicitAssociationRequest) => implicitAssociationApi.create(data),
    onMutate: async (newImplicitAssociation) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: implicitAssociationKeys.byResearch(newImplicitAssociation.researchId) });

      // Snapshot previous value
      const previousImplicitAssociation = queryClient.getQueryData<ImplicitAssociationModel | null>(
        implicitAssociationKeys.byResearch(newImplicitAssociation.researchId)
      );

      // Optimistically update
      const optimisticImplicitAssociation: ImplicitAssociationModel = {
        id: `temp_${Date.now()}`,
        researchId: newImplicitAssociation.researchId,
        isRequired: newImplicitAssociation.isRequired,
        targets: newImplicitAssociation.targets || [],
        attributes: newImplicitAssociation.attributes || [],
        exerciseInstructions: newImplicitAssociation.exerciseInstructions || '',
        testInstructions: newImplicitAssociation.testInstructions || '',
        testConfiguration: newImplicitAssociation.testConfiguration || '',
        showResults: newImplicitAssociation.showResults || false,
        metadata: {
          ...newImplicitAssociation.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      queryClient.setQueryData(
        implicitAssociationKeys.byResearch(newImplicitAssociation.researchId),
        optimisticImplicitAssociation
      );

      return { previousImplicitAssociation };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: implicitAssociationKeys.byResearch(variables.researchId) });
      toast.success('Implicit Association creado exitosamente');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousImplicitAssociation !== undefined) {
        queryClient.setQueryData(
          implicitAssociationKeys.byResearch(variables.researchId),
          context.previousImplicitAssociation
        );
      }

      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al crear Implicit Association');
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: implicitAssociationKeys.byResearch(variables.researchId) });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ researchId, data }: { researchId: string; data: UpdateImplicitAssociationRequest }) =>
      implicitAssociationApi.update(researchId, data),
    onMutate: async ({ researchId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: implicitAssociationKeys.byResearch(researchId) });

      // Snapshot previous value
      const previousImplicitAssociation = queryClient.getQueryData<ImplicitAssociationModel | null>(
        implicitAssociationKeys.byResearch(researchId)
      );

      // Optimistically update
      if (previousImplicitAssociation) {
        const optimisticImplicitAssociation: ImplicitAssociationModel = {
          ...previousImplicitAssociation,
          ...data,
          metadata: {
            ...previousImplicitAssociation.metadata,
            ...data.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        queryClient.setQueryData(
          implicitAssociationKeys.byResearch(researchId),
          optimisticImplicitAssociation
        );
      }

      return { previousImplicitAssociation };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: implicitAssociationKeys.byResearch(variables.researchId) });
      toast.success('Implicit Association actualizado exitosamente');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousImplicitAssociation !== undefined) {
        queryClient.setQueryData(
          implicitAssociationKeys.byResearch(variables.researchId),
          context.previousImplicitAssociation
        );
      }

      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al actualizar Implicit Association');
    },
    onSettled: (_, __, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: implicitAssociationKeys.byResearch(variables.researchId) });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (researchId: string) => implicitAssociationApi.delete(researchId),
    onSuccess: (_, researchId) => {
      queryClient.invalidateQueries({ queryKey: implicitAssociationKeys.byResearch(researchId) });
      toast.success('Implicit Association eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al eliminar Implicit Association');
    }
  });

  // Wrapper functions for easier use
  const createImplicitAssociation = async (data: ImplicitAssociationFormData): Promise<ImplicitAssociationModel> => {
    if (!researchId) throw new Error('Research ID is required');

    const createData: CreateImplicitAssociationRequest = {
      researchId,
      isRequired: data.isRequired,
      targets: data.targets,
      attributes: data.attributes,
      exerciseInstructions: data.exerciseInstructions,
      testInstructions: data.testInstructions,
      testConfiguration: data.testConfiguration,
      showResults: data.showResults,
      metadata: data.metadata
    };

    return createMutation.mutateAsync(createData);
  };

  const updateImplicitAssociation = async (data: Partial<ImplicitAssociationFormData>): Promise<ImplicitAssociationModel> => {
    if (!researchId) throw new Error('Research ID is required');

    const updateData: UpdateImplicitAssociationRequest = {
      isRequired: data.isRequired,
      targets: data.targets,
      attributes: data.attributes,
      exerciseInstructions: data.exerciseInstructions,
      testInstructions: data.testInstructions,
      testConfiguration: data.testConfiguration,
      showResults: data.showResults,
      metadata: data.metadata
    };

    return updateMutation.mutateAsync({ researchId, data: updateData });
  };

  const deleteImplicitAssociation = async (): Promise<void> => {
    if (!researchId) throw new Error('Research ID is required');
    return deleteMutation.mutateAsync(researchId);
  };

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
    createImplicitAssociation,
    updateImplicitAssociation,
    deleteImplicitAssociation,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for validating implicit association configuration
 */
export function useImplicitAssociationValidation(researchId: string | null) {
  return useQuery({
    queryKey: implicitAssociationKeys.validation(researchId || ''),
    queryFn: () => researchId ? implicitAssociationApi.validate(researchId) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

