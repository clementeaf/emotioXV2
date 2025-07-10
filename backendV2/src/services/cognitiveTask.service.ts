import { v4 as uuidv4 } from 'uuid';
import { Choice, COGNITIVE_TASK_VALIDATION, CognitiveTaskFormData, Question, ScaleConfig, UploadedFile } from '../../../shared/interfaces/cognitive-task.interface';
import { NotFoundError } from '../errors';
import { CognitiveTaskModel, CognitiveTaskRecord } from '../models/cognitiveTask.model';
import { FileType, PresignedUrlParams, S3Service } from '../services/s3.service';
import { buildQuestionDictionary } from '../utils/buildQuestionDictionary';
import { handleDbError } from '../utils/dbError.util';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';

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

// <<< Definir mapeo de errores específicos del modelo CognitiveTask >>>
const COGNITIVE_TASK_MODEL_ERRORS = {
  'COGNITIVE_TASK_NOT_FOUND': { errorClass: NotFoundError, statusCode: 404, apiErrorCode: CognitiveTaskError.NOT_FOUND },
  // Añadir otros mapeos si CognitiveTaskModel lanza errores específicos
};

/**
 * Clase que proporciona servicios para gestionar formularios CognitiveTask
 * Adaptado para usar researchId como PK en el modelo.
 */
export class CognitiveTaskService {
  private model = new CognitiveTaskModel();
  private s3Service = new S3Service();
  private serviceName = 'CognitiveTaskService'; // Para logging

