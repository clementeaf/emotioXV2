import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayAuthorizerResult } from 'aws-lambda';
import { verify } from 'jsonwebtoken';
import { connectionModel } from '../models/connection.model';
import { authService } from '../services/auth.service';
import { errorHandler } from '../middlewares/error.middleware';
import { UnauthorizedError } from '../middlewares/error.middleware';

/**
 * Controlador para WebSocket
 */
export class WebSocketController {
  /**
   * Maneja la conexión de un cliente WebSocket
   */
  async connect(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener token de los parámetros de consulta
      const token = event.queryStringParameters?.token;
      if (!token) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Token no proporcionado' })
        };
      }

      // Verificar token
      try {
        const decoded = authService.verifyToken(token);
        const userId = decoded.id;

        // Obtener ID de conexión
        const connectionId = event.requestContext.connectionId;
        if (!connectionId) {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'ID de conexión no disponible' })
          };
        }

        // Guardar conexión en la base de datos
        await connectionModel.create(connectionId, userId);

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Conectado' })
        };
      } catch (error) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Token inválido' })
        };
      }
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Maneja la desconexión de un cliente WebSocket
   */
  async disconnect(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID de conexión
      const connectionId = event.requestContext.connectionId;
      if (!connectionId) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'ID de conexión no disponible' })
        };
      }

      // Eliminar conexión de la base de datos
      await connectionModel.delete(connectionId);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Desconectado' })
      };
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Maneja los mensajes recibidos por WebSocket
   */
  async default(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID de conexión
      const connectionId = event.requestContext.connectionId;
      if (!connectionId) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'ID de conexión no disponible' })
        };
      }

      // Obtener conexión de la base de datos
      const connection = await connectionModel.findByConnectionId(connectionId);
      if (!connection) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Conexión no autorizada' })
        };
      }

      // Parsear el cuerpo del mensaje
      let message;
      try {
        message = JSON.parse(event.body || '{}');
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Formato de mensaje inválido' })
        };
      }

      // Verificar que el mensaje tiene una acción
      if (!message.action) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Acción no especificada' })
        };
      }

      // Procesar el mensaje según la acción
      switch (message.action) {
        case 'ping':
          // Responder con un pong
          await connectionModel.sendMessage(connectionId, {
            action: 'pong',
            data: { timestamp: Date.now() }
          });
          break;
        
        // Aquí se pueden agregar más acciones
        
        default:
          // Acción desconocida
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Acción desconocida' })
          };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Mensaje recibido' })
      };
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Autoriza una conexión WebSocket
   */
  async authorize(event: any): Promise<APIGatewayAuthorizerResult> {
    try {
      // Obtener token de los parámetros de consulta
      const token = event.queryStringParameters?.token;
      if (!token) {
        throw new UnauthorizedError('Token no proporcionado');
      }

      // Verificar token
      try {
        const decoded = authService.verifyToken(token);
        
        // Generar política de autorización
        return {
          principalId: decoded.id,
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: event.methodArn
              }
            ]
          },
          context: {
            userId: decoded.id
          }
        };
      } catch (error) {
        throw new UnauthorizedError('Token inválido');
      }
    } catch (error) {
      // En caso de error, denegar acceso
      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: event.methodArn
            }
          ]
        }
      };
    }
  }
}

// Instancia del controlador para las funciones Lambda
const websocketController = new WebSocketController();

// Exportar funciones para serverless
export const connect = (event: APIGatewayProxyEvent) => websocketController.connect(event);
export const disconnect = (event: APIGatewayProxyEvent) => websocketController.disconnect(event);
export const default_ = (event: APIGatewayProxyEvent) => websocketController.default(event);
export const authorize = (event: any) => websocketController.authorize(event); 