import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { participantService } from '../services/participant.service';
import { getCorsHeaders } from '../middlewares/cors';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';

// Schema de validación para participantes
const ParticipantSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido')
});

// Schema de validación para login
const LoginSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido')
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

      const newParticipant = await participantService.create({
        ...validatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

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

      // Buscamos o creamos el participante
      let participant = await participantService.findByEmail(validatedData.email);
      
      if (!participant) {
        // Si no existe, lo creamos
        participant = await participantService.create({
          ...validatedData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: participant.id,
          email: participant.email,
          name: participant.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: {
            token,
            participant
          },
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error en login de participante:', error);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error en login de participante',
          status: 400
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
export const participantHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    return {
      statusCode: 405,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Método no permitido',
        status: 405
      })
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