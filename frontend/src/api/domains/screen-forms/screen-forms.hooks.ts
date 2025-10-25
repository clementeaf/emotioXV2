/**
 * Screen Forms Domain Hooks
 * TanStack Query hooks for welcome screen and thank you screen functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { screenFormsApi } from './screen-forms.api';
import type {
  ThankYouScreenModel,
  ThankYouScreenFormData,
  CreateScreenFormRequest,
  UpdateScreenFormRequest
} from './screen-forms.types';

/**
 * Query keys for screen forms
 */
export const screenFormsKeys = {
  all: ['screenForms'] as const,
  byResearch: (researchId: string, screenType: 'welcome' | 'thankyou' = 'thankyou') => 
    [...screenFormsKeys.all, 'research', researchId, screenType] as const,
  validation: (researchId: string, screenType: 'welcome' | 'thankyou' = 'thankyou') => 
    [...screenFormsKeys.all, 'validation', researchId, screenType] as const,
};

/**
 * Hook to get screen form data by research ID and type
 */
export function useScreenFormsData(researchId: string | null, screenType: 'welcome' | 'thankyou' = 'thankyou') {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: screenFormsKeys.byResearch(researchId || '', screenType),
    queryFn: () => researchId ? screenFormsApi.getByResearchId(researchId, screenType) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateScreenFormRequest) => screenFormsApi.create(data, screenType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: screenFormsKeys.byResearch(researchId!, screenType) });
      toast.success(`${screenType === 'welcome' ? 'Welcome' : 'Thank you'} screen created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Failed to create ${screenType} screen`);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ researchId, data }: { researchId: string; data: UpdateScreenFormRequest }) =>
      screenFormsApi.update(researchId, data, screenType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: screenFormsKeys.byResearch(researchId!, screenType) });
      toast.success(`${screenType === 'welcome' ? 'Welcome' : 'Thank you'} screen updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Failed to update ${screenType} screen`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (researchId: string) => screenFormsApi.delete(researchId, screenType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: screenFormsKeys.byResearch(researchId!, screenType) });
      toast.success(`${screenType === 'welcome' ? 'Welcome' : 'Thank you'} screen deleted successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Failed to delete ${screenType} screen`);
    }
  });

  // Wrapper functions for easier use
  const createScreenForm = async (data: ThankYouScreenFormData): Promise<ThankYouScreenModel> => {
    if (!researchId) throw new Error('Research ID is required');

    const createData: CreateScreenFormRequest = {
      ...data,
      researchId
    };

    return createMutation.mutateAsync(createData);
  };

  const updateScreenForm = async (researchId: string, data: Partial<ThankYouScreenFormData>): Promise<ThankYouScreenModel> => {
    const updateData: UpdateScreenFormRequest = {
      isEnabled: data.isEnabled,
      title: data.title,
      message: data.message,
      redirectUrl: data.redirectUrl,
      metadata: data.metadata
    };

    return updateMutation.mutateAsync({ researchId, data: updateData });
  };

  const deleteScreenForm = async (): Promise<void> => {
    if (!researchId) throw new Error('Research ID is required');
    return deleteMutation.mutateAsync(researchId);
  };

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
    createScreenForm,
    updateScreenForm,
    deleteScreenForm,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for validating screen form configuration
 */
export function useScreenFormsValidation(researchId: string | null, screenType: 'welcome' | 'thankyou' = 'thankyou') {
  return useQuery({
    queryKey: screenFormsKeys.validation(researchId || '', screenType),
    queryFn: () => researchId ? screenFormsApi.validate(researchId, screenType) : Promise.resolve(null),
    enabled: !!researchId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for creating screen form
 */
export function useCreateScreenForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, screenType }: { data: CreateScreenFormRequest; screenType: 'welcome' | 'thankyou' }) => 
      screenFormsApi.create(data, screenType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: screenFormsKeys.byResearch(variables.data.researchId, variables.screenType) });
      toast.success(`${variables.screenType === 'welcome' ? 'Welcome' : 'Thank you'} screen created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create screen form');
    }
  });
}

/**
 * Hook for updating screen form
 */
export function useUpdateScreenForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ researchId, data, screenType }: { researchId: string; data: UpdateScreenFormRequest; screenType: 'welcome' | 'thankyou' }) =>
      screenFormsApi.update(researchId, data, screenType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: screenFormsKeys.byResearch(variables.researchId, variables.screenType) });
      toast.success(`${variables.screenType === 'welcome' ? 'Welcome' : 'Thank you'} screen updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update screen form');
    }
  });
}

/**
 * Hook for deleting screen form
 */
export function useDeleteScreenForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ researchId, screenType }: { researchId: string; screenType: 'welcome' | 'thankyou' }) => 
      screenFormsApi.delete(researchId, screenType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: screenFormsKeys.byResearch(variables.researchId, variables.screenType) });
      toast.success(`${variables.screenType === 'welcome' ? 'Welcome' : 'Thank you'} screen deleted successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete screen form');
    }
  });
}
