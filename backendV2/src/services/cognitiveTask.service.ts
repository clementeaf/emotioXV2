import { CognitiveTaskModel, CognitiveTaskRecord } from '../models/cognitiveTask.model';
import { CognitiveTaskFormData, Question, UploadedFile, COGNITIVE_TASK_VALIDATION, ScaleConfig, Choice } from '../../../shared/interfaces/cognitive-task.interface';
import { ApiError } from '../utils/errors';
import { S3Service, FileType, PresignedUrlParams } from '../services/s3.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Errores específicos del servicio de tareas cognitivas
 */
export enum CognitiveTaskError {
  NOT_FOUND = 'COGNITIVE_TASK_NOT_FOUND',
  INVALID_DATA = 'INVALID_COGNITIVE_TASK_DATA',
  RESEARCH_REQUIRED = 'RESEARCH_ID_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR'
}

/**
 * Clase que proporciona servicios para gestionar formularios CognitiveTask
 * Adaptado para usar researchId como PK en el modelo.
 */
export class CognitiveTaskService {
  private model = new CognitiveTaskModel();
  private s3Service = new S3Service();

  /**
   * Validación principal de los datos de entrada para CognitiveTaskFormData.
   * Llama a validaciones auxiliares.
   */
  private validateFormData(data: Partial<CognitiveTaskFormData>): void {
    console.log('[DEBUG] CognitiveTaskService.validateFormData - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // 1. Validar researchId (esencial)
    if (!data.researchId) {
      throw new ApiError(
        `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere un ID de investigación`,
        400
      );
    }

    // 2. Validar preguntas si existen
    if (data.questions) {
      this._validateQuestionsArray(data.questions);
      data.questions.forEach((question, index) => {
        this._validateSingleQuestion(question, index);
      });
    }
  }

  /**
   * Valida que las preguntas sean un array.
   */
  private _validateQuestionsArray(questions: any): void {
    if (!Array.isArray(questions)) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: Las preguntas deben ser un array`,
        400
      );
    }
  }

  /**
   * Valida la estructura y tipos básicos de una pregunta individual.
   */
  private _validateSingleQuestion(question: Question, index: number): void {
    const questionNumber = index + 1;
    
    // Validar tipo de pregunta
    if (!question.type || typeof question.type !== 'string') {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: La pregunta ${questionNumber} debe tener un tipo válido`,
        400
      );
    }

