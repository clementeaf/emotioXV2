import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Middleware para manejar CORS de forma centralizada
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000, http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept',
    'Access-Control-Allow-Credentials': 'true'
};

/**
 * Función para crear respuestas estandarizadas
 */
export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
};

/**
* Manejador global de errores
*/
export const errorHandler = (error: any): APIGatewayProxyResult => {
    console.error('Error en la aplicación:', error);

    // Determinar el código de estado basado en el tipo de error
    let statusCode = 500;
    if (error.statusCode) statusCode = error.statusCode;
    else if (error.message?.includes('no encontrado')) statusCode = 404;
    else if (error.message?.includes('inválido') || error.message?.includes('requerido')) statusCode = 400;
    else if (error.message?.includes('no autorizado') || error.message?.includes('credenciales')) statusCode = 401;

    return createResponse(statusCode, {
        success: false,
        message: error.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'dev' ? error.stack : undefined
    });
};
