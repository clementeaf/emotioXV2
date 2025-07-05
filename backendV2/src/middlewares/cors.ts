import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Función para obtener orígenes permitidos de forma dinámica
function getAllowedOrigins(): string[] {
  // Leer desde variable de entorno, soportando múltiples orígenes separados por comas
  const envOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map(o => o.trim()).filter(o => o);
  
  // Orígenes por defecto para desarrollo y producción
  const defaultOrigins = [
    'http://localhost:3000', // Frontend local (Next.js default)
    'http://localhost:4700', // Frontend local (Vite default for public-tests)
    'http://localhost:5173', // Otro puerto común de Vite
    'https://d2s9nr0bm47yl1.cloudfront.net', // Frontend principal
    'https://d2zt8ia21te5mv.cloudfront.net', // Public-tests CloudFront
    'http://54.90.132.233:3000' // Frontend EC2
  ];
  
  // Combinar orígenes de la variable de entorno con los por defecto
  const allOrigins = [...new Set([...envOrigins, ...defaultOrigins])];
  
  console.log('Orígenes CORS permitidos:', allOrigins);
  return allOrigins;
}

/**
 * Obtiene los headers CORS basados en el origen de la solicitud
 */
export function getCorsHeaders(event: APIGatewayProxyEvent) {
  const requestOrigin = event.headers.origin || event.headers.Origin || '';
  const allowedOrigins = getAllowedOrigins();
  let accessControlAllowOrigin = '';

  // Permitir cualquier dominio de public-tests (regex para flexibilidad)
  const isPublicTests = /public-tests/.test(requestOrigin);
  
  if (isPublicTests) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`CORS: Origen public-tests permitido automáticamente: ${requestOrigin}`);
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`CORS: Origen encontrado en lista permitida: ${requestOrigin}`);
  } else {
    // Fallback al primer origen de la lista si no hay match
    accessControlAllowOrigin = allowedOrigins[0] || 'http://localhost:4700';
    console.log(`CORS: Usando origen fallback: ${accessControlAllowOrigin} (solicitado: ${requestOrigin})`);
  }

  const headers: { [key: string]: string | boolean } = {
    'Access-Control-Allow-Origin': accessControlAllowOrigin,
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin,Cache-Control,Pragma',
    'Access-Control-Max-Age': '86400',
  };

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
