import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { eyeTrackingRecruitService } from '../services/eyeTrackingRecruit.service';
import { 
  CreateEyeTrackingRecruitRequest 
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';
import { createResponse, errorResponse } from '../utils/controller.utils';
import { createController, RouteMap } from '../utils/controller.decorator';

/**
 * Controlador para la gestión de Eye Tracking Recruit
 */
export class EyeTrackingRecruitController {
  /**
   * Obtiene la configuración de reclutamiento para una investigación
   */
  async getConfigByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }
      
      const config = await eyeTrackingRecruitService.getConfigByResearchId(researchId);
      
      if (!config) {
        return errorResponse('No se encontró configuración para esta investigación', 404);
      }
      
      return createResponse(200, { config });
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Crea una nueva configuración de reclutamiento
   */
  async createConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }
      
      if (!event.body) {
        return errorResponse('Se requieren datos para la configuración', 400);
      }
      
      const configData = JSON.parse(event.body) as CreateEyeTrackingRecruitRequest;
      
      const config = await eyeTrackingRecruitService.createConfig(researchId, configData);
      
      return createResponse(201, { config });
    } catch (error: any) {
      console.error('Error al crear configuración:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Actualiza una configuración existente
   */
  async updateConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar la configuración', 400);
      }
      
      const updateData = JSON.parse(event.body);
      
      const updatedConfig = await eyeTrackingRecruitService.updateConfig(configId, updateData);
      
      return createResponse(200, { config: updatedConfig });
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Marca una configuración como completada
   */
  async completeConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      const updatedConfig = await eyeTrackingRecruitService.completeConfig(configId);
      
      return createResponse(200, { config: updatedConfig });
    } catch (error: any) {
      console.error('Error al completar configuración:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Elimina una configuración
   */
  async deleteConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      await eyeTrackingRecruitService.deleteConfig(configId);
      
      return createResponse(200, { message: 'Configuración eliminada correctamente' });
    } catch (error: any) {
      console.error('Error al eliminar configuración:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Crea un nuevo participante
   */
  async createParticipant(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      if (!event.body) {
        return errorResponse('Se requieren datos para el participante', 400);
      }
      
      const participantData = JSON.parse(event.body);
      
      const participant = await eyeTrackingRecruitService.createParticipant(configId, participantData);
      
      return createResponse(201, { participant });
    } catch (error: any) {
      console.error('Error al crear participante:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Registra un participante para una sesión pública
   */
  async registerPublicParticipant(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return errorResponse('Se requieren datos para el participante', 400);
      }
      
      const { configId, ...participantData } = JSON.parse(event.body);
      
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      const participant = await eyeTrackingRecruitService.createParticipant(configId, participantData);
      
      return createResponse(201, { participant });
    } catch (error: any) {
      console.error('Error al registrar participante público:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Actualiza el estado de un participante
   */
  async updateParticipantStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const participantId = event.pathParameters?.participantId;
      if (!participantId) {
        return errorResponse('Se requiere un ID de participante', 400);
      }
      
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar el estado', 400);
      }
      
      const { status, demographicData } = JSON.parse(event.body);
      
      const updatedParticipant = await eyeTrackingRecruitService.updateParticipantStatus(
        participantId, 
        status, 
        demographicData
      );
      
      return createResponse(200, { participant: updatedParticipant });
    } catch (error: any) {
      console.error('Error al actualizar estado de participante:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Actualiza el estado de un participante público (sin autenticación)
   */
  async updatePublicParticipantStatus(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      const participantId = event.pathParameters?.participantId;
      if (!participantId) {
        return errorResponse('Se requiere un ID de participante', 400);
      }
      
      if (!event.body) {
        return errorResponse('Se requieren datos para actualizar el estado', 400);
      }
      
      const { status, demographicData } = JSON.parse(event.body);
      
      const updatedParticipant = await eyeTrackingRecruitService.updateParticipantStatus(
        participantId, 
        status, 
        demographicData
      );
      
      return createResponse(200, { participant: updatedParticipant });
    } catch (error: any) {
      console.error('Error al actualizar estado de participante público:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Obtiene los participantes para una configuración
   */
  async getParticipantsByConfigId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      const participants = await eyeTrackingRecruitService.getParticipantsByConfigId(configId);
      
      return createResponse(200, { participants });
    } catch (error: any) {
      console.error('Error al obtener participantes:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Obtiene estadísticas para una configuración
   */
  async getStatsByConfigId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      const stats = await eyeTrackingRecruitService.getStatsByConfigId(configId);
      
      return createResponse(200, { stats });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Genera un enlace de reclutamiento
   */
  async generateRecruitmentLink(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      if (!event.body) {
        return errorResponse('Se requieren parámetros para el enlace', 400);
      }
      
      const { type, expirationDays } = JSON.parse(event.body);
      
      const link = await eyeTrackingRecruitService.generateRecruitmentLink(
        configId, 
        type, 
        expirationDays
      );
      
      return createResponse(201, { link });
    } catch (error: any) {
      console.error('Error al generar enlace de reclutamiento:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Obtiene enlaces activos para una configuración
   */
  async getActiveLinks(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const configId = event.pathParameters?.configId;
      if (!configId) {
        return errorResponse('Se requiere un ID de configuración', 400);
      }
      
      const links = await eyeTrackingRecruitService.getActiveLinks(configId);
      
      return createResponse(200, { links });
    } catch (error: any) {
      console.error('Error al obtener enlaces activos:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Desactiva un enlace
   */
  async deactivateLink(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const token = event.pathParameters?.token;
      if (!token) {
        return errorResponse('Se requiere un token de enlace', 400);
      }
      
      const deactivatedLink = await eyeTrackingRecruitService.deactivateLink(token);
      
      return createResponse(200, { link: deactivatedLink });
    } catch (error: any) {
      console.error('Error al desactivar enlace:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Valida un enlace (ruta pública)
   */
  async validateRecruitmentLink(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      const token = event.pathParameters?.token;
      if (!token) {
        return errorResponse('Se requiere un token de enlace', 400);
      }
      
      const link = await eyeTrackingRecruitService.validateRecruitmentLink(token);
      
      return createResponse(200, { link });
    } catch (error: any) {
      console.error('Error al validar enlace:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Genera un resumen para una investigación
   */
  async getResearchSummary(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;
      
      if (!researchId) {
        return errorResponse('Se requiere un ID de investigación', 400);
      }
      
      const summary = await eyeTrackingRecruitService.getResearchSummary(researchId);
      
      return createResponse(200, { summary });
    } catch (error: any) {
      console.error('Error al generar resumen de investigación:', error);
      return this.handleError(error);
    }
  }
  
  /**
   * Maneja errores comunes y genera respuestas apropiadas
   */
  private handleError(error: any): APIGatewayProxyResult {
    if (error.statusCode === 404) {
      return errorResponse(error.message, 404);
    }
    
    if (error.statusCode === 400) {
      return errorResponse(error.message, 400);
    }
    
    if (error.statusCode === 403) {
      return errorResponse(error.message, 403);
    }
    
    // Error de servidor por defecto
    return errorResponse('Error interno del servidor', 500);
  }
}

// Instancia del controlador
const controller = new EyeTrackingRecruitController();

// Definir el mapa de rutas
const eyeTrackingRecruitRouteMap: RouteMap = {
  // Rutas para configuraciones
  '/eye-tracking-recruit/research/:researchId/config': {
    'GET': controller.getConfigByResearchId.bind(controller),
    'POST': controller.createConfig.bind(controller)
  },
  '/eye-tracking-recruit/config/:configId': {
    'PUT': controller.updateConfig.bind(controller),
    'DELETE': controller.deleteConfig.bind(controller)
  },
  '/eye-tracking-recruit/config/:configId/complete': {
    'PUT': controller.completeConfig.bind(controller)
  },
  
  // Rutas para participantes
  '/eye-tracking-recruit/config/:configId/participant': {
    'POST': controller.createParticipant.bind(controller)
  },
  '/eye-tracking-recruit/participant/:participantId/status': {
    'PUT': controller.updateParticipantStatus.bind(controller)
  },
  '/eye-tracking-recruit/config/:configId/participants': {
    'GET': controller.getParticipantsByConfigId.bind(controller)
  },
  '/eye-tracking-recruit/config/:configId/stats': {
    'GET': controller.getStatsByConfigId.bind(controller)
  },
  
  // Rutas para enlaces
  '/eye-tracking-recruit/config/:configId/link': {
    'POST': controller.generateRecruitmentLink.bind(controller)
  },
  '/eye-tracking-recruit/config/:configId/links': {
    'GET': controller.getActiveLinks.bind(controller)
  },
  '/eye-tracking-recruit/link/:token/deactivate': {
    'PUT': controller.deactivateLink.bind(controller)
  },
  '/eye-tracking-recruit/link/:token/validate': {
    'GET': controller.validateRecruitmentLink.bind(controller)
  },
  
  // Ruta para resumen
  '/eye-tracking-recruit/research/:researchId/summary': {
    'GET': controller.getResearchSummary.bind(controller)
  },
  
  // Rutas públicas para participantes
  '/eye-tracking-recruit/public/participant': {
    'POST': controller.registerPublicParticipant.bind(controller)
  },
  '/eye-tracking-recruit/public/participant/:participantId/status': {
    'PUT': controller.updatePublicParticipantStatus.bind(controller)
  }
};

/**
 * Manejador principal para las rutas de Eye Tracking Recruit
 */
export const eyeTrackingRecruitHandler = createController(eyeTrackingRecruitRouteMap, {
  basePath: '/eye-tracking-recruit',
  // Rutas que no requieren autenticación
  publicRoutes: [
    { path: '/link/:token/validate', method: 'GET' },
    { path: '/public/participant', method: 'POST' },
    { path: '/public/participant/:participantId/status', method: 'PUT' }
  ]
}); 