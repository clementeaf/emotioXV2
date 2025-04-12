import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createController, RouteMap } from '../utils/controller.decorator';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { authService } from '../services/auth.service';
import { z } from 'zod';
import { uuidv4 } from '../utils/id-generator';

// Esquema de validación para el registro de participante
const ParticipantRegistrationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  researchId: z.string().uuid('ID de investigación inválido')
});

export class ParticipantController {
  /**
   * Registra un nuevo participante y genera un token temporal
   */
  async registerParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Se requieren datos para el registro', 400);
      }

      const data = JSON.parse(event.body);

      // Validar datos de entrada
      const validation = ParticipantRegistrationSchema.safeParse(data);
      if (!validation.success) {
        return errorResponse('Datos de registro inválidos', 400, validation.error.errors);
      }

      // Generar un ID único para el participante
      const participantId = uuidv4();

      // Crear payload para el token
      const tokenPayload = {
        id: participantId,
        email: data.email,
        name: data.name,
        role: 'participant',
        researchId: data.researchId
      };

      // Generar token con duración de 24 horas
      const { token } = await authService.generateToken({
        id: participantId,
        email: data.email,
        name: data.name,
        role: 'participant',
        isActive: true,
        isVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        passwordHash: '', // No necesitamos contraseña para participantes
        preferences: {
          language: 'es',
          notifications: false,
          theme: 'light'
        }
      });

      return createResponse(201, {
        token,
        participantId
      });
    } catch (error) {
      console.error('Error al registrar participante:', error);
      return errorResponse('Error al registrar participante', 500);
    }
  }
}

// Instanciar el controlador
const controller = new ParticipantController();

// Definir el mapa de rutas
const participantRouteMap: RouteMap = {
  '/public/participant/register': {
    'POST': controller.registerParticipant.bind(controller)
  }
};

// Exportar el handler
export const participantHandler = createController(participantRouteMap, {
  basePath: '/participant',
  publicRoutes: [
    { path: '/public/participant/register', method: 'POST' }
  ]
}); 