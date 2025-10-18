/**
 * API de Pantallas de Bienvenida
 * Objeto ordenado y estricto para endpoints de welcome-screen
 */

import { API_BASE_URL } from '../../config/base';

const welcomeScreen = {
  getByResearch: (researchId: string) => `${API_BASE_URL}/research/${researchId}/welcome-screen`,
  save: (researchId: string) => `${API_BASE_URL}/research/${researchId}/welcome-screen`,
  update: (researchId: string) => `${API_BASE_URL}/research/${researchId}/welcome-screen`,
  delete: (researchId: string) => `${API_BASE_URL}/research/${researchId}/welcome-screen`,
};

export default welcomeScreen;
