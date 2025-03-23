import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Controlador de prueba para verificar la configuración básica
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Test controller llamado con evento:', JSON.stringify(event));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify({
      message: 'Hello from test controller!',
      event: {
        path: event.path,
        method: event.httpMethod,
        queryParams: event.queryStringParameters
      }
    })
  };
}; 