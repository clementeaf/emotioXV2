/**
 * Archivo índice para exportar todos los servicios de la aplicación
 */

// Servicios de API
export { default as apiClient } from '../config/api-client';

// Servicios de autenticación y usuarios
export { default as authService } from './authService';

// Servicios de investigación
export { default as researchService } from './researchService';

// Servicios de formularios y pantallas
export { default as smartVOCFormService } from './smartVOCFormService';
export { default as eyeTrackingService } from './eyeTrackingService';
export { default as welcomeScreenService } from './welcomeScreenService';
export { default as thankYouScreenService } from './thankYouScreenService';

// Exportar también los tipos
export * from './authService';
export * from './researchService';
export * from './smartVOCFormService';
export * from './eyeTrackingService';
export * from './welcomeScreenService';
export * from './thankYouScreenService'; 