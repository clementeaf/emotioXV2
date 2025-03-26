import { apiClient } from './api-client';
import { authService } from '../services';

/**
 * Inicializa la configuración del cliente API
 * - Configura el token de autenticación si existe en localStorage
 * - Configura interceptores para manejar errores comunes
 */
export function setupApiClient(): void {
  // Inicializar el token de autenticación si existe
  authService.initializeAuth();

  // Aquí se pueden agregar más configuraciones como:
  // - Handlers globales para errores de red
  // - Interceptores para actualizar automáticamente el token
  // - Logging de peticiones en modo desarrollo
  // - etc.

  console.log('✅ Cliente API inicializado correctamente');
}

export default setupApiClient; 