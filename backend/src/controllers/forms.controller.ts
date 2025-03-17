import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formsService } from '../services/forms.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ValidationError, NotFoundError, ForbiddenError } from '../middlewares/error.middleware';
import { successResponse, createdResponse, noContentResponse, emptyArrayResponse } from '../middlewares/response.middleware';
import { errorHandler } from '../middlewares/error.middleware';

/**
 * Controlador para los formularios
 */
export class FormsController {
  /**
   * Crea un nuevo formulario
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
      if (!data.researchId || !data.title || !data.questions) {
        throw new ValidationError('Research ID, title and questions are required');
      }

      // Validar que las preguntas sean un array no vacío
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new ValidationError('Questions must be a non-empty array');
      }

      // Crear formulario
      const form = await formsService.createForm({
        userId,
        researchId: data.researchId,
        title: data.title,
        description: data.description || '',
        questions: data.questions,
        isPublished: data.isPublished || false
      });

      // Devolver respuesta exitosa
      return createdResponse(form, 'Form created successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Obtiene un formulario por su ID
   */
  async get(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Obtener formulario
      const form = await formsService.getFormById(formId);
      if (!form) {
        throw new NotFoundError('Form not found');
      }

      // Verificar que el usuario es propietario del formulario
      if (form.userId !== userId) {
        throw new ForbiddenError('You do not have permission to access this form');
      }

      // Devolver respuesta exitosa
      return successResponse(form);
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Lista todos los formularios del usuario
   */
  async list(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Verificar si se filtra por investigación
      const researchId = event.queryStringParameters?.researchId;

      // Obtener formularios
      let forms;
      if (researchId) {
        forms = await formsService.getFormsByResearchId(researchId, userId);
      } else {
        forms = await formsService.getFormsByUserId(userId);
      }

      // Si no hay formularios, devolver array vacío
      if (forms.length === 0) {
        return emptyArrayResponse('No forms found');
      }

      // Devolver respuesta exitosa
      return successResponse(forms);
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Actualiza un formulario
   */
  async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
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

      // Verificar que el usuario es propietario del formulario
      const isOwner = await formsService.isFormOwner(userId, formId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to update this form');
      }

      // Actualizar formulario
      const updatedForm = await formsService.updateForm(formId, updateData);

      // Devolver respuesta exitosa
      return successResponse(updatedForm, 'Form updated successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Elimina un formulario
   */
  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Verificar que el usuario es propietario del formulario
      const isOwner = await formsService.isFormOwner(userId, formId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to delete this form');
      }

      // Eliminar formulario
      await formsService.deleteForm(formId);

      // Devolver respuesta exitosa
      return noContentResponse();
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Publica un formulario
   */
  async publish(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Verificar que el usuario es propietario del formulario
      const isOwner = await formsService.isFormOwner(userId, formId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to publish this form');
      }

      // Publicar formulario
      const publishedForm = await formsService.publishForm(formId);

      // Devolver respuesta exitosa
      return successResponse(publishedForm, 'Form published successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Despublica un formulario
   */
  async unpublish(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Verificar que el usuario es propietario del formulario
      const isOwner = await formsService.isFormOwner(userId, formId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to unpublish this form');
      }

      // Despublicar formulario
      const unpublishedForm = await formsService.unpublishForm(formId);

      // Devolver respuesta exitosa
      return successResponse(unpublishedForm, 'Form unpublished successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Obtiene un formulario público por su ID
   */
  async getPublic(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Obtener formulario
      const form = await formsService.getPublicFormById(formId);
      if (!form) {
        throw new NotFoundError('Form not found or not published');
      }

      // Devolver respuesta exitosa
      return successResponse(form);
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Envía respuestas a un formulario
   */
  async submitResponses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Validar que el cuerpo de la solicitud existe
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      // Parsear el cuerpo de la solicitud
      const data = JSON.parse(event.body);

      // Validar campos requeridos
      if (!data.responses || !Array.isArray(data.responses) || data.responses.length === 0) {
        throw new ValidationError('Responses must be a non-empty array');
      }

      // Enviar respuestas
      const submission = await formsService.submitResponses(formId, data.responses, data.respondentInfo);

      // Devolver respuesta exitosa
      return createdResponse(submission, 'Responses submitted successfully');
    } catch (error) {
      return errorHandler(error);
    }
  }

  /**
   * Obtiene las respuestas de un formulario
   */
  async getResponses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Verificar autenticación
      const userId = authMiddleware(event);

      // Obtener ID del formulario
      const formId = event.pathParameters?.id;
      if (!formId) {
        throw new ValidationError('Form ID is required');
      }

      // Verificar que el usuario es propietario del formulario
      const isOwner = await formsService.isFormOwner(userId, formId);
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to access responses for this form');
      }

      // Obtener respuestas
      const responses = await formsService.getFormResponses(formId);

      // Si no hay respuestas, devolver array vacío
      if (responses.length === 0) {
        return emptyArrayResponse('No responses found');
      }

      // Devolver respuesta exitosa
      return successResponse(responses);
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// Instancia del controlador para las funciones Lambda
const formsController = new FormsController();

// Exportar funciones para serverless
export const create = (event: APIGatewayProxyEvent) => formsController.create(event);
export const get = (event: APIGatewayProxyEvent) => formsController.get(event);
export const list = (event: APIGatewayProxyEvent) => formsController.list(event);
export const update = (event: APIGatewayProxyEvent) => formsController.update(event);
export const delete_ = (event: APIGatewayProxyEvent) => formsController.delete(event);
export const publish = (event: APIGatewayProxyEvent) => formsController.publish(event);
export const unpublish = (event: APIGatewayProxyEvent) => formsController.unpublish(event);
export const getPublic = (event: APIGatewayProxyEvent) => formsController.getPublic(event);
export const submitResponses = (event: APIGatewayProxyEvent) => formsController.submitResponses(event);
export const getResponses = (event: APIGatewayProxyEvent) => formsController.getResponses(event); 