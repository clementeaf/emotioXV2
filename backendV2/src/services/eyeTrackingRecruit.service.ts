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

// <<< Importar utilidades estándar >>>
import { structuredLog } from '../utils/logging.util';
import { ApiError } from '../utils/errors'; 
import { NotFoundError } from '../errors'; 
import { handleDbError } from '../utils/dbError.util';

/**
 * Servicio para gestionar la funcionalidad de reclutamiento de Eye Tracking
 */
export class EyeTrackingRecruitService {
  // <<< Añadir serviceName >>>
  private serviceName = 'EyeTrackingRecruitService';

  /**
   * Obtiene la configuración de reclutamiento para una investigación
   */
  async getConfigByResearchId(researchId: string): Promise<EyeTrackingRecruitConfig> {
    const context = 'getConfigByResearchId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Buscando configuración por researchId', { researchId });
    try {
      // Model now returns single config or null
      const config = await EyeTrackingRecruitConfigModel.getByResearchId(researchId);
      
      // Throw NotFoundError if model returns null
      if (!config) {
        structuredLog('warn', `${this.serviceName}.${context}`, 'No se encontró configuración', { researchId });
        throw new NotFoundError(`Configuración de reclutamiento no encontrada para researchId ${researchId}`);
      }
      
      // Assuming only one config per researchId is valid (model already returns first or null)
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración encontrada', { researchId, configId: config.id });
      return config;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Crea una nueva configuración de reclutamiento
   */
  async createConfig(researchId: string, configData: Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>): Promise<EyeTrackingRecruitConfig> {
    const context = 'createConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Iniciando creación de configuración', { researchId });
    
    // 1. Check existence (getConfigByResearchId now throws NotFoundError)
    let existingConfig: EyeTrackingRecruitConfig | null = null;
    try {
      existingConfig = await this.getConfigByResearchId(researchId);
    } catch (error) {
      if (!(error instanceof NotFoundError)) { // Only ignore NotFoundError
        throw handleDbError(error, `${context} [CheckExistingStep]`, this.serviceName, {});
      }
      // If NotFoundError, existingConfig remains null, proceed to create
    }

    if (existingConfig) {
      structuredLog('warn', `${this.serviceName}.${context}`, 'Conflicto: ya existe configuración para la investigación', { researchId });
      throw new ApiError('Ya existe una configuración para esta investigación', 409);
    }
    
    // 2. Create config
    try {
      const createdConfig = await EyeTrackingRecruitConfigModel.create({
          ...configData,
          researchId
      });
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración creada', { researchId, configId: createdConfig.id });
      return createdConfig;
    } catch (error) {
       // Standardize catch block for create step
       if (error instanceof ApiError || error instanceof NotFoundError) {
          throw error;
       }
       throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Actualiza una configuración existente
   */
  async updateConfig(configId: string, updateData: Partial<Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>>): Promise<EyeTrackingRecruitConfig> {
    const context = 'updateConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando configuración', { configId });
    try {
        // Model's update method checks existence and throws 404
        const updatedConfigResult = await EyeTrackingRecruitConfigModel.update(configId, updateData);
        
        if (!updatedConfigResult) {
            structuredLog('error', `${this.serviceName}.${context}`, 'La actualización del modelo devolvió null inesperadamente', { configId });
            throw new ApiError('Error interno: La actualización no devolvió un resultado válido.', 500);
        }
        
        structuredLog('info', `${this.serviceName}.${context}`, 'Configuración actualizada', { configId });
        return updatedConfigResult;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {}); 
    }
  }
  
