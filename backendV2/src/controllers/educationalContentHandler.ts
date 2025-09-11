import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BadRequestError, UnauthorizedError, ConflictError, InternalServerError } from '../errors';
import { EducationalContentService } from '../services/educationalContentService';
import { authService } from '../services/auth.service';
import { validateCreateEducationalContent, validateUpdateEducationalContent } from '../utils/validators/educationalContentValidators';

// Helper function to extract userId from JWT token
const getUserIdFromToken = async (event: APIGatewayProxyEvent): Promise<string | null> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await authService.validateToken(token);
    
    if (!decoded || !decoded.id) {
      return null;
    }

    return decoded.id;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
};

/**
 * Handler principal para rutas de Educational Content
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const httpMethod = event.httpMethod;
  const path = event.path;

  console.log(`Educational Content Handler v2 - ${httpMethod} ${path}`);

  // Manejar OPTIONS para CORS
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: '',
    };
  }

  try {
    const userId = await getUserIdFromToken(event);
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    // GET /educational-content - Obtener todo el contenido educativo del usuario
    if (httpMethod === 'GET' && path === '/educational-content') {
      const result = await EducationalContentService.getAllEducationalContent(userId);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: result,
        }),
      };
    }

    // GET /educational-content/{contentType} - Obtener contenido específico por tipo
    if (httpMethod === 'GET' && path.match(/^\/educational-content\/(smart_voc|cognitive_task)$/)) {
      const contentType = event.pathParameters?.contentType as 'smart_voc' | 'cognitive_task';
      
      if (!contentType || !['smart_voc', 'cognitive_task'].includes(contentType)) {
        throw new BadRequestError('Tipo de contenido inválido');
      }

      const educationalContent = await EducationalContentService.getEducationalContent(userId, contentType);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: educationalContent,
        }),
      };
    }

    // PUT /educational-content/{contentType} - Actualizar contenido específico
    if (httpMethod === 'PUT' && path.match(/^\/educational-content\/(smart_voc|cognitive_task)$/)) {
      const contentType = event.pathParameters?.contentType as 'smart_voc' | 'cognitive_task';
      
      if (!contentType || !['smart_voc', 'cognitive_task'].includes(contentType)) {
        throw new BadRequestError('Tipo de contenido inválido');
      }

      const body = JSON.parse(event.body || '{}');
      
      // Validar datos de entrada
      const validation = validateUpdateEducationalContent(body);
      if (!validation.isValid) {
        throw new BadRequestError(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      const updatedContent = await EducationalContentService.updateEducationalContent(userId, contentType, body);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: updatedContent,
        }),
      };
    }

    // POST /educational-content - Crear contenido nuevo
    if (httpMethod === 'POST' && path === '/educational-content') {
      const body = JSON.parse(event.body || '{}');
      
      // Validar datos de entrada
      const validation = validateCreateEducationalContent({ ...body, userId });
      if (!validation.isValid) {
        throw new BadRequestError(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      const educationalContent = await EducationalContentService.createEducationalContent({ ...body, userId });
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: educationalContent,
        }),
      };
    }

    // Ruta no encontrada
    throw new BadRequestError('Endpoint no encontrado');

  } catch (error) {
    console.error('Error in educational content handler:', error);
    
    if (error instanceof BadRequestError || error instanceof UnauthorizedError || error instanceof ConflictError || error instanceof InternalServerError) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
      }),
    };
  }
};