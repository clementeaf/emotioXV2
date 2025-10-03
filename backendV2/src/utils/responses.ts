import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { toApplicationError, type ApplicationError } from '../types/errors';

/**
 * Headers CORS por defecto (deprecated - usar getCorsHeaders en su lugar)
 * @deprecated Use getCorsHeaders from cors middleware instead
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:4700',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin,Cache-Control,Pragma',
    'Access-Control-Allow-Credentials': 'true'
};

/**
 * Función para crear respuestas estandarizadas (versión legacy)
 * @deprecated Use createResponseWithCors instead
 */
export const createResponse = (statusCode: number, body: Record<string, unknown> | unknown[]): APIGatewayProxyResult => {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
};

/**
 * Función para crear respuestas estandarizadas con CORS dinámico
 */
export const createResponseWithCors = (statusCode: number, body: Record<string, unknown> | unknown[], event: APIGatewayProxyEvent): APIGatewayProxyResult => {
    return {
        statusCode,
        headers: getCorsHeaders(event),
        body: JSON.stringify(body)
    };
};

/**
* Manejador global de errores
*/
export const errorHandler = (error: Error | ApplicationError): APIGatewayProxyResult => {
    console.error('Error en la aplicación:', error);

    const appError = toApplicationError(error);

    // Determinar el código de estado basado en el tipo de error
    let statusCode = appError.statusCode || 500;

    if (appError.message?.includes('no encontrado')) statusCode = 404;
    else if (appError.message?.includes('inválido') || appError.message?.includes('requerido')) statusCode = 400;
    else if (appError.message?.includes('no autorizado') || appError.message?.includes('credenciales')) statusCode = 401;

    return createResponse(statusCode, {
        success: false,
        message: appError.message || 'Error interno del servidor',
        code: appError.code,
        details: appError.details,
        error: process.env.NODE_ENV === 'dev' ? appError.stack : undefined
    });
};
