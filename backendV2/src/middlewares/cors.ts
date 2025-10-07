import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Función para obtener orígenes permitidos de forma dinámica
function getAllowedOrigins(): string[] {
  // Leer desde variable de entorno, soportando múltiples orígenes separados por comas
  const envOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map(o => o.trim()).filter(o => o);

  // Orígenes por defecto para desarrollo y producción
  const defaultOrigins = [
    // 🖥️ Desarrollo local
    'http://localhost:3000',        // Frontend local (Next.js default)
    'http://localhost:4700',        // Public-tests local (Vite default)
    'http://localhost:5173',        // Vite puerto alternativo
    'http://localhost:5174',        // Vite puerto alternativo 2
    'http://localhost:8080',        // Otros puertos comunes
    'http://localhost:8081',        // Otros puertos comunes

    // ☁️ CloudFront (Producción)
    'https://d2s9nr0bm47yl1.cloudfront.net',  // Frontend CloudFront
    'https://d35071761848hm.cloudfront.net',  // Public-tests CloudFront

    // 🖥️ EC2 (Si aplicable)
    'http://54.90.132.233:3000',    // Frontend EC2

    // 🔗 Amplify (Si aplicable)
    'https://main.d1234567890.amplifyapp.com',  // Ejemplo Amplify

    // 🌍 Dominios personalizados (actualizar según sea necesario)
    'https://emotioxv2.com',        // Dominio de producción (si aplica)
    'https://app.emotioxv2.com',    // Subdominio de app (si aplica)
    'https://tests.emotioxv2.com',  // Subdominio de tests (si aplica)
  ];

  // 🔍 Auto-detectar endpoints dinámicos de la propia aplicación
  const currentApiEndpoint = process.env.API_ENDPOINT;
  if (currentApiEndpoint) {
    // Extraer dominio base del endpoint actual
    try {
      const apiUrl = new URL(currentApiEndpoint);
      const apiOrigin = `${apiUrl.protocol}//${apiUrl.hostname}`;
      defaultOrigins.push(apiOrigin);
    } catch (error) {
      console.warn('No se pudo parsear API_ENDPOINT para CORS:', currentApiEndpoint);
    }
  }

  // Combinar orígenes de la variable de entorno con los por defecto
  const allOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

  console.log('🔗 Orígenes CORS permitidos:', allOrigins.length, 'orígenes');
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Lista completa CORS:', allOrigins);
  }

  return allOrigins;
}

/**
 * Obtiene los headers CORS basados en el origen de la solicitud
 */
export function getCorsHeaders(event: APIGatewayProxyEvent) {
  const requestOrigin = event.headers.origin || event.headers.Origin || '';
  const allowedOrigins = getAllowedOrigins();
  let accessControlAllowOrigin = '';

  // 🔍 Permitir dominios de desarrollo local automáticamente
  const isLocalDomain = /^http:\/\/localhost:\d+$/.test(requestOrigin);
  const isLocalIP = /^http:\/\/(127\.0\.0\.1|0\.0\.0\.0):\d+$/.test(requestOrigin);
  const isPublicTests = /public-tests|tests\./.test(requestOrigin);
  const isCloudFront = /\.cloudfront\.net$/.test(requestOrigin);
  const isAmplify = /\.amplifyapp\.com$/.test(requestOrigin);
  const isExecuteApi = /\.execute-api\./.test(requestOrigin);

  // 🚀 Lógica de permisión de orígenes
  if (isLocalDomain || isLocalIP) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`🔗 CORS: Dominio local permitido automáticamente: ${requestOrigin}`);
  } else if (isPublicTests) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`📱 CORS: Origen public-tests permitido automáticamente: ${requestOrigin}`);
  } else if (isCloudFront) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`☁️ CORS: CloudFront permitido automáticamente: ${requestOrigin}`);
  } else if (isAmplify) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`🔗 CORS: Amplify permitido automáticamente: ${requestOrigin}`);
  } else if (isExecuteApi) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`🚀 CORS: API Gateway permitido automáticamente: ${requestOrigin}`);
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`✅ CORS: Origen encontrado en lista permitida: ${requestOrigin}`);
  } else {
    // Fallback más inteligente
    if (process.env.NODE_ENV === 'development' || process.env.STAGE === 'dev') {
      // En desarrollo, ser más permisivo
      accessControlAllowOrigin = requestOrigin || allowedOrigins[0] || 'http://localhost:4700';
      console.log(`🔧 CORS (DEV): Usando origen permisivo: ${accessControlAllowOrigin} (solicitado: ${requestOrigin})`);
    } else {
      // En producción, usar fallback seguro
      accessControlAllowOrigin = allowedOrigins.find(o => o.includes('cloudfront')) || allowedOrigins[0] || 'https://d35071761848hm.cloudfront.net';
      console.log(`🔒 CORS (PROD): Usando origen fallback seguro: ${accessControlAllowOrigin} (solicitado: ${requestOrigin})`);
    }
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
