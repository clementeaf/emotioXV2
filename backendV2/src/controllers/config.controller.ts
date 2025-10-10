import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador para configuración dinámica de endpoints
 * Permite que frontend y public-tests obtengan configuración actual en runtime
 */
export const configHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { httpMethod } = event;
  
  try {
    switch (httpMethod) {
      case 'GET':
        structuredLog('info', 'ConfigHandler.GET', 'Obteniendo configuración dinámica');
        
        // Obtener configuración actual del entorno
        const config = getCurrentConfig();
        
        structuredLog('info', 'ConfigHandler.GET', 'Configuración obtenida exitosamente', {
          stage: config.stage,
          httpEndpoint: config.httpEndpoint
        });
        
        return createResponse(200, config, event);

      default:
        return errorResponse(`Método ${httpMethod} no soportado`, 405, event);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    structuredLog('error', 'ConfigHandler', 'Error al obtener configuración', { error: errorMessage });
    return errorResponse('Error interno del servidor', 500, event);
  }
};

/**
 * Obtiene la configuración actual del entorno
 */
function getCurrentConfig() {
  // Obtener variables de entorno
  const stage = process.env.STAGE || 'dev';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Construir endpoints basados en el entorno actual
  const httpEndpoint = `https://${process.env.API_GATEWAY_ID}.execute-api.${region}.amazonaws.com/${stage}`;
  const wsEndpoint = `wss://${process.env.WS_API_GATEWAY_ID}.execute-api.${region}.amazonaws.com/${stage}`;
  
  // URLs de desarrollo local
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const publicTestsUrl = process.env.PUBLIC_TESTS_URL || 'http://localhost:5173';
  
  return {
    // Endpoints principales
    httpEndpoint,
    wsEndpoint,
    stage,
    region,
    
    // URLs de desarrollo
    frontendUrl,
    publicTestsUrl,
    
    // Metadata
    generatedAt: new Date().toISOString(),
    version: process.env.BACKEND_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    // Información de sincronización
    syncMethod: 'dynamic-runtime',
    lastUpdated: new Date().toISOString()
  };
}
