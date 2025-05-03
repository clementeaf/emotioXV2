import { 
  EyeTrackingModel, 
  EyeTrackingFormData,
  EyeTrackingRecord,
  DEFAULT_EYE_TRACKING_CONFIG
} from '../models/eyeTracking.model';
import { ApiError } from '../utils/errors';
import { NotFoundError } from '../errors';
import { structuredLog } from '../utils/logging.util';
import { handleDbError } from '../utils/dbError.util';

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
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * Servicio para gestionar configuraciones de eye tracking
 */
export class EyeTrackingService {
  private serviceName = 'EyeTrackingService';

  /**
   * Validación básica de los datos de entrada
   * @param data Datos a validar
   * @returns true si la validación es exitosa
   * @throws ApiError si hay errores de validación
   */
  private validateData(data: Partial<EyeTrackingFormData>): boolean {
    const context = 'validateData';
    structuredLog('debug', `${this.serviceName}.${context}`, 'Datos recibidos para validación', { data: JSON.stringify(data) });
    
    const errors: Record<string, string> = {};
    
    // Verificar si researchId está presente
    if (!data.researchId) {
      errors.researchId = 'El ID de investigación es obligatorio';
    }

    // Validar preguntas demográficas si están presentes
    if (data.demographicQuestions) {
      // Validaciones específicas para preguntas demográficas si se necesitan
    }

    // Validar configuración de enlaces si está presente
    if (data.linkConfig) {
      // Validaciones específicas para linkConfig si se necesitan
    }

    // Validar límite de participantes si está presente
    if (data.participantLimit) {
      if (data.participantLimit.enabled && data.participantLimit.value <= 0) {
        errors.participantLimitValue = 'El límite de participantes debe ser mayor que cero cuando está habilitado';
      }
    }

    // Validar enlaces de retorno si están presentes
    if (data.backlinks) {
      if (data.backlinks.complete && !this.isValidUrl(data.backlinks.complete)) {
        errors.backlinksComplete = 'La URL de retorno para completados debe ser válida';
      }
      if (data.backlinks.disqualified && !this.isValidUrl(data.backlinks.disqualified)) {
        errors.backlinksDisqualified = 'La URL de retorno para descalificados debe ser válida';
      }
      if (data.backlinks.overquota && !this.isValidUrl(data.backlinks.overquota)) {
        errors.backlinksOverquota = 'La URL de retorno para cuota excedida debe ser válida';
      }
    }

    // Validar URL de investigación si está presente
    if (data.researchUrl && !this.isValidUrl(data.researchUrl)) {
      errors.researchUrl = 'La URL de investigación debe ser válida';
    }

    // Si hay errores, lanzar excepción
    if (Object.keys(errors).length > 0) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Errores de validación encontrados', { errors });
      throw new ApiError(
        `${EyeTrackingError.INVALID_DATA}: Los datos de eye tracking no son válidos. Errores: ${JSON.stringify(errors)}`,
        400
      );
    }
    
