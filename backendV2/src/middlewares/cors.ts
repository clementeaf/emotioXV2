import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Obtiene los headers CORS basados en el origen de la solicitud
 */
export function getCorsHeaders(event: APIGatewayProxyEvent) {
  const origin = event.headers.origin || event.headers.Origin;
  
  const headers: { [key: string]: string | boolean } = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin,Access-Control-Allow-Origin,Cache-Control,cache-control,Pragma,pragma,X-Amz-User-Agent',
    'Access-Control-Max-Age': '86400',
  };

  console.log(`CORS: Respondiendo con origin=${origin || '*'}`);
  
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