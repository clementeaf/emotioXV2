import { 
  EyeTrackingModel, 
  EyeTrackingFormData,
  EyeTrackingRecord,
  DEFAULT_EYE_TRACKING_CONFIG,
  EYE_TRACKING_VALIDATION
} from '../models/eyeTracking.model';
import { ApiError } from '../utils/errors';

// Instancia del modelo
const eyeTrackingModel = new EyeTrackingModel();

/**
 * Errores específicos del servicio de eye tracking
 */
export enum EyeTrackingError {
  NOT_FOUND = 'EYE_TRACKING_NOT_FOUND',
  INVALID_DATA = 'INVALID_EYE_TRACKING_DATA',
  RESEARCH_REQUIRED = 'RESEARCH_ID_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STIMULUS_NOT_FOUND = 'STIMULUS_NOT_FOUND',
  AREA_NOT_FOUND = 'AREA_OF_INTEREST_NOT_FOUND'
}

/**
 * Servicio para gestionar configuraciones de eye tracking
 */
export class EyeTrackingService {
  /**
   * Validación básica de los datos de entrada
   * @param data Datos a validar
   * @returns true si la validación es exitosa
   * @throws ApiError si hay errores de validación
   */
  private validateData(data: Partial<EyeTrackingFormData>): boolean {
    console.log('[DEBUG] EyeTrackingService.validateData - Datos recibidos:', JSON.stringify(data, null, 2));
    
    const errors: Record<string, string> = {};
    
    // Verificar si researchId está presente
    if (!data.researchId) {
      errors.researchId = 'El ID de investigación es obligatorio';
    }

    // Validar parámetros de configuración si están presentes
    if (data.config?.parameters) {
      // Validar tasa de muestreo
      if (data.config.parameters.samplingRate !== undefined) {
        if (data.config.parameters.samplingRate < EYE_TRACKING_VALIDATION.samplingRate.min) {
          errors.samplingRate = `La tasa de muestreo debe ser al menos ${EYE_TRACKING_VALIDATION.samplingRate.min} Hz`;
        } else if (data.config.parameters.samplingRate > EYE_TRACKING_VALIDATION.samplingRate.max) {
          errors.samplingRate = `La tasa de muestreo no puede exceder los ${EYE_TRACKING_VALIDATION.samplingRate.max} Hz`;
        }
      }

      // Validar umbral de fijación
      if (data.config.parameters.fixationThreshold !== undefined) {
        if (data.config.parameters.fixationThreshold < EYE_TRACKING_VALIDATION.fixationThreshold.min) {
          errors.fixationThreshold = `El umbral de fijación debe ser al menos ${EYE_TRACKING_VALIDATION.fixationThreshold.min} ms`;
        } else if (data.config.parameters.fixationThreshold > EYE_TRACKING_VALIDATION.fixationThreshold.max) {
          errors.fixationThreshold = `El umbral de fijación no puede exceder los ${EYE_TRACKING_VALIDATION.fixationThreshold.max} ms`;
        }
      }

      // Validar umbral de velocidad sacádica
      if (data.config.parameters.saccadeVelocityThreshold !== undefined) {
        if (data.config.parameters.saccadeVelocityThreshold < EYE_TRACKING_VALIDATION.saccadeVelocityThreshold.min) {
          errors.saccadeVelocityThreshold = `El umbral de velocidad sacádica debe ser al menos ${EYE_TRACKING_VALIDATION.saccadeVelocityThreshold.min} °/s`;
        } else if (data.config.parameters.saccadeVelocityThreshold > EYE_TRACKING_VALIDATION.saccadeVelocityThreshold.max) {
          errors.saccadeVelocityThreshold = `El umbral de velocidad sacádica no puede exceder los ${EYE_TRACKING_VALIDATION.saccadeVelocityThreshold.max} °/s`;
        }
      }
    }

    // Validar configuración de estímulos si está presente
    if (data.stimuli) {
      console.log('[DEBUG] EyeTrackingService.validateData - Validando stimuli:', JSON.stringify(data.stimuli, null, 2));
      
      // Validar duración por estímulo
      if (data.stimuli.durationPerStimulus !== undefined) {
        if (data.stimuli.durationPerStimulus < EYE_TRACKING_VALIDATION.durationPerStimulus.min) {
          errors.durationPerStimulus = `La duración por estímulo debe ser al menos ${EYE_TRACKING_VALIDATION.durationPerStimulus.min} segundos`;
        } else if (data.stimuli.durationPerStimulus > EYE_TRACKING_VALIDATION.durationPerStimulus.max) {
          errors.durationPerStimulus = `La duración por estímulo no puede exceder los ${EYE_TRACKING_VALIDATION.durationPerStimulus.max} segundos`;
        }
      }

      // Validar estímulos individuales
      if (data.stimuli.items && Array.isArray(data.stimuli.items)) {
        console.log('[DEBUG] EyeTrackingService.validateData - Número de estímulos:', data.stimuli.items.length);
        
        data.stimuli.items.forEach((item, index) => {
          if (!item.fileName || item.fileName.trim() === '') {
            errors[`items[${index}].fileName`] = 'El nombre del archivo no puede estar vacío';
          }
          if (!item.fileUrl || item.fileUrl.trim() === '') {
            errors[`items[${index}].fileUrl`] = 'La URL del archivo no puede estar vacía';
          }
          if (!item.s3Key || item.s3Key.trim() === '') {
            errors[`items[${index}].s3Key`] = 'La clave S3 del archivo no puede estar vacía';
          }
          
          // Verificar que fileUrl y s3Key sean coherentes
          if (item.fileUrl && item.s3Key && !item.fileUrl.includes(item.s3Key)) {
            errors[`items[${index}].consistency`] = 'La URL del archivo debe incluir su clave S3';
          }
        });
      }
    }

    // Si hay errores, lanzar excepción
    if (Object.keys(errors).length > 0) {
      console.error('[DEBUG] EyeTrackingService.validateData - Errores encontrados:', errors);
      throw new ApiError(
        `${EyeTrackingError.INVALID_DATA}: Los datos de eye tracking no son válidos. Errores: ${JSON.stringify(errors)}`,
        400
      );
    }
    
    console.log('[DEBUG] EyeTrackingService.validateData - Validación exitosa');
    return true;
  }

