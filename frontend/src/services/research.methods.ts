/**
 * Research service methods for API operations
 */

import { alovaInstance } from '@/config/alova.config';
import type { Research, CreateResearchRequest } from '@/types/research';

/**
 * Fetch all research
 */
export const fetchResearchList = () =>
  alovaInstance.Get<{ data: Research[] }>('/research', {
    name: 'fetchResearchList'
  });

/**
 * Fetch research by ID
 */
export const fetchResearchById = (id: string) =>
  alovaInstance.Get<{ data: Research }>(`/research/${id}`, {
    name: 'fetchResearchById',
    cacheFor: 1000 * 60 * 2, // Cache por 2 minutos
  });

/**
 * Create new research
 */
export const createResearch = (researchData: CreateResearchRequest) =>
  alovaInstance.Post<{ data: Research }>('/research', researchData, {
    name: 'createResearch'
  });

/**
 * Update research
 */
export const updateResearch = (id: string, researchData: Partial<Research>) =>
  alovaInstance.Put<{ data: Research }>(`/research/${id}`, researchData, {
    name: 'updateResearch'
  });

/**
 * Delete research
 */
export const deleteResearch = (id: string) =>
  alovaInstance.Delete(`/research/${id}`, {
    name: 'deleteResearch'
  });

/**
 * Get research results
 */
export const getResearchResults = (id: string) =>
  alovaInstance.Get<{ data: any }>(`/research/${id}/results`, {
    name: 'getResearchResults'
  });

/**
 * Get by ID (alias for fetchResearchById)
 */
export const getById = fetchResearchById;

/**
 * Get SmartVOC form data
 */
export const getSmartVOCForm = (id: string) =>
  alovaInstance.Get<{ data: any }>(`/research/${id}/smartvoc-form`, {
    name: 'getSmartVOCForm'
  });

/**
 * Get grouped responses
 */
export const getGroupedResponses = (id: string) =>
  alovaInstance.Get<{ questions: any[] }>(`/research/${id}/grouped-responses`, {
    name: 'getGroupedResponses'
  });

/**
 * Research methods collection
 */
export const researchMethods = {
  fetchResearchList,
  fetchResearchById,
  createResearch,
  updateResearch,
  deleteResearch,
  getResearchResults,
  getById,
  getSmartVOCForm,
  getGroupedResponses,
  // Aliases
  getAll: fetchResearchList,
  create: createResearch,
  update: updateResearch,
  delete: deleteResearch
};

/**
 * Research data methods collection
 */
export const researchDataMethods = {
  fetchResearchList,
  getResearchResults,
  getSmartVOCForm,
  getGroupedResponses
};