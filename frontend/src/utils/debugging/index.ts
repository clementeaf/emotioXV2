/**
 * Punto de entrada para las utilidades de depuración
 * 
 * Estas funciones se pueden ejecutar desde la consola del navegador para habilitar
 * la depuración en producción o desarrollo
 */

import { patchApiClientWithDebugger } from './apiIntegration';
import { clearApiDebugLogs, getApiDebugLogs } from './apiDebugger';

// Definir estas funciones en el ámbito global para acceder desde la consola
declare global {
  interface Window {
    enableApiDebugger: () => void;
    disableApiDebugger: () => void;
    getApiLogs: () => any[];
    clearApiLogs: () => void;
  }
}

// Variable para almacenar la función de restauración
let restoreOriginalMethods: (() => void) | null = null;

// Solo ejecutar este código en el cliente, no en el servidor
if (typeof window !== 'undefined') {
  // Habilitar el debugger
  window.enableApiDebugger = () => {
    if (!restoreOriginalMethods) {
      const { restoreOriginalMethods: restore } = patchApiClientWithDebugger();
      restoreOriginalMethods = restore;
    } else {
    }
  };

  // Deshabilitar el debugger
  window.disableApiDebugger = () => {
    if (restoreOriginalMethods) {
      restoreOriginalMethods();
      restoreOriginalMethods = null;
    } else {
    }
  };

  // Obtener logs de la API
  window.getApiLogs = getApiDebugLogs;

  // Limpiar logs de la API
  window.clearApiLogs = clearApiDebugLogs;

  // Mensaje informativo
}

export {
  patchApiClientWithDebugger,
  clearApiDebugLogs,
  getApiDebugLogs
}; 