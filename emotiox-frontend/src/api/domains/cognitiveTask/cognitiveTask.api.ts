/**
 * API de Tareas Cognitivas
 * Objeto ordenado y estricto para endpoints de cognitive-task
 */

import { API_BASE_URL } from '../../config/base';

const cognitiveTask = {
  getByResearch: (researchId: string) => `${API_BASE_URL}/research/${researchId}/cognitive-task`,
  create: (researchId: string) => `${API_BASE_URL}/research/${researchId}/cognitive-task`,
  update: (researchId: string) => `${API_BASE_URL}/research/${researchId}/cognitive-task`,
  delete: (researchId: string) => `${API_BASE_URL}/research/${researchId}/cognitive-task`,
  getUploadUrl: (researchId: string) => `${API_BASE_URL}/research/${researchId}/cognitive-task/upload-url`,
};

export default cognitiveTask;
