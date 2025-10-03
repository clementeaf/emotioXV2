import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { type Logger as PinoLogger } from 'pino';
import { APIGatewayEventWebsocketRequestContext } from './types/websocket';
import { getHandler } from './dispatcher';
// Podrías importar HttpError si quieres usarlo en el catch de WebSocket
import { HttpError } from './errors'; 

// Manejo de solicitudes WebSocket
export async function handleWebsocketRequest(
  // Asegúrate que el tipo combinado aquí sea correcto para tu uso
  event: APIGatewayProxyEvent & { requestContext: APIGatewayEventWebsocketRequestContext },
  context: Context,
  requestLogger: PinoLogger
): Promise<APIGatewayProxyResult> {
  const routeKey = event.requestContext.routeKey;
  requestLogger.info(`WebSocket route: ${routeKey}`);

  // Asumiendo que getHandler('websocket') devuelve el handler correcto
  const websocketHandler = await getHandler('websocket'); 
  if (!websocketHandler) {
    requestLogger.error('Controlador WebSocket no encontrado');
    // Devolver un error consistente
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error: WebSocket handler unavailable' }),
    };
  }

  try {
    // Llama al handler específico para la ruta WebSocket
    // Este handler debería manejar $connect, $disconnect, $default, etc.
    return await websocketHandler(event, context, requestLogger) as APIGatewayProxyResult;
  } catch (error: unknown) {
    requestLogger.error({ err: error, routeKey }, `Error en WebSocket handler`);
    
    // Opcional: Usar HttpError aquí si el websocketHandler lanza errores personalizados
    let statusCode = 500;
    let message = 'Error processing WebSocket request';
    if (error instanceof HttpError) {
      statusCode = error.statusCode; // Podría ser útil para lógica interna, aunque WS no usa códigos HTTP directos para mensajes
      message = error.message;
    }
    
    // Para WebSocket, la respuesta de error es usualmente solo para la conexión inicial
    // o si necesitas devolver algo a API Gateway. Los errores durante mensajes
    // a menudo se manejan cerrando la conexión o enviando un mensaje de error al cliente.
    return {
      statusCode: statusCode, // Usualmente 500 para fallos generales aquí
      body: JSON.stringify({ message: message }), 
    };
  }
} 