import { HttpError } from '../errors';
import { ApiError } from './errors';
import { structuredLog } from './logging.util';

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
  error: any,
  context: string,
  serviceName: string,
  modelErrorMappings: ErrorMapping = {}
): ApiError | HttpError => {
  // Si ya es un ApiError, retornarlo (puede venir de validaciones previas o del propio modelo)
  if (error instanceof ApiError) {
    return error;
  }
  // [FIX] Si es un HttpError (incluye NotFoundError), retornarlo tal cual
  if (error instanceof Error && 'statusCode' in error && typeof (error as any).statusCode === 'number') {
    return error as HttpError;
  }

  const logContext = `${serviceName}.${context}`;

  if (error instanceof Error) {
    // Intentar mapear usando el mapa proporcionado
    for (const prefix in modelErrorMappings) {
      if (error.message.startsWith(prefix)) {
        const mapping = modelErrorMappings[prefix];
        structuredLog('warn', logContext, `Mapeando error específico del modelo: ${prefix}`, { originalError: error.message });
        // Usar la clase de error específica del mapeo
        return new mapping.errorClass(
          mapping.errorClass.prototype.message || error.message, // Usar mensaje default de la clase si existe
          mapping.apiErrorCode
        );
      }
    }

    // Si no hubo mapeo, error genérico de DB
    structuredLog('error', logContext, 'Error de base de datos no mapeado', { error: { name: error.name, message: error.message, stack: error.stack } });
    return new ApiError(
      `DATABASE_ERROR: ${error.message || 'Error inesperado en base de datos'}`,
      500
    );
  }

  // Fallback para errores que no son instancias de Error
  structuredLog('error', logContext, 'Error desconocido/no-Error capturado', { errorData: JSON.stringify(error) });
  return new ApiError('DATABASE_ERROR: Error inesperado en la capa de datos', 500);
};
