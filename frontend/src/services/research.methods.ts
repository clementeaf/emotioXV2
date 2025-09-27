/**
 * Research service methods for API operations
 * Migrated to use new architecture (TanStack Query + Axios)
 */

import { researchApi } from '@/api/domains/research/research.api';
import type { Research, CreateResearchRequest, UpdateResearchRequest } from '@/types/research';

/**
 * Fetch all research
 * @deprecated Use useResearchList hook instead
 */
export const fetchResearchList = () => researchApi.getAll();

/**
 * Fetch research by ID
 * @deprecated Use useResearchById hook instead
 */
export const fetchResearchById = (id: string) => researchApi.getById(id);

/**
 * Create new research
 * @deprecated Use useCreateResearch hook instead
 */
export const createResearch = (data: CreateResearchRequest) => researchApi.create(data);

/**
 * Update research
 * @deprecated Use useUpdateResearch hook instead
 */
export const updateResearch = (id: string, data: UpdateResearchRequest) => researchApi.update(id, data);

/**
 * Delete research
 * @deprecated Use useDeleteResearch hook instead
 */
export const deleteResearch = (id: string) => researchApi.delete(id);

/**
 * Update research status
 * @deprecated Use useUpdateResearchStatus hook instead
 */
export const updateResearchStatus = (id: string, status: string) => researchApi.updateStatus(id, status);

// Legacy compatibility exports
export {
  fetchResearchList as getAllResearch,
  fetchResearchById as getResearchById,
  createResearch as postResearch,
  updateResearch as putResearch,
  deleteResearch as removeResearch
};