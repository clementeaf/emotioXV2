import { NewResearch, newResearchModel } from '../models/newResearch.model';
import { ValidationError, validateNewResearch, validateRequiredFields } from '../utils/validation';
import { structuredLog } from '../utils/logging.util';

/**
 * Clase de error para operaciones de investigación
 */
export class ResearchError extends Error {
  statusCode: number;
  validationErrors?: Record<string, string>;

  constructor(message: string, statusCode: number = 500, validationErrors?: Record<string, string>) {
    super(message);
    this.name = 'ResearchError';
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }
}

/**
 * Servicio para manejar operaciones CRUD de investigaciones
 */
export class NewResearchService {
  /**
   * Crea una nueva investigación
   * @param data Datos de la investigación
   * @param userId ID del usuario creador
   * @returns Investigación creada con su ID
   */
  async createResearch(data: NewResearch, userId: string): Promise<NewResearch> {
    try {
      structuredLog('info', 'NewResearchService.createResearch', 'Creando nueva investigación', { researchName: data.name, type: data.type, userId });

      // Validar campos requeridos
      validateRequiredFields(data);
      structuredLog('info', 'NewResearchService.createResearch', 'Validación de campos requeridos completada');

      // Validar todos los datos
      validateNewResearch(data);
      structuredLog('info', 'NewResearchService.createResearch', 'Validación completa de datos completada');

      const result = await newResearchModel.create(data, userId);
      structuredLog('info', 'NewResearchService.createResearch', 'Investigación creada exitosamente', { researchId: result.id });
      return result;
    } catch (error) {
      structuredLog('error', 'NewResearchService.createResearch', 'Error detallado al crear investigación', { error });

      if (error instanceof ResearchError) {
        throw error;
      }

      if (error instanceof ValidationError) {
        throw new ResearchError('Error de validación en los datos', 400, error.errors);
      }

      structuredLog('error', 'NewResearchService.createResearch', 'Error al crear investigación', { error });
      throw new ResearchError('Error al crear la investigación', 500);
    }
  }

  /**
   * Obtiene una investigación por su ID
   * @param id ID de la investigación
   * @param context Contexto de la llamada ('user' o 'public-check')
   * @param userId ID del usuario (ya no se usa para permisos)
   * @returns Datos de la investigación
   */
  async getResearchById(id: string, context: 'user' | 'public-check', _userId?: string): Promise<NewResearch> {
    try {
      structuredLog('info', 'NewResearchService.getResearchById', 'Buscando research por ID', { id });
      const research = await newResearchModel.getById(id);
      
      if (!research) {
        structuredLog('info', 'NewResearchService.getResearchById', 'Research no encontrado', { id });
        throw new ResearchError('Investigación no encontrada', 404);
      }
      
      structuredLog('info', 'NewResearchService.getResearchById', 'Research encontrado exitosamente', { id });
      
      // Solo validar estado para acceso público
      if (context === 'public-check') {
        if (research.status !== 'active') {
          throw new ResearchError('No tienes permiso para acceder a esta investigación', 403);
        }
      }
      return research;
    } catch (error) {
      if (error instanceof ResearchError) {
        throw error;
      }
      console.error('Error al obtener investigación:', error);
      throw new ResearchError('Error al obtener la investigación', 500);
    }
  }

  /**
   * Obtiene todas las investigaciones de un usuario
   * @param userId ID del usuario
   * @returns Lista de investigaciones
   */
  async getUserResearches(userId: string): Promise<NewResearch[]> {
    try {
      return await newResearchModel.getByUserId(userId);
    } catch (error) {
      console.error('Error al obtener investigaciones del usuario:', error);
      throw new ResearchError('Error al obtener las investigaciones', 500);
    }
  }

  /**
   * Actualiza una investigación existente
   * @param id ID de la investigación
   * @param data Datos a actualizar
   * @param userId ID del usuario (ya no se usa para permisos)
   * @returns Investigación actualizada
   */
  async updateResearch(id: string, data: Partial<NewResearch>, _userId: string): Promise<NewResearch> {
    try {
      // Verificar existencia
      const existingResearch = await newResearchModel.getById(id);
      if (!existingResearch) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      // Validar datos antes de actualizar
      validateNewResearch(data);
      // Actualizar investigación
      return await newResearchModel.update(id, data);
    } catch (error) {
      if (error instanceof ResearchError) {
        throw error;
      }
      if (error instanceof ValidationError) {
        throw new ResearchError('Error de validación en los datos', 400, error.errors);
      }
      console.error('Error al actualizar investigación:', error);
      throw new ResearchError('Error al actualizar la investigación', 500);
    }
  }

  /**
   * Elimina una investigación
   * @param id ID de la investigación
   * @param userId ID del usuario (ya no se usa para permisos)
   * @returns Confirmación de eliminación
   */
  async deleteResearch(id: string, _userId: string): Promise<{ message: string }> {
    try {
      // Verificar existencia
      const existingResearch = await newResearchModel.getById(id);
      if (!existingResearch) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      // Eliminar investigación (sin validar permisos)
      await newResearchModel.delete(id);
      return { message: 'Investigación eliminada exitosamente' };
    } catch (error) {
      if (error instanceof ResearchError) {
        throw error;
      }
      console.error('Error al eliminar investigación:', error);
      throw new ResearchError('Error al eliminar la investigación', 500);
    }
  }

  /**
   * Cambia el estado de una investigación
   * @param id ID de la investigación
   * @param status Nuevo estado
   * @param userId ID del usuario (ya no se usa para permisos)
   * @returns Investigación actualizada
   */
  async changeResearchStatus(id: string, status: string, _userId: string): Promise<NewResearch> {
    try {
      // Verificar existencia
      const existingResearch = await newResearchModel.getById(id);
      if (!existingResearch) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      // Validar el nuevo estado
      validateNewResearch({ status });
      // Actualizar estado
      return await newResearchModel.updateStatus(id, status);
    } catch (error) {
      if (error instanceof ResearchError) {
        throw error;
      }
      if (error instanceof ValidationError) {
        throw new ResearchError('Estado no válido', 400, error.errors);
      }
      console.error('Error al cambiar estado de investigación:', error);
      throw new ResearchError('Error al cambiar el estado de la investigación', 500);
    }
  }

  /**
   * Obtiene todas las investigaciones
   * @returns Lista de todas las investigaciones
   */
  async getAllResearches(): Promise<NewResearch[]> {
    try {
      return await newResearchModel.getAll();
    } catch (error) {
      console.error('Error al obtener todas las investigaciones desde el modelo:', error);
      // Re-lanzar el error original para que el controlador lo maneje
      // Si el modelo devuelve [], no entrará aquí.
      // Si hay un error real (permisos, red, etc.), se propagará.
      throw error;
    }
  }
}

// Exportar instancia única
export const newResearchService = new NewResearchService();
