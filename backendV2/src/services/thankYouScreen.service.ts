import {
    DEFAULT_THANK_YOU_SCREEN_CONFIG,
    DEFAULT_THANK_YOU_SCREEN_VALIDATION,
    ThankYouScreenModel as SharedThankYouScreenModel,
    ThankYouScreenConfig,
    ThankYouScreenFormData
} from '../../../shared/interfaces/thank-you-screen.interface';
import { ThankYouScreenModel } from '../models/thankYouScreen.model';
import { handleDbError } from '../utils/dbError.util';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';

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
    ThankYouScreenConfig, ThankYouScreenFormData, SharedThankYouScreenModel as ThankYouScreenRecord
};

/**
 * Servicio para gestionar pantallas de agradecimiento
 */
export class ThankYouScreenService {
  private serviceName = 'ThankYouScreenService';

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
    const context = 'create'; // Contexto para logging
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

      // Extraer questionKey del frontend si existe
      const questionKey = (data as any).questionKey || null;

      // Crear en el modelo
      const thankYouScreen = await thankYouScreenModel.create(screenData, researchId, questionKey);
      return thankYouScreen;
    } catch (error) {
      // Usar handleDbError para consistencia, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Obtener una pantalla de agradecimiento por su ID
   * @param id ID de la pantalla
   * @returns La pantalla de agradecimiento encontrada
   */
  async getById(id: string): Promise<SharedThankYouScreenModel> {
    const context = 'getById'; // Contexto para logging
    try {
      const thankYouScreen = await thankYouScreenModel.getById(id);

      if (!thankYouScreen) {
        // Lanzar ApiError directamente para que lo capture handleDbError
        throw new ApiError(
          `${ThankYouScreenError.NOT_FOUND}: Pantalla de agradecimiento no encontrada`,
          404
        );
      }

      return thankYouScreen;
    } catch (error) {
      // Usar handleDbError para consistencia, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Obtener la pantalla de agradecimiento de una investigación
   * @param researchId ID de la investigación
   * @returns La pantalla de agradecimiento encontrada
   */
  async getByResearchId(researchId: string): Promise<SharedThankYouScreenModel> {
    const context = 'getByResearchId'; // Contexto para logging
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${ThankYouScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener la pantalla de agradecimiento`,
          400
        );
      }

      const thankYouScreen = await thankYouScreenModel.getByResearchId(researchId);

      // Throw ApiError if not found (reverting previous change)
      if (!thankYouScreen) {
        structuredLog('warn', `${this.serviceName}.${context}`, 'No se encontró ThankYouScreen', { researchId });
        // Lanzar ApiError directamente
        throw new ApiError(
          `${ThankYouScreenError.NOT_FOUND}: No se encontró una pantalla de agradecimiento para esta investigación`,
          404
        );
      }

      return thankYouScreen;
    } catch (error) {
      // Usar handleDbError para consistencia, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
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
    const context = 'update'; // Contexto para logging
    try {
      // Validar datos
      this.validateData(data);

      // Verificar existencia (getById lanzará ApiError si no existe)
      await this.getById(id);

      // Actualizar en el modelo
      const updatedScreen = await thankYouScreenModel.update(id, data);

      // Si update devuelve null o undefined (aunque no debería si existe)
      if (!updatedScreen) {
         throw new ApiError(
          `${ThankYouScreenError.DATABASE_ERROR}: No se pudo actualizar la pantalla de agradecimiento después de verificar existencia.`,
          500
        );
      }

      return updatedScreen;
    } catch (error) {
       // Usar handleDbError, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Actualiza O CREA la pantalla de agradecimiento de una investigación
   * @param researchId ID de la investigación
   * @param data Datos a actualizar/crear
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de agradecimiento actualizada o creada
   */
  async updateByResearchId(researchId: string, data: ThankYouScreenFormData, _userId: string): Promise<SharedThankYouScreenModel> {
    const context = 'updateByResearchId'; // Contexto para logging
    try {
      if (!researchId) {
        throw new ApiError(
          `${ThankYouScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar/crear la pantalla de agradecimiento`,
          400
        );
      }
      this.validateData(data); // Validar datos entrantes

      const existing = await thankYouScreenModel.getByResearchId(researchId);

      if (existing) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando pantalla existente', { researchId, screenId: existing.id });
        return await this.update(existing.id, data, _userId);
      } else {
        structuredLog('info', `${this.serviceName}.${context}`, 'Creando nueva pantalla porque no existe', { researchId });
        return await this.create(data, researchId, _userId);
      }
    } catch (error) {
      // Usar handleDbError, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Eliminar una pantalla de agradecimiento
   * @param id ID de la pantalla
   * @param _userId ID del usuario que realiza la operación
   */
  async delete(id: string, _userId: string): Promise<void> {
    const context = 'delete'; // Contexto para logging
    try {
      // Verificar existencia (getById lanzará ApiError si no existe)
      await this.getById(id);

      // Eliminar en el modelo
      const success = await thankYouScreenModel.delete(id);

      // Si delete devuelve false (indicando fallo)
      if (!success) {
        throw new ApiError(
          `${ThankYouScreenError.DATABASE_ERROR}: Error al eliminar la pantalla de agradecimiento desde el modelo`,
          500
        );
      }
    } catch (error) {
      // Usar handleDbError, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
    }
  }

  /**
   * Obtener todas las pantallas de agradecimiento
   * @returns Array con todas las pantallas de agradecimiento
   */
  async getAll(): Promise<SharedThankYouScreenModel[]> {
    const context = 'getAll'; // Contexto para logging
    try {
      const thankYouScreens = await thankYouScreenModel.getAll();
      return thankYouScreens;
    } catch (error) {
      // Usar handleDbError, pasando {} explícitamente como 4to arg
      throw handleDbError(error, context, this.serviceName, {});
    }
  }
}

// Exportar una instancia única del servicio
export const thankYouScreenService = new ThankYouScreenService();
