/**
 * 🏢 CLIENTS HOOK - AlovaJS Clean Implementation
 * Client management with strict TypeScript and SOLID principles
 */

import { useRequest } from 'alova/client';
import { researchForClientsMethods } from '../services/clients.methods';
import { extractClientsFromResearch, filterClients, sortClients } from '../utils/client.processors';
import type {
  Client,
  ClientStatus,
  UseClientsReturn,
  UseClientByIdReturn
} from '../types/clients';

interface UseClientsParams {
  filters?: {
    status?: ClientStatus;
    company?: string;
    search?: string;
  };
  sortBy?: 'name' | 'company' | 'researchCount' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook for managing clients extracted from research data
 * Uses AlovaJS for caching and state management
 */
export function useClients(params: UseClientsParams = {}): UseClientsReturn {
  const {
    filters = {},
    sortBy = 'name',
    sortOrder = 'asc'
  } = params;

  // Get research data to extract clients
  const researchQuery = useRequest(
    () => researchForClientsMethods.getAllResearch(),
    {
      initialData: { data: [] },
      immediate: true,
    }
  );

  // Process clients from research data
  const processedClients = useProcessClients(
    researchQuery.data?.data || [],
    filters,
    sortBy,
    sortOrder
  );

  const handleRefetch = async (): Promise<void> => {
    try {
      await researchQuery.send();
    } catch (error) {
      console.error('Failed to refetch clients:', error);
      throw error;
    }
  };

  return {
    clients: processedClients,
    isLoading: researchQuery.loading,
    error: researchQuery.error || null,
    refetch: handleRefetch,
  };
}

/**
 * Hook for getting a single client by ID
 */
export function useClientById(clientId: string): UseClientByIdReturn {
  if (!clientId) {
    throw new Error('Client ID is required');
  }

  const { clients, isLoading, error } = useClients();

  const client = clients.find((c: Client) => c.id === clientId) || null;

  const handleRefetch = async (): Promise<void> => {
    // Since clients are derived from research data, 
    // we don't have a separate refetch for individual clients
  };

  return {
    client,
    isLoading,
    error,
    refetch: handleRefetch,
  };
}

/**
 * Hook for clients with active status only
 */
export function useActiveClients(params?: Omit<UseClientsParams, 'filters'>) {
  return useClients({
    ...params,
    filters: { status: 'active' }
  });
}

/**
 * Hook for client statistics
 */
export function useClientStats() {
  const { clients, isLoading, error } = useClients();

  const stats = useComputeClientStats(clients);

  return {
    stats,
    isLoading,
    error
  };
}

// Helper functions
function useProcessClients(
  researchData: Array<{
    id: string;
    enterprise?: string;
    basic?: { enterprise?: string };
    status: string;
    createdAt: string;
    updatedAt: string;
  }>,
  filters: UseClientsParams['filters'] = {},
  sortBy: NonNullable<UseClientsParams['sortBy']>,
  sortOrder: NonNullable<UseClientsParams['sortOrder']>
): Client[] {
  if (!Array.isArray(researchData)) {
    return [];
  }

  try {
    // Extract clients from research data
    let clients = extractClientsFromResearch(researchData);

    // Apply filters
    if (Object.keys(filters).length > 0) {
      clients = filterClients(clients, filters);
    }

    // Apply sorting
    clients = sortClients(clients, sortBy || 'name');

    return clients;
  } catch (error) {
    console.error('Error processing clients:', error);
    return [];
  }
}

function useComputeClientStats(clients: Client[]) {
  if (!Array.isArray(clients)) {
    return {
      totalClients: 0,
      activeClients: 0,
      totalResearch: 0,
      avgCompletionRate: 0
    };
  }

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalResearch = clients.reduce((sum, client) => sum + client.researchCount, 0);
  const avgCompletionRate = totalResearch > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  return {
    totalClients,
    activeClients,
    totalResearch,
    avgCompletionRate
  };
}

/**
 * Utility function to validate client data
 */
export function validateClientData(client: Partial<Client>): boolean {
  if (!client.name || client.name.trim().length === 0) {
    return false;
  }

  if (!client.company || client.company.trim().length === 0) {
    return false;
  }

  if (client.email && !isValidEmail(client.email)) {
    return false;
  }

  return true;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}