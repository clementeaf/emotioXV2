import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayAuthorizerResult } from 'aws-lambda';
import { verify, sign } from 'jsonwebtoken';
import { WebSocketEvent, WebSocketMessage } from '../../../shared/src/types/websocket.types';
import { ConnectionModel } from '../models/connection.model';
import { userModel } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'emotiox-dev-secret-key-2024';
const TOKEN_EXPIRATION = '24h';

const getWebSocketEndpoint = (event: APIGatewayProxyEvent): string => {
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  return `https://${domain}/${stage}`;
};

const generateToken = (user: { id: string; email: string; name: string }): string => {
  return sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
};

export const connect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.queryStringParameters?.token;
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Token no proporcionado' }),
      };
    }

    // Verificar el token
    const decoded = verify(token, JWT_SECRET) as { id: string };
    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Connection ID no disponible' }),
      };
    }

    const endpoint = getWebSocketEndpoint(event);
    const connectionModel = new ConnectionModel(endpoint);

    // Crear la conexión en DynamoDB
    await connectionModel.create(connectionId, decoded.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Conectado exitosamente' }),
    };
  } catch (error) {
    console.error('Error en la conexión WebSocket:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Token inválido' }),
    };
  }
};

export const disconnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const connectionId = event.requestContext.connectionId;
    if (connectionId) {
      const endpoint = getWebSocketEndpoint(event);
      const connectionModel = new ConnectionModel(endpoint);
      await connectionModel.delete(connectionId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Desconectado exitosamente' }),
    };
  } catch (error) {
    console.error('Error en la desconexión WebSocket:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al desconectar' }),
    };
  }
};

export const handleDefault = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const message: WebSocketMessage = {
      event: body.event || WebSocketEvent.UNKNOWN,
      data: body.data || {},
    };

    const connectionId = event.requestContext.connectionId;
    if (!connectionId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Connection ID no disponible' }),
      };
    }

    const endpoint = getWebSocketEndpoint(event);
    const connectionModel = new ConnectionModel(endpoint);

    // Aquí puedes manejar diferentes tipos de eventos
    switch (message.event) {
      case WebSocketEvent.PING:
        await connectionModel.sendMessage(connectionId, {
          event: WebSocketEvent.PONG,
          data: { timestamp: Date.now() },
        });
        return { statusCode: 200, body: 'OK' };

      case WebSocketEvent.TOKEN_REFRESH:
        try {
          // Verificar el token actual
          const { token } = message.data as { token: string };
          if (!token) {
            throw new Error('Token no proporcionado');
          }

          const decoded = verify(token, JWT_SECRET) as { id: string; email: string };
          
          // Obtener información actualizada del usuario
          const user = await userModel.findByEmail(decoded.email);
          if (!user) {
            throw new Error('Usuario no encontrado');
          }

          // Generar nuevo token
          const newToken = generateToken(user);

          // Enviar el nuevo token al cliente
          await connectionModel.sendMessage(connectionId, {
            event: WebSocketEvent.TOKEN_REFRESHED,
            data: { token: newToken },
          });

          return { statusCode: 200, body: 'OK' };
        } catch (error) {
          console.error('Error al renovar token:', error);
          await connectionModel.sendMessage(connectionId, {
            event: WebSocketEvent.ERROR,
            data: { message: 'Error al renovar token' },
          });
          return { statusCode: 401, body: 'Unauthorized' };
        }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Evento no soportado' }),
        };
    }
  } catch (error) {
    console.error('Error en el manejador por defecto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor' }),
    };
  }
};

export const authorize = async (event: APIGatewayProxyEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.queryStringParameters?.token;
    if (!token) {
      throw new Error('Token no proporcionado');
    }

    // Verificar el token
    const decoded = verify(token, JWT_SECRET);
    const principalId = typeof decoded === 'object' ? decoded.id : 'anonymous';

    return {
      principalId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (error) {
    console.error('Error en la autorización WebSocket:', error);
    throw new Error('Unauthorized');
  }
}; 