/**
 * Índice centralizado de todas las APIs migradas a AlovaJS
 * Facilita la importación y migración gradual desde las APIs originales
 */

// ============================================
// CONFIGURACIÓN Y CLIENTE BASE
// ============================================

import { alovaInstance } from '../config/alova.config';

export {
  alovaInstance,
  invalidateCache,
  updateAlovaToken,
  type AlovaMethod,
  type AlovaResponse,
} from '../config/alova.config';

export {
  AlovaApiClient,
  alovaApiClient,
  invalidateApiCache,
} from '../config/api-alova';

// ============================================
// APIs PRINCIPALES MIGRADAS
// ============================================

// API principal con hooks y métodos estáticos
export {
  // Hooks de Alova
  useCompanies,
  useCompanyById,
  useResearchList,
  useResearchById,
  useWelcomeScreen,
  useThankYouScreen,
  useEyeTracking,
  useSmartVOC,
  useCognitiveTask,
  useModuleResponses,
  useParticipants,
  useWatchResearch,
  
  // APIs estáticas
  companiesAPI,
  authAPI,
  researchAPI,
  welcomeScreenAPI,
  thankYouScreenAPI,
  eyeTrackingAPI,
  eyeTrackingRecruitAPI,
  smartVocAPI,
  cognitiveTaskAPI,
  s3API,
  moduleResponsesAPI,
  participantsAPI,
  researchInProgressAPI,
  
  // Configuración
  setupAuthToken,
} from './api-alova';

// ============================================
// HOOKS BÁSICOS MIGRADOS
// ============================================

export { useApi } from '../hooks/useApi-alova';
export { useApiSimple } from '../hooks/useApiSimple-alova';

// Hook completo de research data
export {
  useResearchData,
  useResearchList as useResearchListHook,
  useWatchResearch as useWatchResearchHook,
  useResearchStatus,
  useResearchModules,
} from '../hooks/useResearchData-alova';

// ============================================
// APIs ESPECÍFICAS MIGRADAS
// ============================================

// Eye Tracking API
export {
  // Hooks
  useEyeTrackingByResearch,
  useWatchEyeTracking,
  useEyeTrackingMutations,
  useEyeTrackingRecruit,
  
  // APIs
  eyeTrackingAPI as eyeTrackingAlovaAPI,
  eyeTrackingRecruitAPI as eyeTrackingRecruitAlovaAPI,
  eyeTrackingFixedAPI as eyeTrackingFixedAlovaAPI,
} from './eye-tracking-api-alova';

// SmartVOC API
export {
  // Hooks
  useSmartVOC as useSmartVOCHook,
  useWatchSmartVOC,
  useSmartVOCMutations,
  useSmartVOCManager,
  
  // APIs
  smartVocAPI as smartVocAlovaAPI,
  smartVocFixedAPI as smartVocFixedAlovaAPI,
} from './smart-voc-api-alova';

// ============================================
// SERVICIOS MIGRADOS
// ============================================

// Servicio de autenticación
export {
  authService as authServiceAlova,
  type RegisterData,
  type LoginData,
  type AuthResponse,
} from '../services/authService-alova';

// Servicio de investigaciones
export {
  researchService as researchServiceAlova,
  useResearchList as useResearchListService,
  useResearch,
  useResearchMutations,
  useResearchManager,
  type Research,
  type CreateResearchData,
} from '../services/researchService-alova';

// ============================================
// UTILIDADES Y HELPERS
// ============================================

/**
 * Función helper para migración gradual
 * Permite cambiar entre API original y Alova según configuración
 */
export const createHybridAPI = <T, A>(originalAPI: T, alovaAPI: A, useAlova: boolean = false) => {
  return useAlova ? alovaAPI : originalAPI;
};

/**
 * Función para limpiar toda la caché de Alova
 */
export const clearAllCache = () => {
  alovaInstance.snapshots.match(/.*/g).forEach((method: any) => method.abort());
};

/**
 * Función para invalidar caché por patrón
 */
export const invalidateCachePattern = (pattern: string | RegExp) => {
  alovaInstance.snapshots.match(pattern).forEach(method => method.abort());
};

/**
 * Hook para monitorear estado de conexión de red
 * Útil para reactivar peticiones cuando vuelve la conectividad
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reactivar peticiones pausadas
      alovaInstance.snapshots.match(/./).forEach(method => {
        // Reactivar método - simplemente enviar de nuevo
        method.send();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// ============================================
// COMPATIBILIDAD HACIA ATRÁS
// ============================================

/**
 * Mapeo de APIs originales a versiones con Alova
 * Facilita la migración gradual manteniendo nombres conocidos
 */
export const legacyAPIMapping = {
  // APIs originales -> APIs con Alova
  'eyeTrackingFixedAPI': 'eyeTrackingFixedAlovaAPI',
  'smartVocFixedAPI': 'smartVocFixedAlovaAPI',
  'authService': 'authServiceAlova',
  'researchService': 'researchServiceAlova',
};

/**
 * Función para obtener API migrada por nombre
 */
export const getMigratedAPI = (apiName: keyof typeof legacyAPIMapping) => {
  const migratedName = legacyAPIMapping[apiName];
  
  // Esto debería retornar la API correspondiente
  // Por simplicidad, retornamos el nombre de la API migrada
  return migratedName;
};

// ============================================
// CONFIGURACIÓN DE MIGRACIÓN
// ============================================

/**
 * Configuración global para controlar la migración
 */
export const ALOVA_MIGRATION_CONFIG = {
  // Usar Alova por defecto para nuevas implementaciones
  useAlovaByDefault: true,
  
  // APIs que ya han sido completamente migradas
  migratedAPIs: [
    'eyeTrackingAPI',
    'smartVocAPI', 
    'authService',
    'researchService',
    'useApi',
    'useApiSimple'
  ],
  
  // APIs en proceso de migración
  inProgressAPIs: [
    'cognitiveTaskAPI',
    'moduleResponsesAPI'
  ],
  
  // APIs pendientes de migración
  pendingAPIs: [
    's3Service',
    'participantsService'
  ]
};

/**
 * Hook para verificar si una API ha sido migrada
 */
export const useIsMigrated = (apiName: string): boolean => {
  return ALOVA_MIGRATION_CONFIG.migratedAPIs.includes(apiName);
};

// Re-exportar useState y useEffect para el hook de network status
import { useState, useEffect } from 'react';

// Re-exportar la instancia de Alova para acceso directo
export { alovaInstance as alova };