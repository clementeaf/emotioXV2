import { SmartVOCFormModel, SmartVOCFormRecord } from '../models/smartVocForm.model';
import { SmartVOCFormData, QuestionConfig, CSATConfig, CESConfig, CVConfig, NEVConfig, NPSConfig, VOCConfig } from '../../../shared/interfaces/smart-voc.interface';
// Eliminar imports directos de DynamoDB
// import { PutCommand, QueryCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { v4 as uuidv4 } from 'uuid'; // UUID se maneja en el modelo
import { ApiError } from '../utils/errors'; // Añadir ApiError

/**
 * Errores específicos del servicio SmartVOC
 */
export enum SmartVOCError {
  NOT_FOUND = 'SMART_VOC_FORM_NOT_FOUND',
  INVALID_DATA = 'INVALID_SMART_VOC_DATA',
  RESEARCH_REQUIRED = 'RESEARCH_ID_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED', // Si se necesita control de permisos
  DATABASE_ERROR = 'DATABASE_ERROR',
  ALREADY_EXISTS = 'SMART_VOC_FORM_ALREADY_EXISTS'
}

/**
 * Clase que proporciona servicios para gestionar formularios SmartVOC
 */
export class SmartVOCFormService {
  // Ya no necesitamos tableName ni dynamoDBClient aquí
  // private readonly tableName = process.env.SMART_VOC_FORM_TABLE_NAME;
  // protected dynamoDBClient: DynamoDBDocumentClient;

  // Declarar el tipo como la CLASE del modelo
  private model: SmartVOCFormModel;

  constructor() {
    // Instanciar la CLASE del modelo
    this.model = new SmartVOCFormModel();
    // Ya no se inicializa el cliente DynamoDB aquí
  }

