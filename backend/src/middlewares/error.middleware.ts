import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Tipos de errores personalizados
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Middleware para manejar errores y convertirlos en respuestas HTTP apropiadas
 */
export const errorHandler = (error: Error): APIGatewayProxyResult => {
  console.error('Error:', error);

  // Headers CORS para todas las respuestas
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json'
  };

  // Manejar diferentes tipos de errores
  if (error instanceof NotFoundError) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not Found',
        message: error.message
      })
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Unauthorized',
        message: error.message
      })
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({
        error: 'Forbidden',
        message: error.message
      })
    };
  }

  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Bad Request',
        message: error.message
      })
    };
  }

  // Error genérico para cualquier otro tipo de error
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    })
  };
}; 