import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:4700',
  'http://localhost:3000',
  'https://app.emotio-x.com',
  'https://dev.emotio-x.com'
];

/**
 * Extraer el origen de un evento API Gateway
 */
export function getOriginFromEvent(event: APIGatewayProxyEvent): string | undefined {
  return event.headers?.origin || event.headers?.Origin;
}

/**
 * Create a standardized API response
 */
export function createResponse(
  statusCode: number,
  body?: any,
  headers: Record<string, string> = {},
  origin?: string
): APIGatewayProxyResult {
  // Determinar el origen a usar
  let allowOrigin = '*';
  
  // Si estamos usando credenciales, no podemos usar el comodín *
  const credentials = String(headers['Access-Control-Allow-Credentials']).toLowerCase();
  if (credentials === 'true') {
    // Si se proporciona un origen y está en la lista de permitidos, usarlo
    if (origin && allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else {
      // Por defecto, usar el primer origen permitido
      allowOrigin = allowedOrigins[0];
    }
  }
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, Accept, Origin, Referer, User-Agent, Access-Control-Request-Method, Access-Control-Request-Headers',
      ...headers
    },
    body: body ? JSON.stringify(body) : ''
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(error: any, origin?: string): APIGatewayProxyResult {
  // Ampliar el logging para depuración
  console.error('Error completo:', error);
  console.error('Stack trace:', error.stack);
  
  // En entornos de desarrollo, devolver más información
  const isDev = process.env.STAGE === 'dev' || process.env.STAGE === 'local';
  
  if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message.includes('Unauthorized')) {
    return createResponse(401, {
      message: 'Unauthorized access',
      details: isDev ? error.message : undefined
    }, {}, origin);
  }

  if (error.message === 'Not Found' || error.message.includes('not found')) {
    return createResponse(404, {
      message: 'Resource not found',
      details: isDev ? error.message : undefined
    }, {}, origin);
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return createResponse(400, {
      message: 'Validation error',
      errors: error.details,
      details: isDev ? error.message : undefined
    }, {}, origin);
  }

  // Handle AWS DynamoDB errors
  if (error.code === 'ConditionalCheckFailedException') {
    return createResponse(409, {
      message: 'Resource already exists or condition check failed',
      details: isDev ? error.message : undefined
    }, {}, origin);
  }

  // Default to 500 internal server error
  return createResponse(500, {
    message: 'Internal server error',
    error: isDev ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n'),
      code: error.code
    } : undefined
  }, {}, origin);
} 