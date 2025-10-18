/**
 * API de SmartVOC
 * Objeto ordenado y estricto para endpoints de smart-voc
 */

import { API_BASE_URL } from '../../config/base';

const smartVoc = {
  getByResearch: (researchId: string) => `${API_BASE_URL}/research/${researchId}/smart-voc`,
  create: (researchId: string) => `${API_BASE_URL}/research/${researchId}/smart-voc`,
  update: (researchId: string, formId: string) => `${API_BASE_URL}/research/${researchId}/smart-voc/${formId}`,
  delete: (researchId: string) => `${API_BASE_URL}/research/${researchId}/smart-voc`,
};

export default smartVoc;
