/**
 * API para CognitiveTask
 * Implementando un enfoque similar a SmartVOC
 */

import API_CONFIG from '@/config/api.config';
import { s3Service } from '@/services';

// Preparar los encabezados con el token de autenticación
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (typeof window !== 'undefined') {
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    const token = storageType === 'local'
      ? localStorage.getItem('token') || ''
      : sessionStorage.getItem('token') || '';
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Manejador de respuesta personalizado para CognitiveTask
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleCognitiveTaskResponse = async (response: Response) => {
  try {
    const data = await response.json();
    if (!response.ok) {
      console.warn(`[CognitiveTaskAPI] Respuesta no exitosa: ${response.status}`, data);
      
      // Caso especial para 404 - Simplemente retornar un objeto con notFound=true
      if (response.status === 404) {
        return { 
          notFound: true, 
          data: null,
          status: 404
        };
      }
      
      return { 
        error: true, 
        status: response.status, 
        message: data.message || data.error || response.statusText,
        data: null
      };
    }
    return data;
  } catch (error) {
    // Si no es JSON, intentar obtener como texto
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      console.warn(`[CognitiveTaskAPI] Error no-JSON: ${response.status}`);
      
      // Caso especial para 404 - Simplemente retornar un objeto con notFound=true
      if (response.status === 404) {
        return { 
          notFound: true, 
          data: null,
          status: 404
        };
      }
      
      return { 
        error: true, 
        status: response.status, 
        message: text || response.statusText,
        data: null
      };
    }
    return text || {};
  }
};

// Función simple para normalizar URLs
const normalizeUrl = (base: string, path: string): string => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

