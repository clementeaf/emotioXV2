/**
 * API de Autenticación
 * Objeto ordenado y estricto para endpoints de auth
 */

import { API_BASE_URL } from '../../config/base';

const auth = {
  login: () => `${API_BASE_URL}/auth/login`,
  register: () => `${API_BASE_URL}/auth/register`,
  logout: () => `${API_BASE_URL}/auth/logout`,
  refreshToken: () => `${API_BASE_URL}/auth/refreshToken`,
  getProfile: () => `${API_BASE_URL}/auth/profile`,
};

export default auth;
