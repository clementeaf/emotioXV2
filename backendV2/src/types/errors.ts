/**
 * Tipos de errores estructurados para toda la aplicación
 * Elimina la necesidad de usar 'unknown' o 'any' en catch blocks
 */

export interface ApplicationError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string | number | boolean>;
}

export interface DatabaseError extends ApplicationError {
  operation?: 'read' | 'write' | 'update' | 'delete';
  table?: string;
}

export interface ValidationError extends ApplicationError {
  field?: string;
  value?: string | number | boolean;
}

export interface AuthenticationError extends ApplicationError {
  userId?: string;
  reason?: string;
}

/**
 * Type guard para verificar si un error es un ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as ApplicationError).statusCode === 'number'
  );
}

/**
 * Type guard para verificar si un error es un Error estándar
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Convierte cualquier error capturado a ApplicationError
 */
export function toApplicationError(error: unknown): ApplicationError {
  if (isApplicationError(error)) {
    return error;
  }

  if (isError(error)) {
    const appError: ApplicationError = error;
    appError.statusCode = 500;
    return appError;
  }

  // Error desconocido: crear ApplicationError genérico
  const genericError = new Error('Error desconocido en la aplicación') as ApplicationError;
  genericError.statusCode = 500;
  genericError.details = {
    originalError: String(error)
  };
  return genericError;
}

/**
 * Tipo para errores de AWS Lambda
 */
export interface LambdaError extends ApplicationError {
  requestId?: string;
  context?: string;
}

/**
 * Tipo para errores de DynamoDB
 */
export interface DynamoDBError extends DatabaseError {
  errorCode?: string;
  errorType?: 'ConditionalCheckFailedException' | 'ResourceNotFoundException' | 'ValidationException' | 'ProvisionedThroughputExceededException';
}

/**
 * Tipo para errores de S3
 */
export interface S3Error extends ApplicationError {
  bucket?: string;
  key?: string;
  operation?: 'upload' | 'download' | 'delete' | 'list';
}

/**
 * Tipo para errores de WebSocket
 */
export interface WebSocketError extends ApplicationError {
  connectionId?: string;
  action?: string;
}
