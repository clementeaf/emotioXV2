/**
 * Configuración de AlovaJS para Public-Tests - TEMPORALMENTE DESHABILITADA
 * Sistema paralelo al actual TanStack Query - NO REEMPLAZA aún
 * 
 * NOTA: Deshabilitado temporalmente debido a problemas de configuración de tipos
 */

// Placeholder para evitar errores de importación
export const alovaInstance = {
  Get: () => {
    throw new Error('AlovaJS temporalmente deshabilitado');
  },
  Post: () => {
    throw new Error('AlovaJS temporalmente deshabilitado');
  },
  Put: () => {
    throw new Error('AlovaJS temporalmente deshabilitado');
  },
  Delete: () => {
    throw new Error('AlovaJS temporalmente deshabilitado');
  }
};

// Debug info para desarrollo
if (import.meta.env.DEV) {
  console.log('[AlovaJS Config] AlovaJS temporalmente deshabilitado para resolver problemas de tipos');
}