/**
 * Índice centralizado para servicios
 * Facilita la importación de servicios en toda la aplicación
 */

// Servicios de API
export { default as apiClient } from '../config/api-client';

// Servicios de autenticación y usuario
export { default as authService } from './authService';
export { default as tokenService } from './tokenService';

// Servicios de investigación
export { default as researchService } from './researchService';

// Servicios de pantallas y formularios
export { default as welcomeScreenService } from './welcomeScreenService';
export { default as thankYouScreenService } from './thankYouScreenService';
export { default as smartVOCFormService } from './smartVOCFormService';

// Servicios de eye tracking
export { default as eyeTrackingService } from './eyeTrackingService';

// Servicio de almacenamiento S3
export { default as s3Service } from './s3Service';

// Exportar también los tipos
export * from './authService';
export * from './researchService';
export * from './smartVOCFormService';
export * from './eyeTrackingService';
export * from './welcomeScreenService';
export * from './thankYouScreenService'; 