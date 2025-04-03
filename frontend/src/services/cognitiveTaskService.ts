import { apiClient } from '../config/api-client';
import { s3Service } from './index';
import { 
  CognitiveTaskFormData, 
  CognitiveTaskModel as CognitiveTaskRecord, 
  UploadedFile
} from '../components/research/CognitiveTask/types';

/**
 * Servicio para manejar operaciones relacionadas con las tareas cognitivas
 */
export const cognitiveTaskService = {
  /**
   * Obtiene la configuración de tarea cognitiva por su ID
   * @param id ID de la configuración
   * @returns Configuración solicitada
   */
  async getById(id: string): Promise<CognitiveTaskRecord> {
    try {
      return await apiClient.get<CognitiveTaskRecord, 'cognitiveTask'>('cognitiveTask', 'get', { id });
    } catch (error) {
      console.error(`Error al obtener configuración de tarea cognitiva ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la configuración de tarea cognitiva para una investigación específica
   * @param researchId ID de la investigación
   * @returns Configuración solicitada
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskRecord> {
    try {
      return await apiClient.get<CognitiveTaskRecord, 'cognitiveTask'>('cognitiveTask', 'getByResearch', { researchId });
    } catch (error) {
      console.error(`Error al obtener configuración de tarea cognitiva para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva configuración de tarea cognitiva
   * @param data Datos de la nueva configuración
   * @param researchId ID de la investigación (opcional)
   * @returns Configuración creada
   */
  async create(data: CognitiveTaskFormData, researchId?: string): Promise<CognitiveTaskRecord> {
    try {
      // Procesar los archivos en el formulario para asegurar que tengan las claves de S3
      const processedData = await this.processFormFiles(data);
      
      // Si se proporciona un ID de investigación, se usa para vincular la configuración
      const payload = researchId ? { ...processedData, researchId } : processedData;
      return await apiClient.post<CognitiveTaskRecord, typeof payload, 'cognitiveTask'>(
        'cognitiveTask', 
        'create', 
        payload
      );
    } catch (error) {
      console.error('Error al crear configuración de tarea cognitiva:', error);
      throw error;
    }
  },

  /**
   * Actualiza una configuración de tarea cognitiva existente
   * @param id ID de la configuración
   * @param data Datos a actualizar
   * @returns Configuración actualizada
   */
  async update(id: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    try {
      // Procesar los archivos en el formulario para asegurar que tengan las claves de S3
      const processedData = await this.processFormFiles(data);
      
      return await apiClient.put<CognitiveTaskRecord, Partial<CognitiveTaskFormData>, 'cognitiveTask'>(
        'cognitiveTask', 
        'update', 
        processedData, 
        { id }
      );
    } catch (error) {
      console.error(`Error al actualizar configuración de tarea cognitiva ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza o crea una configuración de tarea cognitiva para una investigación específica
   * @param researchId ID de la investigación
   * @param data Datos completos de la configuración
   * @returns Configuración actualizada o creada
   */
  async updateByResearchId(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    try {
      // Procesar los archivos en el formulario para asegurar que tengan las claves de S3
      const processedData = await this.processFormFiles(data);
      
      return await apiClient.put<CognitiveTaskRecord, CognitiveTaskFormData, 'cognitiveTask'>(
        'cognitiveTask', 
        'createOrUpdate', 
        processedData, 
        { researchId }
      );
    } catch (error) {
      console.error(`Error al actualizar configuración de tarea cognitiva para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una configuración de tarea cognitiva
   * @param id ID de la configuración
   * @returns Confirmación de eliminación
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete<void, 'cognitiveTask'>('cognitiveTask', 'delete', { id });
    } catch (error) {
      console.error(`Error al eliminar configuración de tarea cognitiva ${id}:`, error);
      throw error;
    }
  },

  /**
   * Sube un archivo al servidor para una tarea cognitiva
   * @param file Archivo a subir
   * @param researchId ID de la investigación
   * @param progressCallback Callback para reportar progreso
   * @returns Información del archivo subido
   */
  async uploadFile(
    file: File, 
    researchId: string, 
    progressCallback?: (progress: number) => void
  ): Promise<UploadedFile> {
    try {
      // Usar el servicio de S3 para subir el archivo
      const result = await s3Service.uploadFile({
        file,
        researchId,
        folder: 'cognitive-task-files',
        progressCallback
      });

      // Crear un objeto UploadedFile con la información del archivo
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(), // Generar un ID único para el archivo
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.fileUrl,
        s3Key: result.key
      };

      return uploadedFile;
    } catch (error) {
      console.error('Error al subir archivo para tarea cognitiva:', error);
      throw error;
    }
  },
  
  /**
   * Sube múltiples archivos al servidor para una tarea cognitiva
   * @param files Lista de archivos a subir
   * @param researchId ID de la investigación
   * @param progressCallback Callback para reportar progreso
   * @returns Lista de información de archivos subidos
   */
  async uploadMultipleFiles(
    files: File[], 
    researchId: string, 
    progressCallback?: (progress: number, fileIndex: number) => void
  ): Promise<UploadedFile[]> {
    try {
      const uploadedFiles: UploadedFile[] = [];
      
      // Procesar cada archivo en secuencia para evitar sobrecarga
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Subir el archivo actual
        const result = await s3Service.uploadFile({
          file,
          researchId,
          folder: 'cognitive-task-files',
          progressCallback: progress => {
            if (progressCallback) {
              progressCallback(progress, i);
            }
          }
        });
        
        // Crear información del archivo subido
        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.fileUrl,
          s3Key: result.key
        };
        
        uploadedFiles.push(uploadedFile);
      }
      
      return uploadedFiles;
    } catch (error) {
      console.error('Error al subir múltiples archivos para tarea cognitiva:', error);
      throw error;
    }
  },
  
  /**
   * Procesa los archivos en el formulario para asegurar que tengan las claves de S3
   * @param formData Datos del formulario a procesar
   * @returns Datos del formulario con archivos procesados
   */
  async processFormFiles(formData: Partial<CognitiveTaskFormData>): Promise<Partial<CognitiveTaskFormData>> {
    // Si no hay preguntas o es un formulario vacío, devolver los datos sin cambios
    if (!formData.questions || formData.questions.length === 0) {
      return formData;
    }
    
    // Copia profunda para no modificar el original
    const processedData = JSON.parse(JSON.stringify(formData)) as Partial<CognitiveTaskFormData>;
    
    // Recorrer todas las preguntas que pueden tener archivos
    for (const question of processedData.questions || []) {
      // Solo procesar preguntas de tipo navigation_flow o preference_test que tienen archivos
      if (
        (question.type === 'navigation_flow' || question.type === 'preference_test') &&
        question.files && 
        question.files.length > 0
      ) {
        // Asegurarse de que cada archivo tenga una clave de S3 válida
        for (const file of question.files) {
          // Si el archivo ya tiene una clave S3 y una URL válida, continuar
          if (file.s3Key && file.url && !file.url.startsWith('blob:')) {
            continue;
          }
          
          // Si encontramos un archivo sin clave S3 o con URL local, 
          // significa que hubo un error en la carga o que no se completó
          if (!file.s3Key || file.url.startsWith('blob:')) {
            console.error('Archivo sin clave S3 o con URL local:', file);
            throw new Error(`El archivo ${file.name} no se cargó correctamente en S3`);
          }
        }
      }
    }
    
    return processedData;
  }
};

export default cognitiveTaskService; 