  /**
   * Validación básica y profunda de los datos de entrada
   */
  private validateData(data: Partial<SmartVOCFormData>): boolean {
    const errors: Record<string, string> = {};
    const qErrors: Record<string, Record<string, string>> = {}; // Para errores por pregunta

    if (data.questions !== undefined) {
      if (!Array.isArray(data.questions)) {
        errors.questions = 'Las preguntas deben ser un array';
      } else {
        data.questions.forEach((q, index) => {
            const questionKey = `question_${index + 1}`;
            qErrors[questionKey] = {}; // Inicializar errores para esta pregunta
            
            // Validaciones básicas de pregunta
            if (!q.id || typeof q.id !== 'string' || q.id.trim() === '') qErrors[questionKey].id = `debe tener un ID válido`;
            if (!q.title || typeof q.title !== 'string' || q.title.trim() === '') qErrors[questionKey].title = `debe tener título`;
            if (!q.description || typeof q.description !== 'string' || q.description.trim() === '') qErrors[questionKey].description = `debe tener descripción`;
            if (!q.type || !['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC'].includes(q.type)) qErrors[questionKey].type = `tiene un tipo inválido (${q.type})`;
            if (q.required === undefined || typeof q.required !== 'boolean') qErrors[questionKey].required = `debe indicar si es requerida (true/false)`;
            if (q.showConditionally === undefined || typeof q.showConditionally !== 'boolean') qErrors[questionKey].showConditionally = `debe indicar si se muestra condicionalmente (true/false)`;
            if (!q.config || typeof q.config !== 'object') qErrors[questionKey].config = `debe tener un objeto de configuración`;
            
            // Validación profunda de q.config basada en q.type
            if (q.config && q.type) {
                const config = q.config as QuestionConfig; // Cast para acceso seguro
                switch (q.type) {
                    case 'CSAT':
                        const csatConfig = config as CSATConfig;
                        if (!csatConfig.type || !['stars', 'numbers', 'emojis'].includes(csatConfig.type)) qErrors[questionKey]['config.type'] = 'CSAT: tipo de config inválido';
                        if (!csatConfig.companyName || typeof csatConfig.companyName !== 'string') qErrors[questionKey]['config.companyName'] = 'CSAT: requiere companyName';
                        break;
                    case 'CES':
                         const cesConfig = config as CESConfig;
                         if (cesConfig.type !== 'scale') qErrors[questionKey]['config.type'] = 'CES: tipo de config debe ser scale';
                         if (!cesConfig.scaleRange || typeof cesConfig.scaleRange.start !== 'number' || typeof cesConfig.scaleRange.end !== 'number') qErrors[questionKey]['config.scaleRange'] = 'CES: requiere scaleRange numérico';
                         break;
                    case 'CV':
                         const cvConfig = config as CVConfig;
                         if (cvConfig.type !== 'scale') qErrors[questionKey]['config.type'] = 'CV: tipo de config debe ser scale';
                         if (!cvConfig.scaleRange || typeof cvConfig.scaleRange.start !== 'number' || typeof cvConfig.scaleRange.end !== 'number') qErrors[questionKey]['config.scaleRange'] = 'CV: requiere scaleRange numérico';
                         // startLabel/endLabel son opcionales
                         break;
                    case 'NEV':
                         const nevConfig = config as NEVConfig;
                         if (nevConfig.type !== 'emojis') qErrors[questionKey]['config.type'] = 'NEV: tipo de config debe ser emojis';
                         if (!nevConfig.companyName || typeof nevConfig.companyName !== 'string') qErrors[questionKey]['config.companyName'] = 'NEV: requiere companyName';
                         break;
                    case 'NPS':
                         const npsConfig = config as NPSConfig;
                         if (npsConfig.type !== 'scale') qErrors[questionKey]['config.type'] = 'NPS: tipo de config debe ser scale';
                         if (!npsConfig.scaleRange || typeof npsConfig.scaleRange.start !== 'number' || typeof npsConfig.scaleRange.end !== 'number') qErrors[questionKey]['config.scaleRange'] = 'NPS: requiere scaleRange numérico';
                         if (!npsConfig.companyName || typeof npsConfig.companyName !== 'string') qErrors[questionKey]['config.companyName'] = 'NPS: requiere companyName';
                         break;
                    case 'VOC':
                        const vocConfig = config as VOCConfig;
                        if (vocConfig.type !== 'text') qErrors[questionKey]['config.type'] = 'VOC: tipo de config debe ser text';
                        break;
                }
            }
             // Limpiar errores de pregunta si no hay ninguno
            if (Object.keys(qErrors[questionKey]).length === 0) {
                delete qErrors[questionKey];
            }
        });
      }
    }
    // Añadir otras validaciones a nivel de formulario si es necesario (ej: data.researchId)

    const finalErrors = { ...errors };
    if (Object.keys(qErrors).length > 0) {
        finalErrors.questions = qErrors as any; // Añadir errores de preguntas
    }

    if (Object.keys(finalErrors).length > 0) {
      throw new ApiError(
        `${SmartVOCError.INVALID_DATA}: Los datos del formulario SmartVOC no son válidos - ${JSON.stringify(finalErrors)}`,
        400
      );
    }

    return true;
  }

