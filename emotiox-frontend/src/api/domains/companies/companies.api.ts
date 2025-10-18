/**
 * API de Empresas
 * Objeto ordenado y estricto para endpoints de companies
 */

import { API_BASE_URL } from "../../config/base";

const companies = {
  getAll: () => `${API_BASE_URL}/companies`,
  getById: (id: string) => `${API_BASE_URL}/companies/${id}`,
  create: () => `${API_BASE_URL}/companies`,
  update: (id: string) => `${API_BASE_URL}/companies/${id}`,
  delete: (id: string) => `${API_BASE_URL}/companies/${id}`,
};

export default companies;