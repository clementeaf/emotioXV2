/**
 * Smart VOC Domain Hooks
 * TanStack Query hooks for smart VOC functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { smartVocApi } from './smart-voc.api';
import type {
  SmartVOCFormData,
  CreateSmartVOCRequest,
  UpdateSmartVOCRequest
} from './smart-voc.types';

/**
 * Query keys for smart VOC
 */
export const smartVocKeys = {
  all: ['smartVOC'] as const,
  byResearch: (researchId: string) => [...smartVocKeys.all, 'research', researchId] as const,
  validation: (researchId: string) => [...smartVocKeys.all, 'validation', researchId] as const,
};

/**
 * Hook to get smart VOC data by research ID
 */
export function useSmartVOCData(researchId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: smartVocKeys.byResearch(researchId || ''),
    queryFn: () => researchId ? smartVocApi.getByResearchId(researchId) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSmartVOCRequest) => smartVocApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartVocKeys.byResearch(researchId!) });
      toast.success('Smart VOC created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create smart VOC');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ researchId, data }: { researchId: string; data: UpdateSmartVOCRequest }) =>
      smartVocApi.update(researchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartVocKeys.byResearch(researchId!) });
      toast.success('Smart VOC updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update smart VOC');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (researchId: string) => smartVocApi.delete(researchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartVocKeys.byResearch(researchId!) });
      toast.success('Smart VOC deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete smart VOC');
    }
  });

  // Wrapper functions for easier use
  const createSmartVOC = async (data: SmartVOCFormData): Promise<SmartVOCFormData> => {
    if (!researchId) throw new Error('Research ID is required');

    const createData: CreateSmartVOCRequest = {
      ...data,
      researchId
    };

    return createMutation.mutateAsync(createData);
  };

  const updateSmartVOC = async (data: Partial<SmartVOCFormData>): Promise<void> => {
    if (!researchId) throw new Error('Research ID is required');

    const updateData: UpdateSmartVOCRequest = {
      questions: data.questions,
      randomizeQuestions: data.randomizeQuestions,
      smartVocRequired: data.smartVocRequired,
      metadata: data.metadata
    };

    await updateMutation.mutateAsync({ researchId, data: updateData });
  };

  const deleteSmartVOC = async (): Promise<void> => {
    if (!researchId) throw new Error('Research ID is required');
    return deleteMutation.mutateAsync(researchId);
  };

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
    createSmartVOC,
    updateSmartVOC,
    deleteSmartVOC,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for validating smart VOC configuration
 */
export function useSmartVOCValidation(researchId: string | null) {
  return useQuery({
    queryKey: smartVocKeys.validation(researchId || ''),
    queryFn: () => researchId ? smartVocApi.validate(researchId) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for creating smart VOC
 */
export function useCreateSmartVOC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSmartVOCRequest) => smartVocApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: smartVocKeys.byResearch(variables.researchId) });
      toast.success('Smart VOC created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create smart VOC');
    }
  });
}

/**
 * Hook for updating smart VOC
 */
export function useUpdateSmartVOC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ researchId, data }: { researchId: string; data: UpdateSmartVOCRequest }) =>
      smartVocApi.update(researchId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: smartVocKeys.byResearch(variables.researchId) });
      toast.success('Smart VOC updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update smart VOC');
    }
  });
}

/**
 * Hook for deleting smart VOC
 */
export function useDeleteSmartVOC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (researchId: string) => smartVocApi.delete(researchId),
    onSuccess: (_, researchId) => {
      queryClient.invalidateQueries({ queryKey: smartVocKeys.byResearch(researchId) });
      toast.success('Smart VOC deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete smart VOC');
    }
  });
}