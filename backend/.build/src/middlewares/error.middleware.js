"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = void 0;
/**
 * Tipos de errores personalizados
 */
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Middleware para manejar errores y convertirlos en respuestas HTTP apropiadas
 */
const errorHandler = (error) => {
    console.error('Error:', error);
    // Headers CORS para todas las respuestas
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json'
    };
    // Manejar diferentes tipos de errores
    if (error instanceof NotFoundError) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                error: 'Not Found',
                message: error.message
            })
        };
    }
    if (error instanceof UnauthorizedError) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
                error: 'Unauthorized',
                message: error.message
            })
        };
    }
    if (error instanceof ForbiddenError) {
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
                error: 'Forbidden',
                message: error.message
            })
        };
    }
    if (error instanceof ValidationError) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Bad Request',
                message: error.message
            })
        };
    }
    // Error genérico para cualquier otro tipo de error
    return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
        })
    };
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map