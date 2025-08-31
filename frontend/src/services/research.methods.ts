/**
 * Research service methods for API operations
 */

import { createAlova } from '@/config/api-alova';
import type { Research, CreateResearchRequest } from '@/types/research';

const alova = createAlova();

/**
 * Fetch all research
 */
export const fetchResearchList = () =>
  alova.Get<{ data: Research[] }>('/research', {
    name: 'fetchResearchList'
  });

/**
 * Fetch research by ID
 */
export const fetchResearchById = (id: string) =>
  alova.Get<{ data: Research }>(`/research/${id}`, {
    name: 'fetchResearchById'
  });

/**
 * Create new research
 */
export const createResearch = (researchData: CreateResearchRequest) =>
  alova.Post<{ data: Research }>('/research', researchData, {
    name: 'createResearch'
  });

/**
 * Update research
 */
export const updateResearch = (id: string, researchData: Partial<Research>) =>
  alova.Put<{ data: Research }>(`/research/${id}`, researchData, {
    name: 'updateResearch'
  });

/**
 * Delete research
 */
export const deleteResearch = (id: string) =>
  alova.Delete(`/research/${id}`, {
    name: 'deleteResearch'
  });

/**
 * Get research results
 */
export const getResearchResults = (id: string) =>
  alova.Get<{ data: any }>(`/research/${id}/results`, {
    name: 'getResearchResults'
  });