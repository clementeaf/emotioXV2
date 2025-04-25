import { apiClient } from '../config/api-client';
import { s3Service } from './index';
import { 
  CognitiveTaskData, 
  CognitiveTaskData as CognitiveTaskRecord, 
  // UploadedFile // <-- Comentado hasta saber dónde está definido
} from '../components/research/CognitiveTask/types';

// <<< Definir UploadedFile localmente si no se puede importar (Ejemplo) >>>
// O importar desde la ubicación correcta si se conoce
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  s3Key: string;
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  questionId?: string;
}

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
      // <<< Usar clave GET >>>
      return await apiClient.get<CognitiveTaskRecord, 'cognitiveTask'>('cognitiveTask', 'GET', { id });
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
      // <<< Usar clave GET_BY_RESEARCH >>>
      return await apiClient.get<CognitiveTaskRecord, 'cognitiveTask'>('cognitiveTask', 'GET_BY_RESEARCH', { researchId });
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
  async create(data: CognitiveTaskData, researchId?: string): Promise<CognitiveTaskRecord> { // <<< Usar CognitiveTaskData >>>
    try {
      const processedData = await this.processFormFiles(data);
      const payload = researchId ? { ...processedData, researchId } : processedData;
      // <<< Usar clave CREATE >>>
      return await apiClient.post<CognitiveTaskRecord, typeof payload, 'cognitiveTask'>(
        'cognitiveTask', 
        'CREATE', 
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
  async update(id: string, data: Partial<CognitiveTaskData>): Promise<CognitiveTaskRecord> { // <<< Usar CognitiveTaskData >>>
    try {
      const processedData = await this.processFormFiles(data);
      // <<< Usar clave UPDATE >>>
      return await apiClient.put<CognitiveTaskRecord, Partial<CognitiveTaskData>, 'cognitiveTask'>(
        'cognitiveTask', 
        'UPDATE', 
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
  async updateByResearchId(researchId: string, data: CognitiveTaskData): Promise<CognitiveTaskRecord> { // <<< Usar CognitiveTaskData >>>
    try {
      const processedData = await this.processFormFiles(data);
      // <<< Usar clave UPDATE (para PUT) y aceptar Partial como payload >>>
      return await apiClient.put<CognitiveTaskRecord, Partial<CognitiveTaskData>, 'cognitiveTask'>(
        'cognitiveTask', 
        'UPDATE', // Asumiendo que PUT al endpoint base actualiza o crea 
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
      // <<< Usar clave DELETE >>>
      await apiClient.delete<void, 'cognitiveTask'>('cognitiveTask', 'DELETE', { id });
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
  async processFormFiles(formData: Partial<CognitiveTaskData>): Promise<Partial<CognitiveTaskData>> { // <<< Usar CognitiveTaskData >>>
    if (!formData.questions || formData.questions.length === 0) {
      return formData;
    }
    const processedData = JSON.parse(JSON.stringify(formData)) as Partial<CognitiveTaskData>; // <<< Usar CognitiveTaskData >>>
    
    for (const question of processedData.questions || []) {
      if (
        (question.type === 'navigation_flow' || question.type === 'preference_test') &&
        question.files && 
        question.files.length > 0
      ) {
        for (const file of question.files as UploadedFile[]) { // <<< Añadir type assertion >>>
          if (file.s3Key && file.url && !file.url.startsWith('blob:')) {
            continue;
          }
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