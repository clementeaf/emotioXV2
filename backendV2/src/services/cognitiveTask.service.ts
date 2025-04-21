import { CognitiveTaskModel, CognitiveTaskRecord } from '../models/cognitiveTask.model';
import { CognitiveTaskFormData, Question, UploadedFile, COGNITIVE_TASK_VALIDATION } from '../../../shared/interfaces/cognitive-task.interface';
import { ApiError } from '../utils/errors';
import { S3Service, FileType, PresignedUrlParams } from '../services/s3.service';

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
   * Crea un nuevo formulario CognitiveTask para una investigación
   * @param researchId ID de la investigación
   * @param formData Datos del formulario
   * @returns El formulario creado
   */
  async createCognitiveTaskForm(researchId: string, formData: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    try {
      // Validar que existe researchId
      if (!researchId) {
        throw new ApiError(
          `${CognitiveTaskError.RESEARCH_REQUIRED}: Se requiere ID de investigación para crear un formulario de tareas cognitivas`,
          400
        );
      }

      // Validar datos
      this.validateFormData({...formData, researchId});

      // Verificamos si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      
      if (existingForm) {
        throw new ApiError(
          `${CognitiveTaskError.INVALID_DATA}: Ya existe un formulario CognitiveTask para la investigación con ID: ${researchId}`,
          400
        );
      }
      
      return await this.model.create(formData, researchId);
    } catch (error) {
      console.error('Error al crear formulario CognitiveTask:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al crear formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Obtiene un formulario CognitiveTask por su ID
   * @param formId ID del formulario
   * @returns El formulario si existe, null si no
   */
  async getCognitiveTaskFormById(formId: string): Promise<CognitiveTaskRecord | null> {
    try {
      const form = await this.model.getById(formId);
      
      if (!form) {
        console.log(`No se encontró formulario CognitiveTask con ID: ${formId}`);
      }
      
      return form;
    } catch (error) {
      console.error('Error al obtener formulario CognitiveTask por ID:', error);
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al obtener formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Obtiene el formulario CognitiveTask asociado a una investigación
   * @param researchId ID de la investigación
   * @returns El formulario si existe, null si no
   */
  async getCognitiveTaskFormByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    try {
      const form = await this.model.getByResearchId(researchId);
      
      if (!form) {
        console.log(`No se encontró formulario CognitiveTask para la investigación con ID: ${researchId}`);
      }
      
      return form;
    } catch (error) {
      console.error('Error al obtener formulario CognitiveTask por ID de investigación:', error);
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al obtener formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Actualiza un formulario CognitiveTask
   * @param formId ID del formulario
   * @param updateData Datos actualizados
   * @returns El formulario actualizado
   */
  async updateCognitiveTaskForm(formId: string, updateData: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    try {
      // Verificamos si el formulario existe
      const existingForm = await this.model.getById(formId);
      
      if (!existingForm) {
        throw new ApiError(
          `${CognitiveTaskError.NOT_FOUND}: No se encontró formulario CognitiveTask con ID: ${formId}`,
          404
        );
      }
      
      // Si se están actualizando las preguntas, validar los datos
      if (updateData.questions) {
        this.validateFormData({
          ...existingForm,
          ...updateData
        });
      }
      
      return await this.model.update(formId, updateData);
    } catch (error) {
      console.error('Error al actualizar formulario CognitiveTask:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al actualizar formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Elimina un formulario CognitiveTask
   * @param formId ID del formulario a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteCognitiveTaskForm(formId: string): Promise<boolean> {
    try {
      // Verificamos si el formulario existe
      const existingForm = await this.model.getById(formId);
      
      if (!existingForm) {
        throw new ApiError(
          `${CognitiveTaskError.NOT_FOUND}: No se encontró formulario CognitiveTask con ID: ${formId}`,
          404
        );
      }
      
      // Eliminar los archivos asociados
      const filesToDelete: string[] = [];
      
      // Recopilar todas las claves S3 de los archivos en las preguntas
      if (existingForm.questions) {
        existingForm.questions.forEach(question => {
          if (question.files && question.files.length > 0) {
            question.files.forEach(file => {
              if (file.s3Key) {
                filesToDelete.push(file.s3Key);
              }
            });
          }
        });
      }
      
      // Eliminar archivos de S3 si hay alguno
      if (filesToDelete.length > 0) {
        const deletePromises = filesToDelete.map(s3Key => 
          this.s3Service.generateDeleteUrl(s3Key)
            .then(deleteUrl => {
              // Aquí normalmente se haría una petición HTTP a la URL,
              // pero eso lo manejará el cliente frontend
              console.log(`URL generada para eliminar archivo ${s3Key}`);
              return deleteUrl;
            })
            .catch(error => {
              console.error(`Error al generar URL para eliminar archivo ${s3Key}:`, error);
              return null;
            })
        );
        
        // Esperar a que se completen todas las promesas
        await Promise.all(deletePromises);
      }
      
      await this.model.delete(formId);
      return true;
    } catch (error) {
      console.error('Error al eliminar formulario CognitiveTask:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al eliminar formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
    }
  }

  /**
   * Crea o actualiza un formulario CognitiveTask para una investigación
   * Si ya existe un formulario para esa investigación, lo actualiza
   * Si no existe, crea uno nuevo
   * @param researchId ID de la investigación
   * @param formData Datos del formulario
   * @returns El formulario creado o actualizado
   */
  async createOrUpdateCognitiveTaskForm(researchId: string, formData: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    try {
      // Agregar logs detallados para diagnosticar el problema con las imágenes
      console.log('[DIAGNOSTICO-IMAGEN] Datos recibidos del formulario:', JSON.stringify(formData, null, 2));
      
      // Verificar específicamente las preguntas que podrían tener imágenes
      if (formData.questions && formData.questions.length > 0) {
        const questionsWithFiles = formData.questions.filter(q => 
          ['navigation_flow', 'preference_test'].includes(q.type) && q.files && q.files.length > 0
        );
        
        if (questionsWithFiles.length > 0) {
          console.log('[DIAGNOSTICO-IMAGEN] Encontradas preguntas con archivos:', questionsWithFiles.length);
          questionsWithFiles.forEach((q, index) => {
            console.log(`[DIAGNOSTICO-IMAGEN] Pregunta ${index + 1} (ID: ${q.id}, Tipo: ${q.type}):`, 
              JSON.stringify(q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key})), null, 2)
            );
          });
        } else {
          console.log('[DIAGNOSTICO-IMAGEN] No se encontraron preguntas con archivos');
        }
      }
      
      // Validar datos
      this.validateFormData({...formData, researchId});
      
      // Verificamos si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      
      let result: CognitiveTaskRecord;
      
      if (existingForm) {
        // Si existe, lo actualizamos
        console.log('[DIAGNOSTICO-IMAGEN] Actualizando formulario existente:', existingForm.id);
        result = await this.model.update(existingForm.id, formData);
      } else {
        // Si no existe, lo creamos
        console.log('[DIAGNOSTICO-IMAGEN] Creando nuevo formulario para research:', researchId);
        result = await this.model.create(formData, researchId);
      }
      
      // Verificar el resultado después de guardar
      console.log('[DIAGNOSTICO-IMAGEN] Resultado después de guardar:', 
        JSON.stringify(result.questions
          .filter(q => ['navigation_flow', 'preference_test'].includes(q.type) && q.files && q.files.length > 0)
          .map(q => ({
            id: q.id, 
            type: q.type, 
            files: q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key}))
          })), null, 2)
      );
      
      return result;
    } catch (error) {
      console.error('Error al crear o actualizar formulario CognitiveTask:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `${CognitiveTaskError.DATABASE_ERROR}: Error al crear o actualizar formulario CognitiveTask: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        500
      );
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
          await this.updateCognitiveTaskForm(formId, updateData);
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
} 