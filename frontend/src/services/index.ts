/**
 * Índice centralizado para servicios
 * Facilita la importación de servicios en toda la aplicación
 */

// Servicios de API
export { apiClient } from '../api/config';

// Servicios de autenticación y usuario
// ❌ ELIMINADO: authService - usar AuthProvider y /api/domains/auth/
export { default as tokenService } from './tokenService';

// Servicios de investigación
export { companyService } from './companyService';

// Servicios de pantallas y formularios
// ❌ ELIMINADO: smartVOCFormService - usar /api/domains/smart-voc/
// ❌ ELIMINADO: thankYouScreenService - usar /api/domains/thank-you-screen/
// ❌ ELIMINADO: welcomeScreenService - usar hooks centralizados de useWelcomeScreenData

// Servicios de eye tracking
export { default as eyeTrackingService } from './eyeTrackingService';

// Servicio de tareas cognitivas
export { default as cognitiveTaskService } from './cognitiveTaskService';

// Servicio de almacenamiento S3
export { default as s3Service } from './s3Service';

// Exportar también los tipos
// ❌ ELIMINADO: authService types - usar tipos de /api/domains/auth/
export * from './cognitiveTaskService';
export * from './companyService';
export * from './eyeTrackingService';
// ❌ ELIMINADO: smartVOCFormService - usar /api/domains/smart-voc/
// ❌ ELIMINADO: thankYouScreenService - usar /api/domains/thank-you-screen/
// ❌ ELIMINADO: welcomeScreen.service - usar hooks centralizados
