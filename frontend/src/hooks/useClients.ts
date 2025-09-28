/**
 * 🏢 CLIENTS HOOK - TanStack Query Implementation
 * Client management with strict TypeScript and SOLID principles
 */

import { useClients as useClientsFromDomain } from '@/api/domains/clients';
import type { Client, ClientStatus } from '@/types/clients';

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
 * Hook for managing clients
 * Now uses TanStack Query through the domain architecture
 */
export function useClients(params: UseClientsParams = {}) {
  const result = useClientsFromDomain({
    ...params,
    useResearchData: true // Use research data as the app currently does
  });

  return {
    clients: result.clients,
    isLoading: result.isLoading,
    error: result.error?.message || null,
    refetch: result.refetch,
  };
}

/**
 * Hook for getting a single client by ID
 */
export function useClientById(clientId: string) {
  // Since clients come from research data, we use the main clients hook
  // and filter to find the specific client
  const { clients, isLoading, error } = useClients();

  const client = clients.find((c: Client) => c.id === clientId) || null;

  return {
    client,
    isLoading,
    error,
    refetch: async () => {
      // Since clients are derived from research data,
      // we don't have a separate refetch for individual clients
    },
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

  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    totalResearch: clients.reduce((sum, client) => sum + client.researchCount, 0),
    avgCompletionRate: 0
  };

  if (stats.totalClients > 0) {
    stats.avgCompletionRate = Math.round((stats.activeClients / stats.totalClients) * 100);
  }

  return {
    stats,
    isLoading,
    error
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

/**
 * Re-export the mutation hooks from domain
 */
export {
  useCreateClient,
  useUpdateClient,
  useDeleteClient
} from '@/api/domains/clients';