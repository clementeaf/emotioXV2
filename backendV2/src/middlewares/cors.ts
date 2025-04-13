import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const allowedOrigins = (process.env.ALLOWED_ORIGIN || '').split(',');

/**
 * Obtiene los headers CORS basados en el origen de la solicitud
 */
export function getCorsHeaders(event: APIGatewayProxyEvent) {
  const origin = event.headers.origin || event.headers.Origin;
  const headers: { [key: string]: string | boolean } = {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Allow-Origin',
    'Access-Control-Max-Age': '86400',
  };

  // Si el origen está en la lista de permitidos, lo incluimos en los headers
  if (origin && allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    // Si no hay origen o no está permitido, usamos el primer origen permitido
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
  }

  return headers;
}

/**
 * Middleware de CORS para AWS Lambda
 */
export async function corsMiddleware(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult | null> {
  // Si es una solicitud OPTIONS, respondemos inmediatamente
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: ''
    };
  }

  // Para otros métodos, continuamos con la ejecución
  return null;
} 