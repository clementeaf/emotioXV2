/**
 * API para CognitiveTask (Refactorizada)
 */

import { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';
import { ApiError } from '@/config/api-client'; // Importar ApiError si se necesita

// Quitado: getAuthHeaders
// Quitado: handleCognitiveTaskResponse
// Quitado: normalizeUrl

export class CognitiveTaskFixedAPI extends ApiClient {
  constructor() {
    super(`${API_CONFIG.baseURL}`);
  }

  /**
   * Obtiene la tarea cognitiva asociada a una investigación
   */
  async getByResearchId(researchId: string): Promise<CognitiveTaskFormData | null> {
    console.log(`[CognitiveTaskFixedAPI] Obteniendo tarea cognitiva por researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
    
    try {
      // Generar una clave única para este recurso para cache
      const cacheKey = `cognitive_task_resource_${researchId}`;
      
      // Si ya intentamos acceder a este recurso antes y no existía, devolvemos directamente
      // una respuesta simulada sin hacer ninguna solicitud HTTP
      const isKnownNonExistent = localStorage.getItem(cacheKey) === 'nonexistent';
      
      if (isKnownNonExistent) {
        console.log(`[CognitiveTaskFixedAPI] Usando respuesta en caché para ${researchId} - sabemos que no existe`);
        return null;
      }
      
      console.log(`[CognitiveTaskFixedAPI] Iniciando GET a ${path}`);
      
      try {
        const result = await this.get<CognitiveTaskFormData>(path);
        
        console.log(`[CognitiveTaskFixedAPI] GET exitoso, datos recibidos:`, {
          researchId: result?.researchId,
          questionCount: result?.questions?.length || 0
        });
        
        // Eliminar el registro de "nonexistent" si la solicitud tuvo éxito
        localStorage.removeItem(cacheKey);
        
        // Verificar que el resultado tenga la estructura esperada
        if (result && (!result.researchId || !Array.isArray(result.questions))) {
          console.warn(`[CognitiveTaskFixedAPI] Advertencia: Resultado con estructura incompleta`);
        }
        
        return result;
      } catch (apiError) {
        // Manejar error 404 (no encontrado) de manera silenciosa
        if (apiError instanceof ApiError && apiError.statusCode === 404) {
          console.log(`[CognitiveTaskFixedAPI] No se encontró configuración de tarea cognitiva para esta investigación - esto es normal para nuevas investigaciones`);
          localStorage.setItem(cacheKey, 'nonexistent');
          return null;
        }
        
        // Manejar error 500 (error interno del servidor) de manera silenciosa también
        if (apiError instanceof ApiError && apiError.statusCode === 500) {
          console.warn(`[CognitiveTaskFixedAPI] Error 500 al obtener tarea cognitiva para researchId: ${researchId}`, {
            message: apiError.message,
            details: (apiError as any).originalError || apiError.message
          });
          
          // No guardar en caché errores 500 ya que podrían ser temporales
          return null;
        }
        
        // Otros errores, propagarlos
        throw apiError;
      }
    } catch (error) {
      console.error("[CognitiveTaskFixedAPI] Error en getByResearchId:", error);
      
      // Para otros errores no manejados, devolver null para evitar que falle la interfaz
      return null;
    }
  }

  /**
   * Crea una nueva tarea cognitiva
   */
  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    console.log(`[CognitiveTaskFixedAPI] Creando tarea cognitiva para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
    // Asegurarse que el payload incluya researchId si el backend lo necesita en el body
    const payload = { ...data, researchId }; 
    return this.post<CognitiveTaskFormData>(path, payload);
  }

  /**
   * Actualiza una tarea cognitiva existente
   * @param researchId ID de la investigación
   * @param taskId ID de la tarea cognitiva a actualizar
   * @param data Datos actualizados
   */
  async update(researchId: string, taskId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskFormData> {
    console.log(`[CognitiveTaskFixedAPI] Actualizando tarea cognitiva ${taskId} para researchId: ${researchId}`);
    // Construir ruta incluyendo taskId
    const path = `/research/${researchId}/cognitive-task/${taskId}`;
    return this.put<CognitiveTaskFormData>(path, data);
  }

  /**
   * Elimina una tarea cognitiva existente
   * Renombrado a deleteTask para evitar conflicto con ApiClient.delete
   * @param researchId ID de la investigación
   * @param taskId ID de la tarea cognitiva a eliminar
   */
  async deleteTask(researchId: string, taskId: string): Promise<void> {
    console.log(`[CognitiveTaskFixedAPI] Eliminando tarea cognitiva ${taskId} para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task/${taskId}`;
    // Llamar al método delete de la clase base ApiClient
    await super.delete<void>(path);
  }
  
  /**
   * Guarda (crea o actualiza) una tarea cognitiva para una investigación.
   * Similar a saveWelcomeScreen, usa PUT en la ruta simple.
   */
  async save(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    console.log(`[CognitiveTaskFixedAPI] Guardando tarea cognitiva para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
    
    // Sanitizar los datos para eliminar campos vacíos o nulos en archivos
    const sanitizedData = this.sanitizeDataForSave(data);
    
    // Asegurarse que el payload incluya researchId si el backend lo necesita en el body
    const payload = { ...sanitizedData, researchId }; 
    
    try {
      console.log(`[CognitiveTaskFixedAPI] Enviando datos a ${path} - payload reducido:`, {
        researchId: payload.researchId,
        questionCount: payload.questions?.length || 0,
        hasFiles: payload.questions?.some(q => q.files && q.files.length > 0) || false
      });
      
      return this.put<CognitiveTaskFormData>(path, payload);
    } catch (error) {
      console.error(`[CognitiveTaskFixedAPI] Error en save:`, error);
      throw error;
    }
  }
  
  /**
   * Sanitiza los datos para enviar al backend, eliminando campos problemáticos
   */
  private sanitizeDataForSave(data: CognitiveTaskFormData): CognitiveTaskFormData {
    // Crear una copia profunda para no modificar los datos originales
    const sanitized = JSON.parse(JSON.stringify(data)) as CognitiveTaskFormData;
    
    // Sanitizar las preguntas
    if (sanitized.questions) {
      sanitized.questions = sanitized.questions.map(question => {
        // Sanitizar archivos si existen
        if (question.files && Array.isArray(question.files)) {
          question.files = question.files
            // Filtrar archivos nulos o undefined
            .filter(file => file && typeof file === 'object')
            // Asegurarse de que cada archivo tiene los campos requeridos
            .map(file => {
              // Campos esenciales para un archivo
              const essentialFields = ['id', 'name', 'size', 'type', 's3Key'];
              
              // Verificar que todos los campos esenciales existen
              const hasMissingFields = essentialFields.some(field => {
                return file[field as keyof typeof file] === undefined;
              });
              
              if (hasMissingFields) {
                console.warn(`[CognitiveTaskFixedAPI] Archivo con campos faltantes omitido:`, 
                  JSON.stringify(file));
                return null;
              }
              
              // Crear un objeto limpio solo con los campos necesarios
              return {
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                s3Key: file.s3Key,
                url: file.url // Opcional pero útil
              };
            })
            // Filtrar cualquier archivo que haya sido convertido a null en la etapa anterior
            .filter(file => file !== null);
        }
        return question;
      });
    }
    
    return sanitized;
  }
  
  // Mantener métodos relacionados con S3 si son necesarios y específicos
  // async getFileUploadUrl(...) { ... }
  // async getFileDownloadUrl(...) { ... }
  // async getFileDeleteUrl(...) { ... }
}

// Exportar instancia
export const cognitiveTaskFixedAPI = new CognitiveTaskFixedAPI(); 