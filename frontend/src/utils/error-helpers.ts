/**
 * Utilidades para manejo de errores
 */

/**
 * Construir mensaje de error genérico
 */
export const buildErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

/**
 * Crear objeto de error para modales
 */
export const createModalError = (
  title: string, 
  message: string, 
  type: 'error' | 'warning' | 'info' = 'error'
) => ({
  title,
  message,
  type
});
