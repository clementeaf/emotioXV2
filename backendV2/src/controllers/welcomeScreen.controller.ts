import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';

// Controlador simplificado pero funcional
const welcomeScreenHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WelcomeScreen handler called', { path: event.path, method: event.httpMethod });

  const { httpMethod, pathParameters } = event;
  const researchId = pathParameters?.researchId;

  if (!researchId) {
    return errorResponse('Se requiere researchId', 400);
  }

  // Simular respuesta para GET
  if (httpMethod === 'GET') {
    return createResponse(404, {
      message: 'Welcome screen not found for this research.',
      researchId
    });
  }

  // Para otros métodos, devolver error de método no implementado
  return createResponse(405, {
    message: `Method ${httpMethod} not implemented for welcome-screen`,
    allowedMethods: ['GET']
  });
};

// Exportar con ambos nombres para compatibilidad
export const handler = welcomeScreenHandler;
export const mainHandler = welcomeScreenHandler;
