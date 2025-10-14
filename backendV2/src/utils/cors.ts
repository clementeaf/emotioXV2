import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Genera headers CORS para respuestas API
 * @param event Evento de API Gateway
 * @returns Headers CORS
 */
export function getCorsHeaders(event: APIGatewayProxyEvent): Record<string, string> {
  const origin = event.headers?.origin || event.headers?.Origin || '*';
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}
