import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getCorsHeaders } from '../middlewares/cors';
import { NewResearchService } from '../services/newResearch.service';
import { participantService } from '../services/participant.service';

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

      const researchData = await this.researchServiceInstance.getResearchById(validatedData.researchId, 'public-check');
      if (!researchData) {
        console.warn(`[ParticipantController.login] Intento de login para investigación inexistente: ${validatedData.researchId}`);
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'La investigación especificada no existe.', status: 404 })
        };
      }

      let participant = await participantService.findByEmail(validatedData.email);

      if (participant) {
        if (participant.name !== validatedData.name) {
          console.warn(`[ParticipantController.login] Conflicto de nombre para email existente. Email: ${validatedData.email}, Nombre Guardado: ${participant.name}, Nombre Solicitado: ${validatedData.name}`);
          return {
            statusCode: 409,
            headers: getCorsHeaders(event),
            body: JSON.stringify({
              error: `El email '${validatedData.email}' ya está registrado con un nombre diferente. Por favor, verifica los datos ingresados.`,
              status: 409
            })
          };
        }
        console.log(`[ParticipantController.login] Participante existente encontrado por email: ${validatedData.email}, ID: ${participant.id}`);
      } else {
        console.log(`[ParticipantController.login] Creando nuevo participante para email: ${validatedData.email}`);
        participant = await participantService.create({
          name: validatedData.name,
          email: validatedData.email
        });
        console.log(`[ParticipantController.login] Nuevo participante creado. ID: ${participant.id}`);
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
            participant: {
              id: participant.id,
              name: participant.name,
              email: participant.email
            },
            token: token
          },
          status: 200
        })
      };
    } catch (error: any) {
      console.error('[ParticipantController.login] Error en login de participante:', error);
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: error.errors, status: 400 })
        };
      }
      if (error?.statusCode === 403) {
        return {
          statusCode: 403,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: error.message || 'No tienes permiso para esta acción', status: 403 })
        };
      }
      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error interno en el login',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Genera participantes dummy para una investigación
   */
  async generateDummyParticipants(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para generar participantes',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);
      const { researchId, count = 5 } = data;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'researchId es requerido',
            status: 400
          })
        };
      }

      // Validar que la investigación existe
      const researchData = await this.researchServiceInstance.getResearchById(researchId, 'public-check');
      if (!researchData) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'La investigación especificada no existe',
            status: 404
          })
        };
      }

      // Generar nombres y emails dummy
      const dummyNames = [
        'Ana García', 'Carlos López', 'María Rodríguez', 'Juan Martínez', 'Laura Sánchez',
        'Pedro Gómez', 'Carmen Fernández', 'Miguel Ruiz', 'Isabel Díaz', 'Francisco Moreno',
        'Pilar Muñoz', 'Antonio Álvarez', 'Rosa Romero', 'José Gutiérrez', 'Elena Navarro'
      ];

      const generatedParticipants = [];
      const maxParticipants = Math.min(count, 15); // Límite de 15 participantes

      for (let i = 0; i < maxParticipants; i++) {
        const name = dummyNames[i % dummyNames.length];
        const email = `participante${i + 1}@dummy.com`;

        // Verificar si ya existe un participante con este email
        const existingParticipant = await participantService.findByEmail(email);
        
        let participant;
        if (existingParticipant) {
          participant = existingParticipant;
        } else {
          // Crear nuevo participante
          participant = await participantService.create({
            name,
            email
          });
        }

        generatedParticipants.push({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          publicTestsUrl: `${process.env.PUBLIC_TESTS_URL || 'http://localhost:4700'}?researchId=${researchId}&userId=${participant.id}`
        });
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: {
            researchId,
            participants: generatedParticipants,
            totalGenerated: generatedParticipants.length
          },
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error generando participantes dummy:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al generar participantes dummy',
          status: 500
        })
      };
    }
  }

  /**
   * Obtiene participantes de una investigación específica
   */
  async getParticipantsByResearch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'researchId es requerido',
            status: 400
          })
        };
      }

      // Validar que la investigación existe
      const researchData = await this.researchServiceInstance.getResearchById(researchId, 'public-check');
      if (!researchData) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'La investigación especificada no existe',
            status: 404
          })
        };
      }

      // Por ahora retornamos todos los participantes, 
      // en el futuro se puede filtrar por investigación si se agrega esa relación
      const participants = await participantService.findAll();
      
      const participantsWithUrls = participants.map(participant => ({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        createdAt: participant.createdAt,
        publicTestsUrl: `${process.env.PUBLIC_TESTS_URL || 'http://localhost:4700'}?researchId=${researchId}&userId=${participant.id}`
      }));

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: {
            researchId,
            participants: participantsWithUrls,
            total: participantsWithUrls.length
          },
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error obteniendo participantes por investigación:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener participantes',
          status: 500
        })
      };
    }
  }

  /**
   * Elimina un participante específico de una investigación
   */
  async deleteParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;
      const participantId = event.pathParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            error: 'researchId y participantId son requeridos'
          })
        };
      }

      // 🎯 ELIMINAR PARTICIPANTE DE DYNAMODB
      const deleteData = {
        researchId,
        participantId,
        deletedAt: new Date().toISOString(),
        deletedBy: 'admin', // TODO: Obtener del token de autenticación
        reason: 'Manual deletion from dashboard'
      };

      // 🎯 ELIMINAR REGISTROS RELACIONADOS
      await participantService.deleteParticipantData(researchId, participantId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Participante eliminado correctamente',
          data: {
            researchId,
            participantId,
            deletedAt: deleteData.deletedAt
          }
        })
      };

    } catch (error) {
      console.error('Error eliminando participante:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
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
    } else if (path === '/participants/generate' && method === 'POST') {
      // 🎯 NUEVA RUTA: Generar participantes dummy
      return controller.generateDummyParticipants(event);
    } else if (method === 'GET' && path.match(/^\/research\/[\w-]+\/participants$/)) {
      // 🎯 NUEVA RUTA: Obtener participantes de una investigación
      return controller.getParticipantsByResearch(event);
    } else if (method === 'DELETE' && path.match(/^\/research\/[\w-]+\/participants\/[\w-]+$/)) {
      // 🎯 NUEVA RUTA: Eliminar participante específico de una investigación
      return controller.deleteParticipant(event);
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
