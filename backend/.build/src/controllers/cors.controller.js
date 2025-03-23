"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.CorsController = void 0;
/**
 * Lista de orígenes permitidos
 */
const allowedOrigins = [
    'http://localhost:4700',
    'http://localhost:3000',
    'https://app.emotio-x.com',
    'https://dev.emotio-x.com'
];
/**
 * Controlador para CORS
 */
class CorsController {
    /**
     * Manejador para solicitudes OPTIONS - responde a verificaciones de CORS pre-flight
     * Esto permite a los navegadores verificar si se permiten las solicitudes cross-origin antes de enviar la solicitud real
     */
    async handler(event) {
        console.log('Recibida solicitud OPTIONS en:', event.path);
        // Extraer el origen de la solicitud
        const origin = event.headers.origin || event.headers.Origin;
        // Verificar si el origen está permitido
        let allowOrigin = '*';
        if (origin && allowedOrigins.includes(origin)) {
            allowOrigin = origin;
        }
        else {
            // Si no es un origen permitido específico pero estamos en desarrollo, permitir el primer origen
            if (process.env.STAGE === 'dev' || process.env.STAGE === 'local') {
                allowOrigin = allowedOrigins[0];
            }
        }
        console.log('Respondiendo desde OPTIONS con Origin:', allowOrigin);
        // Responder con los headers CORS adecuados
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, Accept, Origin, Referer, User-Agent, Access-Control-Request-Method, Access-Control-Request-Headers',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '600',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'CORS preflight response' })
        };
    }
}
exports.CorsController = CorsController;
// Instancia del controlador para las funciones Lambda
const corsController = new CorsController();
// Exportar funciones para serverless
const handler = (event) => corsController.handler(event);
exports.handler = handler;
//# sourceMappingURL=cors.controller.js.map