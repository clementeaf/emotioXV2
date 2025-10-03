import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getCorsHeaders } from '../middlewares/cors';
import { NewResearchService } from '../services/newResearch.service';
import { participantService } from '../services/participant.service';
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

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
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.create', 'Error creating participant', { error: (error as Error)?.message || error, stack: (error as Error)?.stack });
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
          error: (error as Error)?.message || 'Error al crear participante',
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
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.getById', 'Error retrieving participant by ID', { participantId: event.pathParameters?.id, error: (error as Error)?.message || error, stack: (error as Error)?.stack });
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
   * Verifica si un participante existe (endpoint público para public-tests)
   */
  async verifyParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const participantId = event.pathParameters?.participantId;
      const researchId = event.queryStringParameters?.researchId;

      if (!participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'participantId es requerido',
            status: 400
          })
        };
      }

      // Verificar que el participante existe
      const participant = await participantService.findById(participantId);

      if (!participant) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Participante no encontrado',
            valid: false,
            status: 404
          })
        };
      }

      // Si se proporciona researchId, verificar que la investigación existe
      if (researchId) {
        const researchData = await this.researchServiceInstance.getResearchById(researchId, 'public-check');
        if (!researchData) {
          return {
            statusCode: 404,
            headers: getCorsHeaders(event),
            body: JSON.stringify({
              error: 'Investigación no encontrada',
              valid: false,
              status: 404
            })
          };
        }
      }

      // Retornar información básica del participante (sin datos sensibles)
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: {
            id: participant.id,
            name: participant.name,
            email: participant.email,
            valid: true
          },
          status: 200
        })
      };
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.verifyParticipant', 'Error verifying participant', { participantId: event.pathParameters?.participantId, researchId: event.queryStringParameters?.researchId, error: (error as Error)?.message || error, stack: (error as Error)?.stack });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error al verificar participante',
          valid: false,
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
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.getAll', 'Error retrieving all participants', { error: (error as Error)?.message || error, stack: (error as Error)?.stack });
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
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.delete', 'Error deleting participant', { participantId: event.pathParameters?.id, error: (error as Error)?.message || error, stack: (error as Error)?.stack });
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
        structuredLog('warn', 'ParticipantController.login', 'Login attempt for non-existent research', { researchId: validatedData.researchId, email: validatedData.email });
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'La investigación especificada no existe.', status: 404 })
        };
      }

      let participant = await participantService.findByEmail(validatedData.email);

      if (participant) {
        if (participant.name !== validatedData.name) {
          structuredLog('warn', 'ParticipantController.login', 'Name conflict for existing email', { email: validatedData.email, existingName: participant.name, requestedName: validatedData.name });
          return {
            statusCode: 409,
            headers: getCorsHeaders(event),
            body: JSON.stringify({
              error: `El email '${validatedData.email}' ya está registrado con un nombre diferente. Por favor, verifica los datos ingresados.`,
              status: 409
            })
          };
        }
        structuredLog('info', 'ParticipantController.login', 'Existing participant found by email', { email: validatedData.email, participantId: participant.id });
      } else {
        structuredLog('info', 'ParticipantController.login', 'Creating new participant for email', { email: validatedData.email });
        participant = await participantService.create({
          name: validatedData.name,
          email: validatedData.email
        });
        structuredLog('info', 'ParticipantController.login', 'New participant created successfully', { participantId: participant.id, email: validatedData.email });
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
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      structuredLog('error', 'ParticipantController.login', 'Error in participant login', { error: appError.message, stack: appError.stack, statusCode: appError.statusCode });
      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: error.errors, status: 400 })
        };
      }
      if (appError.statusCode === 403) {
        return {
          statusCode: 403,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: appError.message || 'No tienes permiso para esta acción', status: 403 })
        };
      }
      return {
        statusCode: appError.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: appError.message || 'Error interno en el login',
          status: appError.statusCode || 500
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
      try {
        await this.researchServiceInstance.getResearchById(researchId, 'user');
      } catch (error: unknown) {
        const appError = toApplicationError(error);
        structuredLog('error', 'ParticipantController.generateDummyParticipants', 'Error validating research', { researchId, error: appError.message, statusCode: appError.statusCode });
        // Si es un ResearchError, devolver el código de estado específico
        if (appError.statusCode === 404) {
          return {
            statusCode: 404,
            headers: getCorsHeaders(event),
            body: JSON.stringify({
              error: 'La investigación especificada no existe',
              status: 404
            })
          };
        } else if (appError.statusCode === 403) {
          return {
            statusCode: 403,
            headers: getCorsHeaders(event),
            body: JSON.stringify({
              error: 'La investigación no está activa',
              status: 403
            })
          };
        } else {
          throw error; // Re-lanzar otros errores
        }
      }

      // Generar nombres y emails dummy ÚNICOS
      const dummyNames = [
        'Ana García', 'Carlos López', 'María Rodríguez', 'Juan Martínez', 'Laura Sánchez',
        'Pedro Gómez', 'Carmen Fernández', 'Miguel Ruiz', 'Isabel Díaz', 'Francisco Moreno',
        'Pilar Muñoz', 'Antonio Álvarez', 'Rosa Romero', 'José Gutiérrez', 'Elena Navarro',
        'David Torres', 'Lucía Vázquez', 'Raúl Herrera', 'Sandra Jiménez', 'Roberto Castro'
      ];

      const generatedParticipants = [];
      const maxParticipants = Math.min(count, 20);
      const timestamp = Date.now();

      for (let i = 0; i < maxParticipants; i++) {
        const name = dummyNames[i % dummyNames.length];
        // 🎯 GENERAR EMAIL ÚNICO con timestamp + índice + UUID parcial
        const uniqueId = uuidv4().slice(0, 8);
        const email = `participante.${timestamp}.${i}.${uniqueId}@study.emotioxv2.com`;

        structuredLog('info', 'ParticipantController.generateDummyParticipants', `Creating participant ${i + 1}/${maxParticipants}`, {
          name,
          emailPrefix: email.substring(0, 30) + '...',
          uniqueId,
          researchId
        });

        // 🎯 SIEMPRE CREAR NUEVO PARTICIPANTE (no verificar existencia)
        const participant = await participantService.create({
          name,
          email
        });

        generatedParticipants.push({
          id: participant.id,
          name: participant.name,
          email: participant.email,
          publicTestsUrl: `${process.env.PUBLIC_TESTS_URL || 'https://d2zt8ia21te5mv.cloudfront.net'}?researchId=${researchId}&userId=${participant.id}`
        });

        structuredLog('info', 'ParticipantController.generateDummyParticipants', 'Participant created successfully', {
          participantId: participant.id,
          name: participant.name,
          emailPrefix: participant.email.substring(0, 20) + '...',
          researchId
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
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.generateDummyParticipants', 'Error generating dummy participants', { researchId: JSON.parse(event.body || '{}').researchId, error: (error as Error)?.message || error, stack: (error as Error)?.stack });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: (error as Error)?.message || 'Error al generar participantes dummy',
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
        publicTestsUrl: `${process.env.PUBLIC_TESTS_URL || 'https://d2zt8ia21te5mv.cloudfront.net'}?researchId=${researchId}&participantId=${participant.id}`
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
    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.getParticipantsByResearch', 'Error retrieving participants by research', { researchId: event.pathParameters?.researchId, error: (error as Error)?.message || error, stack: (error as Error)?.stack });
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: (error as Error)?.message || 'Error al obtener participantes',
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

    } catch (error: unknown) {
      structuredLog('error', 'ParticipantController.deleteParticipant', 'Error deleting participant', { researchId: event.pathParameters?.researchId, participantId: event.pathParameters?.participantId, error: (error as Error)?.message || error, stack: (error as Error)?.stack });
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
    } else if (method === 'GET' && path.match(/^\/participants\/verify\/[\w-]+$/)) {
      // 🎯 NUEVA RUTA: Verificar participante (público, sin auth)
      return controller.verifyParticipant(event);
    }

    // Ruta no encontrada o método no permitido en ruta existente
    structuredLog('warn', 'ParticipantController.mainHandler', 'Unhandled route/method', { method, path });
    return {
      statusCode: 404, // Cambiado a 404 genérico para rutas no encontradas
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Recurso no encontrado', status: 404 })
    };
  } catch (error: unknown) {
    structuredLog('error', 'ParticipantController.mainHandler', 'Error in participant handler', { error: (error as Error)?.message || error, stack: (error as Error)?.stack });
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
export const handler = mainHandler;
