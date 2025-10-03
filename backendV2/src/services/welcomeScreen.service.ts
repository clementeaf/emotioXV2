import {
    DEFAULT_WELCOME_SCREEN_CONFIG,
    WelcomeScreenFormData,
    WelcomeScreenRecord
} from '../../../shared/interfaces/welcome-screen.interface';
import { NotFoundError } from '../errors';
import {
    welcomeScreenModel
} from '../models/welcomeScreen.model';
import { handleDbError } from '../utils/dbError.util';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

/**
 * Errores específicos del servicio de pantallas de bienvenida
 */
export enum WelcomeScreenError {
  NOT_FOUND = 'WELCOME_SCREEN_NOT_FOUND',
  INVALID_DATA = 'INVALID_WELCOME_SCREEN_DATA',
  RESEARCH_REQUIRED = 'RESEARCH_ID_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * Servicio para gestionar pantallas de bienvenida
 */
export class WelcomeScreenService {
  private serviceName = 'WelcomeScreenService';

  /**
   * Validación básica de los datos de entrada
   * @param data Datos a validar
   * @returns true si la validación es exitosa
   * @throws ApiError si hay errores de validación
   */
  private validateData(data: Partial<WelcomeScreenFormData>): boolean {
    const errors: Record<string, string> = {};

    // Validar título si está presente
    if (data.title !== undefined) {
      if (data.title.trim() === '') {
        errors.title = 'El título no puede estar vacío';
      } else if (data.title.length < 3) {
        errors.title = 'El título debe tener al menos 3 caracteres';
      } else if (data.title.length > 100) {
        errors.title = 'El título no puede exceder los 100 caracteres';
      }
    }

    // Validar mensaje si está presente
    if (data.message !== undefined) {
      if (data.message.length > 1000) {
        errors.message = 'El mensaje no puede exceder los 1000 caracteres';
      }
    }

    // Validar texto del botón si está presente
    if (data.startButtonText !== undefined) {
      if (data.startButtonText.trim() === '') {
        errors.startButtonText = 'El texto del botón no puede estar vacío';
      } else if (data.startButtonText.length < 2) {
        errors.startButtonText = 'El texto del botón debe tener al menos 2 caracteres';
      } else if (data.startButtonText.length > 50) {
        errors.startButtonText = 'El texto del botón no puede exceder los 50 caracteres';
      }
    }

    // Si hay errores, lanzar excepción
    if (Object.keys(errors).length > 0) {
      throw new ApiError(
        `${WelcomeScreenError.INVALID_DATA}: Los datos de la pantalla de bienvenida no son válidos`,
        400
      );
    }

    return true;
  }