    structuredLog('debug', `${this.serviceName}.${context}`, 'Validación exitosa');
    return true;
  }

  /**
   * Validar si una cadena es una URL válida
   * @param url URL a validar
   * @returns true si es válida, false si no
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crear una nueva configuración de eye tracking
   * @param data Datos de la configuración
   * @param researchId ID de la investigación
   * @param _userId ID del usuario que realiza la operación
   * @returns La configuración de eye tracking creada
   */
  async create(data: EyeTrackingFormData, researchId: string, _userId: string): Promise<EyeTrackingRecord> {
    const context = 'create';
    structuredLog('info', `${this.serviceName}.${context}`, 'Creando configuración', { researchId });
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
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración creada exitosamente', { researchId, id: eyeTracking.id });
      return eyeTracking;
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      if ((error instanceof Error) && error.message?.includes('EYE_TRACKING_CONFIG_EXISTS')) {
        structuredLog('warn', `${this.serviceName}.${context}`, 'Intento de crear configuración duplicada', { researchId });
        throw new ApiError('Configuración ya existe para esta investigación', 409);
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado durante la creación', { error, researchId });
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Obtener una configuración de eye tracking por su ID
   * @param id ID de la configuración
   * @returns La configuración de eye tracking encontrada
   */
  async getById(id: string): Promise<EyeTrackingRecord> {
    const context = 'getById';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo configuración por ID', { id });
    try {
      const eyeTracking = await eyeTrackingModel.getById(id);
      
      if (!eyeTracking) {
        structuredLog('warn', `${this.serviceName}.${context}`, 'Configuración no encontrada', { id });
        throw new NotFoundError(EyeTrackingError.NOT_FOUND);
      }

      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración encontrada', { id });
      return eyeTracking;
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al obtener por ID', { error, id });
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Obtener la configuración de eye tracking de una investigación
   * @param researchId ID de la investigación
   * @returns La configuración de eye tracking encontrada o una nueva con valores por defecto
   */
  async getByResearchId(researchId: string): Promise<EyeTrackingRecord> {
    const context = 'getByResearchId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo configuración por researchId', { researchId });
    if (!researchId) {
      throw new ApiError(
        `${EyeTrackingError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener la configuración de eye tracking`,
        400
      );
    }
    
    let eyeTracking: EyeTrackingRecord | null = null;
    try {
      // 1. Intentar obtener la existente
      eyeTracking = await eyeTrackingModel.getByResearchId(researchId);
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado durante GetStep', { error, researchId });
      throw handleDbError(error, `${context} [GetStep]`, this.serviceName, {});
    }

    if (!eyeTracking) {
      structuredLog('info', `${this.serviceName}.${context}`, 'No existe configuración, creando por defecto', { researchId });
      try {
        const defaultData: EyeTrackingFormData = {
          ...DEFAULT_EYE_TRACKING_CONFIG,
          researchId
        };
        eyeTracking = await this.create(defaultData, researchId, 'system');
      } catch (error) {
        if (error instanceof ApiError || error instanceof NotFoundError) {
          throw error;
        }
        structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado durante CreateDefaultStep', { error, researchId });
        throw handleDbError(error, `${context} [CreateDefaultStep]`, this.serviceName, {});
      }
    }

    structuredLog('info', `${this.serviceName}.${context}`, 'Configuración obtenida/creada', { researchId, id: eyeTracking.id });
    return eyeTracking;
  }

  /**
   * Actualizar una configuración de eye tracking por su ID
   * @param id ID de la configuración
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La configuración actualizada
   */
  async update(id: string, data: Partial<EyeTrackingFormData>, _userId: string): Promise<EyeTrackingRecord> {
    const context = 'update';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando configuración', { id });
    try {
      // Verificar que existe
      await this.getById(id);
      
      // Validar datos
      this.validateData(data);
      
      // Actualizar en el modelo
      const updatedConfig = await eyeTrackingModel.update(id, data);
      
      if (!updatedConfig) {
        throw new ApiError('Error interno: La actualización no devolvió un resultado válido.', 500);
      }
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración actualizada exitosamente', { id });
      return updatedConfig;
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al actualizar', { error, id });
      throw handleDbError(error, context, this.serviceName, {
        'EYE_TRACKING_CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 }
      });
    }
  }

  /**
   * Actualizar o crear la configuración de eye tracking para una investigación
   * @param researchId ID de la investigación
   * @param data Datos completos a guardar
   * @param _userId ID del usuario que realiza la operación
   * @returns La configuración actualizada
   */
  async updateByResearchId(researchId: string, data: EyeTrackingFormData, userId: string): Promise<EyeTrackingRecord> {
    const context = 'updateByResearchId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando/Creando configuración por researchId', { researchId });
    
    if (!researchId) {
      throw new ApiError(
        `${EyeTrackingError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar la configuración`, 400
      );
    }
    this.validateData({ ...data, researchId });
      
    let existingConfig: EyeTrackingRecord | null = null;
    try {
      existingConfig = await eyeTrackingModel.getByResearchId(researchId);
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado durante GetExistingStep', { error, researchId });
      throw handleDbError(error, `${context} [GetExistingStep]`, this.serviceName, {});
    }
      
    try {
      if (existingConfig) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Configuración existente encontrada, actualizando', { researchId, id: existingConfig.id });
        return await this.update(existingConfig.id, { ...data, researchId }, userId);
      } else {
        structuredLog('info', `${this.serviceName}.${context}`, 'No existe configuración, creando nueva', { researchId });
        return await this.create({ ...data, researchId }, researchId, userId);
      }
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      if ((error instanceof Error) && error.message?.includes('EYE_TRACKING_CONFIG_EXISTS')) {
        structuredLog('warn', `${this.serviceName}.${context}`, 'Conflicto al intentar crear configuración durante upsert', { researchId });
        throw new ApiError('Conflicto al crear configuración', 409);
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado durante Update/Create step', { error, researchId });
      throw handleDbError(error, context, this.serviceName, {
        'EYE_TRACKING_CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 },
      });
    }
  }

  /**
   * Eliminar una configuración de eye tracking
   * @param id ID de la configuración
   * @param _userId ID del usuario que realiza la operación
   * @returns void
   */
  async delete(id: string, _userId: string): Promise<void> {
    const context = 'delete';
    structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando configuración', { id });
    try {
      // Verificar que existe
      await this.getById(id);
      
      // Eliminar
      await eyeTrackingModel.delete(id);
      structuredLog('info', `${this.serviceName}.${context}`, 'Configuración eliminada exitosamente', { id });
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al eliminar', { error, id });
      throw handleDbError(error, context, this.serviceName, {
        'EYE_TRACKING_CONFIG_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404 }
      });
    }
  }

  /**
   * Obtiene todas las configuraciones de eye tracking
   * @returns Lista de todas las configuraciones de eye tracking
   */
  async getAll(): Promise<EyeTrackingRecord[]> {
    const context = 'getAll';
    structuredLog('info', `${this.serviceName}.${context}`, 'Obteniendo todas las configuraciones');
    try {
      const eyeTrackingConfigs = await eyeTrackingModel.getAll();
      structuredLog('info', `${this.serviceName}.${context}`, `Encontradas ${eyeTrackingConfigs.length} configuraciones`);
      return eyeTrackingConfigs;
    } catch (error) {
      if (error instanceof ApiError || error instanceof NotFoundError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error inesperado al obtener todas', { error });
      throw handleDbError(error, context, this.serviceName, {});
    }
  }
}

export const eyeTrackingService = new EyeTrackingService(); 