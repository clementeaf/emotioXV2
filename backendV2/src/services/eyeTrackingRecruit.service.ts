import { 
  EyeTrackingRecruitConfig, 
  EyeTrackingRecruitParticipant, 
  EyeTrackingRecruitStats 
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';

import {
  EyeTrackingRecruitConfigModel,
  EyeTrackingRecruitParticipantModel,
  RecruitmentLinkModel,
  RecruitmentLink
} from '../models/eyeTrackingRecruit.model';

// Clase de error para API
class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Servicio para gestionar la funcionalidad de reclutamiento de Eye Tracking
 */
export class EyeTrackingRecruitService {
  /**
   * Obtiene la configuración de reclutamiento para una investigación
   */
  async getConfigByResearchId(researchId: string): Promise<EyeTrackingRecruitConfig | null> {
    const configs = await EyeTrackingRecruitConfigModel.getByResearchId(researchId);
    if (!configs || configs.length === 0) return null;
    
    // Devolvemos la configuración más reciente (asumiendo que puede haber varias)
    return configs.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
      return dateB - dateA;
    })[0];
  }
  
  /**
   * Crea una nueva configuración de reclutamiento
   */
  async createConfig(researchId: string, configData: Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>): Promise<EyeTrackingRecruitConfig> {
    // Verificamos si ya existe una configuración para esta investigación
    const existingConfig = await this.getConfigByResearchId(researchId);
    if (existingConfig) {
      throw new ApiError('Ya existe una configuración para esta investigación', 400);
    }
    
    // Creamos la configuración
    return await EyeTrackingRecruitConfigModel.create({
      ...configData,
      researchId
    });
  }
  
  /**
   * Actualiza una configuración existente
   */
  async updateConfig(configId: string, updateData: Partial<Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>>): Promise<EyeTrackingRecruitConfig> {
    const updatedConfig = await EyeTrackingRecruitConfigModel.update(configId, updateData);
    if (!updatedConfig) {
      throw new ApiError('Configuración no encontrada', 404);
    }
    
    return updatedConfig;
  }
  
  /**
   * Marca una configuración como completada
   */
  async completeConfig(configId: string): Promise<EyeTrackingRecruitConfig> {
    const updatedConfig = await EyeTrackingRecruitConfigModel.markAsCompleted(configId);
    if (!updatedConfig) {
      throw new ApiError('Configuración no encontrada', 404);
    }
    
    return updatedConfig;
  }
  
  /**
   * Elimina una configuración
   */
  async deleteConfig(configId: string): Promise<boolean> {
    const deleted = await EyeTrackingRecruitConfigModel.delete(configId);
    if (!deleted) {
      throw new ApiError('Configuración no encontrada', 404);
    }
    
    return true;
  }
  
  /**
   * Crea un nuevo participante
   */
  async createParticipant(
    recruitConfigId: string, 
    participantData: Partial<Omit<EyeTrackingRecruitParticipant, 'id' | 'recruitConfigId' | 'startedAt' | 'completedAt' | 'sessionDuration'>>
  ): Promise<EyeTrackingRecruitParticipant> {
    // Obtenemos la configuración para verificar que existe y obtener el researchId
    const config = await EyeTrackingRecruitConfigModel.getById(recruitConfigId);
    if (!config) {
      throw new ApiError('Configuración no encontrada', 404);
    }
    
    // Verificamos si se ha alcanzado el límite de participantes si está habilitado
    if (config.participantLimit?.enabled && config.participantLimit.value > 0) {
      const stats = await this.getStatsByConfigId(recruitConfigId);
      if (stats.complete.count >= config.participantLimit.value) {
        throw new ApiError('Se ha alcanzado el límite de participantes', 400);
      }
    }
    
    // Creamos el participante
    return await EyeTrackingRecruitParticipantModel.create({
      ...participantData,
      researchId: config.researchId,
      recruitConfigId,
      status: 'inprogress'
    });
  }
  
  /**
   * Actualiza el estado de un participante
   */
  async updateParticipantStatus(
    participantId: string, 
    status: 'complete' | 'disqualified' | 'overquota' | 'inprogress',
    demographicData?: Record<string, any>
  ): Promise<EyeTrackingRecruitParticipant> {
    const updatedParticipant = await EyeTrackingRecruitParticipantModel.updateStatus(
      participantId, 
      status, 
      demographicData
    );
    
    if (!updatedParticipant) {
      throw new ApiError('Participante no encontrado', 404);
    }
    
    return updatedParticipant;
  }
  
  /**
   * Obtiene los participantes por configuración de reclutamiento
   */
  async getParticipantsByConfigId(configId: string): Promise<EyeTrackingRecruitParticipant[]> {
    return await EyeTrackingRecruitParticipantModel.getByConfigId(configId);
  }
  
  /**
   * Obtiene estadísticas de participantes para una configuración
   */
  async getStatsByConfigId(configId: string): Promise<EyeTrackingRecruitStats> {
    return await EyeTrackingRecruitParticipantModel.getStats(configId);
  }
  
  /**
   * Genera un enlace de reclutamiento
   */
  async generateRecruitmentLink(
    configId: string, 
    type: 'standard' | 'preview' | 'admin' = 'standard',
    expirationDays?: number
  ): Promise<RecruitmentLink> {
    // Obtenemos la configuración para verificar que existe y obtener el researchId
    const config = await EyeTrackingRecruitConfigModel.getById(configId);
    if (!config) {
      throw new ApiError('Configuración no encontrada', 404);
    }
    
    // Calculamos la fecha de expiración si se proporciona
    let expiresAt: string | undefined;
    if (expirationDays && expirationDays > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      expiresAt = expirationDate.toISOString();
    }
    
    /* Solución para el tipo: 
       Estamos usando el operador 'as any' como una solución temporal
       para este problema de tipos ya que el modelo acepta un string opcional
       pero TypeScript no reconoce correctamente la firma. */
    return await RecruitmentLinkModel.create(
      config.researchId, 
      configId, 
      type, 
      expiresAt as any
    );
  }
  
  /**
   * Obtiene todos los enlaces activos para una configuración
   */
  async getActiveLinks(configId: string): Promise<RecruitmentLink[]> {
    return await RecruitmentLinkModel.getActiveByConfigId(configId);
  }
  
  /**
   * Desactiva un enlace
   */
  async deactivateLink(token: string): Promise<RecruitmentLink> {
    const deactivatedLink = await RecruitmentLinkModel.deactivate(token);
    if (!deactivatedLink) {
      throw new ApiError('Enlace no encontrado', 404);
    }
    
    return deactivatedLink;
  }
  
  /**
   * Registra un acceso a un enlace
   */
  async recordLinkAccess(token: string): Promise<RecruitmentLink> {
    const updatedLink = await RecruitmentLinkModel.incrementAccessCount(token);
    if (!updatedLink) {
      throw new ApiError('Enlace no encontrado', 404);
    }
    
    return updatedLink;
  }
  
  /**
   * Valida si un enlace es válido y no ha expirado
   */
  async validateRecruitmentLink(token: string): Promise<RecruitmentLink> {
    const link = await RecruitmentLinkModel.getByToken(token);
    if (!link) {
      throw new ApiError('Enlace no encontrado', 404);
    }
    
    if (!link.isActive) {
      throw new ApiError('El enlace ha sido desactivado', 400);
    }
    
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new ApiError('El enlace ha expirado', 400);
    }
    
    // Incrementamos el contador de accesos
    await this.recordLinkAccess(token);
    
    return link;
  }
  
  /**
   * Genera un resumen de participación para una investigación
   */
  async getResearchSummary(researchId: string): Promise<any> {
    try {
      const config = await this.getConfigByResearchId(researchId);
      
      if (!config) {
        return {
          config: null,
          stats: null,
          activeLinks: []
        };
      }
      
      // Asegurarnos de que config.id no sea undefined
      if (!config.id) {
        throw new Error('ID de configuración no encontrado');
      }
      
      const stats = await this.getStatsByConfigId(config.id);
      const activeLinks = await this.getActiveLinks(config.id);
      
      return {
        config,
        stats,
        activeLinks
      };
    } catch (error) {
      console.error('Error obteniendo resumen de investigación:', error);
      throw error;
    }
  }
}

// Exportamos una instancia del servicio para usar como singleton
export const eyeTrackingRecruitService = new EyeTrackingRecruitService(); 