import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { SmartVOCFormService } from '../services/smartVocForm.service';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Controlador para manejar las peticiones relacionadas con formularios SmartVOC
 * 
 * Este controlador gestiona la creación, actualización, obtención y eliminación de
 * formularios SmartVOC para investigaciones. Trabaja en conjunto con el servicio
 * SmartVOCFormService para las operaciones de datos y requiere que el usuario esté
 * autenticado para todas las operaciones.
 */
export class SmartVOCFormController {
  // Instanciar el servicio una vez
  private smartVOCService = new SmartVOCFormService();

  /**
   * Crea un nuevo formulario SmartVOC
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario SmartVOC creado
   */
  async createSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando createSmartVOCForm...');
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.error('Error: No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear el formulario SmartVOC', 400);
      }

      console.log('ID de usuario extraído:', userId);
      
      if (!userId) {
        console.error('Error: No se pudo extraer el ID de usuario');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición con manejo de errores
      let formData: SmartVOCFormData;
      try {
        formData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log('Datos de formulario parseados:', formData);
      } catch (e) {
        console.error('Error al parsear JSON del cuerpo:', e);
        return errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400);
      }

      // Obtener el ID de la investigación desde el cuerpo de la petición o parámetros de ruta
      const researchId = formData.researchId || event.pathParameters?.researchId;
      console.log('ID de investigación:', researchId);
      
      if (!researchId) {
        console.error('Error: No se proporcionó ID de investigación');
        return errorResponse('Se requiere un ID de investigación (proporcione researchId en el cuerpo de la petición)', 400);
      }

      // Crear el formulario SmartVOC usando el servicio
      console.log('Llamando al servicio para crear formulario SmartVOC...');
      const smartVocForm = await this.smartVOCService.createSmartVOCForm(researchId, formData);
      console.log('Formulario SmartVOC creado exitosamente:', smartVocForm.id);

      return createResponse(201, {
        message: 'Formulario SmartVOC creado exitosamente',
        data: smartVocForm
      });
    } catch (error) {
      console.error('Error en createSmartVOCForm:', error);
      return this.handleError(error);
    }
  }

  /**
   * Obtiene un formulario SmartVOC por su ID
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario SmartVOC solicitado
   */
  async getSmartVOCFormById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      if (!formId) {
        return errorResponse('Se requiere un ID de formulario SmartVOC', 400);
      }

      // Obtener el formulario SmartVOC usando el servicio
      const smartVocForm = await this.smartVOCService.getSmartVOCFormById(formId);
      
      if (!smartVocForm) {
        return errorResponse('Formulario SmartVOC no encontrado', 404);
      }

      return createResponse(200, {
        data: smartVocForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene el formulario SmartVOC de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario SmartVOC de la investigación
   */
  async getSmartVOCFormByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      
      console.log('DEBUG - getSmartVOCFormByResearchId:', {
        path: event.path,
        pathParameters: event.pathParameters,
        researchId
      });
      
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Obtener el formulario SmartVOC usando el servicio
      const smartVocForm = await this.smartVOCService.getSmartVOCFormByResearchId(researchId);
      
      if (!smartVocForm) {
        return createResponse(200, {
          data: null,
          message: 'No existe un formulario SmartVOC para esta investigación'
        });
      }

      return createResponse(200, {
        data: smartVocForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza un formulario SmartVOC
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario SmartVOC actualizado
   */
  async updateSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar el formulario SmartVOC', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const formData: Partial<SmartVOCFormData> = JSON.parse(event.body);

      // Obtener el ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      if (!formId) {
        return errorResponse('Se requiere un ID de formulario SmartVOC', 400);
      }

      // Actualizar el formulario SmartVOC usando el servicio
      const updatedForm = await this.smartVOCService.updateSmartVOCForm(formId, formData);

      return createResponse(200, {
        message: 'Formulario SmartVOC actualizado exitosamente',
        data: updatedForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza o crea el formulario SmartVOC de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario SmartVOC actualizado o creado
   */
  async createOrUpdateSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar el formulario SmartVOC', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const formData: SmartVOCFormData = JSON.parse(event.body);

      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Actualizar o crear el formulario SmartVOC usando el servicio
      const smartVocForm = await this.smartVOCService.createOrUpdateSmartVOCForm(researchId, formData);

      return createResponse(200, {
        message: 'Formulario SmartVOC actualizado exitosamente',
        data: smartVocForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Elimina un formulario SmartVOC
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el resultado de la eliminación
   */
  async deleteSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener el ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      if (!formId) {
        return errorResponse('Se requiere un ID de formulario SmartVOC', 400);
      }

      // Eliminar el formulario SmartVOC usando el servicio
      await this.smartVOCService.deleteSmartVOCForm(formId);

      return createResponse(200, {
        message: 'Formulario SmartVOC eliminado exitosamente'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Clona un formulario SmartVOC existente para una nueva investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario SmartVOC clonado
   */
  async cloneSmartVOCForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para clonar el formulario SmartVOC', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const cloneData = JSON.parse(event.body);

      // Verificar que se proporciona la información necesaria
      if (!cloneData.sourceFormId) {
        return errorResponse('Se requiere el ID del formulario origen (sourceFormId)', 400);
      }

      if (!cloneData.targetResearchId) {
        return errorResponse('Se requiere el ID de la investigación destino (targetResearchId)', 400);
      }

      // Clonar el formulario SmartVOC usando el servicio
      const clonedForm = await this.smartVOCService.cloneSmartVOCForm(
        cloneData.sourceFormId,
        cloneData.targetResearchId
      );

      return createResponse(201, {
        message: 'Formulario SmartVOC clonado exitosamente',
        data: clonedForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Maneja errores de forma consistente
   * @param error Error capturado
   * @returns Respuesta HTTP con el error
   */
  private handleError(error: any): APIGatewayProxyResult {
    console.error('Error en controlador SmartVOCForm:', error);
    
    const message = error.message || 'Error interno del servidor';
    const statusCode = error.statusCode || 500;
    
    return errorResponse(message, statusCode);
  }

  /**
   * Obtiene todos los formularios SmartVOC
   * @param _event Evento de API Gateway (no utilizado directamente)
   * @param _userId ID del usuario autenticado (no utilizado directamente)
   * @returns Respuesta HTTP con todos los formularios
   */
  async getAllSmartVOCForms(_event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Obtener todos los formularios SmartVOC
      const forms = await this.smartVOCService.getAllForms();
      
      return createResponse(200, {
        data: forms
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Crear instancia del controlador
const controller = new SmartVOCFormController();

// Definir mapa de rutas para el controlador
const routes: RouteMap = {
  '/smart-voc': {
    'GET': controller.getAllSmartVOCForms.bind(controller),
    'POST': controller.createSmartVOCForm.bind(controller)
  },
  '/smart-voc/:id': {
    'GET': controller.getSmartVOCFormById.bind(controller),
    'PUT': controller.updateSmartVOCForm.bind(controller),
    'DELETE': controller.deleteSmartVOCForm.bind(controller)
  },
  '/research/:researchId/smart-voc': {
    'GET': controller.getSmartVOCFormByResearchId.bind(controller),
    'POST': controller.createOrUpdateSmartVOCForm.bind(controller),
    'PUT': controller.createOrUpdateSmartVOCForm.bind(controller)
  },
  '/smart-voc/clone': {
    'POST': controller.cloneSmartVOCForm.bind(controller)
  },
  '/smart-voc/all': {
    'GET': controller.getAllSmartVOCForms.bind(controller)
  }
};

// Crear y exportar el controlador con las rutas definidas
export const smartVocFormController = createController(routes, {
  basePath: '',  // Cambiado de '/smart-voc' a '' para permitir rutas como /research/:researchId/smart-voc
  publicRoutes: [] // Todas las rutas requieren autenticación
});

export default smartVocFormController; 