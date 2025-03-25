import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ThankYouScreenService } from '../services/thank-you-screen.service';
import { requireAuth } from '../utils/auth';
import { createResponse, createErrorResponse, getOriginFromEvent } from '../utils/response';

/**
 * Controlador para la pantalla de agradecimiento (Thank You Screen)
 */
export class ThankYouScreenController {
  private thankYouScreenService: ThankYouScreenService;

  constructor() {
    this.thankYouScreenService = new ThankYouScreenService();
  }

  /**
   * Guardar la configuración de la pantalla de agradecimiento
   */
  async saveThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el origen para los headers CORS
      const origin = getOriginFromEvent(event);
      
      // Autenticar al usuario y obtener su ID
      const userId = requireAuth(event);
      
      // Obtener los datos del cuerpo de la petición
      const requestBody = JSON.parse(event.body || '{}');
      const { researchId, ...thankYouScreenData } = requestBody;
      
      if (!researchId) {
        return createResponse(400, { message: 'Research ID is required' }, {}, origin);
      }
      
      // Guardar la configuración
      const result = await this.thankYouScreenService.saveThankYouScreen(
        researchId,
        userId,
        thankYouScreenData
      );
      
      return createResponse(200, { success: true, data: result }, {}, origin);
    } catch (error) {
      console.error('Error saving thank you screen:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }

  /**
   * Obtener la configuración de la pantalla de agradecimiento
   */
  async getThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el origen para los headers CORS
      const origin = getOriginFromEvent(event);
      
      // Autenticar al usuario y obtener su ID
      const userId = requireAuth(event);
      
      // Obtener el ID de la investigación de los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      
      if (!researchId) {
        return createResponse(400, { message: 'Research ID is required' }, {}, origin);
      }
      
      // Obtener la configuración
      const thankYouScreen = await this.thankYouScreenService.getThankYouScreen(researchId, userId);
      
      if (!thankYouScreen) {
        return createResponse(404, { message: 'Thank you screen not found' }, {}, origin);
      }
      
      return createResponse(200, { success: true, data: thankYouScreen }, {}, origin);
    } catch (error) {
      console.error('Error getting thank you screen:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }

  /**
   * Obtener la configuración de la pantalla de agradecimiento por ID
   */
  async getThankYouScreenById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el origen para los headers CORS
      const origin = getOriginFromEvent(event);
      
      // Autenticar al usuario y obtener su ID
      const userId = requireAuth(event);
      
      // Obtener el ID de la pantalla de los parámetros de ruta
      const id = event.pathParameters?.id;
      
      if (!id) {
        return createResponse(400, { message: 'Thank you screen ID is required' }, {}, origin);
      }
      
      // Obtener la configuración
      const thankYouScreen = await this.thankYouScreenService.getThankYouScreenById(id, userId);
      
      if (!thankYouScreen) {
        return createResponse(404, { message: 'Thank you screen not found' }, {}, origin);
      }
      
      return createResponse(200, { success: true, data: thankYouScreen }, {}, origin);
    } catch (error) {
      console.error('Error getting thank you screen by ID:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }

  /**
   * Actualizar la configuración de la pantalla de agradecimiento
   */
  async updateThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el origen para los headers CORS
      const origin = getOriginFromEvent(event);
      
      // Autenticar al usuario y obtener su ID
      const userId = requireAuth(event);
      
      // Obtener el ID de la pantalla de los parámetros de ruta
      const id = event.pathParameters?.id;
      
      if (!id) {
        return createResponse(400, { message: 'Thank you screen ID is required' }, {}, origin);
      }
      
      // Obtener los datos del cuerpo de la petición
      const thankYouScreenData = JSON.parse(event.body || '{}');
      
      // Actualizar la configuración
      const result = await this.thankYouScreenService.updateThankYouScreen(
        id,
        userId,
        thankYouScreenData
      );
      
      if (!result) {
        return createResponse(404, { message: 'Thank you screen not found or you do not have permission to update it' }, {}, origin);
      }
      
      return createResponse(200, { success: true, data: result }, {}, origin);
    } catch (error) {
      console.error('Error updating thank you screen:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }

  /**
   * Eliminar la configuración de la pantalla de agradecimiento
   */
  async deleteThankYouScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el origen para los headers CORS
      const origin = getOriginFromEvent(event);
      
      // Autenticar al usuario y obtener su ID
      const userId = requireAuth(event);
      
      // Obtener el ID de la pantalla de los parámetros de ruta
      const id = event.pathParameters?.id;
      
      if (!id) {
        return createResponse(400, { message: 'Thank you screen ID is required' }, {}, origin);
      }
      
      // Eliminar la configuración
      const result = await this.thankYouScreenService.deleteThankYouScreen(id, userId);
      
      if (!result) {
        return createResponse(404, { message: 'Thank you screen not found or you do not have permission to delete it' }, {}, origin);
      }
      
      return createResponse(200, { success: true, message: 'Thank you screen deleted successfully' }, {}, origin);
    } catch (error) {
      console.error('Error deleting thank you screen:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }
}

// Instancia del controlador para las funciones Lambda
const thankYouScreenController = new ThankYouScreenController();

// Exportar funciones para serverless
export const save = (event: APIGatewayProxyEvent) => thankYouScreenController.saveThankYouScreen(event);
export const get = (event: APIGatewayProxyEvent) => thankYouScreenController.getThankYouScreen(event);
export const getById = (event: APIGatewayProxyEvent) => thankYouScreenController.getThankYouScreenById(event);
export const update = (event: APIGatewayProxyEvent) => thankYouScreenController.updateThankYouScreen(event);
export const remove = (event: APIGatewayProxyEvent) => thankYouScreenController.deleteThankYouScreen(event); 