    // Validar longitud del título si existe
    if (question.title && question.title.length > COGNITIVE_TASK_VALIDATION.title.maxLength) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: El título de la pregunta ${questionNumber} no debe exceder ${COGNITIVE_TASK_VALIDATION.title.maxLength} caracteres`,
        400
      );
    }
    
    // Validaciones específicas por tipo
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'ranking':
        this._validateQuestionChoices(question.choices, questionNumber);
        break;
      case 'linear_scale':
        this._validateQuestionScale(question.scaleConfig, questionNumber);
        break;
      case 'navigation_flow':
      case 'preference_test':
        this._validateQuestionFiles(question.files, questionNumber);
        break;
      // Añadir casos para otros tipos si existen (e.g., 'text_input')
    }
  }

  /**
   * Valida las opciones (choices) para preguntas de selección múltiple, única o ranking.
   */
  private _validateQuestionChoices(choices: Choice[] | undefined, questionNumber: number): void {
    if (!choices || !Array.isArray(choices)) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: Las opciones de la pregunta ${questionNumber} deben ser un array`,
        400
      );
    }

    if (choices.length < COGNITIVE_TASK_VALIDATION.choices.min) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: La pregunta ${questionNumber} debe tener al menos ${COGNITIVE_TASK_VALIDATION.choices.min} opción`,
        400
      );
    }

    if (choices.length > COGNITIVE_TASK_VALIDATION.choices.max) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: La pregunta ${questionNumber} no debe exceder ${COGNITIVE_TASK_VALIDATION.choices.max} opciones`,
        400
      );
    }
    // Podría añadirse validación del contenido de cada choice si es necesario
  }

  /**
   * Valida la configuración de escala (scaleConfig) para preguntas de escala lineal.
   */
  private _validateQuestionScale(scaleConfig: ScaleConfig | undefined, questionNumber: number): void {
    if (!scaleConfig || typeof scaleConfig !== 'object') {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: La configuración de escala de la pregunta ${questionNumber} debe ser un objeto`,
        400
      );
    }

    if (scaleConfig.startValue < COGNITIVE_TASK_VALIDATION.scaleConfig.minValue) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: El valor inicial de la escala (pregunta ${questionNumber}) debe ser al menos ${COGNITIVE_TASK_VALIDATION.scaleConfig.minValue}`,
        400
      );
    }

    if (scaleConfig.endValue > COGNITIVE_TASK_VALIDATION.scaleConfig.maxValue) {
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: El valor final de la escala (pregunta ${questionNumber}) no debe exceder ${COGNITIVE_TASK_VALIDATION.scaleConfig.maxValue}`,
        400
      );
    }
    // Añadir validación startValue <= endValue si aplica
    if (scaleConfig.startValue > scaleConfig.endValue) {
       throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: El valor inicial de la escala (pregunta ${questionNumber}) no puede ser mayor que el valor final`,
        400
      );
    }
  }

  /**
   * Valida los archivos (files) para preguntas que los requieren.
   */
  private _validateQuestionFiles(files: UploadedFile[] | undefined, questionNumber: number): void {
    if (!files || !Array.isArray(files)) {
      // Permitir que no haya archivos si no son obligatorios? Depende de la lógica.
      // Si son obligatorios, lanzar error aquí. Si no, simplemente retornar.
      // Asumiendo que *pueden* estar vacíos, pero si existen, deben ser un array válido.
       if (files === undefined) return; // Si no existe el array, OK (asumiendo opcional)
       throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: Los archivos de la pregunta ${questionNumber} deben ser un array`,
        400
      ); 
    }
    
    // Si el array existe, validar cada archivo
    files.forEach((file, fileIndex) => {
      const fileNumber = fileIndex + 1;
      if (!file || typeof file !== 'object') {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} de la pregunta ${questionNumber} es inválido`,
          400
        );
      }
      
      // Validar campos básicos del archivo
      if (!file.id || !file.name || !file.size || !file.type) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} (pregunta ${questionNumber}) debe tener id, name, size y type`,
          400
        );
      }
      
      // Validar campos críticos para S3 (URL y Key)
      if (!file.url || !file.s3Key) {
        console.log(`[VALIDACION-IMAGEN] Archivo con datos incompletos: Pregunta ${questionNumber}, Archivo ${fileNumber}`, file);
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} (pregunta ${questionNumber}) debe tener url y s3Key`,
          400
        );
      }
      
      // Validar tamaño máximo
      if (file.size > COGNITIVE_TASK_VALIDATION.files.maxSize) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} (pregunta ${questionNumber}) excede el tamaño máximo (${COGNITIVE_TASK_VALIDATION.files.maxSize / (1024 * 1024)} MB)`,
          400
        );
      }
      // Podría añadirse validación de tipo MIME si COGNITIVE_TASK_VALIDATION.files.validTypes existe
    });
  }

  /**
   * Genera una URL prefirmada para subir un archivo a S3
   * @param fileParams Parámetros del archivo
   * @param researchId ID de la investigación
   * @returns Respuesta con la URL prefirmada y datos del archivo
   */
  async getFileUploadUrl(fileParams: {
    fileName: string;
    fileSize: number;
    fileType: string;
    researchId: string;
  }): Promise<{
    uploadUrl: string;
    fileUrl: string;
    file: UploadedFile;
  }> {
    try {
      // Validar tipo MIME
      if (!COGNITIVE_TASK_VALIDATION.files.validTypes.includes(fileParams.fileType)) {
        throw new ApiError(
          `${CognitiveTaskError.FILE_ERROR}: Tipo de archivo no válido. Tipos permitidos: ${COGNITIVE_TASK_VALIDATION.files.validTypes.join(', ')}`,
          400
        );
      }

      // Validar tamaño
      if (fileParams.fileSize > COGNITIVE_TASK_VALIDATION.files.maxSize) {
        throw new ApiError(
          `${CognitiveTaskError.FILE_ERROR}: El archivo excede el tamaño máximo permitido (${COGNITIVE_TASK_VALIDATION.files.maxSize / (1024 * 1024)} MB)`,
          400
        );
      }

      // Crear parámetros para S3
      const params: PresignedUrlParams = {
        fileType: FileType.IMAGE, // Asumimos que todos los archivos son imágenes
        fileName: fileParams.fileName,
        mimeType: fileParams.fileType,
        fileSize: fileParams.fileSize,
        researchId: fileParams.researchId,
        folder: 'cognitive-tasks' // Carpeta específica para tareas cognitivas
      };

      // Generar URL prefirmada
      const presignedUrlResponse = await this.s3Service.generateUploadUrl(params);

      // Crear objeto de archivo
      const file: UploadedFile = {
        id: presignedUrlResponse.key.split('/').pop() || '', // Extraer nombre del archivo de la clave S3
        name: fileParams.fileName,
        size: fileParams.fileSize,
        type: fileParams.fileType,
        url: presignedUrlResponse.fileUrl,
        s3Key: presignedUrlResponse.key
      };

      return {
        uploadUrl: presignedUrlResponse.uploadUrl,
        fileUrl: presignedUrlResponse.fileUrl,
        file
      };
    } catch (error) {
      console.error('Error al generar URL para subir archivo:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `${CognitiveTaskError.UPLOAD_ERROR}: Error al generar URL para subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Genera una URL prefirmada para descargar un archivo de S3
   * @param s3Key Clave del archivo en S3
   * @returns URL prefirmada para descargar el archivo
   */
  async getFileDownloadUrl(s3Key: string): Promise<string> {
    try {
      return await this.s3Service.generateDownloadUrl(s3Key);
    } catch (error) {
      console.error('Error al generar URL para descargar archivo:', error);
      throw new ApiError(
        `${CognitiveTaskError.FILE_ERROR}: Error al generar URL para descargar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Genera una URL prefirmada para eliminar un archivo de S3
   * @param s3Key Clave del archivo en S3
   * @returns URL prefirmada para eliminar el archivo
   */
  async getFileDeleteUrl(s3Key: string): Promise<string> {
    try {
      return await this.s3Service.generateDeleteUrl(s3Key);
    } catch (error) {
      console.error('Error al generar URL para eliminar archivo:', error);
      throw new ApiError(
        `${CognitiveTaskError.FILE_ERROR}: Error al generar URL para eliminar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Obtiene un formulario CognitiveTask según el ID de investigación.
   * Llama directamente al modelo que usa researchId como PK.
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    this.validateResearchId(researchId); // Validar ID
    try {
      // La llamada al modelo es la misma, pero ahora usa GetCommand por PK
      return await this.model.getByResearchId(researchId);
    } catch (error) {
      console.error('[CognitiveTaskService] Error en getByResearchId:', error);
      // Usar handleDbError para mapear errores del modelo
      throw this.handleDbError(error, 'obtener tarea cognitiva por researchId');
    }
  }

  /**
   * Crea un formulario CognitiveTask.
   * Genera el ID lógico (UUID) aquí.
   */
  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    this.validateResearchId(researchId);
    
    // Generar ID lógico (UUID) si no viene
    const formId = data.id || uuidv4();
    const formDataWithId = { 
      ...data, 
      id: formId, // Asegurar que el ID lógico existe
      researchId // Asegurar que researchId existe para validación
    };

    // Validar datos completos al crear (usa el método refactorizado)
    this.validateFormData(formDataWithId);
    
    try {
      // Pasar el objeto completo (con id y researchId) y researchId por separado al modelo
      return await this.model.create(formDataWithId, researchId);
    } catch (error) {
      console.error('[CognitiveTaskService] Error en create:', error);
      throw this.handleDbError(error, 'crear tarea cognitiva');
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente usando su ID lógico (UUID).
   * Obtiene el researchId asociado antes de llamar al modelo.
   */
  async update(taskId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    if (!taskId) throw new ApiError('Se requiere taskId (UUID) para actualizar', 400);

    try {
      // 1. Obtener el registro actual usando el ID lógico (UUID) para obtener researchId y verificar existencia
      const currentRecord = await this.model.getById(taskId);
      if (!currentRecord) {
        throw new ApiError(CognitiveTaskError.NOT_FOUND, 404); // Lanzar 404 si no existe
      }
      const researchId = currentRecord.researchId;

      // 2. Validar los datos parciales, asegurando que researchId esté presente para la validación
      // Eliminar id y researchId del payload de validación si no deben validarse directamente.
      const { id, researchId: dataResearchId, ...validationPayload } = data;
      this.validateFormData({ ...validationPayload, researchId }); // Validar con el researchId real
      
      // 3. Llamar al modelo para actualizar usando researchId (PK)
      // Eliminar id y researchId del payload de actualización
      const { id: removedId, researchId: removedResearchId, ...updatePayload } = data;
      const updatedRecord = await this.model.update(researchId, updatePayload);
      
      // El modelo ahora verifica si result.Attributes existe, así que confiamos en eso.
      return updatedRecord; 
      
    } catch (error) {
      console.error(`[CognitiveTaskService] Error en update (taskId: ${taskId}):`, error);
      // Re-lanzar ApiErrors (como NOT_FOUND de getById)
      if (error instanceof ApiError) throw error; 
      // Mapear errores específicos del modelo (como COGNITIVE_TASK_NOT_FOUND de update)
      throw this.handleDbError(error, 'actualizar tarea cognitiva');
    }
  }

  /**
   * Elimina un formulario CognitiveTask usando su ID lógico (UUID).
   * Obtiene el researchId asociado antes de llamar al modelo.
   */
  async delete(taskId: string): Promise<boolean> {
    if (!taskId) throw new ApiError('Se requiere taskId (UUID) para eliminar', 400);
    try {
       // 1. Obtener el registro actual usando el ID lógico (UUID) para obtener researchId y verificar existencia
      const currentRecord = await this.model.getById(taskId);
      if (!currentRecord) {
        throw new ApiError(CognitiveTaskError.NOT_FOUND, 404); // Lanzar 404 si no existe
      }
      const researchId = currentRecord.researchId;

      // 2. Llamar al modelo para eliminar usando researchId (PK)
      return await this.model.delete(researchId);
      // El modelo usa ConditionCheck y lanza error si no existe, que será mapeado por handleDbError

    } catch (error) {
      console.error(`[CognitiveTaskService] Error en delete (taskId: ${taskId}):`, error);
      // Re-lanzar ApiErrors (como NOT_FOUND de getById)
      if (error instanceof ApiError) throw error;
      // Mapear errores específicos del modelo (como COGNITIVE_TASK_NOT_FOUND de delete)
      throw this.handleDbError(error, 'eliminar tarea cognitiva');
    }
  }

  /**
   * Clona un formulario CognitiveTask existente para una nueva investigación.
   * Usa getById con el ID lógico (UUID) del formulario fuente.
   */
  async cloneCognitiveTaskForm(sourceFormId: string, targetResearchId: string): Promise<CognitiveTaskRecord> {
    if (!sourceFormId) throw new ApiError('Se requiere sourceFormId (UUID) para clonar', 400);
    this.validateResearchId(targetResearchId);
    
    try {
      // 1. Obtener formulario origen usando su ID lógico (UUID)
      const sourceForm = await this.model.getById(sourceFormId);
      if (!sourceForm) {
        throw new ApiError(
          `${CognitiveTaskError.NOT_FOUND}: No se encontró formulario CognitiveTask fuente con ID: ${sourceFormId}`,
          404
        );
      }
      
      // 2. Verificar si ya existe un formulario para la investigación destino (usando PK)
      const existingTargetForm = await this.model.getByResearchId(targetResearchId);
      if (existingTargetForm) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: Ya existe un formulario CognitiveTask para la investigación destino con ID: ${targetResearchId}`,
          400
        );
      }
      
      // 3. Preparar datos para clonar
      const newFormId = uuidv4(); 
      const clonedQuestions = await this.cloneQuestions(sourceForm.questions, targetResearchId);
      const now = new Date().toISOString();
      
      const formDataToClone: CognitiveTaskFormData = {
        id: newFormId, 
        researchId: targetResearchId,
        questions: clonedQuestions,
        randomizeQuestions: sourceForm.randomizeQuestions,
        metadata: {
          // Copiar metadata original si existe, pero sin añadir campos no definidos
          ...(sourceForm.metadata || {}),
          createdAt: now, 
          updatedAt: now,
          lastModifiedBy: 'system_clone'
        }
      };
      
      // 4. Crear el nuevo formulario usando el modelo
      return await this.model.create(formDataToClone, targetResearchId);

    } catch (error) {
      console.error('Error al clonar formulario CognitiveTask:', error);
      if (error instanceof ApiError) throw error;
      // Mapear errores de DB
      throw this.handleDbError(error, 'clonar formulario CognitiveTask');
    }
  }

  /**
   * Clona las preguntas de un formulario, incluyendo sus archivos
   * @param questions Preguntas originales
   * @param targetResearchId ID de la investigación destino
   * @returns Preguntas clonadas
   */
  private async cloneQuestions(questions: Question[], targetResearchId: string): Promise<Question[]> {
    try {
      const clonedQuestions: Question[] = [];
      
      for (const question of questions) {
        const clonedQuestion: Question = {
          ...question,
          // Generar nuevo ID para la pregunta clonada?
          // id: uuidv4(), // O mantener el ID original si es necesario para referencias?
          id: question.id // Mantenemos el mismo ID por ahora
        };
        
        // Si la pregunta tiene archivos, clonarlos
        if (question.files && question.files.length > 0) {
          clonedQuestion.files = await this.cloneFiles(question.files, targetResearchId);
        }
        
        clonedQuestions.push(clonedQuestion);
      }
      
      return clonedQuestions;
    } catch (error) {
      console.error('Error al clonar preguntas:', error);
      // Re-lanzar para que cloneCognitiveTaskForm lo maneje
      throw error; 
    }
  }

  /**
   * Clona archivos de S3 para una nueva investigación.
   * Genera nueva metadata y URL de subida para cada archivo en el destino.
   * NO realiza la copia física del contenido.
   */
  private async cloneFiles(files: UploadedFile[], targetResearchId: string): Promise<UploadedFile[]> {
    try {
      const clonedFilesPromises = files.map(async (file) => {
        const mimeType = file.type || 'application/octet-stream'; 
        const fileSize = typeof file.size === 'string' ? parseInt(file.size, 10) : file.size;

        if (isNaN(fileSize) || fileSize === null || fileSize === undefined) {
            console.warn(`[CLONE_FILES] Tamaño de archivo inválido o nulo para ${file.name}, omitiendo.`);
            return null;
        }
        
        const params: PresignedUrlParams = {
          fileType: FileType.IMAGE, // Ajustar según sea necesario
          fileName: file.name,
          mimeType: mimeType,
          fileSize: fileSize,
          researchId: targetResearchId,
          folder: 'cognitive-tasks'
        };

        const presignedUrlResponse = await this.s3Service.generateUploadUrl(params);

        // Crear objeto de archivo clonado con la nueva metadata de S3
        const clonedFile: UploadedFile = {
          id: presignedUrlResponse.key.split('/').pop() || uuidv4(), 
          name: file.name, 
          size: fileSize, 
          type: mimeType,
          url: presignedUrlResponse.fileUrl, 
          s3Key: presignedUrlResponse.key, 
          time: Date.now() // Usar Date.now() para timestamp numérico
        };

        // Clonar hitZones si existen
        if (file.hitZones && file.hitZones.length > 0) {
          clonedFile.hitZones = file.hitZones.map(zone => ({
            ...zone,
            id: uuidv4(), 
            fileId: clonedFile.id 
          }));
        }
        return clonedFile;
      });

      const results = await Promise.all(clonedFilesPromises);
      return results.filter(file => file !== null) as UploadedFile[];
      
    } catch (error) {
      console.error('Error al clonar archivos (generando nueva metadata S3):', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(`${CognitiveTaskError.FILE_ERROR}: Error durante la preparación de clonación de archivos S3`, 500);
    }
  }

  /**
   * Obtiene todos los formularios CognitiveTask
   * @returns Lista de todos los formularios
   */
  async getAllForms(): Promise<CognitiveTaskRecord[]> {
    try {
      return await this.model.getAll();
    } catch (error) {
      console.error('Error al obtener todos los formularios CognitiveTask:', error);
      // Usar handleDbError
      throw this.handleDbError(error, 'obtener todos los formularios CognitiveTask');
      // throw new ApiError(
      //   `${CognitiveTaskError.DATABASE_ERROR}: Error al obtener formularios CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      //   500
      // );
    }
  }

  /**
   * Actualizaciones batch de formularios CognitiveTask
   * Útil para actualizaciones masivas en campañas
   * @param formIds IDs de los formularios a actualizar
   * @param updateData Datos a actualizar en todos los formularios
   * @returns Número de formularios actualizados correctamente
   */
  async batchUpdate(formIds: string[], updateData: Partial<CognitiveTaskFormData>): Promise<number> {
    // Validar los datos de actualización una vez antes del bucle
    // Necesitaríamos un researchId genérico o adaptar la validación
    // this.validateFormData(updateData); // Esto fallará si requiere researchId
    // Por ahora, omitimos la validación en batch o asumimos que los datos son válidos.
    
    try {
      let successCount = 0;
      
      // Actualizar cada formulario individualmente
      for (const formId of formIds) {
        try {
          // La llamada a `update` ya incluye la validación interna (con la limitación de researchId mencionada)
          await this.update(formId, updateData);
          successCount++;
        } catch (error) {
          // Loggear error específico pero continuar con el batch
          console.error(`[BatchUpdate] Error al actualizar formulario ${formId}:`, error);
        }
      }
      
      return successCount;
    } catch (error) {
      // Capturar errores generales del proceso batch (poco probable si los errores individuales se capturan)
      console.error('Error general en actualización batch de formularios CognitiveTask:', error);
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error general en actualización batch: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  // --- Funciones Auxiliares --- 
  private validateResearchId(researchId: string): void {
    if (!researchId) {
      throw new ApiError(
        `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere un ID de investigación`,
        400
      );
    }
  }
  
  // Manejador de errores de base de datos refactorizado para incluir mapeo de errores específicos del modelo
  private handleDbError(error: any, context: string): ApiError {
    if (error instanceof ApiError) {
      return error; 
    }
    
    if (error instanceof Error) {
        if (error.message.startsWith('COGNITIVE_TASK_NOT_FOUND')) {
             console.warn(`[handleDbError] Mapeando error NOT_FOUND en contexto: ${context}`);
             return new ApiError(CognitiveTaskError.NOT_FOUND, 404);
        } 
        
        console.error(`[CognitiveTaskService] Error de base de datos en ${context}:`, error);
        return new ApiError(
          `${CognitiveTaskError.DATABASE_ERROR}: ${error.message || 'Error inesperado en base de datos'}`,
          500
        );
    }
    
    // Fallback para errores no estándar - Corregir console.error y asegurar retorno
    console.error(`[CognitiveTaskService] Error desconocido/no-Error en ${context}:`, JSON.stringify(error));
    return new ApiError(CognitiveTaskError.DATABASE_ERROR, 500);
  }
}
