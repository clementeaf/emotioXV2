/**
 * 📋 RESEARCH LIST HOOK - AlovaJS Clean Implementation
 * Handles research CRUD operations with strict typing
 * Follows SOLID principles and DRY methodology
 */

import { useRequest, useWatcher } from 'alova/client';
import { useEffect, useState, useRef } from 'react';
import { invalidateCache } from '../config/alova.config';
import { researchMethods } from '../services/research.methods';
import type {
  Research,
  ResearchListResponse,
  CreateResearchRequest,
  UpdateResearchRequest,
  PaginationParams,
  FilterParams,
  ResearchStatus,
  ResearchAPIResponse
} from '../types/research';

interface UseResearchListParams {
  pagination?: PaginationParams;
  filters?: FilterParams;
  autoRefresh?: boolean;
}

interface UseResearchListReturn {
  // Data
  researches: ResearchAPIResponse[];
  total: number;
  currentPage: number;
  totalPages: number;

  // States
  isLoading: boolean;
  error: Error | null;

  // Actions
  refetch: () => Promise<{ data: { researches: ResearchAPIResponse[]; data: ResearchAPIResponse[]; total: number; page: number; limit: number; }; success: boolean; }>;
  createResearch: (data: CreateResearchRequest) => Promise<Research>;
  updateResearch: (id: string, data: UpdateResearchRequest) => Promise<Research>;
  deleteResearch: (id: string) => Promise<void>;
}

interface UseResearchByIdReturn {
  data: Research | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<{ data: Research | null; success: boolean; }>;
}

/**
 * Hook for managing research list with pagination and filters
 */
export function useResearchList(params: UseResearchListParams = {}): UseResearchListReturn {
  const {
    pagination = { page: 1, limit: 10 },
    filters = {},
    autoRefresh = false
  } = params;

  // Main query for research list
  const listQuery = useRequest(
    () => researchMethods.getAll(),
    {
      initialData: createEmptyListResponse(),
      immediate: true,
    }
  );

  // Auto-refresh watcher (always call but conditionally enable)
  useWatcher(() => researchMethods.getAll(), [pagination, filters], {
    immediate: autoRefresh,
  });

  // Listen for research list updates from other components
  useEffect(() => {
    const handleResearchListUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { action, data, optimistic } = customEvent.detail;

      if (action === 'delete' && optimistic) {
        // Apply optimistic update to this instance
        const filteredData = data || [];
        listQuery.data = { data: filteredData } as any;
      } else if (action === 'rollback') {
        // Rollback to original data
        listQuery.data = { data: data } as any;
      } else {
        // Force refetch for other actions
        listQuery.send(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('research-list-updated', handleResearchListUpdate);
      return () => {
        window.removeEventListener('research-list-updated', handleResearchListUpdate);
      };
    }
  }, [listQuery]);

  // Create research mutation
  const createMutation = useRequest(
    (data: CreateResearchRequest) => researchMethods.create(data),
    {
      immediate: false,
    }
  );

  // Update research mutation
  const updateMutation = useRequest(
    ({ id, data }: { id: string; data: UpdateResearchRequest }) =>
      researchMethods.update(id, data),
    {
      immediate: false,
    }
  );

  // Delete research mutation
  const deleteMutation = useRequest(
    (id: string) => researchMethods.delete(id),
    {
      immediate: false,
    }
  );

  // Handle create research
  const handleCreateResearch = async (data: CreateResearchRequest): Promise<Research> => {
    console.log('🔥 CREATE RESEARCH CALLED FROM useResearchList:', data);
    try {
      console.log('🔥 SENDING CREATE MUTATION');
      const response = await createMutation.send(data);
      console.log('🔥 CREATE MUTATION SUCCESS:', response);

      if (!response) {
        throw new Error('Invalid create response');
      }

      // Refresh list after creation
      console.log('🔥 REFRESHING LIST AFTER CREATE');
      await listQuery.send();

      return response.data || response;
    } catch (error) {
      console.error('🔥 CREATE FAILED IN useResearchList:', error);
      throw error;
    }
  };

  // Handle update research
  const handleUpdateResearch = async (id: string, data: UpdateResearchRequest): Promise<Research> => {
    if (!id) {
      throw new Error('Research ID is required for update');
    }

    try {
      const response = await updateMutation.send({ id, data });
      
      if (!response) {
        throw new Error('Invalid update response');
      }

      // Refresh list after update
      await listQuery.send();
      
      return response.data || response;
    } catch (error) {
      console.error('Failed to update research:', error);
      throw error;
    }
  };

  // Handle delete research with optimistic updates
  const handleDeleteResearch = async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Research ID is required for deletion');
    }

    console.log('🔥 DELETE STARTED - ID:', id);

    // ✅ Store original data for rollback
    const currentData = (listQuery.data as unknown as { data?: ResearchAPIResponse[] })?.data || [];
    console.log('🔥 CURRENT DATA BEFORE DELETE:', currentData.length, 'items');

    const optimisticData = currentData.filter(research => research.id !== id);
    console.log('🔥 OPTIMISTIC DATA AFTER FILTER:', optimisticData.length, 'items');

    // ✅ Optimistic update - remove from UI immediately
    listQuery.data = { data: optimisticData } as any;
    console.log('🔥 LISTQUERY.DATA UPDATED TO:', (listQuery.data as any)?.data?.length, 'items');

    // ✅ Notify other instances immediately with optimistic update
    if (typeof window !== 'undefined') {
      console.log('🔥 DISPATCHING EVENT TO OTHER INSTANCES');
      window.dispatchEvent(new CustomEvent('research-list-updated', {
        detail: { action: 'delete', id, optimistic: true, data: optimisticData }
      }));
    }

    try {
      // ✅ Execute deletion in background
      console.log('🔥 SENDING DELETE REQUEST TO BACKEND');
      await deleteMutation.send(id);

      // ✅ Success - the optimistic update was correct, no need to change anything
      console.log('🔥 BACKEND DELETE SUCCESS - OPTIMISTIC UPDATE CONFIRMED');
    } catch (error) {
      console.error('🔥 BACKEND DELETE FAILED:', error);

      // ✅ Rollback optimistic update on error
      listQuery.data = { data: currentData } as any;
      console.log('🔥 ROLLBACK COMPLETED');

      // ✅ Notify other instances to rollback
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('research-list-updated', {
          detail: { action: 'rollback', id, data: currentData }
        }));
      }

      throw error;
    }
  };

  const apiResponse = listQuery.data as unknown as { data?: ResearchAPIResponse[] };
  const listData = apiResponse?.data || [];

  console.log('🔥 HOOK RETURN - LISTDATA LENGTH:', listData.length);

  return {
    // Data
    researches: listData,
    total: listData.length,
    currentPage: 1,
    totalPages: 1,

    // States
    isLoading: listQuery.loading || createMutation.loading || updateMutation.loading || deleteMutation.loading,
    error: listQuery.error || createMutation.error || updateMutation.error || deleteMutation.error || null,

    // Actions
    refetch: async () => {
      const response = await listQuery.send();
      const responseData = (response as unknown as { data?: ResearchAPIResponse[] })?.data || [];
      return {
        data: {
          researches: responseData,
          data: responseData,
          total: responseData.length,
          page: 1,
          limit: responseData.length
        },
        success: true
      };
    },
    createResearch: handleCreateResearch,
    updateResearch: handleUpdateResearch,
    deleteResearch: handleDeleteResearch,
  };
}

