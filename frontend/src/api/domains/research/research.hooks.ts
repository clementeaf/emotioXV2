/**
 * Research Domain Hooks - React Query implementation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { researchApi } from './research.api';
import type {
  CreateResearchRequest,
  UpdateResearchRequest,
  ResearchListParams,
  ResearchAPIResponse,
  ApiError
} from './research.types';

// Query keys
export const researchKeys = {
  all: ['research'] as const,
  lists: () => [...researchKeys.all, 'list'] as const,
  list: (params?: ResearchListParams) => [...researchKeys.lists(), params] as const,
  details: () => [...researchKeys.all, 'detail'] as const,
  detail: (id: string) => [...researchKeys.details(), id] as const,
  user: () => [...researchKeys.all, 'user'] as const,
};

/**
 * Hook for getting all research
 */
export function useResearchList(params?: ResearchListParams) {
  return useQuery({
    queryKey: researchKeys.list(params),
    queryFn: () => researchApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for getting research by ID
 */
export function useResearchById(id: string) {
  return useQuery({
    queryKey: researchKeys.detail(id),
    queryFn: () => researchApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for getting user research
 */
export function useUserResearch() {
  return useQuery({
    queryKey: researchKeys.user(),
    queryFn: () => researchApi.getUserResearch(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating research
 */
export function useCreateResearch() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateResearchRequest) => researchApi.create(data),
    onMutate: async (newResearch) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });

      // Snapshot previous value
      const previousResearch = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());

      // Optimistically update
      if (previousResearch) {
        const optimisticResearch: ResearchAPIResponse = {
          id: `temp-${Date.now()}`,
          name: newResearch.basic?.name || '',
          companyId: newResearch.basic?.companyId || '',
          type: newResearch.basic?.type || '',
          technique: newResearch.basic?.technique || '',
          description: newResearch.basic?.description || '',
          targetParticipants: newResearch.basic?.targetParticipants || 0,
          objectives: newResearch.basic?.objectives || [],
          tags: newResearch.basic?.tags || [],
          status: newResearch.status || 'draft',
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<ResearchAPIResponse[]>(
          researchKeys.lists(),
          [...previousResearch, optimisticResearch]
        );
      }

      return { previousResearch };
    },
    onSuccess: (data) => {
      // Invalidate and refetch research queries
      queryClient.invalidateQueries({ queryKey: researchKeys.all });

      // Show success message
      toast.success('Investigación creada exitosamente');

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: ApiError, newResearch, context) => {
      // Rollback on error
      if (context?.previousResearch) {
        queryClient.setQueryData(researchKeys.lists(), context.previousResearch);
      }

      const message = error.response?.data?.message || 'Error al crear investigación';
      toast.error(message);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });
}

/**
 * Hook for updating research
 */
export function useUpdateResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResearchRequest }) =>
      researchApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: researchKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });

      // Snapshot previous values
      const previousResearch = queryClient.getQueryData<ResearchAPIResponse>(researchKeys.detail(id));
      const previousList = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());

      // Optimistically update detail
      if (previousResearch) {
        const optimisticResearch: ResearchAPIResponse = {
          ...previousResearch,
          // Merge updates (using any for type safety during optimistic update)
          ...(data as any),
          name: (data as any).name || previousResearch.name,
          description: (data as any).description || previousResearch.description,
          status: (data as any).status || previousResearch.status,
        };

        queryClient.setQueryData(researchKeys.detail(id), optimisticResearch);

        // Optimistically update in lists too
        if (previousList) {
          queryClient.setQueryData<ResearchAPIResponse[]>(
            researchKeys.lists(),
            previousList.map(research =>
              research.id === id ? optimisticResearch : research
            )
          );
        }
      }

      return { previousResearch, previousList };
    },
    onSuccess: (data, variables) => {
      // Update specific research in cache with real data
      queryClient.setQueryData(researchKeys.detail(variables.id), data);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });

      toast.success('Investigación actualizada exitosamente');
    },
    onError: (error: ApiError, variables, context) => {
      // Rollback on error
      if (context?.previousResearch) {
        queryClient.setQueryData(researchKeys.detail(variables.id), context.previousResearch);
      }
      if (context?.previousList) {
        queryClient.setQueryData(researchKeys.lists(), context.previousList);
      }

      const message = error.response?.data?.message || 'Error al actualizar investigación';
      toast.error(message);
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: researchKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });
}

/**
 * Hook for deleting research
 */
export function useDeleteResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => researchApi.delete(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });

      // Snapshot previous value
      const previousResearch = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());

      // Optimistically update
      if (previousResearch) {
        queryClient.setQueryData<ResearchAPIResponse[]>(
          researchKeys.lists(),
          previousResearch.filter(research => research.id !== deletedId)
        );
      }

      return { previousResearch };
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: researchKeys.all });

      toast.success('Investigación eliminada exitosamente');
    },
    onError: (error: ApiError, deletedId, context) => {
      // Rollback on error
      if (context?.previousResearch) {
        queryClient.setQueryData(researchKeys.lists(), context.previousResearch);
      }

      const message = error.response?.data?.message || 'Error al eliminar investigación';
      toast.error(message);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });
}

/**
 * Hook for updating research status
 */
export function useUpdateResearchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      researchApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: researchKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: researchKeys.lists() });

      // Snapshot previous values
      const previousResearch = queryClient.getQueryData<ResearchAPIResponse>(researchKeys.detail(id));
      const previousList = queryClient.getQueryData<ResearchAPIResponse[]>(researchKeys.lists());

      // Optimistically update status
      if (previousResearch) {
        const optimisticResearch: ResearchAPIResponse = {
          ...previousResearch,
          status,
        };

        queryClient.setQueryData(researchKeys.detail(id), optimisticResearch);

        // Optimistically update in lists too
        if (previousList) {
          queryClient.setQueryData<ResearchAPIResponse[]>(
            researchKeys.lists(),
            previousList.map(research =>
              research.id === id ? optimisticResearch : research
            )
          );
        }
      }

      return { previousResearch, previousList };
    },
    onSuccess: (data, variables) => {
      // Update specific research in cache with real data
      queryClient.setQueryData(researchKeys.detail(variables.id), data);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });

      toast.success('Estado actualizado exitosamente');
    },
    onError: (error: ApiError, variables, context) => {
      // Rollback on error
      if (context?.previousResearch) {
        queryClient.setQueryData(researchKeys.detail(variables.id), context.previousResearch);
      }
      if (context?.previousList) {
        queryClient.setQueryData(researchKeys.lists(), context.previousList);
      }

      const message = error.response?.data?.message || 'Error al actualizar estado';
      toast.error(message);
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: researchKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: researchKeys.lists() });
    },
  });
}