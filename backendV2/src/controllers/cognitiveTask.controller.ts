import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';
import { CognitiveTaskService } from '../services/cognitiveTask.service';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';
import { ApiError } from '../utils/errors';

/**
 * Controlador para manejar las peticiones relacionadas con formularios CognitiveTask
 * 
 * Este controlador gestiona la creación, actualización, obtención y eliminación de
 * formularios CognitiveTask para investigaciones. Trabaja en conjunto con el servicio
 * CognitiveTaskService para las operaciones de datos y requiere que el usuario esté
 * autenticado para todas las operaciones.
 */
export class CognitiveTaskController {
  // Instanciar el servicio una vez
  private cognitiveTaskService = new CognitiveTaskService();

  /**
   * Crea un nuevo formulario CognitiveTask
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario CognitiveTask creado
   */
  async createCognitiveTaskForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      console.log('Iniciando createCognitiveTaskForm...');
      
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        console.error('Error: No hay cuerpo en la petición');
        return errorResponse('Se requieren datos para crear el formulario CognitiveTask', 400);
      }

      console.log('ID de usuario extraído:', userId);
      
      if (!userId) {
        console.error('Error: No se pudo extraer el ID de usuario');
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición con manejo de errores
      let formData: CognitiveTaskFormData;
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

      // Crear el formulario CognitiveTask usando el servicio
      console.log('Llamando al servicio para crear formulario CognitiveTask...');
      
      const cognitiveTaskForm = await this.cognitiveTaskService.createCognitiveTaskForm(researchId, formData);
      console.log('Formulario CognitiveTask creado exitosamente:', cognitiveTaskForm.id);

      return createResponse(201, {
        message: 'Formulario CognitiveTask creado exitosamente',
        data: cognitiveTaskForm
      });
    } catch (error) {
      console.error('Error en createCognitiveTaskForm:', error);
      return this.handleError(error);
    }
  }

  /**
   * Obtiene un formulario CognitiveTask por su ID
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario CognitiveTask solicitado
   */
  async getCognitiveTaskFormById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      if (!formId) {
        return errorResponse('Se requiere un ID de formulario CognitiveTask', 400);
      }

      // Obtener el formulario CognitiveTask usando el servicio
      const cognitiveTaskForm = await this.cognitiveTaskService.getCognitiveTaskFormById(formId);
      
      if (!cognitiveTaskForm) {
        return errorResponse('Formulario CognitiveTask no encontrado', 404);
      }

      return createResponse(200, {
        data: cognitiveTaskForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene el formulario CognitiveTask de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario CognitiveTask de la investigación
   */
  async getCognitiveTaskFormByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      
      console.log('DEBUG - getCognitiveTaskFormByResearchId:', {
        path: event.path,
        pathParameters: event.pathParameters,
        researchId
      });
      
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Obtener el formulario CognitiveTask usando el servicio
      const cognitiveTaskForm = await this.cognitiveTaskService.getCognitiveTaskFormByResearchId(researchId);
      
      if (!cognitiveTaskForm) {
        return createResponse(200, {
          data: null,
          message: 'No existe un formulario CognitiveTask para esta investigación'
        });
      }

      return createResponse(200, {
        data: cognitiveTaskForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza un formulario CognitiveTask
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario CognitiveTask actualizado
   */
  async updateCognitiveTaskForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar el formulario CognitiveTask', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const formData: Partial<CognitiveTaskFormData> = JSON.parse(event.body);

      // Obtener el ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      if (!formId) {
        return errorResponse('Se requiere un ID de formulario CognitiveTask', 400);
      }

      // Actualizar el formulario CognitiveTask usando el servicio
      const updatedForm = await this.cognitiveTaskService.updateCognitiveTaskForm(formId, formData);

      return createResponse(200, {
        message: 'Formulario CognitiveTask actualizado exitosamente',
        data: updatedForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Actualiza o crea el formulario CognitiveTask de una investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario CognitiveTask actualizado o creado
   */
  async createOrUpdateCognitiveTaskForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar el formulario CognitiveTask', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const formData: CognitiveTaskFormData = JSON.parse(event.body);

      // Obtener el ID de la investigación desde los parámetros de ruta
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Actualizar o crear el formulario CognitiveTask usando el servicio
      const cognitiveTaskForm = await this.cognitiveTaskService.createOrUpdateCognitiveTaskForm(researchId, formData);

      return createResponse(200, {
        message: 'Formulario CognitiveTask actualizado exitosamente',
        data: cognitiveTaskForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Elimina un formulario CognitiveTask
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el resultado de la eliminación
   */
  async deleteCognitiveTaskForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener el ID del formulario desde los parámetros de ruta
      const formId = event.pathParameters?.id;
      if (!formId) {
        return errorResponse('Se requiere un ID de formulario CognitiveTask', 400);
      }

      // Eliminar el formulario CognitiveTask usando el servicio
      await this.cognitiveTaskService.deleteCognitiveTaskForm(formId);

      return createResponse(200, {
        message: 'Formulario CognitiveTask eliminado exitosamente'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Clona un formulario CognitiveTask existente para una nueva investigación
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el formulario CognitiveTask clonado
   */
  async cloneCognitiveTaskForm(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para clonar el formulario CognitiveTask', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const cloneData: { sourceFormId: string; targetResearchId: string } = JSON.parse(event.body);
      
      if (!cloneData.sourceFormId || !cloneData.targetResearchId) {
        return errorResponse('Se requiere sourceFormId y targetResearchId para clonar el formulario', 400);
      }

      // Clonar el formulario CognitiveTask usando el servicio
      const clonedForm = await this.cognitiveTaskService.cloneCognitiveTaskForm(
        cloneData.sourceFormId,
        cloneData.targetResearchId
      );

      return createResponse(201, {
        message: 'Formulario CognitiveTask clonado exitosamente',
        data: clonedForm
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene todos los formularios CognitiveTask
   * @returns Respuesta HTTP con todos los formularios CognitiveTask
   */
  async getAllCognitiveTaskForms(): Promise<APIGatewayProxyResult> {
    try {
      // Obtener todos los formularios CognitiveTask usando el servicio
      const forms = await this.cognitiveTaskService.getAllForms();
      
      return createResponse(200, {
        data: forms
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Actualizaciones batch de formularios CognitiveTask
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con el resultado de las actualizaciones
   */
  async batchUpdateCognitiveTaskForms(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar los formularios', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const batchData: { formIds: string[]; updateData: Partial<CognitiveTaskFormData> } = JSON.parse(event.body);
      
      if (!batchData.formIds || !Array.isArray(batchData.formIds) || batchData.formIds.length === 0) {
        return errorResponse('Se requiere un array de IDs de formularios para actualizar', 400);
      }

      // Realizar actualizaciones batch usando el servicio
      const successCount = await this.cognitiveTaskService.batchUpdate(
        batchData.formIds,
        batchData.updateData
      );

      return createResponse(200, {
        message: `${successCount} de ${batchData.formIds.length} formularios actualizados exitosamente`,
        successCount,
        totalCount: batchData.formIds.length
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Genera una URL prefirmada para subir un archivo
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la URL prefirmada y metadatos
   */
  async generateFileUploadUrl(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para generar la URL de subida', 400);
      }

      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Parsear el cuerpo de la petición
      const fileParams = JSON.parse(event.body);
      
      // Validar parámetros necesarios
      if (!fileParams.fileName || !fileParams.fileSize || !fileParams.fileType) {
        return errorResponse('Se requiere fileName, fileSize y fileType para generar la URL de subida', 400);
      }

      // Obtener researchId
      const researchId = fileParams.researchId || event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }

      // Generar URL de subida
      const uploadUrlResponse = await this.cognitiveTaskService.getFileUploadUrl({
        fileName: fileParams.fileName,
        fileSize: fileParams.fileSize,
        fileType: fileParams.fileType,
        researchId: researchId
      });

      return createResponse(200, {
        message: 'URL de subida generada exitosamente',
        data: uploadUrlResponse
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Genera una URL prefirmada para descargar un archivo
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la URL prefirmada
   */
  async generateFileDownloadUrl(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener la clave S3 desde los parámetros de ruta
      const s3Key = event.pathParameters?.key;
      if (!s3Key) {
        return errorResponse('Se requiere una clave S3 para descargar el archivo', 400);
      }

      // Obtener tiempo de expiración si se proporciona
      let expiresIn = 3600; // 1 hora por defecto
      if (event.queryStringParameters?.expiresIn) {
        expiresIn = parseInt(event.queryStringParameters.expiresIn, 10);
        if (isNaN(expiresIn) || expiresIn <= 0) {
          return errorResponse('El parámetro expiresIn debe ser un número positivo', 400);
        }
      }

      // Generar URL de descarga
      const downloadUrl = await this.cognitiveTaskService.getFileDownloadUrl(s3Key);

      return createResponse(200, {
        message: 'URL de descarga generada exitosamente',
        url: downloadUrl,
        key: s3Key,
        expiresIn: expiresIn
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Genera una URL prefirmada para eliminar un archivo
   * @param event Evento de API Gateway
   * @returns Respuesta HTTP con la URL prefirmada
   */
  async generateFileDeleteUrl(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!userId) {
        return errorResponse('Usuario no autenticado', 401);
      }

      // Obtener la clave S3 desde los parámetros de ruta
      const s3Key = event.pathParameters?.key;
      if (!s3Key) {
        return errorResponse('Se requiere una clave S3 para eliminar el archivo', 400);
      }

      // Generar URL de eliminación
      const deleteUrl = await this.cognitiveTaskService.getFileDeleteUrl(s3Key);

      return createResponse(200, {
        message: 'URL de eliminación generada exitosamente',
        url: deleteUrl,
        key: s3Key
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Maneja errores comunes y devuelve una respuesta adecuada
   * @param error Error ocurrido
   * @returns Respuesta HTTP con el error
   */
  private handleError(error: any): APIGatewayProxyResult {
    console.error('Error en CognitiveTaskController:', error);
    
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode);
    }
    
    const errorMessage = error.message || 'Error interno del servidor';
    const statusCode = error.statusCode || 500;
    
    return errorResponse(errorMessage, statusCode);
  }
}

// Crear instancia del controlador
const controller = new CognitiveTaskController();

// Definir mapa de rutas para el controlador
const routes: RouteMap = {
  '/cognitive-task': {
    'GET': controller.getAllCognitiveTaskForms.bind(controller),
    'POST': controller.createCognitiveTaskForm.bind(controller)
  },
  '/cognitive-task/:id': {
    'GET': controller.getCognitiveTaskFormById.bind(controller),
    'PUT': controller.updateCognitiveTaskForm.bind(controller),
    'DELETE': controller.deleteCognitiveTaskForm.bind(controller)
  },
  '/research/:researchId/cognitive-task': {
    'GET': controller.getCognitiveTaskFormByResearchId.bind(controller),
    'POST': controller.createOrUpdateCognitiveTaskForm.bind(controller),
    'PUT': controller.createOrUpdateCognitiveTaskForm.bind(controller)
  },
  '/cognitive-task/clone': {
    'POST': controller.cloneCognitiveTaskForm.bind(controller)
  },
  '/cognitive-task/batch-update': {
    'POST': controller.batchUpdateCognitiveTaskForms.bind(controller)
  },
  '/cognitive-task/file/upload': {
    'POST': controller.generateFileUploadUrl.bind(controller)
  },
  '/research/:researchId/cognitive-task/file/upload': {
    'POST': controller.generateFileUploadUrl.bind(controller)
  },
  '/cognitive-task/file/download/:key': {
    'GET': controller.generateFileDownloadUrl.bind(controller)
  },
  '/cognitive-task/file/delete/:key': {
    'DELETE': controller.generateFileDeleteUrl.bind(controller)
  }
};

// Crear y exportar el controlador con las rutas definidas
export const cognitiveTaskController = createController(routes, {
  basePath: '',  // Permite rutas como /research/:researchId/cognitive-task
  publicRoutes: [] // Todas las rutas requieren autenticación
});

export default cognitiveTaskController; 