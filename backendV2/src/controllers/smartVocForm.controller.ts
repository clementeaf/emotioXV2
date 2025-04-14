import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import smartVOCFormService from '../services/smartVocForm.service';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';

// Función helper para crear respuestas con formato consistente
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
};

// Función helper para crear respuestas de error consistentes
const errorResponse = (message: string, statusCode: number): APIGatewayProxyResult => {
  return createResponse(statusCode, { 
    success: false, 
    message 
  });
};

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

  async createSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Request body is required', 400);
      }

      const formData: SmartVOCFormData = JSON.parse(event.body);
      const form = await smartVOCFormService.create(formData);
      return createResponse(201, { data: form });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Request body is required', 400);
      }

      const formData: SmartVOCFormData = JSON.parse(event.body);
      const form = await smartVOCFormService.update(formData);
      return createResponse(200, { data: form });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createOrUpdateSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

  async deleteSmartVOCForm(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const { researchId } = event.queryStringParameters || {};
      
      if (!researchId) {
        return errorResponse('Research ID is required', 400);
      }

      await smartVOCFormService.delete(researchId);
      return createResponse(200, { message: 'SmartVOC form deleted successfully' });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllSmartVOCForms(_: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
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

const controller = new SmartVOCFormController();

// Definimos las rutas con tipos explícitos
export const routes: Record<string, Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>>> = {
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
    'PUT': controller.createOrUpdateSmartVOCForm.bind(controller)
  },
  '/smart-voc/all': {
    'GET': controller.getAllSmartVOCForms.bind(controller)
  }
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Aquí podrías procesar la ruta según el patrón del path
  const path = event.path;
  const method = event.httpMethod;
  
  // Buscar la ruta correspondiente
  for (const routePath in routes) {
    // Verificar si el path coincide con la ruta (considerando parámetros)
    // Por simplicidad, asumimos una comparación directa por ahora
    if (path.includes(routePath.replace(/\/:[^/]+/g, ''))) {
      const methodHandlers = routes[routePath];
      const handler = methodHandlers[method];
      
      if (handler) {
        return handler(event);
      }
    }
  }
  
  return errorResponse(`No handler found for ${method} ${path}`, 404);
}; 