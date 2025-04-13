import { 
  ThankYouScreenConfig,
  ThankYouScreenFormData, 
  ThankYouScreenModel as SharedThankYouScreenModel,
  DEFAULT_THANK_YOU_SCREEN_CONFIG,
  DEFAULT_THANK_YOU_SCREEN_VALIDATION
} from '../../../shared/interfaces/thank-you-screen.interface';
import { ThankYouScreenModel } from '../models/thankYouScreen.model';
import { ApiError } from '../utils/errors';

// Instancia del modelo
const thankYouScreenModel = new ThankYouScreenModel();

/**
 * Errores específicos del servicio de pantallas de agradecimiento
 */
export enum ThankYouScreenError {
  NOT_FOUND = 'THANK_YOU_SCREEN_NOT_FOUND',
  INVALID_DATA = 'INVALID_THANK_YOU_SCREEN_DATA',
  RESEARCH_REQUIRED = 'RESEARCH_ID_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// Re-exportamos los tipos compartidos para mantener compatibilidad
export type {
  ThankYouScreenConfig,
  SharedThankYouScreenModel as ThankYouScreenRecord,
  ThankYouScreenFormData
};

/**
 * Servicio para gestionar pantallas de agradecimiento
 */
export class ThankYouScreenService {
  /**
   * Validación básica de los datos de entrada
   * @param data Datos a validar
   * @returns true si la validación es exitosa
   * @throws ApiError si hay errores de validación
   */
  private validateData(data: Partial<ThankYouScreenFormData>): boolean {
    const errors: Record<string, string> = {};

    // Validar título si está presente
    if (data.title !== undefined) {
      if (data.title.trim() === '') {
        errors.title = 'El título no puede estar vacío';
      } else if (data.title.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.minLength) {
        errors.title = `El título debe tener al menos ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.minLength} caracteres`;
      } else if (data.title.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.maxLength) {
        errors.title = `El título no puede exceder los ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.maxLength} caracteres`;
      }
    }

    // Validar mensaje si está presente
    if (data.message !== undefined) {
      if (data.message.trim() === '') {
        errors.message = 'El mensaje no puede estar vacío';
      } else if (data.message.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.minLength) {
        errors.message = `El mensaje debe tener al menos ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.minLength} caracteres`;
      } else if (data.message.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.maxLength) {
        errors.message = `El mensaje no puede exceder los ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.maxLength} caracteres`;
      }
    }

    // Validar URL de redirección si está presente
    if (data.redirectUrl && data.redirectUrl.trim() !== '') {
      if (DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.pattern && 
          !DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.pattern.test(data.redirectUrl)) {
        errors.redirectUrl = 'La URL de redirección no tiene un formato válido';
      } else if (data.redirectUrl.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.minLength) {
        errors.redirectUrl = `La URL debe tener al menos ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.minLength} caracteres`;
      } else if (data.redirectUrl.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.maxLength) {
        errors.redirectUrl = `La URL no puede exceder los ${DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.maxLength} caracteres`;
      }
    }

    // Si hay errores, lanzar excepción
    if (Object.keys(errors).length > 0) {
      throw new ApiError(
        `${ThankYouScreenError.INVALID_DATA}: Los datos de la pantalla de agradecimiento no son válidos`,
        400
      );
    }

    return true;
  }

