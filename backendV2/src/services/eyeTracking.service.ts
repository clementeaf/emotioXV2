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
    const errors: Record<string, string> = {};

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
        data.stimuli.items.forEach((item, index) => {
          if (!item.fileName || item.fileName.trim() === '') {
            errors[`items[${index}].fileName`] = 'El nombre del archivo no puede estar vacío';
          }
          if (!item.fileUrl || item.fileUrl.trim() === '') {
            errors[`items[${index}].fileUrl`] = 'La URL del archivo no puede estar vacía';
          }
        });
      }
    }

    // Si hay errores, lanzar excepción
    if (Object.keys(errors).length > 0) {
      throw new ApiError(
        `${EyeTrackingError.INVALID_DATA}: Los datos de eye tracking no son válidos. Errores: ${JSON.stringify(errors)}`,
        400
      );
    }

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
      // Obtener la configuración actual
      const currentConfig = await this.getById(id);
      
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
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${EyeTrackingError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar la configuración de eye tracking`,
          400
        );
      }
      
      // Validar datos
      this.validateData(data);
      
      // Buscar si ya existe una configuración para esta investigación
      const existingConfig = await eyeTrackingModel.getByResearchId(researchId);
      
      if (existingConfig) {
        // Si existe, actualizar
        const updatedConfig = await eyeTrackingModel.update(existingConfig.id, {
          ...data,
          researchId // Asegurarse de que el researchId no se cambie
        });
        
        if (!updatedConfig) {
          throw new ApiError(
            `${EyeTrackingError.DATABASE_ERROR}: No se pudo actualizar la configuración de eye tracking`,
            500
          );
        }
        
        return updatedConfig;
      } else {
        // Si no existe, crear nueva
        return await this.create(data, researchId, _userId);
      }
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en EyeTrackingService.updateByResearchId:', error);
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
      const eyeTracking = await this.getById(id);
      
      // Eliminar
      const deleted = await eyeTrackingModel.delete(id);
      
      if (!deleted) {
        throw new ApiError(
          `${EyeTrackingError.DATABASE_ERROR}: Error al eliminar la configuración de eye tracking`,
          500
        );
      }
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
} 