import { HttpError } from '../errors';
import { ApiError } from './errors';
import { structuredLog } from './logging.util';
import { toApplicationError, type DatabaseError } from '../types/errors';

// Interfaz para mapear mensajes de error específicos del modelo a ApiErrors
interface ErrorMapping {
  [errorMessagePrefix: string]: {
    errorClass: new (message?: string, code?: string) => ApiError; // Tipo constructor para ApiError o subclases
    statusCode: number;
    apiErrorCode?: string; // Opcional: código de error específico de la API
  };
}

/**
 * Maneja errores originados en la capa del modelo (base de datos).
 * Intenta mapear errores específicos a ApiErrors conocidos.
 *
 * @param error El error capturado.
 * @param context Contexto de la operación (ej. 'obtener tarea cognitiva').
 * @param serviceName Nombre del servicio para logging (ej. 'CognitiveTaskService')
 * @param modelErrorMappings Mapa opcional para errores específicos del modelo.
 * @returns Una instancia de ApiError.
 */
export const handleDbError = (
  error: Error | DatabaseError,
  context: string,
  serviceName: string,
  modelErrorMappings: ErrorMapping = {}
): ApiError | HttpError => {
  // Si ya es un ApiError, retornarlo (puede venir de validaciones previas o del propio modelo)
  if (error instanceof ApiError) {
    return error;
  }
  // [FIX] Si es un HttpError (incluye NotFoundError), retornarlo tal cual
  if (error instanceof Error && 'statusCode' in error && typeof (error as HttpError).statusCode === 'number') {
    return error as HttpError;
  }

  const logContext = `${serviceName}.${context}`;
  const appError = toApplicationError(error);

  if (appError instanceof Error) {
    // Intentar mapear usando el mapa proporcionado
    for (const prefix in modelErrorMappings) {
      if (appError.message.startsWith(prefix)) {
        const mapping = modelErrorMappings[prefix];
        structuredLog('warn', logContext, `Mapeando error específico del modelo: ${prefix}`, { originalError: appError.message });
        // Usar la clase de error específica del mapeo
        return new mapping.errorClass(
          mapping.errorClass.prototype.message || appError.message, // Usar mensaje default de la clase si existe
          mapping.apiErrorCode
        );
      }
    }

    // Si no hubo mapeo, error genérico de DB
    structuredLog('error', logContext, 'Error de base de datos no mapeado', { error: { name: appError.name, message: appError.message, stack: appError.stack } });
    return new ApiError(
      `DATABASE_ERROR: ${appError.message || 'Error inesperado en base de datos'}`,
      500
    );
  }

  // Fallback (no debería llegar aquí con toApplicationError)
  structuredLog('error', logContext, 'Error inesperado en la capa de datos', { error: appError });
  return new ApiError('DATABASE_ERROR: Error inesperado en la capa de datos', 500);
};
