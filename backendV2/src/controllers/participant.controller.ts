import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { participantService } from '../services/participant.service';
import { createResponse, errorResponse, getCorsHeaders } from '../utils/controller.utils';
import { z } from 'zod';

// Schema de validación para participantes
const ParticipantSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido')
});

/**
 * Controlador para el manejo de participantes
 */
export class ParticipantController {
  /**
   * Crea un nuevo participante
   */
  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Se requieren datos para crear el participante', 400);
      }

      const data = JSON.parse(event.body);
      const validatedData = ParticipantSchema.parse(data);

      const existingParticipant = await participantService.findByEmail(validatedData.email);
      if (existingParticipant) {
        return errorResponse('Ya existe un participante con este email', 409);
      }

      const newParticipant = await participantService.create({
        ...validatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return createResponse(201, newParticipant);
    } catch (error: any) {
      console.error('Error al crear participante:', error);
      return errorResponse(error.message || 'Error al crear participante', 400);
    }
  }

  /**
   * Obtiene un participante por ID
   */
  async getById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const id = event.pathParameters?.id;
      
      if (!id) {
        return errorResponse('ID de participante no proporcionado', 400);
      }

      const participant = await participantService.findById(id);
      
      if (!participant) {
        return errorResponse('Participante no encontrado', 404);
      }

      return createResponse(200, participant);
    } catch (error: any) {
      console.error('Error al obtener participante:', error);
      return errorResponse('Error al obtener participante', 500);
    }
  }

  /**
   * Obtiene todos los participantes
   */
  async getAll(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const participants = await participantService.findAll();
      return createResponse(200, participants);
    } catch (error: any) {
      console.error('Error al obtener participantes:', error);
      return errorResponse('Error al obtener participantes', 500);
    }
  }

  /**
   * Elimina un participante
   */
  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const id = event.pathParameters?.id;
      
      if (!id) {
        return errorResponse('ID de participante no proporcionado', 400);
      }

      const participant = await participantService.findById(id);
      
      if (!participant) {
        return errorResponse('Participante no encontrado', 404);
      }

      await participantService.delete(id);

      return createResponse(200, {
        message: 'Participante eliminado exitosamente',
        participant
      });
    } catch (error: any) {
      console.error('Error al eliminar participante:', error);
      return errorResponse('Error al eliminar participante', 500);
    }
  }
}

// Instancia del controlador
const controller = new ParticipantController();

/**
 * Handler principal para las rutas de participantes
 */
export const participantHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: ''
      };
    }

    const path = event.path.toLowerCase();
    const method = event.httpMethod;

    // Enrutar según el método y path
    if (method === 'POST' && path === '/participants') {
      return controller.create(event);
    } else if (method === 'GET' && path === '/participants') {
      return controller.getAll(event);
    } else if (method === 'GET' && path.match(/^\/participants\/[\w-]+$/)) {
      return controller.getById(event);
    } else if (method === 'DELETE' && path.match(/^\/participants\/[\w-]+$/)) {
      return controller.delete(event);
    }

    return errorResponse('Método no permitido', 405);
  } catch (error: any) {
    console.error('Error en participantHandler:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 