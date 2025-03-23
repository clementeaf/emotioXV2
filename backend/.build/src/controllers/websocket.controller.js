"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.default_ = exports.disconnect = exports.connect = exports.WebSocketController = void 0;
const connection_model_1 = require("../models/connection.model");
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("../middlewares/error.middleware");
const error_middleware_2 = require("../middlewares/error.middleware");
/**
 * Controlador para WebSocket
 */
class WebSocketController {
    /**
     * Maneja la conexión de un cliente WebSocket
     */
    async connect(event) {
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
                const decoded = auth_service_1.authService.verifyToken(token);
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
                await connection_model_1.connectionModel.create(connectionId, userId);
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Conectado' })
                };
            }
            catch (error) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ message: 'Token inválido' })
                };
            }
        }
        catch (error) {
            return (0, error_middleware_1.errorHandler)(error);
        }
    }
    /**
     * Maneja la desconexión de un cliente WebSocket
     */
    async disconnect(event) {
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
            await connection_model_1.connectionModel.delete(connectionId);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Desconectado' })
            };
        }
        catch (error) {
            return (0, error_middleware_1.errorHandler)(error);
        }
    }
    /**
     * Maneja los mensajes recibidos por WebSocket
     */
    async default(event) {
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
            const connection = await connection_model_1.connectionModel.findByConnectionId(connectionId);
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
            }
            catch (error) {
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
                    await connection_model_1.connectionModel.sendMessage(connectionId, {
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
        }
        catch (error) {
            return (0, error_middleware_1.errorHandler)(error);
        }
    }
    /**
     * Autoriza una conexión WebSocket
     */
    async authorize(event) {
        try {
            // Obtener token de los parámetros de consulta
            const token = event.queryStringParameters?.token;
            if (!token) {
                throw new error_middleware_2.UnauthorizedError('Token no proporcionado');
            }
            // Verificar token
            try {
                const decoded = auth_service_1.authService.verifyToken(token);
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
            }
            catch (error) {
                throw new error_middleware_2.UnauthorizedError('Token inválido');
            }
        }
        catch (error) {
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
exports.WebSocketController = WebSocketController;
// Instancia del controlador para las funciones Lambda
const websocketController = new WebSocketController();
// Exportar funciones para serverless
const connect = (event) => websocketController.connect(event);
exports.connect = connect;
const disconnect = (event) => websocketController.disconnect(event);
exports.disconnect = disconnect;
const default_ = (event) => websocketController.default(event);
exports.default_ = default_;
const authorize = (event) => websocketController.authorize(event);
exports.authorize = authorize;
//# sourceMappingURL=websocket.controller.js.map