/**
 * Utilidades para verificar y restaurar la autenticación en los componentes 
 * que necesitan autenticación
 */

import toast from 'react-hot-toast';

/**
 * Verifica si hay un token en localStorage o sessionStorage
 * @returns true si hay token en alguno de los storages
 */
export const hasStoredToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token') || !!sessionStorage.getItem('token');
};

/**
 * Verifica si hay una discrepancia entre el estado de autenticación y los tokens almacenados
 * @param isAuthenticated el estado actual de autenticación
 * @returns true si hay una discrepancia (token en storage pero no autenticado)
 */
export const hasAuthSync = (isAuthenticated: boolean): boolean => {
  return hasStoredToken() === isAuthenticated;
};

/**
 * Crea un botón personalizado para añadir a un modal
 * @param text Texto del botón
 * @param onClick Función a ejecutar al hacer clic
 * @param className Clases adicionales para el botón
 * @returns Elemento HTML del botón
 */
export const createActionButton = (
  text: string,
  onClick: () => void,
  className: string = 'px-4 py-2 mt-4 bg-blue-600 text-white rounded hover:bg-blue-700'
): HTMLButtonElement => {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = className;
  button.onclick = onClick;
  return button;
};

/**
 * Muestra un mensaje de diagnóstico cuando hay problemas de autenticación
 */
export const showAuthDiagnostics = (): void => {
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  
  console.group('📊 Diagnóstico de Autenticación');
  // console.log('Token en localStorage:', localToken ? `${localToken.substring(0, 15)}...` : 'No existe');
  // console.log('Token en sessionStorage:', sessionToken ? `${sessionToken.substring(0, 15)}...` : 'No existe');
  
  try {
    const token = localToken || sessionToken;
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        // console.log('Payload del token:', payload);
        
        // Verificar expiración
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = now > expDate;
          
          // console.log('Expiración:', expDate.toLocaleString());
          // console.log('Expirado:', isExpired ? 'Sí ❌' : 'No ✅');
          
          if (isExpired) {
            // console.log('Expirado hace:', Math.round((now.getTime() - expDate.getTime()) / 1000 / 60), 'minutos');
          } else {
            // console.log('Expira en:', Math.round((expDate.getTime() - now.getTime()) / 1000 / 60), 'minutos');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al decodificar token:', error);
  }
  
  console.groupEnd();
  
  // Mostrar toast con mensaje
  toast('Verificando estado de autenticación...', {
    icon: '🔍',
    duration: 3000
  });
}; 