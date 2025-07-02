import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const allowedOrigins = [
  'http://localhost:3000', // Frontend local (Next.js default)
  'http://localhost:4700', // Frontend local (Vite default for public-tests)
  'http://localhost:5173', // Otro puerto común de Vite
  'https://d2s9nr0bm47yl1.cloudfront.net'
];

/**
 * Obtiene los headers CORS basados en el origen de la solicitud
 */
export function getCorsHeaders(event: APIGatewayProxyEvent) {
  const origin = event.headers.origin || event.headers.Origin;
  let accessControlAllowOrigin = '';

  if (origin && allowedOrigins.includes(origin)) {
    accessControlAllowOrigin = origin;
  }

  const headers: { [key: string]: string | boolean } = {
    'Access-Control-Allow-Origin': accessControlAllowOrigin,
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin',
    'Access-Control-Max-Age': '86400',
  };

  console.log(`CORS: Solicitud de origin=${origin}. Permitido: ${accessControlAllowOrigin ? 'Sí' : 'No'}`);

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
