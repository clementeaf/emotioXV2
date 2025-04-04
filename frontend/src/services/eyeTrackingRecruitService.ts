import { apiClient } from '../config/api-client';
import {
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitParticipant,
  EyeTrackingRecruitStats,
  CreateEyeTrackingRecruitRequest,
  UpdateEyeTrackingRecruitRequest,
  GenerateRecruitmentLinkResponse,
  RecruitLinkType
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';

/**
 * Tipo para enlaces de reclutamiento
 */
interface RecruitmentLink {
  id?: string;
  token: string;
  configId: string;
  researchId: string;
  type: RecruitLinkType;
  createdAt: Date;
  expiresAt?: Date;
  lastAccessedAt?: Date;
  isActive: boolean;
}

/**
 * Servicio para manejar operaciones relacionadas con el reclutamiento para Eye Tracking
 */
export const eyeTrackingRecruitService = {
  /* ===== Operaciones de Configuración ===== */
  
  /**
   * Obtiene la configuración de reclutamiento para una investigación
   * @param researchId ID de la investigación
   * @returns Configuración de reclutamiento
   */
  async getConfigByResearchId(researchId: string): Promise<EyeTrackingRecruitConfig | null> {
    try {
      return await apiClient.get<EyeTrackingRecruitConfig, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'getConfigByResearchId', 
        { researchId }
      );
    } catch (error) {
      console.error(`Error al obtener configuración de reclutamiento para investigación ${researchId}:`, error);
      throw error;
    }
  },
  
  /**
   * Crea una nueva configuración de reclutamiento
   * @param researchId ID de la investigación
   * @param data Datos de la configuración
   * @returns Configuración creada
   */
  async createConfig(researchId: string, data: CreateEyeTrackingRecruitRequest): Promise<EyeTrackingRecruitConfig> {
    try {
      return await apiClient.post<EyeTrackingRecruitConfig, CreateEyeTrackingRecruitRequest, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'createConfig', 
        data, 
        { researchId }
      );
    } catch (error) {
      console.error(`Error al crear configuración de reclutamiento para investigación ${researchId}:`, error);
      throw error;
    }
  },
  
  /**
   * Actualiza una configuración de reclutamiento existente
   * @param configId ID de la configuración
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async updateConfig(configId: string, data: UpdateEyeTrackingRecruitRequest): Promise<EyeTrackingRecruitConfig> {
    try {
      return await apiClient.put<EyeTrackingRecruitConfig, UpdateEyeTrackingRecruitRequest, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'updateConfig', 
        data, 
        { configId }
      );
    } catch (error) {
      console.error(`Error al actualizar configuración de reclutamiento ${configId}:`, error);
      throw error;
    }
  },
  
  /**
   * Marca una configuración como completada
   * @param configId ID de la configuración
   * @returns Configuración actualizada
   */
  async completeConfig(configId: string): Promise<EyeTrackingRecruitConfig> {
    try {
      return await apiClient.put<EyeTrackingRecruitConfig, {}, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'completeConfig', 
        {}, 
        { configId }
      );
    } catch (error) {
      console.error(`Error al completar configuración de reclutamiento ${configId}:`, error);
      throw error;
    }
  },
  
  /**
   * Elimina una configuración de reclutamiento
   * @param configId ID de la configuración
   * @returns Confirmación de eliminación
   */
  async deleteConfig(configId: string): Promise<void> {
    try {
      await apiClient.delete<void, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'deleteConfig', 
        { configId }
      );
    } catch (error) {
      console.error(`Error al eliminar configuración de reclutamiento ${configId}:`, error);
      throw error;
    }
  },
  
  /* ===== Operaciones de Participantes ===== */
  
  /**
   * Crea un nuevo participante
   * @param configId ID de la configuración
   * @param data Datos del participante
   * @returns Participante creado
   */
  async createParticipant(configId: string, data: Partial<EyeTrackingRecruitParticipant>): Promise<EyeTrackingRecruitParticipant> {
    try {
      return await apiClient.post<EyeTrackingRecruitParticipant, Partial<EyeTrackingRecruitParticipant>, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'createParticipant', 
        data, 
        { configId }
      );
    } catch (error) {
      console.error(`Error al crear participante para configuración ${configId}:`, error);
      throw error;
    }
  },
  
  /**
   * Actualiza el estado de un participante
   * @param participantId ID del participante
   * @param status Nuevo estado
   * @returns Participante actualizado
   */
  async updateParticipantStatus(participantId: string, status: string): Promise<EyeTrackingRecruitParticipant> {
    try {
      return await apiClient.put<EyeTrackingRecruitParticipant, { status: string }, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'updateParticipantStatus', 
        { status }, 
        { participantId }
      );
    } catch (error) {
      console.error(`Error al actualizar estado del participante ${participantId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene los participantes para una configuración
   * @param configId ID de la configuración
   * @returns Lista de participantes
   */
  async getParticipantsByConfigId(configId: string): Promise<EyeTrackingRecruitParticipant[]> {
    try {
      return await apiClient.get<EyeTrackingRecruitParticipant[], 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'getParticipantsByConfigId', 
        { configId }
      );
    } catch (error) {
      console.error(`Error al obtener participantes para configuración ${configId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene estadísticas de participantes para una configuración
   * @param configId ID de la configuración
   * @returns Estadísticas de participantes
   */
  async getStatsByConfigId(configId: string): Promise<EyeTrackingRecruitStats> {
    try {
      return await apiClient.get<EyeTrackingRecruitStats, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'getStatsByConfigId', 
        { configId }
      );
    } catch (error) {
      console.error(`Error al obtener estadísticas para configuración ${configId}:`, error);
      throw error;
    }
  },
  
  /* ===== Operaciones de Enlaces de Reclutamiento ===== */
  
  /**
   * Genera un enlace de reclutamiento
   * @param configId ID de la configuración
   * @param type Tipo de enlace
   * @param expirationDays Días hasta la expiración
   * @returns Respuesta con el enlace generado
   */
  async generateRecruitmentLink(
    configId: string, 
    type: RecruitLinkType = RecruitLinkType.STANDARD,
    expirationDays?: number
  ): Promise<GenerateRecruitmentLinkResponse> {
    try {
      return await apiClient.post<GenerateRecruitmentLinkResponse, { type: RecruitLinkType, expirationDays?: number }, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'generateRecruitmentLink', 
        { type, expirationDays }, 
        { configId }
      );
    } catch (error) {
      console.error(`Error al generar enlace de reclutamiento para configuración ${configId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtiene los enlaces activos para una configuración
   * @param configId ID de la configuración
   * @returns Lista de enlaces activos
   */
  async getActiveLinks(configId: string): Promise<RecruitmentLink[]> {
    try {
      return await apiClient.get<RecruitmentLink[], 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'getActiveLinks', 
        { configId }
      );
    } catch (error) {
      console.error(`Error al obtener enlaces activos para configuración ${configId}:`, error);
      throw error;
    }
  },
  
  /**
   * Desactiva un enlace de reclutamiento
   * @param token Token del enlace
   * @returns Enlace desactivado
   */
  async deactivateLink(token: string): Promise<RecruitmentLink> {
    try {
      return await apiClient.put<RecruitmentLink, {}, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'deactivateLink', 
        {}, 
        { token }
      );
    } catch (error) {
      console.error(`Error al desactivar enlace de reclutamiento ${token}:`, error);
      throw error;
    }
  },
  
  /**
   * Valida un enlace de reclutamiento
   * @param token Token del enlace
   * @returns Respuesta de validación
   */
  async validateRecruitmentLink(token: string): Promise<{ valid: boolean, link?: RecruitmentLink }> {
    try {
      return await apiClient.get<{ valid: boolean, link?: RecruitmentLink }, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'validateRecruitmentLink', 
        { token }
      );
    } catch (error) {
      console.error(`Error al validar enlace de reclutamiento ${token}:`, error);
      throw error;
    }
  },
  
  /* ===== Operaciones de Resumen ===== */
  
  /**
   * Obtiene un resumen de la investigación
   * @param researchId ID de la investigación
   * @returns Resumen de la investigación
   */
  async getResearchSummary(researchId: string): Promise<any> {
    try {
      return await apiClient.get<any, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'getResearchSummary', 
        { researchId }
      );
    } catch (error) {
      console.error(`Error al obtener resumen de investigación ${researchId}:`, error);
      throw error;
    }
  },
  
  /* ===== Operaciones Públicas para Participantes ===== */
  
  /**
   * Registra un participante público
   * @param data Datos del participante
   * @returns Participante registrado
   */
  async registerPublicParticipant(data: Partial<EyeTrackingRecruitParticipant>): Promise<EyeTrackingRecruitParticipant> {
    try {
      return await apiClient.post<EyeTrackingRecruitParticipant, Partial<EyeTrackingRecruitParticipant>, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'registerPublicParticipant', 
        data
      );
    } catch (error) {
      console.error('Error al registrar participante público:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza el estado de un participante público
   * @param participantId ID del participante
   * @param status Nuevo estado
   * @returns Participante actualizado
   */
  async updatePublicParticipantStatus(participantId: string, status: string): Promise<EyeTrackingRecruitParticipant> {
    try {
      return await apiClient.put<EyeTrackingRecruitParticipant, { status: string }, 'eyeTrackingRecruit'>(
        'eyeTrackingRecruit', 
        'updatePublicParticipantStatus', 
        { status }, 
        { participantId }
      );
    } catch (error) {
      console.error(`Error al actualizar estado del participante público ${participantId}:`, error);
      throw error;
    }
  }
};

export default eyeTrackingRecruitService; 