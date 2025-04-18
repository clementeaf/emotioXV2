import { 
  welcomeScreenModel
} from '../models/welcomeScreen.model';
import { 
  WelcomeScreenFormData, 
  WelcomeScreenRecord, 
  DEFAULT_WELCOME_SCREEN_CONFIG 
} from '../../../shared/interfaces/welcome-screen.interface';
import { ApiError } from '../utils/errors';

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
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${WelcomeScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para crear una pantalla de bienvenida`,
          400
        );
      }

      // Validar datos
      this.validateData(data);

      // Establecer metadatos
      const screenData: WelcomeScreenFormData = {
        ...data,
        isEnabled: data.isEnabled ?? DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
        title: data.title || DEFAULT_WELCOME_SCREEN_CONFIG.title,
        message: data.message || DEFAULT_WELCOME_SCREEN_CONFIG.message,
        startButtonText: data.startButtonText || DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText
      };

      // Crear en el modelo
      const welcomeScreen = await welcomeScreenModel.create(screenData, researchId);
      return welcomeScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en WelcomeScreenService.create:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al crear la pantalla de bienvenida`,
        500
      );
    }
  }

  /**
   * Obtener una pantalla de bienvenida por su ID
   * @param id ID de la pantalla
   * @returns La pantalla de bienvenida encontrada
   */
  async getById(id: string): Promise<WelcomeScreenRecord> {
    try {
      const welcomeScreen = await welcomeScreenModel.getById(id);
      
      if (!welcomeScreen) {
        throw new ApiError(
          `${WelcomeScreenError.NOT_FOUND}: Pantalla de bienvenida no encontrada`,
          404
        );
      }

      return welcomeScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en WelcomeScreenService.getById:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al obtener la pantalla de bienvenida`,
        500
      );
    }
  }

  /**
   * Obtener la pantalla de bienvenida de una investigación
   * @param researchId ID de la investigación
   * @returns La pantalla de bienvenida encontrada
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${WelcomeScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener la pantalla de bienvenida`,
          400
        );
      }

      console.log('[WelcomeScreenService] Buscando welcome screen para researchId:', researchId);
      const welcomeScreen = await welcomeScreenModel.getByResearchId(researchId);
      
      if (!welcomeScreen) {
        console.log('[WelcomeScreenService] No se encontró welcome screen para researchId:', researchId);
        return null;
      }

      console.log('[WelcomeScreenService] Welcome screen encontrado:', welcomeScreen);
      return welcomeScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('[WelcomeScreenService] Error en getByResearchId:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al obtener la pantalla de bienvenida para la investigación`,
        500
      );
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
    try {
      // Validar datos
      this.validateData(data);

      // Verificar existencia
      const existing = await welcomeScreenModel.getById(id);
      if (!existing) {
        throw new ApiError(
          `${WelcomeScreenError.NOT_FOUND}: Pantalla de bienvenida no encontrada`,
          404
        );
      }

      // Actualizar en el modelo
      const updatedScreen = await welcomeScreenModel.update(id, data);
      return updatedScreen;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en WelcomeScreenService.update:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al actualizar la pantalla de bienvenida`,
        500
      );
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
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${WelcomeScreenError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar la pantalla de bienvenida`,
          400
        );
      }

      // Validar datos
      this.validateData(data);

      console.log('[WelcomeScreenService] Actualizando welcome screen para researchId:', researchId);
      console.log('[WelcomeScreenService] Datos a actualizar:', data);

      // Intentar obtener la pantalla existente
      const existingScreen = await welcomeScreenModel.getByResearchId(researchId);

      if (existingScreen) {
        // Si existe, actualizar
        console.log('[WelcomeScreenService] Actualizando welcome screen existente');
        const updatedScreen = await welcomeScreenModel.update(researchId, {
          ...data,
          metadata: {
            version: (existingScreen.metadata?.version || '1.0'),
            lastUpdated: new Date(),
            lastModifiedBy: userId
          }
        });
        console.log('[WelcomeScreenService] Welcome screen actualizado:', updatedScreen);
        return updatedScreen;
      } else {
        // Si no existe, crear nuevo
        console.log('[WelcomeScreenService] Creando nuevo welcome screen');
        const newScreen = await welcomeScreenModel.create({
          ...data,
          metadata: {
            version: '1.0',
            lastUpdated: new Date(),
            lastModifiedBy: userId
          }
        }, researchId);
        console.log('[WelcomeScreenService] Nuevo welcome screen creado:', newScreen);
        return newScreen;
      }
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('[WelcomeScreenService] Error en updateByResearchId:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al actualizar la pantalla de bienvenida`,
        500
      );
    }
  }

  /**
   * Eliminar una pantalla de bienvenida
   * @param id ID de la pantalla
   * @param _userId ID del usuario que realiza la operación
   */
  async delete(id: string, _userId: string): Promise<void> {
    try {
      // Verificar existencia
      const existing = await welcomeScreenModel.getById(id);
      if (!existing) {
        throw new ApiError(
          `${WelcomeScreenError.NOT_FOUND}: Pantalla de bienvenida no encontrada`,
          404
        );
      }

      // Eliminar en el modelo
      await welcomeScreenModel.delete(id);
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en WelcomeScreenService.delete:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al eliminar la pantalla de bienvenida`,
        500
      );
    }
  }

  /**
   * Obtiene todas las pantallas de bienvenida
   * @returns Lista de todas las pantallas de bienvenida
   */
  async getAll(): Promise<WelcomeScreenRecord[]> {
    try {
      const welcomeScreens = await welcomeScreenModel.getAll();
      return welcomeScreens;
    } catch (error) {
      // Si ya es un ApiError, relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Error en WelcomeScreenService.getAll:', error);
      throw new ApiError(
        `${WelcomeScreenError.DATABASE_ERROR}: Error al obtener todas las pantallas de bienvenida`,
        500
      );
    }
  }
}

// Exportar una instancia única del servicio
export const welcomeScreenService = new WelcomeScreenService(); 