/**
 * Client service methods for API operations
 */

import { alovaInstance } from '@/config/alova.config';
import type { Client, ClientResponse, ClientsListResponse } from '@/types/clients';

/**
 * Fetch all clients
 */
export const fetchClients = () => 
  alovaInstance.Get<ClientsListResponse>('/clients', {
    name: 'fetchClients'
  });

/**
 * Fetch client by ID
 */
export const fetchClientById = (id: string) =>
  alovaInstance.Get<ClientResponse>(`/clients/${id}`, {
    name: 'fetchClientById'
  });

/**
 * Create new client
 */
export const createClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) =>
  alovaInstance.Post<ClientResponse>('/clients', clientData, {
    name: 'createClient'
  });

/**
 * Update client
 */
export const updateClient = (id: string, clientData: Partial<Client>) =>
  alovaInstance.Put<ClientResponse>(`/clients/${id}`, clientData, {
    name: 'updateClient'
  });

/**
 * Delete client
 */
export const deleteClient = (id: string) =>
  alovaInstance.Delete(`/clients/${id}`);

/**
 * Get all research (for clients)
 */
export const getAllResearch = () =>
  alovaInstance.Get('/research', {
    name: 'getAllResearch'
  });

/**
 * Research methods for clients functionality
 */
export const researchForClientsMethods = {
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient,
  getAllResearch
};