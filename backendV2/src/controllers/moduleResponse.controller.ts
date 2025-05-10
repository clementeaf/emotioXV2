import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { moduleResponseService } from '../services/moduleResponse.service';
import { getCorsHeaders } from '../middlewares/cors';
import { z } from 'zod';
import { CreateModuleResponseDtoSchema, UpdateModuleResponseDtoSchema } from '../models/moduleResponse.model';

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
      
      // Validar los datos utilizando el esquema
      const validatedData = CreateModuleResponseDtoSchema.parse(data);

      // Guardar la respuesta (el servicio decide si es crear o actualizar)
      const savedResponse = await moduleResponseService.saveModuleResponse(validatedData);

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
}

/**
 * Handler principal para procesar las peticiones de API Gateway
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new ModuleResponseController();
  const path = event.resource;
  const method = event.httpMethod;

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
    if (path === '/module-responses' && method === 'POST') {
      return await controller.saveResponse(event);
    }
    
    if (path === '/module-responses/{id}' && method === 'PUT') {
      return await controller.updateResponse(event);
    }
    
    if (path === '/module-responses' && method === 'GET') {
      return await controller.getResponses(event);
    }
    
    if (path === '/module-responses/complete' && method === 'POST') {
      return await controller.markAsCompleted(event);
    }
    
    if (path === '/module-responses/research/{id}' && method === 'GET') {
      return await controller.getResponsesByResearch(event);
    }

    // Si no se encuentra la ruta
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Ruta no encontrada',
        status: 404
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