/**
 * Obtiene los headers de autenticación para las peticiones a la API
 */
export const getAuthHeaders = () => {
  // Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    return {};
  }

  // Intentar obtener el token de diferentes fuentes
  let token = null;
  
  // 1. Primero verificar localStorage
  const localToken = localStorage.getItem('token');
  if (localToken) {
    token = localToken;
  } 
  // 2. Si no, verificar sessionStorage
  else if (sessionStorage.getItem('token')) {
    token = sessionStorage.getItem('token');
  }
  
  // Verificar si encontramos un token
  if (!token) {
    return {};
  }
  
  // Log de depuración para verificar el token (solo mostramos los primeros caracteres por seguridad)
  
  return token ? {
    'Authorization': `Bearer ${token}`,
  } : {};
}; 