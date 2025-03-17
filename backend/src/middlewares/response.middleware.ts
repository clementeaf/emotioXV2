import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Headers CORS para todas las respuestas
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

/**
 * Middleware para crear respuestas HTTP exitosas
 */
export const createResponse = (
  statusCode: number,
  data: any,
  message?: string
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: message || '',
      data
    })
  };
};

/**
 * Respuesta exitosa (200 OK)
 */
export const successResponse = (data: any, message?: string): APIGatewayProxyResult => {
  return createResponse(200, data, message);
};

/**
 * Respuesta de creación exitosa (201 Created)
 */
export const createdResponse = (data: any, message?: string): APIGatewayProxyResult => {
  return createResponse(201, data, message);
};

/**
 * Respuesta sin contenido (204 No Content)
 */
export const noContentResponse = (): APIGatewayProxyResult => {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: ''
  };
};

/**
 * Respuesta para arrays vacíos
 * Devuelve un array vacío en lugar de un error cuando no hay datos
 */
export const emptyArrayResponse = (message?: string): APIGatewayProxyResult => {
  return createResponse(200, [], message || 'No data found');
}; 