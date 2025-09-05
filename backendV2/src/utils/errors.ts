/**
 * Clase para manejar errores personalizados de la API
 */
export class ApiError extends Error {
  statusCode: number;
  
  /**
   * Constructor para errores personalizados
   * @param message Mensaje de error
   * @param statusCode Código de estado HTTP
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Interfaz para errores de aplicación con tipos específicos
 */
interface ApplicationError extends Error {
  statusCode?: number;
  name: string;
  message: string;
}

/**
 * Función para manejar errores en handlers Lambda
 * @param error Error capturado
 * @returns Respuesta formateada para Lambda
 */
export const handleError = (error: ApplicationError | Error) => {
  console.error('Error:', error);
  
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({
        message: error.message
      })
    };
  }
  
  // Error no controlado
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: 'Error interno del servidor'
    })
  };
}; 