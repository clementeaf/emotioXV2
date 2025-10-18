/**
 * API de Admin
 * Objeto ordenado y estricto para endpoints de admin
 */

import { API_BASE_URL } from '../../config/base';

const admin = {
  users: () => `${API_BASE_URL}/admin/users`,
  user: (id: string) => `${API_BASE_URL}/admin/users/${id}`,
  stats: () => `${API_BASE_URL}/admin/users/stats`,
};

export default admin;
