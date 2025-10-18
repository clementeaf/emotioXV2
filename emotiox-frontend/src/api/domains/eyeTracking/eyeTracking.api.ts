/**
 * API de Eye Tracking
 * Objeto ordenado y estricto para endpoints de eye-tracking
 */

import { API_BASE_URL } from '../../config/base';

const eyeTracking = {
  getByResearch: (researchId: string) => `${API_BASE_URL}/research/${researchId}/eye-tracking`,
  create: (researchId: string) => `${API_BASE_URL}/research/${researchId}/eye-tracking`,
  update: (researchId: string) => `${API_BASE_URL}/research/${researchId}/eye-tracking`,
  delete: (researchId: string) => `${API_BASE_URL}/research/${researchId}/eye-tracking`,
};

export default eyeTracking;
