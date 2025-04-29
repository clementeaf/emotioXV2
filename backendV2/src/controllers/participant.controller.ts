import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { participantService } from '../services/participant.service';
import { getCorsHeaders } from '../middlewares/cors';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';
import { NewResearchService } from '../services/newResearch.service';

// Schema de validación para participantes
const ParticipantSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido')
});

// Schema de validación para login
const LoginSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  researchId: z.string().uuid('Research ID inválido')
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Controlador para el manejo de participantes
 */
export class ParticipantController {
  private researchServiceInstance: NewResearchService;

  constructor() {
    this.researchServiceInstance = new NewResearchService();
  }

  /**
   * Crea un nuevo participante
   */
  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para crear el participante',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);
      const validatedData = ParticipantSchema.parse(data);

      const existingParticipant = await participantService.findByEmail(validatedData.email);
      if (existingParticipant) {
        return {
          statusCode: 409,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Ya existe un participante con este email',
            status: 409
          })
        };
      }

      const newParticipant = await participantService.create(validatedData);

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: newParticipant,
          status: 201
        })
      };
    } catch (error: any) {
      console.error('Error al crear participante:', error);
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: error.errors, status: 400 })
        };
      }
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al crear participante',
          status: 400
        })
      };
    }
  }

  /**
   * Obtiene un participante por ID
   */
  async getById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const id = event.pathParameters?.id;
      
      if (!id) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de participante no proporcionado',
            status: 400
          })
        };
      }

      const participant = await participantService.findById(id);
      
      if (!participant) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Participante no encontrado',
            status: 404
          })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: participant,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener participante:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error al obtener participante',
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene todos los participantes
   */
  async getAll(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const participants = await participantService.findAll();
      return {
        statusCode: 200,
        headers: getCorsHeaders(_event),
        body: JSON.stringify({
          data: participants,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener participantes:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(_event),
        body: JSON.stringify({
          error: 'Error al obtener participantes',
          status: 500
        })
      };
    }
  }

  /**
   * Elimina un participante
   */
  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const id = event.pathParameters?.id;
      
      if (!id) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'ID de participante no proporcionado',
            status: 400
          })
        };
      }

      const participant = await participantService.findById(id);
      
      if (!participant) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Participante no encontrado',
            status: 404
          })
        };
      }

      await participantService.delete(id);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: participant,
          message: 'Participante eliminado exitosamente',
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al eliminar participante:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error al eliminar participante',
          status: 500
        })
      };
    }
  }

  /**
   * Login de participante
   */
  async login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para el login',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);
      const validatedData = LoginSchema.parse(data);

      // --- Validación de Research ID --- 
      const researchData = await this.researchServiceInstance.getResearchById(validatedData.researchId, 'public-check');
      if (!researchData) {
        console.warn(`[ParticipantController.login] Intento de login para investigación inexistente: ${validatedData.researchId}`);
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'La investigación especificada no existe.', status: 404 })
        };
      }
      // --- Fin Validación --- 

      let participant = await participantService.findByEmail(validatedData.email);
      
      if (!participant) {
        participant = await participantService.create({
          name: validatedData.name,
          email: validatedData.email
        });
      }

      const token = jwt.sign(
        { 
          id: participant.id, 
          email: participant.email,
          researchId: validatedData.researchId,
          type: 'participant'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: {
            participant: participant,
            token: token          
          },
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error en login de participante:', error);
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: error.errors, status: 400 })
        };
      }
      // Añadir chequeo para errores con statusCode 403 (Forbidden)
      if (error?.statusCode === 403) {
        return {
            statusCode: 403,
            headers: getCorsHeaders(event),
            body: JSON.stringify({ error: error.message || 'No tienes permiso para esta acción', status: 403 })
        };
      }
      // Manejar otros errores como 500 genérico
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error interno en el login',
          status: 500
        })
      };
    }
  }
}

// Instancia del controlador
const controller = new ParticipantController();

/**
 * Handler principal para las rutas de participantes
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
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
    } else if (path === '/participants/login' && method === 'POST') {
      return controller.login(event);
    }

    // Ruta no encontrada o método no permitido en ruta existente
    console.log('[ParticipantHandler] Ruta/Método no manejado:', { method, path });
    return {
      statusCode: 404, // Cambiado a 404 genérico para rutas no encontradas
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Recurso no encontrado', status: 404 })
    };
  } catch (error: any) {
    console.error('Error en participantHandler:', error);
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