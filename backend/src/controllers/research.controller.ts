import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { researchService } from '../services/research.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ValidationError, NotFoundError, ForbiddenError } from '../middlewares/error.middleware';
import { successResponse, createdResponse, noContentResponse, emptyArrayResponse } from '../middlewares/response.middleware';
import { errorHandler } from '../middlewares/error.middleware';

/**
 * Controlador para las investigaciones
 */
export class ResearchController {
  /**
   * Crea una nueva investigación
   */
  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Validar que el cuerpo de la solicitud existe
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      // Parsear el cuerpo de la solicitud
      const data = JSON.parse(event.body);

      // Validar campos requeridos
      if (!data.name || !data.type || !data.technique || !data.description || !data.enterprise) {
        throw new ValidationError('Name, type, technique, description and enterprise are required');
      }

      // Crear investigación
      const research = await researchService.createResearch({
        userId,
        name: data.name,
        type: data.type,
        technique: data.technique,
        description: data.description,
        enterprise: data.enterprise,
        targetParticipants: data.targetParticipants
      });

      // Devolver respuesta exitosa
      return createdResponse(research, 'Research created successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Obtiene una investigación por su ID
   */
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID de la investigación
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        throw new ValidationError('Research ID is required');
      }

      // Obtener investigación
      const research = await researchService.getResearchById(researchId);
      if (!research) {
        throw new NotFoundError('Research not found');
      }

      // Verificar que el usuario es propietario de la investigación
      if (research.userId !== userId) {
        throw new ForbiddenError('You do not have permission to access this research');
      }

      // Devolver respuesta exitosa
      return successResponse(research);
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Lista todas las investigaciones del usuario
   */
  async list(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener investigaciones
      const researches = await researchService.getResearchByUserId(userId);

      // Si no hay investigaciones, devolver array vacío
      if (researches.length === 0) {
        return emptyArrayResponse('No researches found');
      }

      // Devolver respuesta exitosa
      return successResponse(researches);
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Actualiza una investigación
   */
  async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID de la investigación
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        throw new ValidationError('Research ID is required');
      }

      // Validar que el cuerpo de la solicitud existe
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      // Parsear el cuerpo de la solicitud
      const updateData = JSON.parse(event.body);

      // Validar que hay datos para actualizar
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No data provided for update');
      }

      // Verificar que el usuario es propietario de la investigación
      const isOwner = await researchService.isResearchOwner(userId, researchId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to update this research');
      }

      // Actualizar investigación
      const updatedResearch = await researchService.updateResearch(researchId, updateData);

      // Devolver respuesta exitosa
      return successResponse(updatedResearch, 'Research updated successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Elimina una investigación
   */
  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID de la investigación
      const researchId = event.pathParameters?.id;
      if (!researchId) {
        throw new ValidationError('Research ID is required');
      }

      // Verificar que el usuario es propietario de la investigación
      const isOwner = await researchService.isResearchOwner(userId, researchId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to delete this research');
      }

      // Eliminar investigación
      await researchService.deleteResearch(researchId);

      // Devolver respuesta exitosa
      return noContentResponse();
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// Instancia del controlador para las funciones Lambda
const researchController = new ResearchController();

// Exportar funciones para serverless
export const create = (event: APIGatewayProxyEvent) => researchController.create(event);
export const get = (event: APIGatewayProxyEvent) => researchController.get(event);
export const list = (event: APIGatewayProxyEvent) => researchController.list(event);
export const update = (event: APIGatewayProxyEvent) => researchController.update(event);
export const delete_ = (event: APIGatewayProxyEvent) => researchController.delete(event); 