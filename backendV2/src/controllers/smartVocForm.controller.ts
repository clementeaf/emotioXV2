import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import smartVOCFormService from '../services/smartVocForm.service';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

/**
 * Controlador para manejar las peticiones relacionadas con formularios SmartVOC
 * 
 * Este controlador gestiona la creación, actualización, obtención y eliminación de
 * formularios SmartVOC para investigaciones. Trabaja en conjunto con el servicio
 * SmartVOCFormService para las operaciones de datos y requiere que el usuario esté
 * autenticado para todas las operaciones.
 */
export class SmartVOCFormController {
  async getSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const { researchId } = event.queryStringParameters || {};
      
      if (!researchId) {
        return errorResponse('Research ID is required', 400);
      }

      const form = await smartVOCFormService.getByResearchId(researchId);
      return createResponse(200, { data: form });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSmartVOCFormById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      
      if (!formId) {
        return errorResponse('Form ID is required', 400);
      }

      // Obtener el formulario SmartVOC usando el servicio
      const smartVocForm = await smartVOCFormService.getById(formId);
      
      if (!smartVocForm) {
        return errorResponse('SmartVOC form not found', 404);
      }

      return createResponse(200, {
        message: 'SmartVOC form retrieved successfully',
        data: smartVocForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSmartVOCFormByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener ID de investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      
      if (!researchId) {
        return errorResponse('Research ID is required', 400);
      }

      // Obtener el formulario SmartVOC usando el servicio
      const smartVocForm = await smartVOCFormService.getByResearchId(researchId);
      
      if (!smartVocForm) {
        return createResponse(404, {
          message: 'SmartVOC form not found for the specified research',
          notFound: true
        });
      }

      return createResponse(200, {
        message: 'SmartVOC form retrieved successfully',
        data: smartVocForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Request body is required', 400);
      }

      const formData: SmartVOCFormData = JSON.parse(event.body);
      
      if (!formData.researchId) {
        return errorResponse('Research ID is required in the form data', 400);
      }
      
      console.log(`[SmartVOCFormController] Creating SmartVOC form for research: ${formData.researchId} by user: ${userId}`);
      const form = await smartVOCFormService.create(formData);
      return createResponse(201, { 
        message: 'SmartVOC form created successfully',
        data: form 
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Request body is required', 400);
      }

      const formData: SmartVOCFormData = JSON.parse(event.body);
      
      if (!formData.researchId) {
        return errorResponse('Research ID is required in the form data', 400);
      }
      
      console.log(`[SmartVOCFormController] Updating SmartVOC form for research: ${formData.researchId} by user: ${userId}`);
      const form = await smartVOCFormService.update(formData);
      return createResponse(200, {
        message: 'SmartVOC form updated successfully',
        data: form 
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createOrUpdateSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Se requieren datos para crear o actualizar el formulario SmartVOC', 400);
      }

      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Parsear el cuerpo de la petición
      const formData: SmartVOCFormData = JSON.parse(event.body);
      formData.researchId = researchId;

      console.log(`[SmartVOCFormController] Creating/Updating SmartVOC form for research: ${researchId} by user: ${userId}`);
      
      // Crear o actualizar el formulario SmartVOC usando el servicio
      const smartVocForm = await smartVOCFormService.createOrUpdate(researchId, formData);

      return createResponse(200, {
        message: 'Formulario SmartVOC creado o actualizado exitosamente',
        data: smartVocForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Primero intentamos obtener el ID de la investigación desde los parámetros de ruta
      let researchId = event.pathParameters?.researchId;
      
      // Si no está en los parámetros de ruta, intentamos obtenerlo desde los query params
      if (!researchId) {
        researchId = event.queryStringParameters?.researchId;
      }
      
      if (!researchId) {
        return errorResponse('Research ID is required', 400);
      }

      console.log(`[SmartVOCFormController] Deleting SmartVOC form for research: ${researchId} by user: ${userId}`);
      await smartVOCFormService.delete(researchId);
      return createResponse(200, { message: 'SmartVOC form deleted successfully' });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllSmartVOCForms(_: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log(`[SmartVOCFormController] Getting all SmartVOC forms by user: ${userId}`);
      // Obtener todos los formularios SmartVOC
      const forms = await smartVOCFormService.getAll();
      
      return createResponse(200, {
        message: 'SmartVOC forms retrieved successfully',
        data: forms
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): APIGatewayProxyResult {
    console.error('Error in SmartVOC form controller:', error);
    return errorResponse(error.message, 500);
  }
}

// Instanciar el controlador
const controller = new SmartVOCFormController();

// Definir el mapa de rutas para SmartVOC
const smartVocRouteMap: RouteMap = {
  '/smart-voc': {
    'GET': controller.getSmartVOCForm.bind(controller),
    'POST': controller.createSmartVOCForm.bind(controller),
    'PUT': controller.updateSmartVOCForm.bind(controller),
    'DELETE': controller.deleteSmartVOCForm.bind(controller)
  },
  '/smart-voc/:id': {
    'GET': controller.getSmartVOCFormById.bind(controller)
  },
  '/research/:researchId/smart-voc': {
    'GET': controller.getSmartVOCFormByResearchId.bind(controller),
    'POST': controller.createOrUpdateSmartVOCForm.bind(controller),
    'PUT': controller.createOrUpdateSmartVOCForm.bind(controller),
    'DELETE': controller.deleteSmartVOCForm.bind(controller)
  },
  '/smart-voc/all': {
    'GET': controller.getAllSmartVOCForms.bind(controller)
  }
};

/**
 * Manejador principal para las rutas de formularios SmartVOC
 * 
 * Utiliza el decorador de controlador para manejar la autenticación y CORS automáticamente.
 * 
 * Rutas soportadas:
 * - GET /smart-voc : Obtiene el formulario SmartVOC para una investigación (usando query param)
 * - POST /smart-voc : Crea un nuevo formulario SmartVOC
 * - PUT /smart-voc : Actualiza un formulario SmartVOC existente
 * - DELETE /smart-voc : Elimina un formulario SmartVOC
 * - GET /smart-voc/:id : Obtiene un formulario SmartVOC por su ID
 * - GET /research/:researchId/smart-voc : Obtiene el formulario SmartVOC para una investigación específica
 * - POST /research/:researchId/smart-voc : Crea o actualiza el formulario SmartVOC para una investigación específica
 * - PUT /research/:researchId/smart-voc : Crea o actualiza el formulario SmartVOC para una investigación específica
 * - DELETE /research/:researchId/smart-voc : Elimina el formulario SmartVOC para una investigación específica
 * - GET /smart-voc/all : Obtiene todos los formularios SmartVOC (administradores)
 */
export const smartVocFormHandler = createController(smartVocRouteMap, {
  basePath: '/smart-voc',
  // No hay rutas públicas, todas requieren autenticación
}); 