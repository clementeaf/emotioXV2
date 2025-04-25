import { CognitiveTaskModel, CognitiveTaskRecord } from '../models/cognitiveTask.model';
import { CognitiveTaskFormData, Question, UploadedFile, COGNITIVE_TASK_VALIDATION } from '../../../shared/interfaces/cognitive-task.interface';
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
 */
export class CognitiveTaskService {
  private model = new CognitiveTaskModel();
  private s3Service = new S3Service();

  /**
   * Validación básica de los datos de entrada
   * @param data Datos a validar
   * @returns true si la validación es exitosa
   * @throws ApiError si hay errores de validación
   */
  private validateFormData(data: Partial<CognitiveTaskFormData>): boolean {
    console.log('[DEBUG] CognitiveTaskService.validateFormData - Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Validar que la investigación tenga un ID
    if (!data.researchId) {
      throw new ApiError(
        `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere un ID de investigación`,
        400
      );
    }

    // Validar preguntas si se proporcionan
    if (data.questions) {
      // Validar que las preguntas sean un array
      if (!Array.isArray(data.questions)) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: Las preguntas deben ser un array`,
          400
        );
      }

      // Validar cada pregunta
      data.questions.forEach((question, index) => {
        // Validar tipo de pregunta
        if (!question.type || typeof question.type !== 'string') {
          throw new ApiError(
            `${CognitiveTaskError.INVALID_DATA}: La pregunta ${index + 1} debe tener un tipo válido`,
            400
          );
        }

        // Validar título si existe
        if (question.title && question.title.length > COGNITIVE_TASK_VALIDATION.title.maxLength) {
          throw new ApiError(
            `${CognitiveTaskError.INVALID_DATA}: El título de la pregunta ${index + 1} no debe exceder ${COGNITIVE_TASK_VALIDATION.title.maxLength} caracteres`,
            400
          );
        }

        // Validar opciones para preguntas de selección
        if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type) && question.choices) {
          if (!Array.isArray(question.choices)) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: Las opciones de la pregunta ${index + 1} deben ser un array`,
              400
            );
          }

          if (question.choices.length < COGNITIVE_TASK_VALIDATION.choices.min) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: La pregunta ${index + 1} debe tener al menos ${COGNITIVE_TASK_VALIDATION.choices.min} opción`,
              400
            );
          }

          if (question.choices.length > COGNITIVE_TASK_VALIDATION.choices.max) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: La pregunta ${index + 1} no debe exceder ${COGNITIVE_TASK_VALIDATION.choices.max} opciones`,
              400
            );
          }
        }

        // Validar escala para preguntas de escala lineal
        if (question.type === 'linear_scale' && question.scaleConfig) {
          if (typeof question.scaleConfig !== 'object') {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: La configuración de escala de la pregunta ${index + 1} debe ser un objeto`,
              400
            );
          }

          if (question.scaleConfig.startValue < COGNITIVE_TASK_VALIDATION.scaleConfig.minValue) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: El valor inicial de la escala debe ser al menos ${COGNITIVE_TASK_VALIDATION.scaleConfig.minValue}`,
              400
            );
          }

          if (question.scaleConfig.endValue > COGNITIVE_TASK_VALIDATION.scaleConfig.maxValue) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: El valor final de la escala no debe exceder ${COGNITIVE_TASK_VALIDATION.scaleConfig.maxValue}`,
              400
            );
          }
        }
        
        // Validar archivos para preguntas de navegación y preferencia
        if (['navigation_flow', 'preference_test'].includes(question.type) && question.files) {
          if (!Array.isArray(question.files)) {
            throw new ApiError(
              `${CognitiveTaskError.INVALID_DATA}: Los archivos de la pregunta ${index + 1} deben ser un array`,
              400
            );
          }
          
          // Verificar integridad de los archivos
          question.files.forEach((file, fileIndex) => {
            if (!file || typeof file !== 'object') {
              throw new ApiError(
                `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileIndex + 1} de la pregunta ${index + 1} es inválido`,
                400
              );
            }
            
            if (!file.id || !file.name || !file.size || !file.type) {
              throw new ApiError(
                `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileIndex + 1} de la pregunta ${index + 1} debe tener id, name, size y type`,
                400
              );
            }
            
            // Validar campos críticos para imágenes
            if (!file.url || !file.s3Key) {
              console.log(`[VALIDACION-IMAGEN] Archivo con datos incompletos: Pregunta ${index + 1}, Archivo ${fileIndex + 1}`, file);
              throw new ApiError(
                `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileIndex + 1} de la pregunta ${index + 1} debe tener url y s3Key`,
                400
              );
            }
            
            // Validar tamaño máximo
            if (file.size > COGNITIVE_TASK_VALIDATION.files.maxSize) {
              throw new ApiError(
                `${CognitiveTaskError.INVALID_DATA}: El archivo ${fileIndex + 1} de la pregunta ${index + 1} excede el tamaño máximo permitido (${COGNITIVE_TASK_VALIDATION.files.maxSize / (1024 * 1024)} MB)`,
                400
              );
            }
          });
        }
      });
    }

    // Si no hay errores, la validación es exitosa
    return true;
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
   * Obtiene un formulario CognitiveTask según el ID de investigación
   * Nombre refactorizado: getByResearchId
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    this.validateResearchId(researchId);
    try {
      return await this.model.getByResearchId(researchId);
    } catch (error) {
      console.error('[CognitiveTaskService] Error en getByResearchId:', error);
      throw this.handleDbError(error, 'obtener tarea cognitiva por researchId');
    }
  }

  /**
   * Crea un formulario CognitiveTask
   * Nombre refactorizado: create
   */
  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    this.validateResearchId(researchId);
    // Validar datos completos al crear
    this.validateFormData(data);
    
    const formDataWithId = { 
      ...data, 
      researchId, 
      id: uuidv4() // Generar ID aquí o dejar que el modelo lo haga?
    };
    
    try {
      return await this.model.create(formDataWithId);
    } catch (error) {
      console.error('[CognitiveTaskService] Error en create:', error);
      throw this.handleDbError(error, 'crear tarea cognitiva');
    }
  }

  /**
   * Actualiza un formulario CognitiveTask existente usando su ID
   * Nombre refactorizado: update
   * @param taskId - ID del formulario a actualizar (PK)
   * @param data - Datos parciales para actualizar
   */
  async update(taskId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    if (!taskId) throw new ApiError('Se requiere taskId para actualizar', 400);
    // Validar datos parciales si existen
    this.validateFormData(data); 

    try {
      // Eliminar researchId de los datos de actualización si existe,
      // ya que no debería cambiarse y podría causar conflicto con la clave de DynamoDB.
      const { researchId, ...updatePayload } = data;
      
      const updatedRecord = await this.model.update(taskId, updatePayload);
      if (!updatedRecord) {
        throw new ApiError(CognitiveTaskError.NOT_FOUND, 404);
      }
      return updatedRecord;
    } catch (error) {
      console.error(`[CognitiveTaskService] Error en update (taskId: ${taskId}):`, error);
      if (error instanceof ApiError && error.statusCode === 404) throw error;
      throw this.handleDbError(error, 'actualizar tarea cognitiva');
    }
  }

  /**
   * Elimina un formulario CognitiveTask usando su ID
   * Nombre refactorizado: delete
   * @param taskId - ID del formulario a eliminar (PK)
   */
  async delete(taskId: string): Promise<boolean> {
    if (!taskId) throw new ApiError('Se requiere taskId para eliminar', 400);
    try {
      const success = await this.model.delete(taskId);
      if (!success) {
        // Podría ser que el modelo ya devuelva error si no lo encuentra,
        // o podemos lanzar uno aquí.
        throw new ApiError(CognitiveTaskError.NOT_FOUND, 404); 
      }
      return true;
    } catch (error) {
      console.error(`[CognitiveTaskService] Error en delete (taskId: ${taskId}):`, error);
      if (error instanceof ApiError && error.statusCode === 404) throw error;
      throw this.handleDbError(error, 'eliminar tarea cognitiva');
    }
  }

  /**
   * Clona un formulario CognitiveTask existente para una nueva investigación
   * @param sourceFormId ID del formulario a clonar
   * @param targetResearchId ID de la investigación destino
   * @returns El nuevo formulario clonado
   */
  async cloneCognitiveTaskForm(sourceFormId: string, targetResearchId: string): Promise<CognitiveTaskRecord> {
    try {
      // Verificamos si el formulario origen existe
      const sourceForm = await this.model.getById(sourceFormId);
      
      if (!sourceForm) {
        throw new ApiError(
          `${CognitiveTaskError.NOT_FOUND}: No se encontró formulario CognitiveTask con ID: ${sourceFormId}`,
          404
        );
      }
      
      // Verificamos si ya existe un formulario para la investigación destino
      const existingTargetForm = await this.model.getByResearchId(targetResearchId);
      
      if (existingTargetForm) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: Ya existe un formulario CognitiveTask para la investigación con ID: ${targetResearchId}`,
          400
        );
      }
      
      // Creamos un nuevo formulario con los datos del origen
      const formDataToClone: CognitiveTaskFormData = {
        researchId: targetResearchId,
        questions: await this.cloneQuestions(sourceForm.questions, targetResearchId),
        randomizeQuestions: sourceForm.randomizeQuestions,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastModifiedBy: 'system'
        }
      };
      
      return await this.model.create(formDataToClone, targetResearchId);
    } catch (error) {
      console.error('Error al clonar formulario CognitiveTask:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al clonar formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
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
          id: question.id // Mantenemos el mismo ID para conservar referencias
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
      throw error;
    }
  }

  /**
   * Clona archivos de S3 para una nueva investigación
   * @param files Archivos originales
   * @param targetResearchId ID de la investigación destino
   * @returns Archivos clonados
   */
  private async cloneFiles(files: UploadedFile[], targetResearchId: string): Promise<UploadedFile[]> {
    try {
      const clonedFiles: UploadedFile[] = [];
      
      for (const file of files) {
        // Crear parámetros para S3
        const params: PresignedUrlParams = {
          fileType: FileType.IMAGE,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          researchId: targetResearchId,
          folder: 'cognitive-tasks'
        };

        // Generar nueva URL prefirmada
        const presignedUrlResponse = await this.s3Service.generateUploadUrl(params);
        
        // Crear objeto de archivo clonado
        const clonedFile: UploadedFile = {
          id: presignedUrlResponse.key.split('/').pop() || '',
          name: file.name,
          size: file.size,
          type: file.type,
          url: presignedUrlResponse.fileUrl,
          s3Key: presignedUrlResponse.key,
          time: file.time
        };
        
        // Si el archivo original tiene zonas de interés, clonarlas
        if (file.hitZones && file.hitZones.length > 0) {
          clonedFile.hitZones = file.hitZones.map(zone => ({
            ...zone,
            fileId: clonedFile.id
          }));
        }
        
        clonedFiles.push(clonedFile);
      }
      
      return clonedFiles;
    } catch (error) {
      console.error('Error al clonar archivos:', error);
      throw error;
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
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al obtener formularios CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
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
      
      // Actualizar cada formulario individualmente
      for (const formId of formIds) {
        try {
          await this.update(formId, updateData);
          successCount++;
        } catch (error) {
          console.error(`Error al actualizar formulario ${formId}:`, error);
          // Continuamos con el siguiente a pesar del error
        }
      }
      
      return successCount;
    } catch (error) {
      console.error('Error en actualización batch de formularios CognitiveTask:', error);
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error en actualización batch: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
  
  private handleDbError(error: any, context: string): ApiError {
    if (error instanceof ApiError) {
      return error; // Re-lanzar errores de validación o específicos
    }
    console.error(`[CognitiveTaskService] Error de base de datos en ${context}:`, error);
    return new ApiError(
      `${CognitiveTaskError.DATABASE_ERROR}: ${error.message || 'Error inesperado en base de datos'}`,
      500
    );
  }
} 