import { CESConfig, CSATConfig, CVConfig, NEVConfig, NPSConfig, QuestionConfig, SmartVOCFormData, VOCConfig } from '../../../shared/interfaces/smart-voc.interface';
import { SmartVOCFormModel, SmartVOCFormRecord } from '../models/smartVocForm.model';
// Eliminar imports directos de DynamoDB
// import { PutCommand, QueryCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { v4 as uuidv4 } from 'uuid'; // UUID se maneja en el modelo
import { ApiError } from '../utils/errors'; // Añadir ApiError
import { structuredLog } from '../utils/logging.util';
import { toApplicationError } from '../types/errors';

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
  private model: SmartVOCFormModel;
  private serviceName = 'SmartVOCFormService'; // Añadir serviceName

  constructor() {
    this.model = new SmartVOCFormModel();
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
          // description es OPCIONAL
          if (q.description && typeof q.description !== 'string') qErrors[questionKey].description = `debe ser texto válido`;
          // 🎯 VALIDAR TIPOS SMART VOC (aceptar tanto formatos cortos como largos)
          const validTypes = ['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC', 'smartvoc_csat', 'smartvoc_ces', 'smartvoc_cv', 'smartvoc_nev', 'smartvoc_nps', 'smartvoc_voc'];
          if (!q.type || !validTypes.includes(q.type)) qErrors[questionKey].type = `tiene un tipo inválido (${q.type})`;
          if (q.required === undefined || typeof q.required !== 'boolean') qErrors[questionKey].required = `debe indicar si es requerida (true/false)`;
          if (q.showConditionally === undefined || typeof q.showConditionally !== 'boolean') qErrors[questionKey].showConditionally = `debe indicar si se muestra condicionalmente (true/false)`;
          if (!q.config || typeof q.config !== 'object') qErrors[questionKey].config = `debe tener un objeto de configuración`;

          // Validación profunda de q.config basada en q.type
          if (q.config && q.type) {
            const config = q.config as QuestionConfig; // Cast para acceso seguro

            // 🎯 NORMALIZAR TIPO PARA VALIDACIÓN
            const normalizedType = q.type.replace('smartvoc_', '').toUpperCase();

            switch (normalizedType) {
              case 'CSAT':
                const csatConfig = config as CSATConfig;
                if (!csatConfig.type || !['stars', 'numbers', 'emojis'].includes(csatConfig.type)) qErrors[questionKey]['config.type'] = 'CSAT: tipo de config inválido';
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
                const validNevTypes = ['emojis', 'emojis_detailed', 'quadrants'];
                if (!nevConfig.type || !validNevTypes.includes(nevConfig.type)) {
                  qErrors[questionKey]['config.type'] = `NEV: tipo de config debe ser uno de: ${validNevTypes.join(', ')}`;
                }
                break;
              case 'NPS':
                const npsConfig = config as NPSConfig;
                if (npsConfig.type !== 'scale') qErrors[questionKey]['config.type'] = 'NPS: tipo de config debe ser scale';
                if (!npsConfig.scaleRange || typeof npsConfig.scaleRange.start !== 'number' || typeof npsConfig.scaleRange.end !== 'number') qErrors[questionKey]['config.scaleRange'] = 'NPS: requiere scaleRange numérico';
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

    const finalErrors: Record<string, unknown> = { ...errors };
    if (Object.keys(qErrors).length > 0) {
      finalErrors.questions = qErrors; // Añadir errores de preguntas
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
    const context = 'getByResearchId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Buscando formulario por researchId', { researchId });
    
    if (!researchId) {
      throw new ApiError(`${SmartVOCError.RESEARCH_REQUIRED}: Se requiere ID de investigación`, 400);
    }
    try {
      // Delegar completamente al modelo
      return await this.model.getByResearchId(researchId);
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      structuredLog('error', `${this.serviceName}.${context}`, 'Error desde el modelo', { appError, researchId });
      // Envolver el error del modelo en ApiError
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al obtener formulario por researchId - ${appError.message}`,
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
    const context = 'getById';
    structuredLog('info', `${this.serviceName}.${context}`, 'Buscando formulario por ID', { id });
    
    try {
      const form = await this.model.getById(id);
      if (!form) {
        throw new ApiError(`${SmartVOCError.NOT_FOUND}: Formulario SmartVOC no encontrado con ID ${id}`, 404);
      }
      return form;
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      // Si ya es un ApiError (como el NOT_FOUND), relanzarlo
      if (appError instanceof ApiError) {
        throw error;
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error desde el modelo', { error, id });
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al obtener formulario por ID - ${appError.message}`,
        500
      );
    }
  }

  /**
   * Crea un nuevo formulario SmartVOC
   * @param formData Datos del formulario
   * @param researchId ID de la investigación
   * @param userId ID del usuario que crea el formulario
   * @returns El formulario creado
   */
  async create(formData: SmartVOCFormData, researchId: string, _userId: string, questionKey?: string, type?: string): Promise<SmartVOCFormRecord> {
    const context = 'create';

    try {
      // Verificar si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      if (existingForm) {
        throw new ApiError(`SMART_VOC_FORM_EXISTS: Ya existe un formulario SmartVOC para la investigación ${researchId}`, 409);
      }

      // Guardar el formulario preservando el questionKey y type del frontend
      const result = await this.model.create(formData, researchId, questionKey, type);

      structuredLog('info', `${this.serviceName}.${context}`, 'Formulario SmartVOC creado exitosamente', {
        formId: result.id,
        researchId,
        questionKey
      });

      return result;
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      structuredLog('error', `${this.serviceName}.${context}`, 'Error al crear formulario SmartVOC', {
        researchId,
        error: appError instanceof Error ? appError.message : 'Error desconocido'
      });
      throw error;
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
  async update(id: string, formData: Partial<SmartVOCFormData>, _userId?: string, questionKey?: string, type?: string): Promise<SmartVOCFormRecord> {
    const context = 'update';
    structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando formulario', { id });

    // Validar datos parciales (la función debe manejar Partial)
    this.validateData(formData);

    try {
      // La verificación de existencia ahora debería hacerse en el modelo antes de actualizar
      // El modelo debería lanzar un error si el ID no existe, que se captura aquí
      return await this.model.update(id, formData, questionKey, type);
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      // Capturar el error específico de NOT_FOUND si el modelo lo lanza
      if (appError.message === 'SMART_VOC_FORM_NOT_FOUND') {
        throw new ApiError(`${SmartVOCError.NOT_FOUND}: Formulario con ID ${id} no encontrado para actualizar`, 404);
      }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error desde el modelo', { error, id });
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al actualizar formulario SmartVOC - ${appError.message}`,
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
    const context = 'delete';
    structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando formulario', { formId });
    
    if (!formId) {
      throw new ApiError(`${SmartVOCError.INVALID_DATA}: Se requiere ID del formulario para eliminar`, 400);
    }

    try {
      // Ya no necesitamos buscar por researchId aquí.
      // Llamar directamente al delete del modelo con el ID del formulario.
      // El modelo maneja la idempotencia (no falla si no existe).
      await this.model.delete(formId);
      structuredLog('info', `${this.serviceName}.${context}`, 'Formulario eliminado exitosamente', { formId });
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      // Ya no debería haber ApiError aquí si el modelo no lo lanza para delete
      // if (appError instanceof ApiError) {
      //     throw error;
      // }
      structuredLog('error', `${this.serviceName}.${context}`, 'Error desde el modelo al eliminar', { appError, formId });
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al eliminar formulario SmartVOC - ${appError.message}`,
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
    const context = 'deleteByResearchId';
    structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando formulario por researchId', { researchId });

    if (!researchId) {
      throw new ApiError(`${SmartVOCError.RESEARCH_REQUIRED}: Se requiere ID de investigación`, 400);
    }

    try {
      // Delegar al modelo que maneja la lógica de búsqueda y eliminación
      const deleted = await this.model.deleteByResearchId(researchId);

      if (deleted) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Formulario eliminado exitosamente', { researchId });
      } else {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontró formulario para eliminar', { researchId });
      }

      return deleted;
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      structuredLog('error', `${this.serviceName}.${context}`, 'Error desde el modelo', { appError, researchId });
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al eliminar formulario por researchId - ${appError.message}`,
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
    const context = 'getAll';
    structuredLog('warn', `${this.serviceName}.${context}`, 'Obteniendo TODOS los formularios SmartVOC - operación costosa');
    
    try {
      return await this.model.getAll();
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      structuredLog('error', `${this.serviceName}.${context}`, 'Error desde el modelo', { appError });
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error al obtener todos los formularios - ${appError.message}`,
        500
      );
    }
  }

  /**
   * Actualiza un módulo específico (pregunta individual) dentro de SmartVOC
   * @param researchId ID de la investigación
   * @param moduleId ID del módulo/pregunta a actualizar (ej: smartvoc_csat, smartvoc_ces, etc.)
   * @param moduleData Datos del módulo específico
   * @param userId ID del usuario que realiza la operación
   * @returns La configuración completa actualizada
   * @throws ApiError si hay error de validación o base de datos
   */
  async updateModule(researchId: string, moduleId: string, moduleData: any, userId: string): Promise<SmartVOCFormRecord> {
    const context = 'updateModule';
    try {
      if (!researchId) {
        throw new ApiError(
          `${SmartVOCError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar módulo`,
          400
        );
      }

      if (!moduleId) {
        throw new ApiError(
          `${SmartVOCError.INVALID_DATA}: Se requiere ID del módulo para actualizar`,
          400
        );
      }

      structuredLog('info', `${this.serviceName}.${context}`, 'Iniciando actualización de módulo SmartVOC', { 
        researchId, 
        moduleId, 
        userId 
      });

      // 1. Obtener configuración actual
      const existingForm = await this.model.getByResearchId(researchId);
      
      if (!existingForm) {
        throw new ApiError(
          `${SmartVOCError.NOT_FOUND}: SmartVOC no encontrado para esta investigación`,
          404
        );
      }

      // 2. Validar que el módulo existe
      const moduleExists = existingForm.questions.some(question => question.id === moduleId);
      if (!moduleExists) {
        throw new ApiError(
          `${SmartVOCError.NOT_FOUND}: Módulo SmartVOC con ID ${moduleId} no encontrado`,
          404
        );
      }

      // 3. Actualizar solo el módulo específico en el array de questions
      const updatedQuestions = existingForm.questions.map(question => 
        question.id === moduleId 
          ? { ...question, ...moduleData, id: moduleId } // Mantener el ID original
          : question
      );

      // 4. Validar las questions actualizadas
      this.validateData({ questions: updatedQuestions });

      // 5. Actualizar con las questions modificadas
      const updatedForm = await this.model.update(existingForm.id, {
        ...existingForm,
        questions: updatedQuestions,
        metadata: {
          ...existingForm.metadata,
          updatedAt: new Date().toISOString()
        }
      });

      structuredLog('info', `${this.serviceName}.${context}`, 'Actualización de módulo SmartVOC completada', { 
        researchId, 
        moduleId, 
        formId: updatedForm.id 
      });

      return updatedForm;
    } catch (error: unknown) {
      const appError = toApplicationError(error);
      structuredLog('error', `${this.serviceName}.${context}`, 'Error actualizando módulo SmartVOC', {
        researchId,
        moduleId,
        error: appError.message,
        stack: appError.stack
      });
      throw new ApiError(
        `${SmartVOCError.DATABASE_ERROR}: Error actualizando módulo SmartVOC - ${appError.message}`,
        appError.statusCode || 500
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
