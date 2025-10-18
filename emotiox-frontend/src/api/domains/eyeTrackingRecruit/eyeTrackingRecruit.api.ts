/**
 * API de Eye Tracking Recruit
 * Objeto ordenado y estricto para endpoints de eye-tracking-recruit
 */

import { API_BASE_URL } from '../../config/base';

const eyeTrackingRecruit = {
  getConfigByResearch: (researchId: string) => `${API_BASE_URL}/eye-tracking-recruit/research/${researchId}`,
  createConfig: (researchId: string) => `${API_BASE_URL}/eye-tracking-recruit/research/${researchId}`,
  updateConfig: (researchId: string) => `${API_BASE_URL}/eye-tracking-recruit/research/${researchId}`,
  delete: (researchId: string) => `${API_BASE_URL}/eye-tracking-recruit/research/${researchId}`,
  createParticipant: (configId: string) => `${API_BASE_URL}/eye-tracking-recruit/config/${configId}/participant`,
  updateParticipantStatus: (participantId: string) => `${API_BASE_URL}/eye-tracking-recruit/participant/${participantId}/status`,
  getParticipants: (configId: string) => `${API_BASE_URL}/eye-tracking-recruit/config/${configId}/participants`,
  getStats: (configId: string) => `${API_BASE_URL}/eye-tracking-recruit/config/${configId}/stats`,
  generateLink: (configId: string) => `${API_BASE_URL}/eye-tracking-recruit/config/${configId}/link`,
  getActiveLinks: (configId: string) => `${API_BASE_URL}/eye-tracking-recruit/config/${configId}/links`,
  deactivateLink: (token: string) => `${API_BASE_URL}/eye-tracking-recruit/link/${token}/deactivate`,
  validateLink: (token: string) => `${API_BASE_URL}/eye-tracking-recruit/link/${token}/validate`,
  getResearchSummary: (researchId: string) => `${API_BASE_URL}/eye-tracking-recruit/research/${researchId}/summary`,
  registerPublicParticipant: () => `${API_BASE_URL}/eye-tracking-recruit/public/participant/start`,
  updatePublicParticipantStatus: (participantId: string) => `${API_BASE_URL}/eye-tracking-recruit/public/participant/${participantId}/status`,
};

export default eyeTrackingRecruit;
