/**
 * API de Participants
 * Objeto ordenado y estricto para endpoints de participants
 */

import { API_BASE_URL } from '../../config/base';

const participants = {
  getAll: () => `${API_BASE_URL}/participants`,
  getById: (id: string) => `${API_BASE_URL}/participants/${id}`,
  login: () => `${API_BASE_URL}/participants/login`,
  create: () => `${API_BASE_URL}/participants`,
  delete: (id: string) => `${API_BASE_URL}/participants/${id}`,
  generate: () => `${API_BASE_URL}/participants/generate`,
  deleteParticipant: (researchId: string, participantId: string) => `${API_BASE_URL}/research/${researchId}/participants/${participantId}`,
};

export default participants;