  /**
   * Obtiene el formulario SmartVOC por ID de investigación
   * @param researchId ID de la investigación
   * @returns El formulario encontrado o null
   * @throws ApiError si ocurre un error de base de datos
   */
  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    console.log(`[SmartVOCFormService.getByResearchId] Buscando por researchId: ${researchId}`);
    if (!researchId) {
      throw new ApiError(`${SmartVOCError.RESEARCH_REQUIRED}: Se requiere ID de investigación`, 400);
    }
    try {
      // Delegar completamente al modelo
      return await this.model.getByResearchId(researchId);
    } catch (error: any) {
      console.error('[SmartVOCFormService.getByResearchId] Error desde el modelo:', error);
      // Envolver el error del modelo en ApiError
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al obtener formulario por researchId - ${error.message}`,
        500
      );
    }
  }

  /**
   * Obtiene el formulario SmartVOC por su ID único
   * @param id ID del formulario
   * @returns El formulario encontrado
   * @throws ApiError si no se encuentra o hay error de DB
   */
  async getById(id: string): Promise<SmartVOCFormRecord> {
    console.log(`[SmartVOCFormService.getById] Buscando por ID: ${id}`);
    try {
      const form = await this.model.getById(id);
      if (!form) {
        throw new ApiError(`${SmartVOCError.NOT_FOUND}: Formulario SmartVOC no encontrado con ID ${id}`, 404);
      }
      return form;
    } catch (error: any) {
       // Si ya es un ApiError (como el NOT_FOUND), relanzarlo
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('[SmartVOCFormService.getById] Error desde el modelo:', error);
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al obtener formulario por ID - ${error.message}`,
        500
      );
    }
  }

  /**
   * Crea un nuevo formulario SmartVOC asociado a una investigación
   * @param formData Datos del formulario
   * @param researchId ID de la investigación
   * @param _userId ID del usuario (opcional, para auditoría futura)
   * @returns El formulario creado
   * @throws ApiError si los datos son inválidos, ya existe o hay error de DB
   */
  async create(formData: SmartVOCFormData, researchId: string, _userId?: string): Promise<SmartVOCFormRecord> {
    console.log('[SmartVOCFormService.create] Creando formulario para researchId:', researchId);
    if (!researchId) {
      throw new ApiError(`${SmartVOCError.RESEARCH_REQUIRED}: Se requiere ID de investigación`, 400);
    }

    // Validar datos primero
    this.validateData(formData);

    try {
        // Verificar si ya existe uno para esta investigación (lógica movida desde el controlador)
        const existing = await this.model.getByResearchId(researchId);
        if (existing) {
            throw new ApiError(`${SmartVOCError.ALREADY_EXISTS}: Ya existe un formulario SmartVOC para la investigación ${researchId}`, 409); // 409 Conflict
        }
        // Delegar la creación al modelo
        return await this.model.create(formData, researchId);
    } catch (error: any) {
        if (error instanceof ApiError) { // Relanzar errores ApiError (como ALREADY_EXISTS)
            throw error;
        }
        // Capturar error específico del modelo si existe (como el ALREADY_EXISTS lanzado por el modelo)
        if (error.message === 'SMART_VOC_FORM_ALREADY_EXISTS') {
             throw new ApiError(`${SmartVOCError.ALREADY_EXISTS}: Ya existe un formulario SmartVOC para la investigación ${researchId}`, 409);
        }
        console.error('[SmartVOCFormService.create] Error desde el modelo:', error);
        throw new ApiError(
            `${SmartVOCError.DATABASE_ERROR}: Error al crear formulario SmartVOC - ${error.message}`,
            500
        );
    }
  }

  /**
   * Actualiza un formulario SmartVOC existente por su ID
   * @param id ID del formulario
   * @param formData Datos parciales a actualizar
   * @param _userId ID del usuario (opcional)
   * @returns El formulario actualizado
   * @throws ApiError si no se encuentra, datos inválidos o error de DB
   */
  async update(id: string, formData: Partial<SmartVOCFormData>, _userId?: string): Promise<SmartVOCFormRecord> {
      console.log(`[SmartVOCFormService.update] Actualizando formulario ID: ${id}`);

      // Validar datos parciales (la función debe manejar Partial)
      this.validateData(formData);

      try {
          // La verificación de existencia ahora debería hacerse en el modelo antes de actualizar
          // El modelo debería lanzar un error si el ID no existe, que se captura aquí
          return await this.model.update(id, formData);
      } catch (error: any) {
          // Capturar el error específico de NOT_FOUND si el modelo lo lanza
          if (error.message === 'SMART_VOC_FORM_NOT_FOUND') {
             throw new ApiError(`${SmartVOCError.NOT_FOUND}: Formulario con ID ${id} no encontrado para actualizar`, 404);
          }
          console.error('[SmartVOCFormService.update] Error desde el modelo:', error);
          throw new ApiError(
              `${SmartVOCError.DATABASE_ERROR}: Error al actualizar formulario SmartVOC - ${error.message}`,
              500
          );
      }
  }

  /**
   * Elimina un formulario SmartVOC por su ID único
   * @param formId ID del formulario a eliminar
   * @param _userId ID del usuario (opcional)
   * @throws ApiError si hay error de DB
   */
  async delete(formId: string, _userId?: string): Promise<void> {
    console.log(`[SmartVOCFormService.delete] Eliminando formulario con ID: ${formId}`);
    if (!formId) {
        throw new ApiError(`${SmartVOCError.INVALID_DATA}: Se requiere ID del formulario para eliminar`, 400);
    }

    try {
        // Ya no necesitamos buscar por researchId aquí.
        // Llamar directamente al delete del modelo con el ID del formulario.
        // El modelo maneja la idempotencia (no falla si no existe).
        await this.model.delete(formId);
        console.log(`[SmartVOCFormService.delete] Llamada a model.delete completada para ID: ${formId}`);
    } catch (error: any) {
        // Ya no debería haber ApiError aquí si el modelo no lo lanza para delete
        // if (error instanceof ApiError) { 
        //     throw error;
        // }
        console.error(`[SmartVOCFormService.delete] Error desde el modelo al eliminar ID ${formId}:`, error);
        throw new ApiError(
            `${SmartVOCError.DATABASE_ERROR}: Error al eliminar formulario SmartVOC - ${error.message}`,
            500
        );
    }
  }

  /**
   * Elimina un formulario SmartVOC por el ID de investigación
   * @param researchId ID de la investigación
   * @param _userId ID del usuario (opcional)
   * @returns true si se eliminó exitosamente, false si no se encontró
   * @throws ApiError si hay error de validación o base de datos
   */
  async deleteByResearchId(researchId: string, _userId?: string): Promise<boolean> {
    console.log(`[SmartVOCFormService.deleteByResearchId] Eliminando formulario para researchId: ${researchId}`);
    
    if (!researchId) {
      throw new ApiError(`${SmartVOCError.RESEARCH_REQUIRED}: Se requiere ID de investigación`, 400);
    }

    try {
      // Delegar al modelo que maneja la lógica de búsqueda y eliminación
      const deleted = await this.model.deleteByResearchId(researchId);
      
      if (deleted) {
        console.log(`[SmartVOCFormService.deleteByResearchId] Formulario eliminado exitosamente para researchId: ${researchId}`);
      } else {
        console.log(`[SmartVOCFormService.deleteByResearchId] No se encontró formulario para eliminar con researchId: ${researchId}`);
      }
      
      return deleted;
    } catch (error: any) {
      console.error('[SmartVOCFormService.deleteByResearchId] Error desde el modelo:', error);
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al eliminar formulario por researchId - ${error.message}`,
        500
      );
    }
  }

  /**
   * Obtiene todos los formularios SmartVOC (usar con precaución)
   * @returns Lista de todos los formularios
   * @throws ApiError si hay error de DB
   */
  async getAll(): Promise<SmartVOCFormRecord[]> {
     console.warn('[SmartVOCFormService.getAll] Obteniendo TODOS los formularios SmartVOC. Esta operación puede ser costosa.');
    try {
        return await this.model.getAll();
    } catch (error: any) {
        console.error('[SmartVOCFormService.getAll] Error desde el modelo:', error);
        throw new ApiError(
            `${SmartVOCError.DATABASE_ERROR}: Error al obtener todos los formularios - ${error.message}`,
            500
        );
    }
  }

   // Eliminar createOrUpdate ya que la lógica de creación/actualización se maneja
   // en el controlador basado en la existencia (similar a WelcomeScreen)
   /*
   async createOrUpdate(researchId: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
     // ... lógica anterior ...
   }
   */

}

// Eliminar la exportación de la instancia singleton
// export const smartVOCFormService = new SmartVOCFormService(); 

// La clase ya se exporta con `export class SmartVOCFormService { ... }` 