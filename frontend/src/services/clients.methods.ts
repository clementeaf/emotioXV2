/**
 * Client service methods for API operations
 */

import { createAlova } from '@/config/api-alova';
import type { Client, ClientResponse, ClientsListResponse } from '@/types/clients';

const alova = createAlova();

/**
 * Fetch all clients
 */
export const fetchClients = () => 
  alova.Get<ClientsListResponse>('/clients', {
    name: 'fetchClients'
  });

/**
 * Fetch client by ID
 */
export const fetchClientById = (id: string) =>
  alova.Get<ClientResponse>(`/clients/${id}`, {
    name: 'fetchClientById'
  });

/**
 * Create new client
 */
export const createClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) =>
  alova.Post<ClientResponse>('/clients', clientData, {
    name: 'createClient'
  });

/**
 * Update client
 */
export const updateClient = (id: string, clientData: Partial<Client>) =>
  alova.Put<ClientResponse>(`/clients/${id}`, clientData, {
    name: 'updateClient'
  });

/**
 * Delete client
 */
export const deleteClient = (id: string) =>
  alova.Delete(`/clients/${id}`, {
    name: 'deleteClient'
  });

/**
 * Get all research (for clients)
 */
export const getAllResearch = () =>
  alova.Get('/research', {
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