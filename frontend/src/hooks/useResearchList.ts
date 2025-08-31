/**
 * 📋 RESEARCH LIST HOOK - AlovaJS Clean Implementation
 * Handles research CRUD operations with strict typing
 * Follows SOLID principles and DRY methodology
 */

import { useRequest, useWatcher } from 'alova/client';
import { researchMethods } from '../services/research.methods';
import type {
  Research,
  ResearchRecord,
  ResearchListResponse,
  CreateResearchRequest,
  UpdateResearchRequest,
  PaginationParams,
  FilterParams,
  ApiResponse,
  ResearchStatus
} from '../types/research';

interface UseResearchListParams {
  pagination?: PaginationParams;
  filters?: FilterParams;
  autoRefresh?: boolean;
}

interface UseResearchListReturn {
  // Data
  researches: Research[];
  total: number;
  currentPage: number;
  totalPages: number;

  // States
  isLoading: boolean;
  error: Error | null;

  // Actions
  refetch: () => Promise<ApiResponse<ResearchListResponse>>;
  createResearch: (data: CreateResearchRequest) => Promise<Research>;
  updateResearch: (id: string, data: UpdateResearchRequest) => Promise<Research>;
  deleteResearch: (id: string) => Promise<void>;
}

interface UseResearchByIdReturn {
  data: Research | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<ApiResponse<Research>>;
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
    try {
      const response = await createMutation.send(data);
      
      if (!response.data) {
        throw new Error('Invalid create response');
      }

      // Refresh list after creation
      await listQuery.send();
      
      return response.data;
    } catch (error) {
      console.error('Failed to create research:', error);
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
      
      if (!response.data) {
        throw new Error('Invalid update response');
      }

      // Refresh list after update
      await listQuery.send();
      
      return response.data;
    } catch (error) {
      console.error('Failed to update research:', error);
      throw error;
    }
  };

  // Handle delete research
  const handleDeleteResearch = async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Research ID is required for deletion');
    }

    try {
      await deleteMutation.send(id);
      
      // Refresh list after deletion
      await listQuery.send();
    } catch (error) {
      console.error('Failed to delete research:', error);
      throw error;
    }
  };

  const listData = (listQuery.data as unknown as { data?: ResearchListResponse })?.data || createEmptyListResponse();

  return {
    // Data
    researches: (listData.data as unknown as Research[]) || [],
    total: listData.total || 0,
    currentPage: listData.page || 1,
    totalPages: Math.ceil((listData.total || 0) / (listData.limit || 10)),

    // States
    isLoading: listQuery.loading || createMutation.loading || updateMutation.loading || deleteMutation.loading,
    error: listQuery.error || createMutation.error || updateMutation.error || deleteMutation.error || null,

    // Actions
    refetch: async () => {
      const response = await listQuery.send();
      return {
        data: {
          researches: (response as unknown as { data?: ResearchRecord[] })?.data || [],
          data: (response as unknown as { data?: ResearchRecord[] })?.data || [],
          total: 0,
          page: 1,
          limit: 10
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
  if (!researchId) {
    throw new Error('Research ID is required');
  }

  const query = useRequest(
    () => researchMethods.getById(researchId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  return {
    data: query.data?.data || null,
    isLoading: query.loading,
    error: query.error || null,
    refetch: async () => {
      const response = await query.send();
      return { data: response.data, success: true };
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