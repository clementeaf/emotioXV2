/**
 * Obtiene los headers de autenticación para las peticiones a la API
 */
export const getAuthHeaders = () => {
  // Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    // console.log('[getAuthHeaders] No estamos en un entorno de navegador, retornando headers vacíos');
    return {};
  }

  // Intentar obtener el token de diferentes fuentes
  let token = null;
  
  // 1. Primero verificar localStorage
  const localToken = localStorage.getItem('token');
  if (localToken) {
    token = localToken;
    // console.log('[getAuthHeaders] Token encontrado en localStorage');
  } 
  // 2. Si no, verificar sessionStorage
  else if (sessionStorage.getItem('token')) {
    token = sessionStorage.getItem('token');
    // console.log('[getAuthHeaders] Token encontrado en sessionStorage');
  }
  
  // Verificar si encontramos un token
  if (!token) {
    console.warn('[getAuthHeaders] No se encontró token de autenticación en ningún almacenamiento');
    return {};
  }
  
  // Log de depuración para verificar el token (solo mostramos los primeros caracteres por seguridad)
  // console.log('[getAuthHeaders] Token recuperado:', token.substring(0, 15) + '...');
  
  return token ? {
    'Authorization': `Bearer ${token}`,
  } : {};
}; 