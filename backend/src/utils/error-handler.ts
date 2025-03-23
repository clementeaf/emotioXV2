import { APIGatewayProxyResult } from 'aws-lambda';
import { ErrorCode } from '../types/common';

/**
 * Manejador de errores centralizado para respuestas de API
 * @param error Error a manejar
 * @returns Respuesta de API formateada
 */
export const errorHandler = (error: unknown): APIGatewayProxyResult => {
  console.error('Error:', error);
  
  // Convertir el error a un objeto con message si no lo es
  const err = error instanceof Error 
    ? error 
    : new Error(typeof error === 'string' ? error : 'Error desconocido');
  
  // Extraer código de error si existe
  const statusCode = (err as any)?.statusCode || 500;
  const errorCode = (err as any)?.errorCode || ErrorCode.INTERNAL_ERROR;
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify({
      success: false,
      error: {
        message: err.message,
        code: errorCode
      }
    })
  };
};

/**
 * Crear un error con código HTTP y código personalizado
 * @param message Mensaje de error
 * @param statusCode Código HTTP
 * @param errorCode Código de error personalizado
 * @returns Error configurado
 */
export const createError = (
  message: string, 
  statusCode: number = 500, 
  errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR
): Error => {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  return error;
}; 