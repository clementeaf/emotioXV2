import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WelcomeScreenService } from '../services/welcome-screen.service';
import { requireAuth } from '../utils/auth';
import { createResponse, createErrorResponse, getOriginFromEvent } from '../utils/response';

/**
 * Controlador para el Welcome Screen
 */
export class WelcomeScreenController {
  private welcomeScreenService: WelcomeScreenService;

  constructor() {
    this.welcomeScreenService = new WelcomeScreenService();
  }

  /**
   * Guardar la configuración del Welcome Screen
   */
  async saveWelcomeScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el origen para los headers CORS
      const origin = getOriginFromEvent(event);
      
      // Autenticar al usuario y obtener su ID
      const userId = requireAuth(event);
      
      // Obtener los datos del cuerpo de la petición
      const requestBody = JSON.parse(event.body || '{}');
      const { researchId, ...welcomeScreenData } = requestBody;
      
      if (!researchId) {
        return createResponse(400, { message: 'Research ID is required' }, {}, origin);
      }
      
      // Guardar la configuración
      const result = await this.welcomeScreenService.saveWelcomeScreen(
        researchId,
        userId,
        welcomeScreenData
      );
      
      return createResponse(200, { success: true, data: result }, {}, origin);
    } catch (error) {
      console.error('Error saving welcome screen:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }

  /**
   * Obtener la configuración del Welcome Screen
   */
  async getWelcomeScreen(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
      const welcomeScreen = await this.welcomeScreenService.getWelcomeScreen(researchId, userId);
      
      if (!welcomeScreen) {
        return createResponse(404, { message: 'Welcome screen not found' }, {}, origin);
      }
      
      return createResponse(200, { success: true, data: welcomeScreen }, {}, origin);
    } catch (error) {
      console.error('Error getting welcome screen:', error);
      return createErrorResponse(error, getOriginFromEvent(event));
    }
  }
}

// Instancia del controlador para las funciones Lambda
const welcomeScreenController = new WelcomeScreenController();

// Exportar funciones para serverless
export const save = (event: APIGatewayProxyEvent) => welcomeScreenController.saveWelcomeScreen(event);
export const get = (event: APIGatewayProxyEvent) => welcomeScreenController.getWelcomeScreen(event); 