  /**
   * Crear una nueva configuración de eye tracking
   * @param data Datos de la configuración
   * @param researchId ID de la investigación
   * @param _userId ID del usuario que realiza la operación
   * @returns La configuración de eye tracking creada
   */
  async create(data: EyeTrackingFormData, researchId: string, _userId: string): Promise<EyeTrackingRecord> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${EyeTrackingError.RESEARCH_REQUIRED}: Se requiere ID de investigación para crear una configuración de eye tracking`,
          400
        );
      }

      // Validar datos
      this.validateData(data);

      // Asegurarse de que los campos requeridos tienen valores por defecto si no se proporcionan
      const eyeTrackingData: EyeTrackingFormData = {
        ...DEFAULT_EYE_TRACKING_CONFIG,
        ...data,
        researchId
      };

      // Crear en el modelo
      const eyeTracking = await eyeTrackingModel.create(eyeTrackingData, researchId);
      return eyeTracking;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.create:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al crear la configuración de eye tracking`,
        500
      );
    }
  }

  /**
   * Obtener una configuración de eye tracking por su ID
   * @param id ID de la configuración
   * @returns La configuración de eye tracking encontrada
   */
  async getById(id: string): Promise<EyeTrackingRecord> {
    try {
      const eyeTracking = await eyeTrackingModel.getById(id);
      
      if (!eyeTracking) {
        throw new ApiError(
          `${EyeTrackingError.NOT_FOUND}: Configuración de eye tracking no encontrada`,
          404
        );
      }

      return eyeTracking;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.getById:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al obtener la configuración de eye tracking`,
        500
      );
    }
  }

  /**
   * Obtener la configuración de eye tracking de una investigación
   * @param researchId ID de la investigación
   * @returns La configuración de eye tracking encontrada o una nueva con valores por defecto
   */
  async getByResearchId(researchId: string): Promise<EyeTrackingRecord> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${EyeTrackingError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener la configuración de eye tracking`,
          400
        );
      }

      const eyeTracking = await eyeTrackingModel.getByResearchId(researchId);
      
      if (!eyeTracking) {
        // Si no existe, crear una por defecto
        const defaultData: EyeTrackingFormData = {
          ...DEFAULT_EYE_TRACKING_CONFIG,
          researchId
        };
        
        // Crear configuración por defecto y retornarla
        return await eyeTrackingModel.create(defaultData, researchId);
      }

      return eyeTracking;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.getByResearchId:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al obtener la configuración de eye tracking para la investigación`,
        500
      );
    }
  }

  /**
   * Actualizar una configuración de eye tracking por su ID
   * @param id ID de la configuración
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La configuración actualizada
   */
  async update(id: string, data: Partial<EyeTrackingFormData>, _userId: string): Promise<EyeTrackingRecord> {
    try {
      // Verificar que existe
      await this.getById(id);
      
      // Validar datos
      this.validateData(data);
      
      // Actualizar en el modelo
      const updatedConfig = await eyeTrackingModel.update(id, data);
      
      if (!updatedConfig) {
        throw new ApiError(
          `${EyeTrackingError.NOT_FOUND}: Configuración de eye tracking no encontrada`,
          404
        );
      }
      
      return updatedConfig;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.update:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al actualizar la configuración de eye tracking`,
        500
      );
    }
  }

  /**
   * Actualizar o crear la configuración de eye tracking para una investigación
   * @param researchId ID de la investigación
   * @param data Datos completos a guardar
   * @param _userId ID del usuario que realiza la operación
   * @returns La configuración actualizada
   */
  async updateByResearchId(researchId: string, data: EyeTrackingFormData, _userId: string): Promise<EyeTrackingRecord> {
    try {
      console.log('[DEBUG] EyeTrackingService.updateByResearchId - Iniciando para researchId:', researchId);
      console.log('[DEBUG] EyeTrackingService.updateByResearchId - Datos recibidos:', JSON.stringify(data, null, 2));
      
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${EyeTrackingError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar la configuración de eye tracking`,
          400
        );
      }
      
      // Validar datos
      this.validateData(data);
      
      // Verificar específicamente los estímulos
      if (data.stimuli && Array.isArray(data.stimuli.items)) {
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - Verificando estímulos, cantidad:', data.stimuli.items.length);
        
        // Verificar cada estímulo
        data.stimuli.items.forEach((item, index) => {
          if (!item.s3Key) {
            console.warn(`[DEBUG] EyeTrackingService.updateByResearchId - Estímulo ${index} sin s3Key:`, item);
          }
        });
      } else {
        console.warn('[DEBUG] EyeTrackingService.updateByResearchId - No hay estímulos en los datos recibidos');
      }
      
      // Buscar si ya existe una configuración para esta investigación
      const existingConfig = await eyeTrackingModel.getByResearchId(researchId);
      
      if (existingConfig) {
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - Encontrada configuración existente, ID:', existingConfig.id);
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - Estímulos en configuración existente:', 
          existingConfig.stimuli.items?.length || 0);
        
        // Si existe, actualizar
        const dataToUpdate = {
          ...data,
          researchId // Asegurarse de que el researchId no se cambie
        };
        
        // Verificar continuidad de estímulos para debugging
        if (existingConfig.stimuli && existingConfig.stimuli.items && 
            dataToUpdate.stimuli && dataToUpdate.stimuli.items) {
          const existingIds = existingConfig.stimuli.items.map(item => item.id);
          const newIds = dataToUpdate.stimuli.items.map(item => item.id);
          
          console.log('[DEBUG] EyeTrackingService.updateByResearchId - IDs de estímulos existentes:', existingIds);
          console.log('[DEBUG] EyeTrackingService.updateByResearchId - IDs de estímulos nuevos:', newIds);
          
          // Verificar estímulos que se mantienen
          const retainedIds = existingIds.filter(id => newIds.includes(id));
          console.log('[DEBUG] EyeTrackingService.updateByResearchId - Estímulos que se mantienen:', retainedIds.length);
          
          // Verificar estímulos nuevos
          const addedIds = newIds.filter(id => !existingIds.includes(id));
          console.log('[DEBUG] EyeTrackingService.updateByResearchId - Estímulos nuevos:', addedIds.length);
          
          // Verificar estímulos eliminados
          const removedIds = existingIds.filter(id => !newIds.includes(id));
          console.log('[DEBUG] EyeTrackingService.updateByResearchId - Estímulos eliminados:', removedIds.length);
        }
        
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - Actualizando configuración con ID:', existingConfig.id);
        const updatedConfig = await eyeTrackingModel.update(existingConfig.id, dataToUpdate);
        
        if (!updatedConfig) {
          console.error('[DEBUG] EyeTrackingService.updateByResearchId - Error al actualizar la configuración');
          throw new ApiError(
            `${EyeTrackingError.DATABASE_ERROR}: No se pudo actualizar la configuración de eye tracking`,
            500
          );
        }
        
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - Configuración actualizada exitosamente');
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - Estímulos en configuración actualizada:', 
          updatedConfig.stimuli.items?.length || 0);
        
        return updatedConfig;
      } else {
        // Si no existe, crear nueva
        console.log('[DEBUG] EyeTrackingService.updateByResearchId - No existe configuración, creando nueva');
        return await this.create(data, researchId, _userId);
      }
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('[DEBUG] EyeTrackingService.updateByResearchId - Error:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al actualizar la configuración de eye tracking para la investigación`,
        500
      );
    }
  }

  /**
   * Eliminar una configuración de eye tracking
   * @param id ID de la configuración
   * @param _userId ID del usuario que realiza la operación
   * @returns void
   */
  async delete(id: string, _userId: string): Promise<void> {
    try {
      // Verificar que existe
      await this.getById(id);
      
      // Eliminar
      await eyeTrackingModel.delete(id);
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.delete:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al eliminar la configuración de eye tracking`,
        500
      );
    }
  }

  /**
   * Obtiene todas las configuraciones de eye tracking
   * @returns Lista de todas las configuraciones de eye tracking
   */
  async getAll(): Promise<EyeTrackingRecord[]> {
    try {
      const eyeTrackingConfigs = await eyeTrackingModel.getAll();
      return eyeTrackingConfigs;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.getAll:', error);
      throw new ApiError(
        `${EyeTrackingError.DATABASE_ERROR}: Error al obtener todas las configuraciones de eye tracking`,
        500
      );
    }
  }
} 