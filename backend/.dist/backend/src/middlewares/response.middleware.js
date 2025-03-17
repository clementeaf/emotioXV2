"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyArrayResponse = exports.noContentResponse = exports.createdResponse = exports.successResponse = exports.createResponse = void 0;
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
const createResponse = (statusCode, data, message) => {
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
exports.createResponse = createResponse;
/**
 * Respuesta exitosa (200 OK)
 */
const successResponse = (data, message) => {
    return (0, exports.createResponse)(200, data, message);
};
exports.successResponse = successResponse;
/**
 * Respuesta de creación exitosa (201 Created)
 */
const createdResponse = (data, message) => {
    return (0, exports.createResponse)(201, data, message);
};
exports.createdResponse = createdResponse;
/**
 * Respuesta sin contenido (204 No Content)
 */
const noContentResponse = () => {
    return {
        statusCode: 204,
        headers: corsHeaders,
        body: ''
    };
};
exports.noContentResponse = noContentResponse;
/**
 * Respuesta para arrays vacíos
 * Devuelve un array vacío en lugar de un error cuando no hay datos
 */
const emptyArrayResponse = (message) => {
    return (0, exports.createResponse)(200, [], message || 'No data found');
};
exports.emptyArrayResponse = emptyArrayResponse;
//# sourceMappingURL=response.middleware.js.map