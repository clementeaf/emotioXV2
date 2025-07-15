/**
 * 🔄 EXPORTACIÓN CENTRALIZADA DE ENDPOINTS - EmotioXV2
 *
 * Este archivo exporta toda la configuración de endpoints de manera centralizada
 * para que otros componentes puedan importar fácilmente la configuración.
 */

// Re-exportar configuración principal
export * from './api-config';

// Re-exportar configuración centralizada (si existe)
try {
  const centralizedConfig = require('./centralized-config');
  export const CENTRALIZED_API_CONFIG = centralizedConfig.CENTRALIZED_API_CONFIG;
  export const API_HTTP_ENDPOINT = centralizedConfig.API_HTTP_ENDPOINT;
  export const API_WEBSOCKET_ENDPOINT = centralizedConfig.API_WEBSOCKET_ENDPOINT;
  export const API_STAGE = centralizedConfig.API_STAGE;
  export const getApiUrl = centralizedConfig.getApiUrl;
  export const getWebsocketUrl = centralizedConfig.getWebsocketUrl;
  export const getPublicTestsUrl = centralizedConfig.getPublicTestsUrl;
  export const navigateToPublicTests = centralizedConfig.navigateToPublicTests;
} catch (error) {
  console.warn('Configuración centralizada no encontrada, usando configuración por defecto');
}

// Exportar estado de sincronización (si existe)
try {
  const syncStatus = require('./sync-status.json');
  export const SYNC_STATUS = syncStatus;
} catch (error) {
  console.warn('Estado de sincronización no encontrado');
  export const SYNC_STATUS = {
    lastSync: null,
    stage: 'dev',
    filesGenerated: [],
    backendVersion: 'unknown'
  };
}

// Función para verificar si los endpoints están sincronizados
export function isEndpointsSynced(): boolean {
  try {
    const fs = require('fs');
    const path = require('path');

    const requiredFiles = [
      'dynamic-endpoints.js',
      'centralized-config.ts',
      'sync-status.json'
    ];

    const configDir = path.join(__dirname);

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(configDir, file))) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Función para obtener información de sincronización
export function getSyncInfo() {
  return {
    synced: isEndpointsSynced(),
    status: SYNC_STATUS,
    configDir: __dirname
  };
}

// Exportar configuración por defecto
export default {
  API_CONFIG,
  CENTRALIZED_API_CONFIG,
  SYNC_STATUS,
  isEndpointsSynced,
  getSyncInfo
};
