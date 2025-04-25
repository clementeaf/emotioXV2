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
  async getConfigByResearchId(researchId: string): Promise<EyeTrackingRecruitConfig | null> {
    const context = 'getConfigByResearchId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Buscando configuración por researchId', { researchId });
    try {
      // <<< Llamar al modelo directamente dentro del try >>>
      const configs: EyeTrackingRecruitConfig[] = await EyeTrackingRecruitConfigModel.getByResearchId(researchId);
      
      if (!configs || configs.length === 0) {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontraron configuraciones', { researchId });
        return null;
      }
      
      const sortedConfigs = configs.sort((a: EyeTrackingRecruitConfig, b: EyeTrackingRecruitConfig) => {
         const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
         const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
         return dateB - dateA;
      });
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración más reciente encontrada', { researchId, configId: sortedConfigs[0].id });
      return sortedConfigs[0];
    } catch (error) {
        // <<< Envolver el error con handleDbError >>>
        // handleDbError se encargará de loguear el error original y lanzar ApiError/NotFoundError
        throw handleDbError(error, context, this.serviceName, {});
    }
  }
  
  /**
   * Crea una nueva configuración de reclutamiento
   */
  async createConfig(researchId: string, configData: Omit<EyeTrackingRecruitConfig, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>): Promise<EyeTrackingRecruitConfig> {
    const context = 'createConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Iniciando creación de configuración', { researchId });
    
    // 1. Verificar existencia (esta llamada ya usa el patrón try/catch + handleDbError)
    const existingConfig = await this.getConfigByResearchId(researchId);
    if (existingConfig) {
      structuredLog('warn', `${this.serviceName}.${context}`, 'Conflicto: ya existe configuración para la investigación', { researchId });
      throw new ApiError('Ya existe una configuración para esta investigación', 409);
    }
    
    // 2. Crear la configuración
    try {
      const createdConfig = await EyeTrackingRecruitConfigModel.create({
          ...configData,
          researchId
      });
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración creada', { researchId, configId: createdConfig.id });
      return createdConfig;
    } catch (error) {
       // <<< Envolver el error con handleDbError >>>
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
        const updatedConfigResult = await EyeTrackingRecruitConfigModel.update(configId, updateData);
        
        if (!updatedConfigResult) {
            structuredLog('error', `${this.serviceName}.${context}`, 'La actualización del modelo devolvió null inesperadamente', { configId });
            throw new ApiError('Error interno: La actualización no devolvió un resultado válido.', 500);
        }
        
        structuredLog('info', `${this.serviceName}.${context}`, 'Configuración actualizada', { configId });
        return updatedConfigResult;
    } catch (error) {
        throw handleDbError(error, context, this.serviceName, {
             'CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } 
        }); 
    }
  }
  
  /**
   * Marca una configuración como completada
   */
  async completeConfig(configId: string): Promise<EyeTrackingRecruitConfig> {
    const context = 'completeConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Marcando configuración como completada', { configId });
     try {
        const updatedConfigResult = await EyeTrackingRecruitConfigModel.markAsCompleted(configId);
        
        if (!updatedConfigResult) {
            structuredLog('error', `${this.serviceName}.${context}`, 'La operación de completar devolvió null inesperadamente', { configId });
            throw new ApiError('Error interno: La operación de completar no devolvió un resultado válido.', 500);
        }

        structuredLog('info', `${this.serviceName}.${context}`, 'Configuración completada', { configId });
        return updatedConfigResult;
    } catch (error) {
        throw handleDbError(error, context, this.serviceName, {
             'CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 }
        });
    }
  }
  
  /**
   * Elimina una configuración
   */
  async deleteConfig(configId: string): Promise<boolean> {
    const context = 'deleteConfig';
    structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando configuración', { configId });
    try {
       await EyeTrackingRecruitConfigModel.delete(configId);
       structuredLog('info', `${this.serviceName}.${context}`, 'Configuración eliminada', { configId });
       return true;
    } catch (error) {
        throw handleDbError(error, context, this.serviceName, {
             'CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 }
        });
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
      // 1. Obtener la configuración (usando el patrón revisado)
      try {
          config = await EyeTrackingRecruitConfigModel.getById(recruitConfigId);
      } catch (error) {
          // Relanzar usando handleDbError solo para errores inesperados de getById
          throw handleDbError(error, `${context} [GetConfigStep]`, this.serviceName, { 'CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } });
      }

      if (!config) {
         structuredLog('warn', `${this.serviceName}.${context}`, 'Configuración no encontrada para asociar participante', { recruitConfigId });
         throw new NotFoundError(`Configuración con ID ${recruitConfigId} no encontrada.`);
      }
      
      // 2. Verificar límite de participantes
      if (config.participantLimit?.enabled && config.participantLimit.value > 0) {
        const stats = await this.getStatsByConfigId(recruitConfigId); // Esta llamada usa el patrón revisado internamente
        if (stats.complete.count >= config.participantLimit.value) {
          structuredLog('warn', `${this.serviceName}.${context}`, 'Límite de participantes alcanzado', { recruitConfigId, limit: config.participantLimit.value });
          throw new ApiError('Se ha alcanzado el límite de participantes', 400);
        }
      }
      
      // 3. Crear el participante (usando el patrón revisado)
      const newParticipant = await EyeTrackingRecruitParticipantModel.create({
          ...participantData,
          researchId: config.researchId,
          recruitConfigId,
          status: 'inprogress'
      });
      structuredLog('info', `${this.serviceName}.${context}`, 'Participante creado', { participantId: newParticipant.id, recruitConfigId });
      return newParticipant;

    } catch (error) {
      // <<< Revisar manejo de errores: relanzar ApiError/NotFoundError, usar handleDbError para otros >>>
      if (error instanceof ApiError || error instanceof NotFoundError) {
          // Log opcional si queremos loguear también en el nivel de servicio
          // structuredLog('warn', `${this.serviceName}.${context}`, 'Error conocido durante la creación', { errorName: error.name, message: error.message });
          throw error;
      }
      // Para errores inesperados del modelo create o del getStats, usar handleDbError
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado durante la creación del participante', { error, recruitConfigId });
      throw handleDbError(error, context, this.serviceName, {}); // handleDbError manejará el log detallado y lanzará ApiError(500)
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
        // La llamada al modelo ya fue refactorizada para lanzar ApiError 404 si no existe
        const updatedParticipant = await EyeTrackingRecruitParticipantModel.updateStatus(
            participantId, 
            configId, // Pasar configId
            status, 
            demographicData
        );
        // Añadir verificación explícita de null (aunque no debería ocurrir)
        if (!updatedParticipant) {
             structuredLog('error', `${this.serviceName}.${context}`, 'La actualización de estado devolvió null inesperadamente', { participantId, configId });
             throw new ApiError('Error interno: La actualización de estado no devolvió un resultado válido.', 500);
        }
        structuredLog('info', `${this.serviceName}.${context}`, 'Estado actualizado', { participantId, newStatus: status });
        return updatedParticipant;
    } catch (error) {
        // <<< Revisar manejo de errores >>>
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error; // El modelo ya lanzó el error correcto (ej. 404)
        }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al actualizar estado', { error, participantId, configId });
        throw handleDbError(error, context, this.serviceName, { 'PARTICIPANT_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } });
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
        // <<< Revisar manejo de errores >>>
        if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
        }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al obtener participantes', { error, configId });
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
        const stats = await EyeTrackingRecruitParticipantModel.getStats(configId);
        structuredLog('info', `${this.serviceName}.${context}`, 'Estadísticas obtenidas', { configId, stats });
        return stats;
     } catch (error) {
        // <<< Revisar manejo de errores >>>
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al obtener estadísticas', { error, configId });
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
    let config: EyeTrackingRecruitConfig | null = null;
    try {
        // 1. Obtener config (maneja errores internamente ahora)
        config = await this.getConfigByIdInternal(configId, context); // Usar helper

        // 2. Calcular expiración
        let expiresAt: string | undefined;
        if (expirationDays && expirationDays > 0) {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);
            expiresAt = expirationDate.toISOString();
        }
        
        // 3. Crear enlace
        const link = await RecruitmentLinkModel.create(
            config.researchId, 
            configId, 
            type, 
            expiresAt
        );
        structuredLog('info', `${this.serviceName}.${context}`, 'Enlace generado', { linkId: link.id, configId });
        return link;
    } catch (error) {
        // <<< Revisar manejo de errores >>>
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al generar enlace', { error, configId });
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
        // <<< Revisar manejo de errores >>>
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al obtener enlaces activos', { error, configId });
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
        // El modelo refactorizado lanza ApiError(404)
        const deactivatedLink = await RecruitmentLinkModel.deactivate(token);
         // Añadir verificación explícita de null (aunque no debería ocurrir)
        if (!deactivatedLink) {
             structuredLog('error', `${this.serviceName}.${context}`, 'La desactivación devolvió null inesperadamente', { token });
             throw new ApiError('Error interno: La desactivación no devolvió un resultado válido.', 500);
        }
        structuredLog('info', `${this.serviceName}.${context}`, 'Enlace desactivado', { token, linkId: deactivatedLink.id });
        return deactivatedLink;
    } catch (error) {
        // <<< Revisar manejo de errores >>>
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al desactivar enlace', { error, token });
        throw handleDbError(error, context, this.serviceName, { 'LINK_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } });
    }
  }
  
  /**
   * Registra un acceso a un enlace
   */
  async recordLinkAccess(token: string): Promise<RecruitmentLink> {
    const context = 'recordLinkAccess';
    structuredLog('info', `${this.serviceName}.${context}`, 'Registrando acceso a enlace', { token });
     try {
        // El modelo refactorizado lanza ApiError(404)
        const updatedLink = await RecruitmentLinkModel.incrementAccessCount(token);
         // Añadir verificación explícita de null (aunque no debería ocurrir)
         if (!updatedLink) {
             structuredLog('error', `${this.serviceName}.${context}`, 'El incremento de acceso devolvió null inesperadamente', { token });
             throw new ApiError('Error interno: El incremento de acceso no devolvió un resultado válido.', 500);
         }
        structuredLog('info', `${this.serviceName}.${context}`, 'Acceso registrado', { token, linkId: updatedLink.id, accessCount: updatedLink.accessCount });
        return updatedLink;
    } catch (error) {
        // <<< Revisar manejo de errores >>>
        if (error instanceof ApiError || error instanceof NotFoundError) {
            throw error;
        }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al registrar acceso', { error, token });
        throw handleDbError(error, context, this.serviceName, { 'LINK_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } });
    }
  }
  
  /**
   * Valida si un enlace es válido y no ha expirado
   */
  async validateRecruitmentLink(token: string): Promise<RecruitmentLink> {
    const context = 'validateRecruitmentLink';
    structuredLog('info', `${this.serviceName}.${context}`, 'Validando enlace', { token });
    try {
        // 1. Obtener enlace (el modelo lanza 404 si no existe)
        const link = await RecruitmentLinkModel.getByToken(token);

        if (!link) {
            // Esto no debería ocurrir si getByToken lanza 404, pero por seguridad:
            structuredLog('warn', `${this.serviceName}.${context}`, 'Enlace no encontrado durante validación (inesperado)', { token });
            throw new NotFoundError(`Enlace no encontrado`);
        }
        
        // 2. Validar estado y expiración
        if (!link.isActive) {
            structuredLog('warn', `${this.serviceName}.${context}`, 'Intento de usar enlace desactivado', { token, linkId: link.id });
            throw new ApiError('El enlace ha sido desactivado', 400);
        }
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
             structuredLog('warn', `${this.serviceName}.${context}`, 'Intento de usar enlace expirado', { token, linkId: link.id, expiresAt: link.expiresAt });
            throw new ApiError('El enlace ha expirado', 400);
        }
        
        // 3. Incrementar contador (usa el método refactorizado que maneja 404)
        await this.recordLinkAccess(token); 
        
        structuredLog('info', `${this.serviceName}.${context}`, 'Enlace validado exitosamente', { token, linkId: link.id });
        return link;
    } catch (error) {
         // <<< Revisar manejo de errores >>>
         if (error instanceof ApiError || error instanceof NotFoundError) {
             throw error;
         }
         structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al validar enlace', { error, token });
         throw handleDbError(error, context, this.serviceName, { 'LINK_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } });
    }
  }
  
  /**
   * Genera un resumen de participación para una investigación
   */
  async getResearchSummary(researchId: string): Promise<any> {
    const context = 'getResearchSummary';
    structuredLog('info', `${this.serviceName}.${context}`, 'Generando resumen para investigación', { researchId });
    try {
      const config = await this.getConfigByResearchId(researchId);
      
      if (!config) {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontró configuración para el resumen', { researchId });
        return { config: null, stats: null, activeLinks: [] };
      }
      
      if (!config.id) {
         structuredLog('error', `${this.serviceName}.${context}`, 'ID de configuración faltante en objeto recuperado', { researchId });
         // Lanzar un error interno si falta el ID
         throw new ApiError('Error interno: ID de configuración faltante.', 500); 
      }
      
      // Estas llamadas usan el patrón try/catch + handleDbError internamente
      const stats = await this.getStatsByConfigId(config.id);
      const activeLinks = await this.getActiveLinks(config.id);
      
      structuredLog('info', `${this.serviceName}.${context}`, 'Resumen generado', { researchId, configId: config.id });
      return { config, stats, activeLinks };

    } catch (error) {
      // <<< Revisar manejo de errores >>>
      if (error instanceof ApiError || error instanceof NotFoundError) {
          throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al generar resumen', { error, researchId });
      // Usar handleDbError para asegurar log y error 500 estandarizado
      throw handleDbError(error, context, this.serviceName, {}); 
    }
  }

  // <<< Helper interno para obtener config por ID y lanzar 404 >>>
  private async getConfigByIdInternal(configId: string, parentContext: string): Promise<EyeTrackingRecruitConfig> {
      const context = `${parentContext} [GetConfigByIdInternal]`;
      try {
          const config = await EyeTrackingRecruitConfigModel.getById(configId);
          if (!config) {
              structuredLog('warn', `${this.serviceName}.${context}`, 'Configuración no encontrada', { configId });
              throw new NotFoundError(`Configuración con ID ${configId} no encontrada.`);
          }
          return config;
      } catch (error) {
           if (error instanceof ApiError || error instanceof NotFoundError) {
               throw error;
           }
           structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al obtener configuración por ID', { error, configId });
           throw handleDbError(error, context, this.serviceName, { 'CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 } });
      }
  }
}

export const eyeTrackingRecruitService = new EyeTrackingRecruitService(); 