  /**
   * Validación principal de los datos de entrada para CognitiveTaskFormData.
   * Llama a validaciones auxiliares.
   */
  private validateFormData(data: Partial<CognitiveTaskFormData>): void {


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
        // Permitir cualquier cantidad de archivos, solo validar estructura de cada uno
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
   * Permite cualquier cantidad de archivos, solo valida la estructura de cada uno.
   */
  private _validateQuestionFiles(files: UploadedFile[] | undefined, questionNumber: number): void {
    if (!files || !Array.isArray(files)) {
      if (files === undefined) return; // Si no existe el array, OK (asumiendo opcional)
      throw new ApiError(
        `${CognitiveTaskError.INVALID_DATA}: Los archivos de la pregunta ${questionNumber} deben ser un array`,
        400
      );
    }
    // Validar cada archivo individualmente (sin restricción de cantidad)
    files.forEach((file, fileIndex) => {
      const fileNumber = fileIndex + 1;
      if (!file || typeof file !== 'object') {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} de la pregunta ${questionNumber} es inválido`,
          400
        );
      }
      if (!file.id || !file.name || !file.size || !file.type) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} (pregunta ${questionNumber}) debe tener id, name, size y type`,
          400
        );
      }
      if (!file.s3Key) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} (pregunta ${questionNumber}) debe tener una s3Key`,
          400
        );
      }
      if (file.size > COGNITIVE_TASK_VALIDATION.files.maxSize) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} (pregunta ${questionNumber}) excede el tamaño máximo (${COGNITIVE_TASK_VALIDATION.files.maxSize / (1024 * 1024)} MB)`,
          400
        );
      }
      if (file.hitZones !== undefined) {
        if (!Array.isArray(file.hitZones)) {
          throw new ApiError(
            `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} de la pregunta ${questionNumber} tiene hitZones inválido (debe ser un array)`,
            400
          );
        }
        file.hitZones.forEach((hz, hzIdx) => {
          if (!hz || typeof hz !== 'object' || !hz.id || !hz.region || typeof hz.region.x !== 'number' || typeof hz.region.y !== 'number' || typeof hz.region.width !== 'number' || typeof hz.region.height !== 'number' || !hz.fileId) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileNumber} de la pregunta ${questionNumber} tiene un hitZone inválido en la posición ${hzIdx + 1}`,
              400
            );
          }
        });
      }
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
    questionId: string;
  }): Promise<{
    uploadUrl: string;
    fileUrl: string;
    file: UploadedFile;
  }> {
    const operation = `${this.serviceName}.getFileUploadUrl`;
    try {
      // Validar tipo MIME
      if (!COGNITIVE_TASK_VALIDATION.files.validTypes.includes(fileParams.fileType)) {
        throw new ApiError(
          `${CognitiveTaskError.FILE_ERROR}: Tipo de archivo no válido. Tipos permitidos: ${COGNITIVE_TASK_VALIDATION.files.validTypes.join(', ')}`,
          400
        );
      }

      // Construir la ruta de la carpeta incluyendo el questionId
      const folderPath = `cognitive-task-files/${fileParams.questionId}`;

      // Llamar al servicio S3 para obtener la URL de subida
      const uploadUrlData = await this.s3Service.generateUploadUrl({
        // Determinar FileType del enum basado en MIME type (simplificado, podría mejorarse)
        fileType: fileParams.fileType.startsWith('image/') ? FileType.IMAGE :
                  fileParams.fileType.startsWith('video/') ? FileType.VIDEO :
                  FileType.DOCUMENT, // Default a document si no es imagen/video
        fileName: fileParams.fileName, // s3Service extraerá la extensión de aquí
        mimeType: fileParams.fileType,
        fileSize: fileParams.fileSize,
        researchId: fileParams.researchId,
        folder: folderPath, // <<< Pasar la carpeta con questionId
      });

      // <<< EXTRAER el fileId REAL de la s3Key devuelta >>>
      let extractedFileId = uuidv4(); // Fallback por si falla la extracción
      try {
          const keyParts = uploadUrlData.key.split('/');
          const fileNameWithExt = keyParts[keyParts.length - 1]; // Nombre con UUID y extensión
          const lastDotIndex = fileNameWithExt.lastIndexOf('.');
          if (lastDotIndex > 0) { // Asume que hay extensión y UUID antes
              // Extraer la parte entre el último '_' (antes del UUID) y el último '.'
              // O, más simple, extraer la parte ANTES del último punto, que es el UUID
              // CORRECCIÓN: s3Service.generateUploadUrl genera ${fileId}${extension}
              extractedFileId = fileNameWithExt.substring(0, lastDotIndex);
              // Validar si parece UUID (opcional pero recomendado)
              if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(extractedFileId)) {
                 console.warn(`[${operation}] No se pudo extraer un UUID válido de la key: ${uploadUrlData.key}. Usando fallback.`);
                 extractedFileId = uuidv4(); // Volver al fallback si no es UUID
              }
          } else {
              // Si no hay extensión, asumir que todo después del último / es el ID
              extractedFileId = fileNameWithExt;
               if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(extractedFileId)) {
                 console.warn(`[${operation}] No se pudo extraer un UUID válido (sin ext) de la key: ${uploadUrlData.key}. Usando fallback.`);
                 extractedFileId = uuidv4(); // Volver al fallback si no es UUID
              }
          }
      } catch (extractError) {
          console.error(`[${operation}] Error extrayendo fileId de la key ${uploadUrlData.key}:`, extractError);
      }

      const uploadedFile: UploadedFile = {
        id: extractedFileId,
        name: fileParams.fileName,
        size: fileParams.fileSize,
        type: fileParams.fileType,
        s3Key: uploadUrlData.key,
        url: uploadUrlData.fileUrl,
      };

      return {
        uploadUrl: uploadUrlData.uploadUrl,
        fileUrl: uploadUrlData.fileUrl,
        file: uploadedFile,
      };

    } catch (error) {
        console.error(`${operation} - Error:`, error);
         if (error instanceof ApiError) {
             throw error;
         }
         throw new ApiError(`${CognitiveTaskError.UPLOAD_ERROR}: ${error instanceof Error ? error.message : 'Error desconocido al preparar subida'}`, 500);
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
   * Genera una URL prefirmada paara eliminar un archivo de S3
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
    const context = 'getByResearchId';
    try {
      if (!researchId) {
        throw new ApiError(
          `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere ID de investigación para obtener el formulario CognitiveTask`,
          400
        );
      }
      structuredLog('info', `${this.serviceName}.${context}`, 'Buscando formulario CognitiveTask', { researchId });
      const cognitiveTask = await this.model.getByResearchId(researchId);

      if (!cognitiveTask) {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontró formulario CognitiveTask', { researchId });
        return null; // Cambiar para retornar null en lugar de throw error
      }

      structuredLog('info', `${this.serviceName}.${context}`, 'Formulario CognitiveTask encontrado', { researchId, formId: cognitiveTask.id });
      return cognitiveTask;
    } catch (error) {
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
    }
  }

  /**
   * Crea un nuevo formulario CognitiveTask
   * @param formData Datos del formulario
   * @param researchId ID de la investigación
   * @param userId ID del usuario que crea el formulario
   * @returns El formulario creado
   */
  async create(formData: CognitiveTaskFormData, researchId: string, userId: string): Promise<CognitiveTaskRecord> {
    const context = 'create';

    try {
      // Verificar si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      if (existingForm) {
        throw new ApiError(`COGNITIVE_TASK_FORM_EXISTS: Ya existe un formulario CognitiveTask para la investigación ${researchId}`, 409);
      }

      // NUEVO: Generar questionKeys para cada pregunta individual
      const questionDictionary = buildQuestionDictionary([formData]);
      const questionKeys = Object.keys(questionDictionary);

      structuredLog('info', `${this.serviceName}.${context}`, 'Generando questionKeys para preguntas individuales', {
        researchId,
        totalQuestions: formData.questions?.length || 0,
        questionKeysGenerated: questionKeys.length,
        questionKeys: questionKeys
      });

      // Crear el formulario con el primer questionKey como identificador principal
      const primaryQuestionKey = questionKeys[0] || undefined;
      const result = await this.model.create(formData, researchId, primaryQuestionKey);

      structuredLog('info', `${this.serviceName}.${context}`, 'Formulario CognitiveTask creado exitosamente', {
        formId: result.id,
        researchId,
        primaryQuestionKey,
        totalQuestionKeys: questionKeys.length
      });

      return result;
    } catch (error) {
      structuredLog('error', `${this.serviceName}.${context}`, 'Error al crear formulario CognitiveTask', {
        researchId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente usando su ID lógico (UUID).
   * Obtiene el researchId asociado antes de llamar al modelo.
   */
  async update(taskId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    const context = 'update';
    try {
      if (!taskId) {
        throw new ApiError('Se requiere taskId (UUID) para actualizar', 400);
      }

      this.validateFormData(data);
      structuredLog('info', `${this.serviceName}.${context}`, 'Verificando existencia del formulario', { taskId });

      const currentRecord = await this.model.getById(taskId);
      if (!currentRecord) {
        structuredLog('warn', `${this.serviceName}.${context}`, 'No se encontró el formulario a actualizar', { taskId });
        throw new NotFoundError(CognitiveTaskError.NOT_FOUND);
      }

      const researchId = currentRecord.researchId;
      structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando formulario CognitiveTask', { taskId, researchId });

      const { id, researchId: dataResearchId, ...updatePayload } = data;
      const result = await this.model.update(researchId, updatePayload);

      structuredLog('info', `${this.serviceName}.${context}`, 'Formulario CognitiveTask actualizado exitosamente', { taskId, researchId });
      return result;
    } catch (error) {
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
    }
  }

  /**
   * Elimina un formulario CognitiveTask usando su ID lógico (UUID).
   * Obtiene el researchId asociado antes de llamar al modelo.
   */
  async delete(taskId: string): Promise<boolean> {
    const context = 'delete';
    if (!taskId) throw new ApiError('Se requiere taskId (UUID) para eliminar', 400);
    try {
      const currentRecord = await this.model.getById(taskId);
      if (!currentRecord) {
        throw new NotFoundError(CognitiveTaskError.NOT_FOUND);
      }
      const researchId = currentRecord.researchId;
      return await this.model.delete(researchId);
    } catch (error) {
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
    }
  }

  /**
   * Clona un formulario CognitiveTask existente para una nueva investigación.
   * Usa getById con el ID lógico (UUID) del formulario fuente.
   */
  async cloneCognitiveTaskForm(sourceFormId: string, targetResearchId: string): Promise<CognitiveTaskRecord> {
    const context = 'cloneCognitiveTaskForm';
    if (!sourceFormId) throw new ApiError('Se requiere sourceFormId (UUID) para clonar', 400);
    this.validateResearchId(targetResearchId);
    try {
      const sourceForm = await this.model.getById(sourceFormId);
      if (!sourceForm) {
        throw new NotFoundError(`${CognitiveTaskError.NOT_FOUND}: No se encontró formulario CognitiveTask fuente con ID: ${sourceFormId}`);
      }
      const existingTargetForm = await this.model.getByResearchId(targetResearchId);
      if (existingTargetForm) {
        throw new ApiError(`${CognitiveTaskError.INVALID_DATA}: Ya existe un formulario CognitiveTask para la investigación destino con ID: ${targetResearchId}`, 400);
      }
      const newFormId = uuidv4();
      const clonedQuestions = await this.cloneQuestions(sourceForm.questions, targetResearchId);
      const now = new Date().toISOString();

      const formDataToClone: CognitiveTaskFormData = {
        id: newFormId,
        researchId: targetResearchId,
        questions: clonedQuestions,
        randomizeQuestions: sourceForm.randomizeQuestions,
        metadata: {
          ...(sourceForm.metadata || {}),
          createdAt: now,
          updatedAt: now,
          lastModifiedBy: 'system_clone'
        }
      };

      return await this.model.create(formDataToClone, targetResearchId);
    } catch (error) {
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
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
          id: question.id
        };

        if (question.files && question.files.length > 0) {
          clonedQuestion.files = await this.cloneFiles(question.files, targetResearchId);
        }

        clonedQuestions.push(clonedQuestion);
      }

      return clonedQuestions;
    } catch (error) {
      console.error('Error al clonar preguntas:', error);
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
    const context = 'getAllForms';
    try {
      return await this.model.getAll();
    } catch (error) {
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
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
    try {
      let successCount = 0;

      for (const formId of formIds) {
        try {
          await this.update(formId, updateData);
          successCount++;
        } catch (error) {
          console.error(`[BatchUpdate] Error al actualizar formulario ${formId}:`, error);
        }
      }

      return successCount;
    } catch (error) {
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

  /**
   * Obtiene un formulario CognitiveTask por su ID lógico (UUID).
   * Utiliza el GSI del modelo.
   */
  async getById(taskId: string): Promise<CognitiveTaskRecord | null> {
    const context = 'getById';
    try {
      // Delegar directamente al método del modelo que usa el GSI
      const record = await this.model.getById(taskId);
      if (!record) {
        // Si el modelo devuelve null, lanzar un error específico del servicio
        throw new NotFoundError(CognitiveTaskError.NOT_FOUND);
      }
      return record;
    } catch (error: any) {
      // Re-lanzar errores conocidos o manejar como error de DB
      if (error instanceof NotFoundError) {
        throw error; // Propagar NotFoundError
      }
      // Usar handleDbError para otros errores de base de datos
      throw handleDbError(error, this.serviceName, context, COGNITIVE_TASK_MODEL_ERRORS);
    }
  }

  /**
   * Actualiza un formulario CognitiveTask para una investigación específica.
   * Si no existe, lo crea.
   * @param researchId ID de la investigación
   * @param data Datos del formulario
   * @param userId ID del usuario que realiza la operación
   * @returns El formulario CognitiveTask actualizado o creado
   */
  async updateByResearchId(researchId: string, data: CognitiveTaskFormData, userId: string): Promise<CognitiveTaskRecord> {
    const context = 'updateByResearchId';
    try {
      if (!researchId) {
        throw new ApiError(
          `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere ID de investigación para actualizar el formulario CognitiveTask`,
          400
        );
      }
      this.validateFormData(data);
      structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando/Creando formulario CognitiveTask', { researchId });

      let existingForm = null;

      try {
        existingForm = await this.model.getByResearchId(researchId);
      } catch (error) {
        // Si hay un error de base de datos real, propagarlo
        throw error;
      }

      if (existingForm) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Actualizando existente', { researchId, formId: existingForm.id });
        const updatedForm = await this.model.update(researchId, {
          ...data,
          metadata: {
            ...(data.metadata || {}),
            version: (existingForm.metadata?.version || '1.0'),
            lastUpdated: new Date().toISOString(),
            lastModifiedBy: userId
          }
        });
        structuredLog('info', `${this.serviceName}.${context}`, 'Actualización completada', { researchId, formId: updatedForm.id });
        return updatedForm;
      } else {
        structuredLog('info', `${this.serviceName}.${context}`, 'Creando nuevo', { researchId });
        const newForm = await this.model.create({
          ...data,
          metadata: {
            ...(data.metadata || {}),
            version: '1.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastModifiedBy: userId
          }
        }, researchId);
        structuredLog('info', `${this.serviceName}.${context}`, 'Creación completada', { researchId, formId: newForm.id });
        return newForm;
      }
    } catch (error) {
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
    }
  }

  /**
   * Elimina un formulario CognitiveTask por el ID de investigación
   * @param researchId ID de la investigación
   * @returns true si se eliminó exitosamente, false si no se encontró
   * @throws ApiError si hay error de validación o base de datos
   */
  async deleteByResearchId(researchId: string): Promise<boolean> {
    const context = 'deleteByResearchId';
    try {
      if (!researchId) {
        throw new ApiError(
          `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere ID de investigación para eliminar el formulario CognitiveTask`,
          400
        );
      }

      structuredLog('info', `${this.serviceName}.${context}`, 'Eliminando formulario CognitiveTask por researchId', { researchId });

      // El modelo ya tiene el método delete(researchId) que usamos
      const deleted = await this.model.delete(researchId);

      if (deleted) {
        structuredLog('info', `${this.serviceName}.${context}`, 'Formulario eliminado exitosamente', { researchId });
      } else {
        structuredLog('info', `${this.serviceName}.${context}`, 'No se encontró formulario para eliminar', { researchId });
      }

      return deleted;
    } catch (error) {
      if (error instanceof NotFoundError) {
        // El formulario no existe, devolver false en lugar de error
        structuredLog('info', `${this.serviceName}.${context}`, 'Formulario no encontrado para eliminar', { researchId });
        return false;
      }
      throw handleDbError(error, context, this.serviceName, COGNITIVE_TASK_MODEL_ERRORS);
    }
  }
}

export const cognitiveTaskService = new CognitiveTaskService();