  /**
   * Crear una nueva pantalla de bienvenida
   * @param data Datos de la pantalla
   * @param researchId ID de la investigación
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de bienvenida creada
   */
  async create(data: WelcomeScreenFormData, researchId: string, _userId: string): Promise<WelcomeScreenRecord> {
    const context = 'create';
    try {
      if (!researchId) {
        throw new ApiError(
          `${WelcomeScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para crear una pantalla de bienvenida`,
          400
        );
      }
      this.validateData(data);
      const screenData: WelcomeScreenFormData = {
        ...data,
        isEnabled: data.isEnabled ?? DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
        title: data.title || DEFAULT_WELCOME_SCREEN_CONFIG.title,
        message: data.message || DEFAULT_WELCOME_SCREEN_CONFIG.message,
        startButtonText: data.startButtonText || DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText
      };

      // Extraer questionKey del frontend si existe
      const questionKey = (data as Record<string, unknown>).questionKey as string | undefined;

      return await welcomeScreenModel.create(screenData, researchId, questionKey);
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Obtener una pantalla de bienvenida por su ID
   * @param id ID de la pantalla
   * @returns La pantalla de bienvenida encontrada
   */
  async getById(id: string): Promise<WelcomeScreenRecord> {
    const context = 'getById';
    try {
      const welcomeScreen = await welcomeScreenModel.getById(id);
      if (!welcomeScreen) {
        throw new NotFoundError(WelcomeScreenError.NOT_FOUND);
      }
      return welcomeScreen;
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Obtener la pantalla de bienvenida de una investigación
   * @param researchId ID de la investigación
   * @returns La pantalla de bienvenida encontrada o configuración por defecto
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord> {
    const context = 'getByResearchId';
    try {
      if (!researchId) {
        throw new ApiError(
          `${WelcomeScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener la pantalla de bienvenida`,
          400
        );
      }
      structuredLog('info', `${this.serviceName}.${context}`, 'Buscando welcome screen', { researchId });
      const welcomeScreen = await welcomeScreenModel.getByResearchId(researchId);

      if (!welcomeScreen) {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontró welcome screen, devolviendo configuración por defecto', { researchId });

        // Para investigaciones nuevas, devolver configuración por defecto en lugar de error
        return {
          id: `default-${researchId}`, // ID temporal para identificar que es por defecto
          researchId,
          ...DEFAULT_WELCOME_SCREEN_CONFIG,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            version: '1.0',
            isDefault: true, // Flag para identificar que es configuración por defecto
            lastUpdated: new Date(),
            lastModifiedBy: 'system'
          }
        } as WelcomeScreenRecord;
      }

      structuredLog('info', `${this.serviceName}.${context}`, 'Welcome screen encontrado', { researchId, screenId: welcomeScreen.id });
      return welcomeScreen;
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Actualizar una pantalla de bienvenida
   * @param id ID de la pantalla
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de bienvenida actualizada
   */
  async update(id: string, data: Partial<WelcomeScreenFormData>, _userId: string): Promise<WelcomeScreenRecord> {
    const context = 'update';
    try {
      this.validateData(data);
      const existing = await welcomeScreenModel.getById(id);
      if (!existing) {
        throw new NotFoundError(WelcomeScreenError.NOT_FOUND);
      }
      return await welcomeScreenModel.update(id, data);
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Actualizar la pantalla de bienvenida de una investigación
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de bienvenida actualizada o creada
   */
  async updateByResearchId(researchId: string, data: WelcomeScreenFormData, userId: string): Promise<WelcomeScreenRecord> {
    const context = 'updateByResearchId';
    try {
      if (!researchId) {
        throw new ApiError(
          `${WelcomeScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar la pantalla de bienvenida`,
          400
        );
      }
      this.validateData(data);
      structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando/Creando welcome screen', { researchId });

      const existingScreen = await welcomeScreenModel.getByResearchId(researchId);

      if (existingScreen) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando existente', { researchId, screenId: existingScreen.id });
        const updatedScreen = await welcomeScreenModel.update(existingScreen.id, {
          ...data,
          metadata: {
            version: (existingScreen.metadata?.version || '1.0'),
            lastUpdated: new Date(),
            lastModifiedBy: userId
          }
        });
        structuredLog('info', `${this.serviceName}.${context}`, 'Actualización completada', { researchId, screenId: updatedScreen.id });
        return updatedScreen;
      } else {
        structuredLog('info', `${this.serviceName}.${context}`, 'Creando nuevo', { researchId });
        const newScreen = await welcomeScreenModel.create({
          ...data,
          metadata: {
            version: '1.0',
            lastUpdated: new Date(),
            lastModifiedBy: userId
          }
        }, researchId);
        structuredLog('info', `${this.serviceName}.${context}`, 'Creación completada', { researchId, screenId: newScreen.id });
        return newScreen;
      }
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Eliminar una pantalla de bienvenida
   * @param id ID de la pantalla
   * @param _userId ID del usuario que realiza la operación
   */
  async delete(id: string, _userId: string): Promise<void> {
    const context = 'delete';
    try {
      const existing = await welcomeScreenModel.getById(id);
      if (!existing) {
        throw new NotFoundError(WelcomeScreenError.NOT_FOUND);
      }
      await welcomeScreenModel.delete(id);
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Obtiene todas las pantallas de bienvenida
   * @returns Lista de todas las pantallas de bienvenida
   */
  async getAll(): Promise<WelcomeScreenRecord[]> {
    const context = 'getAll';
    try {
      return await welcomeScreenModel.getAll();
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }

  /**
   * Actualizar una pantalla de bienvenida específica asegurando que pertenece a una investigación
   * @param researchId ID de la investigación
   * @param screenId ID de la pantalla a actualizar
   * @param data Datos a actualizar
   * @param _userId ID del usuario que realiza la operación
   * @returns La pantalla de bienvenida actualizada
   */
  async updateForResearch(researchId: string, screenId: string, data: Partial<WelcomeScreenFormData>, _userId: string): Promise<WelcomeScreenRecord> {
    const context = 'updateForResearch';
    try {
      this.validateData(data);
      const existing = await welcomeScreenModel.getById(screenId);
      if (!existing) {
        throw new NotFoundError(`${WelcomeScreenError.NOT_FOUND}: Pantalla de bienvenida no encontrada con ID ${screenId}`);
      }
      if (existing.researchId !== researchId) {
        throw new ApiError(
          `${WelcomeScreenError.PERMISSION_DENIED}: La pantalla de bienvenida ${screenId} no pertenece a la investigación ${researchId}`,
          403 // Forbidden
        );
      }
      return await welcomeScreenModel.update(screenId, data);
    } catch (error) {
      throw handleDbError(toApplicationError(error), context, this.serviceName, {});
    }
  }
}

// Exportar una instancia única del servicio
export const welcomeScreenService = new WelcomeScreenService();