/**
 * Hook for getting a single research by ID
 */
export function useResearchById(researchId: string): UseResearchByIdReturn {
  // Si no hay researchId válido, no hacer la petición
  const shouldFetch = Boolean(researchId && researchId.trim());

  // No invalidar cache automáticamente - confiar en invalidaciones explícitas
  // React.useEffect(() => {
  //   if (shouldFetch) {
  //     invalidateCache(/\/research\/.*$/);
  //   }
  // }, [researchId, shouldFetch]);

  const query = useRequest(
    () => researchMethods.getById(researchId),
    {
      initialData: undefined,
      immediate: shouldFetch,
    }
  );

  // Transformar los datos - buscar el elemento correcto por ID
  const transformedData = shouldFetch && query.data?.data ? (() => {
    if (Array.isArray(query.data.data)) {
      // Si es un array, buscar el elemento con el ID correcto
      const foundResearch = query.data.data.find(item => item.id === researchId);
      return foundResearch || null;
    } else {
      // Si no es un array, devolver el dato directamente
      return query.data.data;
    }
  })() : null;


  return {
    data: shouldFetch ? transformedData : null,
    isLoading: shouldFetch ? query.loading : false,
    error: shouldFetch ? (query.error || null) : null,
    refetch: async () => {
      if (!shouldFetch) {
        return { data: null, success: false };
      }
      const response = await query.send();
      const transformedRefetchData = response?.data ? 
        (Array.isArray(response.data) ? response.data[0] : response.data) : null;
      return { data: transformedRefetchData, success: true };
    },
  };
}

/**
 * Hook for research list with specific status filter
 */
export function useResearchByStatus(status: ResearchStatus, pagination?: PaginationParams) {
  return useResearchList({
    pagination,
    filters: { status }
  });
}

/**
 * Hook for user's own research list
 */
export function useMyResearch(pagination?: PaginationParams) {
  // Note: ownerId will be automatically handled by backend using auth token
  return useResearchList({
    pagination,
    filters: {} // Backend filters by authenticated user
  });
}

// Helper functions
function createEmptyListResponse(): ResearchListResponse {
  return {
    researches: [],
    data: [],
    total: 0,
    page: 1,
    limit: 10
  };
}

/**
 * Utility function to validate research data
 */
export function validateResearchData(data: CreateResearchRequest | UpdateResearchRequest): boolean {
  if ('basic' in data && data.basic?.name && data.basic.name.trim().length === 0) {
    return false;
  }
  
  if ('description' in data && data.description !== undefined && typeof data.description !== 'string') {
    return false;
  }

  return true;
}