  /**
   * Crear una nueva pantalla de agradecimiento
   * @param data Datos de la pantalla
   * @param researchId ID de la investigación
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de agradecimiento creada
   */
  async create(data: ThankYouScreenFormData, researchId: string, _userId: string): Promise<SharedThankYouScreenModel> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${ThankYouScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para crear una pantalla de agradecimiento`,
          400
        );
      }

      // Validar datos
      this.validateData(data);

      // Establecer metadatos
      const screenData: ThankYouScreenFormData = {
        ...data,
        isEnabled: data.isEnabled ?? DEFAULT_THANK_YOU_SCREEN_CONFIG.isEnabled,
        title: data.title || DEFAULT_THANK_YOU_SCREEN_CONFIG.title,
        message: data.message || DEFAULT_THANK_YOU_SCREEN_CONFIG.message,
        redirectUrl: data.redirectUrl || DEFAULT_THANK_YOU_SCREEN_CONFIG.redirectUrl
      };

      // Crear en el modelo
      const thankYouScreen = await thankYouScreenModel.create(screenData, researchId);
      return thankYouScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.create:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al crear la pantalla de agradecimiento`,
        500
      );
    }
  }

  /**
   * Obtener una pantalla de agradecimiento por su ID
   * @param id ID de la pantalla
   * @returns La pantalla de agradecimiento encontrada
   */
  async getById(id: string): Promise<SharedThankYouScreenModel> {
    try {
      const thankYouScreen = await thankYouScreenModel.getById(id);
      
      if (!thankYouScreen) {
        throw new ApiError(
          `${ThankYouScreenError.NOT_FOUND}: Pantalla de agradecimiento no encontrada`,
          404
        );
      }

      return thankYouScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.getById:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al obtener la pantalla de agradecimiento`,
        500
      );
    }
  }

  /**
   * Obtener la pantalla de agradecimiento de una investigación
   * @param researchId ID de la investigación
   * @returns La pantalla de agradecimiento encontrada
   */
  async getByResearchId(researchId: string): Promise<SharedThankYouScreenModel> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${ThankYouScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener la pantalla de agradecimiento`,
          400
        );
      }

      const thankYouScreen = await thankYouScreenModel.getByResearchId(researchId);
      
      if (!thankYouScreen) {
        // Si no existe, crear una por defecto
        const defaultData: ThankYouScreenFormData = {
          isEnabled: DEFAULT_THANK_YOU_SCREEN_CONFIG.isEnabled,
          title: DEFAULT_THANK_YOU_SCREEN_CONFIG.title,
          message: DEFAULT_THANK_YOU_SCREEN_CONFIG.message,
          redirectUrl: DEFAULT_THANK_YOU_SCREEN_CONFIG.redirectUrl
        };
        
        // Crear pantalla por defecto y retornarla
        return await thankYouScreenModel.create(defaultData, researchId);
      }

      return thankYouScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.getByResearchId:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al obtener la pantalla de agradecimiento para la investigación`,
        500
      );
    }
  }

  /**
   * Actualizar una pantalla de agradecimiento
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de agradecimiento actualizada
   */
  async update(id: string, data: Partial<ThankYouScreenFormData>, _userId: string): Promise<SharedThankYouScreenModel> {
    try {
      // Validar datos
      this.validateData(data);

      // Verificar existencia
      const existing = await thankYouScreenModel.getById(id);
      if (!existing) {
        throw new ApiError(
          `${ThankYouScreenError.NOT_FOUND}: Pantalla de agradecimiento no encontrada`,
          404
        );
      }

      // Actualizar en el modelo
      const updatedScreen = await thankYouScreenModel.update(id, data);
      
      if (!updatedScreen) {
        throw new ApiError(
          `${ThankYouScreenError.DATABASE_ERROR}: No se pudo actualizar la pantalla de agradecimiento`,
          500
        );
      }
      
      return updatedScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.update:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al actualizar la pantalla de agradecimiento`,
        500
      );
    }
  }

  /**
   * Actualizar la pantalla de agradecimiento de una investigación
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de agradecimiento actualizada
   */
  async updateByResearchId(researchId: string, data: ThankYouScreenFormData, _userId: string): Promise<SharedThankYouScreenModel> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${ThankYouScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar la pantalla de agradecimiento`,
          400
        );
      }

      // Validar datos
      this.validateData(data);

      // Verificar si existe la pantalla para esta investigación
      const existing = await thankYouScreenModel.getByResearchId(researchId);
      
      if (!existing) {
        // Si no existe, crear una nueva
        const createData: ThankYouScreenFormData = {
          ...data,
          isEnabled: data.isEnabled ?? DEFAULT_THANK_YOU_SCREEN_CONFIG.isEnabled,
          title: data.title || DEFAULT_THANK_YOU_SCREEN_CONFIG.title,
          message: data.message || DEFAULT_THANK_YOU_SCREEN_CONFIG.message,
          redirectUrl: data.redirectUrl || DEFAULT_THANK_YOU_SCREEN_CONFIG.redirectUrl
        };
        
        return await thankYouScreenModel.create(createData, researchId);
      }

      // Si existe, actualizarla
      const updateData = {
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : existing.isEnabled,
        title: data.title || existing.title,
        message: data.message || existing.message,
        redirectUrl: data.redirectUrl !== undefined ? data.redirectUrl : existing.redirectUrl
      };
      
      const updated = await thankYouScreenModel.update(existing.id, updateData);
      
      if (!updated) {
        throw new ApiError(
          `${ThankYouScreenError.DATABASE_ERROR}: No se pudo actualizar la pantalla de agradecimiento`,
          500
        );
      }
      
      return updated;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.updateByResearchId:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al actualizar la pantalla de agradecimiento`,
        500
      );
    }
  }

  /**
   * Eliminar una pantalla de agradecimiento
   * @param id ID de la pantalla
   * @param _userId ID del usuario que realiza la operación
   */
  async delete(id: string, _userId: string): Promise<void> {
    try {
      // Verificar existencia
      const existing = await thankYouScreenModel.getById(id);
      if (!existing) {
        throw new ApiError(
          `${ThankYouScreenError.NOT_FOUND}: Pantalla de agradecimiento no encontrada`,
          404
        );
      }

      // Eliminar en el modelo
      const success = await thankYouScreenModel.delete(id);
      
      if (!success) {
        throw new ApiError(
          `${ThankYouScreenError.DATABASE_ERROR}: Error al eliminar la pantalla de agradecimiento`,
          500
        );
      }
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.delete:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al eliminar la pantalla de agradecimiento`,
        500
      );
    }
  }

  /**
   * Obtener todas las pantallas de agradecimiento
   * @returns Array con todas las pantallas de agradecimiento
   */
  async getAll(): Promise<SharedThankYouScreenModel[]> {
    try {
      const thankYouScreens = await thankYouScreenModel.getAll();
      return thankYouScreens;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en ThankYouScreenService.getAll:', error);
      throw new ApiError(
        `${ThankYouScreenError.DATABASE_ERROR}: Error al obtener todas las pantallas de agradecimiento`,
        500
      );
    }
  }
}

// Exportar una instancia única del servicio
export const thankYouScreenService = new ThankYouScreenService(); 