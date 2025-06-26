import { eyeTrackingRecruitAPI } from '@/lib/eye-tracking-api';
import {
  CreateEyeTrackingRecruitRequest,
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitParticipant,
  EyeTrackingRecruitStats,
  GenerateRecruitmentLinkResponse,
  RecruitLinkType,
  UpdateEyeTrackingRecruitRequest
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
    return eyeTrackingRecruitAPI.getConfigByResearchId(researchId);
  },

  /**
   * Crea una nueva configuración de reclutamiento
   * @param researchId ID de la investigación
   * @param data Datos de la configuración
   * @returns Configuración creada
   */
  async createConfig(researchId: string, data: CreateEyeTrackingRecruitRequest): Promise<EyeTrackingRecruitConfig> {
    return eyeTrackingRecruitAPI.createConfig(researchId, data);
  },

  /**
   * Actualiza una configuración de reclutamiento existente
   * @param configId ID de la configuración
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async updateConfig(configId: string, data: UpdateEyeTrackingRecruitRequest): Promise<EyeTrackingRecruitConfig> {
    return eyeTrackingRecruitAPI.updateConfig(configId, data);
  },

  /**
   * Marca una configuración como completada
   * @param configId ID de la configuración
   * @returns Configuración actualizada
   */
  async completeConfig(configId: string): Promise<EyeTrackingRecruitConfig> {
    return eyeTrackingRecruitAPI.completeConfig(configId);
  },

  /**
   * Elimina una configuración de reclutamiento
   * @param configId ID de la configuración
   * @returns Confirmación de eliminación
   */
  async deleteConfig(configId: string): Promise<void> {
    return eyeTrackingRecruitAPI.deleteConfig(configId);
  },

  /* ===== Operaciones de Participantes ===== */

  /**
   * Crea un nuevo participante
   * @param configId ID de la configuración
   * @param data Datos del participante
   * @returns Participante creado
   */
  async createParticipant(configId: string, data: Partial<EyeTrackingRecruitParticipant>): Promise<EyeTrackingRecruitParticipant> {
    return eyeTrackingRecruitAPI.createParticipant(configId, data);
  },

  /**
   * Actualiza el estado de un participante
   * @param participantId ID del participante
   * @param status Nuevo estado
   * @returns Participante actualizado
   */
  async updateParticipantStatus(participantId: string, status: string): Promise<EyeTrackingRecruitParticipant> {
    return eyeTrackingRecruitAPI.updateParticipantStatus(participantId, status);
  },

  /**
   * Obtiene los participantes para una configuración
   * @param configId ID de la configuración
   * @returns Lista de participantes
   */
  async getParticipantsByConfigId(configId: string): Promise<EyeTrackingRecruitParticipant[]> {
    return eyeTrackingRecruitAPI.getParticipantsByConfigId(configId);
  },

  /**
   * Obtiene estadísticas de participantes para una configuración
   * @param configId ID de la configuración
   * @returns Estadísticas de participantes
   */
  async getStatsByConfigId(configId: string): Promise<EyeTrackingRecruitStats> {
    return eyeTrackingRecruitAPI.getStatsByConfigId(configId);
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
    return eyeTrackingRecruitAPI.generateRecruitmentLink(configId, type, expirationDays);
  },

  /**
   * Obtiene los enlaces activos para una configuración
   * @param configId ID de la configuración
   * @returns Lista de enlaces activos
   */
  async getActiveLinks(configId: string): Promise<RecruitmentLink[]> {
    return eyeTrackingRecruitAPI.getActiveLinks(configId);
  },

  /**
   * Desactiva un enlace de reclutamiento
   * @param token Token del enlace
   * @returns Enlace desactivado
   */
  async deactivateLink(token: string): Promise<RecruitmentLink> {
    return eyeTrackingRecruitAPI.deactivateLink(token);
  },

  /**
   * Valida un enlace de reclutamiento
   * @param token Token del enlace
   * @returns Respuesta de validación
   */
  async validateRecruitmentLink(token: string): Promise<{ valid: boolean, link?: RecruitmentLink }> {
    return eyeTrackingRecruitAPI.validateRecruitmentLink(token);
  },

  /* ===== Operaciones de Resumen ===== */

  /**
   * Obtiene un resumen de la investigación
   * @param researchId ID de la investigación
   * @returns Resumen de la investigación
   */
  async getResearchSummary(researchId: string): Promise<any> {
    return eyeTrackingRecruitAPI.getResearchSummary(researchId);
  },

  /* ===== Operaciones Públicas para Participantes ===== */

  /**
   * Registra un participante público
   * @param data Datos del participante
   * @returns Participante registrado
   */
  async registerPublicParticipant(data: Partial<EyeTrackingRecruitParticipant>): Promise<EyeTrackingRecruitParticipant> {
    return eyeTrackingRecruitAPI.registerPublicParticipant(data);
  },

  /**
   * Actualiza el estado de un participante público
   * @param participantId ID del participante
   * @param status Nuevo estado
   * @returns Participante actualizado
   */
  async updatePublicParticipantStatus(participantId: string, status: string): Promise<EyeTrackingRecruitParticipant> {
    return eyeTrackingRecruitAPI.updatePublicParticipantStatus(participantId, status);
  }
};

export default eyeTrackingRecruitService;
