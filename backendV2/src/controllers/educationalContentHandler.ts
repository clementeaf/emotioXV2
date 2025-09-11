import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EducationalContentModel } from '../models/EducationalContentModel';
import { authService } from '../services/auth.service';

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
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Usuario no autenticado',
        }),
      };
    }

    // GET /educational-content - Obtener todo el contenido educativo del usuario
    if (httpMethod === 'GET' && path === '/educational-content') {
      const userContent = await EducationalContentModel.getAllByUserId(userId);
      const contentTypes: ('smart_voc' | 'cognitive_task')[] = ['smart_voc', 'cognitive_task'];
      const result = [];

      for (const contentType of contentTypes) {
        let content = userContent.find(c => c.contentType === contentType);
        
        if (!content) {
          const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
          content = {
            id: 'default',
            contentType,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...defaultContent,
          } as any;
        }
        
        result.push(content);
      }

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
      
      let educationalContent = await EducationalContentModel.getByUserIdAndType(userId, contentType);
      
      if (!educationalContent) {
        const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
        educationalContent = {
          id: 'default',
          contentType,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...defaultContent,
        } as any;
      }

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

    // Ruta no encontrada
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Endpoint no encontrado',
      }),
    };
  } catch (error) {
    console.error('Error in educational content handler:', error);
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