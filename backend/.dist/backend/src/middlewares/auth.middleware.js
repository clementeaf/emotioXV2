"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketAuthMiddleware = exports.authMiddleware = void 0;
const auth_service_1 = require("../services/auth.service");
/**
 * Middleware para verificar la autenticación en las solicitudes
 * Extrae el token de los headers y verifica su validez
 */
const authMiddleware = (event) => {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const token = auth_service_1.authService.extractTokenFromHeader(authHeader);
        const decoded = auth_service_1.authService.verifyToken(token);
        return decoded.id;
    }
    catch (error) {
        throw new Error('Unauthorized');
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Middleware para verificar la autenticación en las solicitudes WebSocket
 * Extrae el token de los query parameters y verifica su validez
 */
const websocketAuthMiddleware = (event) => {
    try {
        const token = event.queryStringParameters?.token;
        if (!token) {
            throw new Error('No token provided');
        }
        const decoded = auth_service_1.authService.verifyToken(token);
        return decoded.id;
    }
    catch (error) {
        throw new Error('Unauthorized');
    }
};
exports.websocketAuthMiddleware = websocketAuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map