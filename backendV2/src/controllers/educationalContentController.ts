import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BadRequestError, UnauthorizedError, ConflictError, InternalServerError } from '../errors';
import { EducationalContentModel, CreateEducationalContentRequest, UpdateEducationalContentRequest, EducationalContent } from '../models/EducationalContentModel';
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

export const createEducationalContent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event);
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const body = JSON.parse(event.body || '{}') as CreateEducationalContentRequest;
    
    // Validar datos de entrada
    const validation = validateCreateEducationalContent(body);
    if (!validation.isValid) {
      throw new BadRequestError(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    // Verificar si ya existe contenido para este tipo
    const existingContent = await EducationalContentModel.getByUserIdAndType(userId, body.contentType);
    if (existingContent) {
      throw new ConflictError(`Ya existe contenido educativo para ${body.contentType}. Usa PUT para actualizar.`);
    }

    const educationalContent = await EducationalContentModel.create({
      ...body,
      userId,
    });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: educationalContent,
      }),
    };
  } catch (error) {
    console.error('Error creating educational content:', error);
    
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

export const getEducationalContent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event);
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const contentType = event.pathParameters?.contentType as 'smart_voc' | 'cognitive_task';
    if (!contentType || !['smart_voc', 'cognitive_task'].includes(contentType)) {
      throw new BadRequestError('Tipo de contenido inválido');
    }

    let educationalContent = await EducationalContentModel.getByUserIdAndType(userId, contentType);

    // Si no existe contenido personalizado, devolver el por defecto
    if (!educationalContent) {
      const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
      educationalContent = {
        id: 'default',
        contentType,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...defaultContent,
      } as EducationalContent;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: educationalContent,
      }),
    };
  } catch (error) {
    console.error('Error getting educational content:', error);
    
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

export const updateEducationalContent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event);
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const contentType = event.pathParameters?.contentType as 'smart_voc' | 'cognitive_task';
    if (!contentType || !['smart_voc', 'cognitive_task'].includes(contentType)) {
      throw new BadRequestError('Tipo de contenido inválido');
    }

    const body = JSON.parse(event.body || '{}') as UpdateEducationalContentRequest;
    
    // Validar datos de entrada
    const validation = validateUpdateEducationalContent(body);
    if (!validation.isValid) {
      throw new BadRequestError(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    // Verificar si existe contenido para actualizar
    let existingContent = await EducationalContentModel.getByUserIdAndType(userId, contentType);
    
    let updatedContent;
    if (existingContent) {
      // Actualizar contenido existente
      updatedContent = await EducationalContentModel.update(existingContent.id, body);
    } else {
      // Crear nuevo contenido con valores por defecto + actualizaciones
      const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
      const createData: CreateEducationalContentRequest = {
        contentType,
        userId,
        title: body.title || defaultContent.title || '',
        generalDescription: body.generalDescription || defaultContent.generalDescription || '',
        typeExplanation: body.typeExplanation || defaultContent.typeExplanation || '',
      };
      
      updatedContent = await EducationalContentModel.create(createData);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: updatedContent,
      }),
    };
  } catch (error) {
    console.error('Error updating educational content:', error);
    
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

export const getAllEducationalContent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = await getUserIdFromToken(event);
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const userContent = await EducationalContentModel.getAllByUserId(userId);
    
    // Asegurar que tenemos contenido para ambos tipos
    const contentTypes: ('smart_voc' | 'cognitive_task')[] = ['smart_voc', 'cognitive_task'];
    const result = [];

    for (const contentType of contentTypes) {
      let content = userContent.find(c => c.contentType === contentType);
      
      if (!content) {
        // Usar contenido por defecto si no existe personalizado
        const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
        content = {
          id: 'default',
          contentType,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...defaultContent,
        } as EducationalContent;
      }

      result.push(content);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };
  } catch (error) {
    console.error('Error getting all educational content:', error);
    
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