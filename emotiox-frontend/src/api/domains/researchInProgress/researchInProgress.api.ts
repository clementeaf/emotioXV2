/**
 * API de Research In Progress
 * Objeto ordenado y estricto para endpoints de research-in-progress
 */

import { API_BASE_URL } from '../../config/base';

const researchInProgress = {
  getParticipantsWithStatus: (researchId: string) => `${API_BASE_URL}/research/${researchId}/participants/status`,
  getOverviewMetrics: (researchId: string) => `${API_BASE_URL}/research/${researchId}/metrics`,
  getParticipantsByResearch: (researchId: string) => `${API_BASE_URL}/research/${researchId}/participants`,
  getParticipantDetails: (researchId: string, participantId: string) => `${API_BASE_URL}/research/${researchId}/participants/${participantId}`,
  deleteParticipant: (researchId: string, participantId: string) => `${API_BASE_URL}/research/${researchId}/participants/${participantId}`,
  getResearchConfiguration: (researchId: string) => `${API_BASE_URL}/eye-tracking-recruit/research/${researchId}`,
};

export default researchInProgress;