// API Cliente para CognitiveTask
export const cognitiveTaskAPI = {
  /**
   * Obtiene una tarea cognitiva por ID
   * @param id ID de la tarea cognitiva
   */
  getById: (id: string) => {
    if (!id) {
      console.warn('[CognitiveTaskAPI] Se requiere un ID para obtener la tarea cognitiva');
      return {
        send: async () => ({ error: true, message: 'ID no proporcionado', data: null })
      };
    }
    
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/cognitive-task/${id}`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(fullUrl, { 
            method: 'GET', 
            headers 
          });
          
          return handleCognitiveTaskResponse(response);
        } catch (error) {
          console.warn('[CognitiveTaskAPI] Error de red controlado');
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Obtiene la tarea cognitiva asociada a una investigación
   * @param researchId ID de la investigación
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      console.warn('[CognitiveTaskAPI] Se requiere un ID de investigación');
      return {
        send: async () => ({ error: true, message: 'ID de investigación no proporcionado', data: null })
      };
    }
    
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${researchId}/cognitive-task`);
    console.log(`[CognitiveTaskAPI] Solicitando tarea cognitiva para investigación: ${researchId}`, { url: fullUrl });
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(fullUrl, { 
            method: 'GET', 
            headers 
          });
          
          return handleCognitiveTaskResponse(response);
        } catch (error) {
          console.warn('[CognitiveTaskAPI] Error de red controlado:', error);
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Crea una nueva tarea cognitiva
   * @param data Datos de la tarea cognitiva
   */
  create: (data: any) => {
    if (!data || !data.researchId) {
      console.warn('[CognitiveTaskAPI] Se requieren datos y un ID de investigación');
      return {
        send: async () => ({ 
          error: true, 
          message: 'Datos o ID de investigación no proporcionados', 
          data: null 
        })
      };
    }
    
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${data.researchId}/cognitive-task`);
    console.log(`[CognitiveTaskAPI] Creando tarea cognitiva para investigación: ${data.researchId}`, { url: fullUrl });
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          // Preparar datos para el backend
          const cleanData = {
            ...data,
            researchId: data.researchId
          };
          
          console.log('[CognitiveTaskAPI] Datos a enviar en Create:', cleanData);
          
          const response = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(cleanData)
          });
          
          return handleCognitiveTaskResponse(response);
        } catch (error) {
          console.warn('[CognitiveTaskAPI] Error de red controlado');
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Actualiza una tarea cognitiva existente
   * @param id ID de la tarea cognitiva (opcional)
   * @param data Datos actualizados
   */
  update: (id: string, data: any) => {
    if (!data || !data.researchId) {
      console.warn('[CognitiveTaskAPI] Se requieren datos y un ID de investigación para actualizar');
      return {
        send: async () => ({ error: true, message: 'Datos o ID de investigación no proporcionados', data: null })
      };
    }
    
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${data.researchId}/cognitive-task`);
    console.log(`[CognitiveTaskAPI] Actualizando tarea cognitiva para investigación: ${data.researchId}`, { url: fullUrl });
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          // Preparar datos para el backend
          const cleanData = {
            ...data,
            researchId: data.researchId
          };
          
          console.log('[CognitiveTaskAPI] Datos a enviar en Update:', cleanData);
          
          const response = await fetch(fullUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(cleanData)
          });
          
          return handleCognitiveTaskResponse(response);
        } catch (error) {
          console.warn('[CognitiveTaskAPI] Error de red controlado');
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },
  
  /**
   * Crea o actualiza automáticamente una tarea cognitiva para una investigación
   * @param researchId ID de la investigación
   * @param data Datos de la tarea cognitiva
   * @returns Resultado de la operación
   */
  createOrUpdateByResearchId: (researchId: string, data: any) => {
    if (!researchId) {
      console.warn('[CognitiveTaskAPI] Se requiere un ID de investigación');
      return {
        send: async () => ({ error: true, message: 'ID de investigación no proporcionado', data: null })
      };
    }
    
    if (!data) {
      console.warn('[CognitiveTaskAPI] Se requieren datos para crear o actualizar');
      return {
        send: async () => ({ error: true, message: 'Datos no proporcionados', data: null })
      };
    }
    
    // URL para operaciones con research ID
    const fullUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${researchId}/cognitive-task`);
    
    return {
      send: async () => {
        try {
          const headers = getAuthHeaders();
          
          // Primero verificamos si existe una tarea cognitiva para esta investigación
          console.log(`[CognitiveTaskAPI] Verificando existencia de tarea cognitiva para investigación: ${researchId}`);
          const checkResponse = await fetch(fullUrl, { 
            method: 'GET', 
            headers 
          });
          
          const checkResult = await handleCognitiveTaskResponse(checkResponse);
          
          // Preparar datos para backend - limpieza adicional
          const cleanData = {
            ...data,
            researchId
          };
          
          // Verificar preguntas y archivos
          if (cleanData.questions) {
            cleanData.questions = cleanData.questions.map((q: any) => {
              // Crear objeto limpio para cada pregunta
              const cleanQuestion: any = {
                id: q.id,
                type: q.type,
                title: q.title,
                required: Boolean(q.required),
                showConditionally: Boolean(q.showConditionally),
                deviceFrame: Boolean(q.deviceFrame)
              };
              
              // Agregar propiedades específicas según el tipo
              if (q.description) cleanQuestion.description = q.description;
              
              if (q.choices && ['single_choice', 'multiple_choice', 'ranking'].includes(q.type)) {
                cleanQuestion.choices = q.choices;
              }
              
              if (q.scaleConfig && q.type === 'linear_scale') {
                cleanQuestion.scaleConfig = q.scaleConfig;
              }
              
              if (q.files && ['navigation_flow', 'preference_test'].includes(q.type)) {
                // Limpiar archivos para incluir solo propiedades necesarias
                cleanQuestion.files = q.files
                  .filter((f: any) => f && f.s3Key && f.url && !f.url.startsWith('blob:'))
                  .map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    url: f.url,
                    s3Key: f.s3Key
                  }));
              }
              
              return cleanQuestion;
            });
          }
          
          console.log('[CognitiveTaskAPI] Datos limpios para enviar:', cleanData);
          
          // Determinar si debemos usar POST o PUT
          let method = 'POST';
          
          if (checkResult && !checkResult.notFound && !checkResult.error && checkResult.data) {
            // Si encontramos datos existentes, usamos PUT para actualizar
            method = 'PUT';
            console.log(`[CognitiveTaskAPI] Se encontró tarea cognitiva existente, usando ${method} para actualizar`);
          } else {
            // Si no hay datos o hubo un error 404, usamos POST para crear nuevo
            console.log(`[CognitiveTaskAPI] No se encontró tarea cognitiva existente, usando ${method} para crear nuevo`);
          }
          
          // Ahora realizamos la operación de crear o actualizar
          const response = await fetch(fullUrl, {
            method,
            headers,
            body: JSON.stringify(cleanData)
          });
          
          const result = await handleCognitiveTaskResponse(response);
          console.log(`[CognitiveTaskAPI] Resultado de ${method} para tarea cognitiva:`, result);
          return result;
        } catch (error) {
          console.warn('[CognitiveTaskAPI] Error de red controlado en createOrUpdateByResearchId:', error);
          return { 
            error: true, 
            network: true, 
            message: 'Error de conexión', 
            data: null 
          };
        }
      }
    };
  },

  /**
   * Sube un archivo al servidor para una tarea cognitiva
   * @param file Archivo a subir
   * @param researchId ID de la investigación
   * @param progressCallback Callback para reportar progreso
   * @returns Información del archivo subido
   */
  uploadFile: async (
    file: File, 
    researchId: string, 
    progressCallback?: (progress: number) => void
  ) => {
    try {
      // Usar el servicio de S3 para subir el archivo
      console.log(`[CognitiveTaskAPI] Subiendo archivo: ${file.name}`);
      const result = await s3Service.uploadFile({
        file,
        researchId,
        folder: 'cognitive-task-files',
        progressCallback
      });

      // Crear un objeto con la información del archivo
      const uploadedFile = {
        id: crypto.randomUUID(), // Generar un ID único para el archivo
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.fileUrl,
        s3Key: result.key
      };

      console.log(`[CognitiveTaskAPI] Archivo subido exitosamente:`, uploadedFile);
      return uploadedFile;
    } catch (error) {
      console.error('[CognitiveTaskAPI] Error al subir archivo:', error);
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
  uploadMultipleFiles: async (
    files: File[], 
    researchId: string, 
    progressCallback?: (progress: number, fileIndex: number) => void
  ) => {
    try {
      const uploadedFiles = [];
      
      // Procesar cada archivo en secuencia para evitar sobrecarga
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Subir el archivo actual
        console.log(`[CognitiveTaskAPI] Subiendo archivo ${i+1} de ${files.length}: ${file.name}`);
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
        const uploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.fileUrl,
          s3Key: result.key
        };
        
        uploadedFiles.push(uploadedFile);
      }
      
      console.log(`[CognitiveTaskAPI] ${files.length} archivos subidos exitosamente`);
      return uploadedFiles;
    } catch (error) {
      console.error('[CognitiveTaskAPI] Error al subir múltiples archivos:', error);
      throw error;
    }
  }
};

// Exportar también con nombre alternativo por compatibilidad
export const cognitiveTaskFixedAPI = cognitiveTaskAPI; 