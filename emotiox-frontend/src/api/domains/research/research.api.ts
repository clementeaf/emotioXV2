/**
 * API de Investigaciones
 * Objeto ordenado y estricto para endpoints de research
 */

import { API_BASE_URL } from '../../config/base';

const research = {
  getAll: () => `${API_BASE_URL}/research`,
  getById: (id: string) => `${API_BASE_URL}/research/${id}`,
  create: () => `${API_BASE_URL}/research`,
  update: (id: string) => `${API_BASE_URL}/research/${id}`,
  delete: (id: string) => `${API_BASE_URL}/research/${id}`,
  updateStatus: (id: string) => `${API_BASE_URL}/research/${id}/status`,
  updateStage: (id: string) => `${API_BASE_URL}/research/${id}/stage`,
};

export default research;
