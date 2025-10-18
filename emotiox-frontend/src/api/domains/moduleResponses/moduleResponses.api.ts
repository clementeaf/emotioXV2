/**
 * API de Module Responses
 * Objeto ordenado y estricto para endpoints de module-responses
 */

import { API_BASE_URL } from '../../config/base';

const moduleResponses = {
  getResponsesByResearch: (researchId: string) => `${API_BASE_URL}/module-responses/research/${researchId}`,
  getResponsesGroupedByQuestion: (researchId: string) => `${API_BASE_URL}/module-responses/grouped-by-question/${researchId}`,
  getResponsesForParticipant: (researchId: string, participantId: string) => `${API_BASE_URL}/research/${researchId}/participant/${participantId}/responses`,
  saveResponse: () => `${API_BASE_URL}/module-responses`,
  updateResponse: (responseId: string) => `${API_BASE_URL}/module-responses/${responseId}`,
  deleteAllResponses: (researchId: string, participantId: string) => `${API_BASE_URL}/research/${researchId}/participant/${participantId}/responses`,
  getSmartVOCResults: (researchId: string) => `${API_BASE_URL}/module-responses/smartvoc/${researchId}`,
  getCPVResults: (researchId: string) => `${API_BASE_URL}/module-responses/cpv/${researchId}`,
  getTrustFlowResults: (researchId: string) => `${API_BASE_URL}/module-responses/trustflow/${researchId}`,
};

export default moduleResponses;
