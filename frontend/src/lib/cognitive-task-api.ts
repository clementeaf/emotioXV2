/**
 * API para CognitiveTask (Refactorizada)
 */

import { ApiError } from '@/config/api-client'; // Importar ApiError si se necesita
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';
import { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';

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

        // Procesar datos del backend al frontend (mapear hitZones a hitzones)
        return result ? this.processDataFromBackend(result) : null;
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
   * Elimina todos los datos de tarea cognitiva por researchId
   * @param researchId ID de la investigación
   */
  async deleteByResearchId(researchId: string): Promise<void> {
    console.log(`[CognitiveTaskFixedAPI] Eliminando todos los datos cognitive task para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
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

      // LOG COMPLETO: Mostrar los datos exactos que se envían al backend
      console.log(`[CognitiveTaskFixedAPI] PAYLOAD COMPLETO que se envía al backend:`, payload);

      // LOG ESPECÍFICO: Mostrar archivos con hitZones
      payload.questions?.forEach((q, qIndex) => {
        if (q.files && q.files.length > 0) {
          console.log(`[CognitiveTaskFixedAPI] Pregunta ${qIndex} (${q.id}) archivos:`, q.files);
          q.files.forEach((file, fIndex) => {
            console.log(`[CognitiveTaskFixedAPI] Archivo ${fIndex} (${file.name}) hitZones:`, file.hitZones);
          });
        }
      });

      return this.put<CognitiveTaskFormData>(path, payload);
    } catch (error) {
      console.error(`[CognitiveTaskFixedAPI] Error en save:`, error);
      throw error;
    }
  }

  /**
   * Mapea las estructuras de hitzones del frontend al formato esperado por el backend
   */
  private mapHitzoneAreasToHitZones(files: any[]): any[] {
    return files.map(file => {
      console.log(`[CognitiveTaskFixedAPI] Procesando archivo para mapeo hitZones:`, file);
      console.log(`[CognitiveTaskFixedAPI] file.hitZones (mayúscula):`, file.hitZones);
      console.log(`[CognitiveTaskFixedAPI] file.hitzones (minúscula):`, file.hitzones);

      // Buscar hitZones tanto en mayúscula como minúscula para compatibilidad
      const hitzonesData = file.hitZones || file.hitzones;

      if (!hitzonesData || !Array.isArray(hitzonesData)) {
        console.log(`[CognitiveTaskFixedAPI] No hay hitZones para procesar en archivo ${file.name}`);
        return file;
      }

      console.log(`[CognitiveTaskFixedAPI] Mapeando ${hitzonesData.length} hitZones para archivo ${file.name}:`, hitzonesData);

      // Mapear HitzoneArea[] a HitZone[]
      const hitZones = hitzonesData.map((area: any) => ({
        id: area.id,
        name: `Hitzone-${area.id}`, // Generar nombre por defecto
        region: {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height
        },
        fileId: file.id
      }));

      console.log(`[CognitiveTaskFixedAPI] HitZones mapeados para backend:`, hitZones);

      return {
        ...file,
        hitZones, // Formato backend
        hitzones: undefined // Remover formato frontend (minúscula)
        // Mantener hitZones para que no se pierda en el frontend
      };
    });
  }

  /**
   * Sanitiza los datos antes de enviarlos al backend
   * Incluye el mapeo de hitzones
   */
  private sanitizeDataForSave(data: CognitiveTaskFormData): CognitiveTaskFormData {
    const sanitized = { ...data };

    if (sanitized.questions && Array.isArray(sanitized.questions)) {
      sanitized.questions = sanitized.questions.map(question => {
        if (question.files && Array.isArray(question.files)) {
          // Mapear hitzones y filtrar archivos válidos
          const mappedFiles = this.mapHitzoneAreasToHitZones(question.files);
          const validFiles = mappedFiles.filter(file =>
            file &&
            file.status !== 'error' &&
            file.status !== 'pending-delete' &&
            file.id &&
            file.name
          );

          return {
            ...question,
            files: validFiles
          };
        }
        return question;
      });
    }

    return sanitized;
  }

  /**
   * Mapea las estructuras de hitzones del backend al formato del frontend
   */
  private mapHitZonesToHitzoneAreas(files: any[]): any[] {
    return files.map(file => {
      console.log(`[CognitiveTaskFixedAPI] Procesando archivo del backend para mapeo a frontend:`, file);
      console.log(`[CognitiveTaskFixedAPI] file.hitZones del backend:`, file.hitZones);

      if (!file.hitZones || !Array.isArray(file.hitZones)) {
        console.log(`[CognitiveTaskFixedAPI] No hay hitZones del backend para procesar en archivo ${file.name}`);
        return file;
      }

      console.log(`[CognitiveTaskFixedAPI] Mapeando ${file.hitZones.length} hitZones del backend a formato frontend`);

      // Mapear HitZone[] a HitzoneArea[] solo si region existe
      const hitZones = file.hitZones
        .filter((zone: any) => zone && zone.region)
        .map((zone: any) => ({
          id: zone.id,
          x: zone.region.x,
          y: zone.region.y,
          width: zone.region.width,
          height: zone.region.height
        }));

      console.log(`[CognitiveTaskFixedAPI] HitzoneAreas mapeados para frontend:`, hitZones);

      return {
        ...file,
        hitZones, // Mantener en formato frontend (mayúscula)
        // No remover hitZones del backend, mantenerlo para el frontend
      };
    });
  }

  /**
   * Procesa los datos recibidos del backend para el frontend
   */
  private processDataFromBackend(data: CognitiveTaskFormData): CognitiveTaskFormData {
    const processed = { ...data };

    if (processed.questions && Array.isArray(processed.questions)) {
      processed.questions = processed.questions.map(question => {
        if (question.files && Array.isArray(question.files)) {
          // Mapear hitZones del backend a hitzones del frontend
          const mappedFiles = this.mapHitZonesToHitzoneAreas(question.files);

          return {
            ...question,
            files: mappedFiles
          };
        }
        return question;
      });
    }

    return processed;
  }

  /**
   * Obtiene una tarea cognitiva por ID de investigación
   * @param researchId ID de la investigación
   */
  async getCognitiveTask(researchId: string): Promise<CognitiveTaskFormData> {
    console.log(`[CognitiveTaskFixedAPI] Obteniendo tarea cognitiva para researchId: ${researchId}`);
    const path = `/research/${researchId}/cognitive-task`;
    const data = await super.get(path) as CognitiveTaskFormData;

    // Procesar datos del backend al frontend
    return this.processDataFromBackend(data);
  }

  // Mantener métodos relacionados con S3 si son necesarios y específicos
  // async getFileUploadUrl(...) { ... }
  // async getFileDownloadUrl(...) { ... }
  // async getFileDeleteUrl(...) { ... }
}

// Exportar instancia
export const cognitiveTaskFixedAPI = new CognitiveTaskFixedAPI();