  /**
   * Marca una configuración como completada
   */
  async completeConfig(configId: string): Promise<EyeTrackingRecruitConfig> {
    const context = 'completeConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Marcando configuración como completada', { configId });
     try {
        // Model's method checks existence and throws 404
        const updatedConfigResult = await EyeTrackingRecruitConfigModel.markAsCompleted(configId);
        
        if (!updatedConfigResult) {
            structuredLog('error', `${this.serviceName}.${context}`, 'La operación de completar devolvió null inesperadamente', { configId });
            throw new ApiError('Error interno: La operación de completar no devolvió un resultado válido.', 500);
        }

        structuredLog('info', `${this.serviceName}.${context}`, 'Configuración completada', { configId });
        return updatedConfigResult;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Elimina una configuración
   */
  async deleteConfig(configId: string): Promise<boolean> {
    const context = 'deleteConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando configuración', { configId });
    try {
       // Model's method checks existence and throws 404
       await EyeTrackingRecruitConfigModel.delete(configId);
       structuredLog('info', `${this.serviceName}.${context}`, 'Configuración eliminada', { configId });
       return true;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Crea un nuevo participante
   */
  async createParticipant(
    recruitConfigId: string, 
    participantData: Partial<Omit<EyeTrackingRecruitParticipant, 'id' | 'recruitConfigId' | 'startedAt' | 'completedAt' | 'sessionDuration'>>
  ): Promise<EyeTrackingRecruitParticipant> {
    const context = 'createParticipant';
    structuredLog('info', `${this.serviceName}.${context}`, 'Iniciando creación de participante', { recruitConfigId });
    let config: EyeTrackingRecruitConfig | null = null; 
    
    try {
      // 1. Get config (using helper which throws 404 if needed)
      config = await this.getConfigByIdInternal(recruitConfigId, context);

      // 2. Check participant limit (getStatsByConfigId uses standardized error handling)
      if (config.participantLimit?.enabled && config.participantLimit.value > 0) {
        const stats = await this.getStatsByConfigId(recruitConfigId); 
        if (stats.complete.count >= config.participantLimit.value) {
          structuredLog('warn', `${this.serviceName}.${context}`, 'Límite de participantes alcanzado', { recruitConfigId, limit: config.participantLimit.value });
          throw new ApiError('Se ha alcanzado el límite de participantes', 400);
        }
      }
      
      // 3. Create participant
      const newParticipant = await EyeTrackingRecruitParticipantModel.create({
          ...participantData,
          researchId: config.researchId,
          recruitConfigId,
          status: 'inprogress'
      });
      structuredLog('info', `${this.serviceName}.${context}`, 'Participante creado', { participantId: newParticipant.id, recruitConfigId });
      return newParticipant;

    } catch (error) {
      // Standardize catch block
      if (error instanceof ApiError || error instanceof NotFoundError) {
          throw error;
      }
      throw handleDbError(error, context, this.serviceName, {}); 
    }
  }
  
  /**
   * Actualiza el estado de un participante
   */
  async updateParticipantStatus(
    participantId: string, 
    configId: string, 
    status: 'complete' | 'disqualified' | 'overquota' | 'inprogress',
    demographicData?: Record<string, any>
  ): Promise<EyeTrackingRecruitParticipant> {
    const context = 'updateParticipantStatus';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando estado de participante', { participantId, configId, status });
    try {
        // Model's updateStatus checks existence and throws 404
        const updatedParticipant = await EyeTrackingRecruitParticipantModel.updateStatus(
            participantId, 
            configId, 
            status, 
            demographicData
        );

        if (!updatedParticipant) {
             structuredLog('error', `${this.serviceName}.${context}`, 'La actualización de estado devolvió null inesperadamente', { participantId, configId });
             throw new ApiError('Error interno: La actualización de estado no devolvió un resultado válido.', 500);
        }
        structuredLog('info', `${this.serviceName}.${context}`, 'Estado actualizado', { participantId, newStatus: status });
        return updatedParticipant;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error; 
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Obtiene los participantes por configuración de reclutamiento
   */
  async getParticipantsByConfigId(configId: string): Promise<EyeTrackingRecruitParticipant[]> {
    const context = 'getParticipantsByConfigId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo participantes por configId', { configId });
    try {
        const participants = await EyeTrackingRecruitParticipantModel.getByConfigId(configId);
        structuredLog('info', `${this.serviceName}.${context}`, `Encontrados ${participants.length} participantes`, { configId });
        return participants;
    } catch (error) {
        // Standardize catch block
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Obtiene estadísticas de participantes para una configuración
   */
  async getStatsByConfigId(configId: string): Promise<EyeTrackingRecruitStats> {
    const context = 'getStatsByConfigId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo estadísticas por configId', { configId });
    try {
        // Model's getStats calls getByConfigId which has standardized error handling
        const stats = await EyeTrackingRecruitParticipantModel.getStats(configId);
        structuredLog('info', `${this.serviceName}.${context}`, 'Estadísticas obtenidas', { configId, stats });
        return stats;
     } catch (error) {
        // Standardize catch block
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Genera un enlace de reclutamiento
   */
  async generateRecruitmentLink(
    configId: string, 
    type: 'standard' | 'preview' | 'admin' = 'standard',
    expirationDays?: number
  ): Promise<RecruitmentLink> {
    const context = 'generateRecruitmentLink';
    structuredLog('info', `${this.serviceName}.${context}`, 'Generando enlace', { configId, type, expirationDays });
    try {
        // 1. Get config (using helper which throws 404 if needed)
        const config = await this.getConfigByIdInternal(configId, context);

        // 2. Calculate expiration
        let expiresAt: string | undefined;
        if (expirationDays && expirationDays > 0) {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);
            expiresAt = expirationDate.toISOString();
        }
        
        // 3. Create link
        const link = await RecruitmentLinkModel.create(
            config.researchId, 
            configId, 
            type, 
            expiresAt
        );
        structuredLog('info', `${this.serviceName}.${context}`, 'Enlace generado', { linkId: link.id, configId });
        return link;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Obtiene todos los enlaces activos para una configuración
   */
  async getActiveLinks(configId: string): Promise<RecruitmentLink[]> {
    const context = 'getActiveLinks';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo enlaces activos', { configId });
    try {
        const links = await RecruitmentLinkModel.getActiveByConfigId(configId);
        structuredLog('info', `${this.serviceName}.${context}`, `Encontrados ${links.length} enlaces activos`, { configId });
        return links;
    } catch (error) {
        // Standardize catch block
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Desactiva un enlace
   */
  async deactivateLink(token: string): Promise<RecruitmentLink> {
    const context = 'deactivateLink';
    structuredLog('info', `${this.serviceName}.${context}`, 'Desactivando enlace', { token });
    try {
        // Model's deactivate method checks existence and throws 404
        const deactivatedLink = await RecruitmentLinkModel.deactivate(token);

        if (!deactivatedLink) {
             structuredLog('error', `${this.serviceName}.${context}`, 'La desactivación devolvió null inesperadamente', { token });
             throw new ApiError('Error interno: La desactivación no devolvió un resultado válido.', 500);
        }
        structuredLog('info', `${this.serviceName}.${context}`, 'Enlace desactivado', { token, linkId: deactivatedLink.id });
        return deactivatedLink;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Registra un acceso a un enlace
   */
  async recordLinkAccess(token: string): Promise<RecruitmentLink> {
    const context = 'recordLinkAccess';
    structuredLog('info', `${this.serviceName}.${context}`, 'Registrando acceso a enlace', { token });
     try {
        // Model's method checks existence and throws 404
        const updatedLink = await RecruitmentLinkModel.incrementAccessCount(token);

         if (!updatedLink) {
             structuredLog('error', `${this.serviceName}.${context}`, 'El incremento de acceso devolvió null inesperadamente', { token });
             throw new ApiError('Error interno: El incremento de acceso no devolvió un resultado válido.', 500);
         }
        structuredLog('info', `${this.serviceName}.${context}`, 'Acceso registrado', { token, linkId: updatedLink.id, accessCount: updatedLink.accessCount });
        return updatedLink;
    } catch (error) {
        // Standardize catch block
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Valida si un enlace es válido y no ha expirado
   */
  async validateRecruitmentLink(token: string): Promise<RecruitmentLink> {
    const context = 'validateRecruitmentLink';
    structuredLog('info', `${this.serviceName}.${context}`, 'Validando enlace', { token });
    try {
        // 1. Get link (model throws 404 if not found)
        const link = await RecruitmentLinkModel.getByToken(token);

        if (!link) {
            structuredLog('warn', `${this.serviceName}.${context}`, 'Enlace no encontrado durante validación', { token });
            throw new NotFoundError(`Enlace no encontrado`);
        }
        
        // 2. Validate status and expiration
        if (!link.isActive) {
            structuredLog('warn', `${this.serviceName}.${context}`, 'Intento de usar enlace desactivado', { token, linkId: link.id });
            throw new ApiError('El enlace ha sido desactivado', 400);
        }
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
             structuredLog('warn', `${this.serviceName}.${context}`, 'Intento de usar enlace expirado', { token, linkId: link.id, expiresAt: link.expiresAt });
            throw new ApiError('El enlace ha expirado', 400);
        }
        
        // 3. Increment access count (this method has standardized error handling)
        await this.recordLinkAccess(token); 
        
        structuredLog('info', `${this.serviceName}.${context}`, 'Enlace validado exitosamente', { token, linkId: link.id });
        return link;
    } catch (error) {
         // Standardize catch block
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
         throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Genera un resumen de participación para una investigación
   */
  async getResearchSummary(researchId: string): Promise<any> {
    const context = 'getResearchSummary';
    structuredLog('info', `${this.serviceName}.${context}`, 'Generando resumen para investigación', { researchId });
    try {
      // getConfigByResearchId now throws NotFoundError
      const config = await this.getConfigByResearchId(researchId);
      
      // No need to check for null config here, NotFoundError would have been thrown
      /*
      if (!config) {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontró configuración para el resumen', { researchId });
        return { config: null, stats: null, activeLinks: [] };
      }
      */
      
      if (!config.id) {
         structuredLog('error', `${this.serviceName}.${context}`, 'ID de configuración faltante en objeto recuperado', { researchId });
         throw new ApiError('Error interno: ID de configuración faltante.', 500); 
      }
      
      // These methods use standardized error handling
      const stats = await this.getStatsByConfigId(config.id);
      const activeLinks = await this.getActiveLinks(config.id);
      
      structuredLog('info', `${this.serviceName}.${context}`, 'Resumen generado', { researchId, configId: config.id });
      return { config, stats, activeLinks };

    } catch (error) {
      // Standardize catch block
      if (error instanceof ApiError || error instanceof NotFoundError) {
          throw error;
      }
      throw handleDbError(error, context, this.serviceName, {}); 
    }
  }

  // Helper function with standardized error handling
  private async getConfigByIdInternal(configId: string, parentContext: string): Promise<EyeTrackingRecruitConfig> {
      const context = `${parentContext} [GetConfigByIdInternal]`;
      try {
          // Model's getById checks existence, but might have fragility in key construction
          const config = await EyeTrackingRecruitConfigModel.getById(configId);
          if (!config) {
              structuredLog('warn', `${this.serviceName}.${context}`, 'Configuración no encontrada por helper', { configId });
              throw new NotFoundError(`Configuración con ID ${configId} no encontrada.`);
          }
          return config;
      } catch (error) {
           // Standardize catch block
           if (error instanceof ApiError || error instanceof NotFoundError) {
               throw error;
           }
           throw handleDbError(error, context, this.serviceName, {});
      }
  }
}

export const eyeTrackingRecruitService = new EyeTrackingRecruitService(); 