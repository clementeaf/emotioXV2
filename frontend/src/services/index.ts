/**
 * Índice centralizado para servicios
 * Facilita la importación de servicios en toda la aplicación
 */

// Servicios de API
export { apiClient } from '../config/api';

// Servicios de autenticación y usuario
export { default as authService } from './authService';
export { default as tokenService } from './tokenService';

// Servicios de investigación
export { default as researchService } from './researchService';

// Servicios de pantallas y formularios
export { default as smartVOCFormService } from './smartVOCFormService';
export { default as thankYouScreenService } from './thankYouScreenService';
export { welcomeScreenService } from './welcomeScreen.service';

// Servicios de eye tracking
export { default as eyeTrackingRecruitService } from './eyeTrackingRecruitService';
export { default as eyeTrackingService } from './eyeTrackingService';

// Servicio de tareas cognitivas
export { default as cognitiveTaskService } from './cognitiveTaskService';

// Servicio de almacenamiento S3
export { default as s3Service } from './s3Service';

// Exportar también los tipos
export * from './authService';
export * from './cognitiveTaskService';
export * from './eyeTrackingRecruitService';
export * from './eyeTrackingService';
export * from './researchService';
export * from './smartVOCFormService';
export * from './thankYouScreenService';
export * from './welcomeScreen.service';
