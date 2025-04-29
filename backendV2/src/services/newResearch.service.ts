import { NewResearch, newResearchModel } from '../models/newResearch.model';
import { ValidationError, validateNewResearch, validateRequiredFields } from '../utils/validation';

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
      console.log('Creando nueva investigación con datos:', JSON.stringify(data));
      console.log('Usuario ID:', userId);
      
      // Validar campos requeridos
      validateRequiredFields(data);
      console.log('Validación de campos requeridos completada');
      
      // Validar todos los datos
      validateNewResearch(data);
      console.log('Validación completa de datos completada');
      
      const result = await newResearchModel.create(data, userId);
      console.log('Investigación creada exitosamente:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error detallado al crear investigación:', error);
      
      if (error instanceof ResearchError) {
        throw error;
      }
      
      if (error instanceof ValidationError) {
        throw new ResearchError('Error de validación en los datos', 400, error.errors);
      }
      
      console.error('Error al crear investigación:', error);
      throw new ResearchError('Error al crear la investigación', 500);
    }
  }

  /**
   * Obtiene una investigación por su ID
   * @param id ID de la investigación
   * @param context Contexto de la llamada ('user' o 'public-check')
   *                - 'user': Verifica propiedad usando userId
   *                - 'public-check': Verifica existencia y estado activo
   * @param userId ID del usuario (requerido si context es 'user')
   * @returns Datos de la investigación
   */
  async getResearchById(id: string, context: 'user' | 'public-check', userId?: string): Promise<NewResearch> {
    try {
      const research = await newResearchModel.getById(id);
      
      if (!research) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      
      // Lógica de permisos basada en el contexto
      if (context === 'user') {
        if (!userId) {
          // Error si se requiere userId pero no se proporciona
          throw new ResearchError('Se requiere userId para verificar permisos de usuario', 500);
        }
        // Verificar si el usuario tiene permiso (es propietario)
        if (!(await this.canAccessResearch(id, userId))) {
          throw new ResearchError('No tienes permiso para acceder a esta investigación', 403);
        }
      } else if (context === 'public-check') {
        // Para acceso público/participante, solo verificar estado
        console.log(`[NewResearchService.getResearchById - public-check] Verificando investigación ID: ${id}. Estado actual: ${research.status}`);
        if (research.status !== 'active') {
          console.warn(`[NewResearchService.getResearchById - public-check] Investigación ${id} no está activa (estado: ${research.status}). Denegando acceso.`);
          throw new ResearchError('No tienes permiso para acceder a esta investigación', 403);
        }
        // Si está activa, el acceso público está permitido (para este chequeo)
      }
      
      return research; // Si pasa los chequeos, devuelve la investigación
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
   * @param userId ID del usuario (para verificar permisos)
   * @returns Investigación actualizada
   */
  async updateResearch(id: string, data: Partial<NewResearch>, userId: string): Promise<NewResearch> {
    try {
      // Verificar existencia
      const existingResearch = await newResearchModel.getById(id);
      if (!existingResearch) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      
      // Verificar permisos
      if (!await this.canAccessResearch(id, userId)) {
        throw new ResearchError('No tienes permiso para modificar esta investigación', 403);
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
   * @param userId ID del usuario (para verificar permisos)
   * @returns Confirmación de eliminación
   */
  async deleteResearch(id: string, userId: string): Promise<{ message: string }> {
    try {
      // Verificar existencia
      const existingResearch = await newResearchModel.getById(id);
      if (!existingResearch) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      
      // Verificar permisos
      if (!await this.canAccessResearch(id, userId)) {
        throw new ResearchError('No tienes permiso para eliminar esta investigación', 403);
      }
      
      // Eliminar investigación
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
   * @param userId ID del usuario (para verificar permisos)
   * @returns Investigación actualizada
   */
  async changeResearchStatus(id: string, status: string, userId: string): Promise<NewResearch> {
    try {
      // Verificar existencia
      const existingResearch = await newResearchModel.getById(id);
      if (!existingResearch) {
        throw new ResearchError('Investigación no encontrada', 404);
      }
      
      // Verificar permisos
      if (!await this.canAccessResearch(id, userId)) {
        throw new ResearchError('No tienes permiso para modificar esta investigación', 403);
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
   * Verifica si un usuario puede acceder a una investigación
   * @param researchId ID de la investigación
   * @param userId ID del usuario
   * @returns true si tiene acceso, false en caso contrario
   */
  private async canAccessResearch(researchId: string, userId: string): Promise<boolean> {
    try {
      const research = await newResearchModel.getById(researchId);
      if (!research) return false;
      
      // Verificar si es el propietario (añadir más lógica según sea necesario)
      return await newResearchModel.isOwner(researchId, userId);
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
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