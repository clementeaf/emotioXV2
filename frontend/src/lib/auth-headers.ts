/**
 * Obtiene los headers de autenticación para las peticiones a la API
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? {
    'Authorization': `Bearer ${token}`,
  } : {};
}; 