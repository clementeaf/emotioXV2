import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getCorsHeaders } from '../middlewares/cors';
import { CreateModuleResponseDtoSchema, UpdateModuleResponseDtoSchema } from '../models/moduleResponse.model';
import { moduleResponseService } from '../services/moduleResponse.service';

/**
 * Controlador para el manejo de respuestas de módulos
 */
export class ModuleResponseController {
  constructor() {}

  /**
   * Guardar una respuesta de módulo (crea o actualiza)
   */
  async saveResponse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para guardar la respuesta',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);

      // NUEVO: Logs detallados para debugging
      console.log(`[ModuleResponseController.saveResponse] 📝 Recibiendo respuesta:`, {
        researchId: data.researchId,
        participantId: data.participantId,
        stepType: data.stepType,
        stepTitle: data.stepTitle,
        questionKey: data.questionKey,
        hasQuestionKey: !!data.questionKey
      });

      // Validar los datos utilizando el esquema
      const validatedData = CreateModuleResponseDtoSchema.parse(data);

      // NUEVO: Log de método de búsqueda que se usará
      if (validatedData.questionKey) {
        console.log(`[ModuleResponseController.saveResponse] ✅ Guardando con questionKey: ${validatedData.questionKey}`);
      } else {
        console.log(`[ModuleResponseController.saveResponse] ⚠️ Guardando sin questionKey - usando stepType: ${validatedData.stepType}`);
      }

      // Guardar la respuesta (el servicio decide si es crear o actualizar)
      const savedResponse = await moduleResponseService.saveModuleResponse(validatedData);

      console.log(`[ModuleResponseController.saveResponse] ✅ Respuesta guardada exitosamente:`, {
        responseId: savedResponse.id,
        questionKey: savedResponse.questionKey,
        stepType: savedResponse.stepType
      });

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: savedResponse,
          status: 201
        })
      };
    } catch (error: any) {
      console.error('Error al guardar respuesta:', error);

      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: error.errors,
            status: 400
          })
        };
      }

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al guardar respuesta',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Actualizar una respuesta específica
   */
  async updateResponse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para actualizar la respuesta',
            status: 400
          })
        };
      }

      const responseId = event.pathParameters?.id;
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!responseId || !researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren responseId, researchId y participantId',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);

      // Validar los datos utilizando el esquema
      const validatedData = UpdateModuleResponseDtoSchema.parse(data);

      // Actualizar la respuesta
      const updatedResponse = await moduleResponseService.updateModuleResponse(
        researchId,
        participantId,
        responseId,
        validatedData
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: updatedResponse,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al actualizar respuesta:', error);

      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: error.errors,
            status: 400
          })
        };
      }

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al actualizar respuesta',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener respuestas por research y participante
   */
  async getResponses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren researchId y participantId',
            status: 400
          })
        };
      }

      // Obtener las respuestas
      const responses = await moduleResponseService.getResponsesForParticipant(
        researchId,
        participantId
      );

      if (!responses) {
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            data: null,
            message: 'No hay respuestas para este participante en este research',
            status: 200
          })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: responses,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener respuestas:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener respuestas',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Marcar las respuestas como completadas
   */
  async markAsCompleted(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren researchId y participantId',
            status: 400
          })
        };
      }

      // Marcar como completado
      const completedDocument = await moduleResponseService.markAsCompleted(
        researchId,
        participantId
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: completedDocument,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al marcar como completado:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al marcar como completado',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener todas las respuestas para un research
   */
  async getResponsesByResearch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.id;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener las respuestas
      const responses = await moduleResponseService.getResponsesByResearch(researchId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: responses,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener respuestas por research:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener respuestas por research',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Eliminar todas las respuestas de un participante específico
   */
  async deleteAllResponses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren researchId y participantId',
            status: 400
          })
        };
      }

      // Eliminar todas las respuestas
      const deleted = await moduleResponseService.deleteAllResponses(
        researchId,
        participantId
      );

      if (deleted) {
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            message: 'Respuestas eliminadas exitosamente',
            status: 200
          })
        };
      } else {
        return {
          statusCode: 204,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            message: 'No había respuestas para eliminar',
            status: 204
          })
        };
      }
    } catch (error: any) {
      console.error('Error al eliminar respuestas:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al eliminar respuestas',
          status: error.statusCode || 500
        })
      };
    }
  }
}

/**
 * Handler principal para procesar las peticiones de API Gateway
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new ModuleResponseController();
  const resource = event.resource;
  const method = event.httpMethod;
  const actualPath = event.path;
  const pathParameters = event.pathParameters;

  // Agregar encabezados CORS a las respuestas OPTIONS
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: ''
    };
  }

  try {
    // Rutas para respuestas de módulos
    if (resource === '/module-responses' && method === 'POST') {
      return await controller.saveResponse(event);
    }

    if (resource === '/module-responses/{id}' && method === 'PUT') {
      return await controller.updateResponse(event);
    }

    if (resource === '/module-responses' && method === 'GET') {
      return await controller.getResponses(event);
    }

    if (resource === '/module-responses/complete' && method === 'POST') {
      return await controller.markAsCompleted(event);
    }

    if (resource === '/module-responses/research/{id}' && method === 'GET') {
      return await controller.getResponsesByResearch(event);
    }

    if (resource === '/module-responses' && method === 'DELETE') {
      return await controller.deleteAllResponses(event);
    }

    // Fallback: intentar con actualPath si resource no coincide
    if (actualPath.startsWith('/module-responses/') && method === 'PUT') {
      return await controller.updateResponse(event);
    }

    // Si no se encuentra la ruta
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Ruta no encontrada',
        status: 404,
        debug: {
          resource,
          method,
          actualPath,
          pathParameters: event.pathParameters
        }
      })
    };
  } catch (error: any) {
    console.error('Error no controlado:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Error interno del servidor',
        status: 500
      })
    };
  }
};
