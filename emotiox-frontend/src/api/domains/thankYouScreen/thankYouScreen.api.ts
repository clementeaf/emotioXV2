/**
 * API de Pantallas de Agradecimiento
 * Objeto ordenado y estricto para endpoints de thank-you-screen
 */

import { API_BASE_URL } from '../../config/base';

const thankYouScreen = {
  getByResearch: (researchId: string) => `${API_BASE_URL}/research/${researchId}/thank-you-screen`,
  save: (researchId: string) => `${API_BASE_URL}/research/${researchId}/thank-you-screen`,
  delete: (researchId: string) => `${API_BASE_URL}/research/${researchId}/thank-you-screen`,
};

export default thankYouScreen;
