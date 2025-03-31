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
      console.log('🔍 [API-DEBUG] Activando debugger de API...');
      const { restoreOriginalMethods: restore } = patchApiClientWithDebugger();
      restoreOriginalMethods = restore;
      console.log('🔍 [API-DEBUG] Debugger de API activado. Todas las llamadas serán registradas.');
    } else {
      console.log('🔍 [API-DEBUG] El debugger de API ya está activado.');
    }
  };

  // Deshabilitar el debugger
  window.disableApiDebugger = () => {
    if (restoreOriginalMethods) {
      console.log('🔍 [API-DEBUG] Desactivando debugger de API...');
      restoreOriginalMethods();
      restoreOriginalMethods = null;
      console.log('🔍 [API-DEBUG] Debugger de API desactivado.');
    } else {
      console.log('🔍 [API-DEBUG] El debugger de API no está activado.');
    }
  };

  // Obtener logs de la API
  window.getApiLogs = getApiDebugLogs;

  // Limpiar logs de la API
  window.clearApiLogs = clearApiDebugLogs;

  // Mensaje informativo
  console.log('🔍 [API-DEBUG] Utilidades de depuración cargadas. Ejecute window.enableApiDebugger() para activar.');
}

export {
  patchApiClientWithDebugger,
  clearApiDebugLogs,
  getApiDebugLogs
}; 