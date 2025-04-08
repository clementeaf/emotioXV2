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
    
    console.log(`[CognitiveTaskAPI] Intentando crear o actualizar tarea cognitiva para investigación: ${researchId}`);
    
    return {
      send: async () => {
        try {
          // LOGS DETALLADOS - Análisis de datos antes de enviar
          console.log('==================== DIAGNÓSTICO DE COGNITIVE TASK DATA ====================');
          console.log(`[CognitiveTaskAPI] Datos originales a enviar:`, JSON.stringify(data, null, 2));
          
          // Contar imágenes en cada pregunta de preference_test
          console.log('\n[CognitiveTaskAPI] ANÁLISIS DE PREFERENCE TESTS:');
          const preferenceTests = data.questions.filter((q: any) => q.type === 'preference_test');
          
          preferenceTests.forEach((question: any, index: number) => {
            console.log(`\n--- Preference Test #${index + 1} (ID: ${question.id}) ---`);
            console.log(`Título: "${question.title}"`);
            
            if (!question.files || !Array.isArray(question.files)) {
              console.log('⚠️ NO TIENE ARRAY DE ARCHIVOS');
            } else {
              console.log(`Total archivos en array: ${question.files.length}`);
              
              // Mostrar detalles de cada archivo
              question.files.forEach((file: any, fileIndex: number) => {
                console.log(`\n  Archivo ${fileIndex + 1}:`);
                console.log(`  - ID: ${file.id}`);
                console.log(`  - Nombre: ${file.name}`);
                console.log(`  - Tamaño: ${file.size}`);
                console.log(`  - Tipo: ${file.type}`);
                console.log(`  - URL: ${file.url?.substring(0, 50)}...`);
                console.log(`  - S3Key: ${file.s3Key}`);
                console.log(`  - URL es blob?: ${file.url?.startsWith('blob:') ? 'SÍ ⚠️' : 'NO ✓'}`);
                
                // Verificar si hay propiedades extras que podrían interferir
                const extraProps = Object.keys(file).filter(k => 
                  !['id', 'name', 'size', 'type', 'url', 's3Key'].includes(k)
                );
                if (extraProps.length > 0) {
                  console.log(`  - Propiedades extra: ${extraProps.join(', ')} ⚠️`);
                  extraProps.forEach(prop => {
                    console.log(`    - ${prop}: ${JSON.stringify(file[prop])}`);
                  });
                }
              });
              
              // Verificar si hay duplicados de s3Key
              const s3Keys = question.files.map((f: any) => f.s3Key);
              const uniqueS3Keys = Array.from(new Set(s3Keys));
              if (s3Keys.length !== uniqueS3Keys.length) {
                console.log(`\n  ⚠️ ALERTA: Hay S3Keys duplicadas en los archivos`);
                console.log(`  - Total s3Keys: ${s3Keys.length}`);
                console.log(`  - S3Keys únicas: ${uniqueS3Keys.length}`);
                console.log(`  - S3Keys: ${JSON.stringify(s3Keys)}`);
              }
            }
          });
          
          console.log('\n[CognitiveTaskAPI] FIN DE ANÁLISIS');
          console.log('==========================================================================');
          
          // Continuar con el flujo normal
          const headers = getAuthHeaders();
          
          // Primero verificamos si existe la tarea cognitiva para esta investigación
          const checkUrl = normalizeUrl(API_CONFIG.baseURL, `/research/${researchId}/cognitive-task`);
          const checkResponse = await fetch(checkUrl, { 
            method: 'GET', 
            headers 
          });
          
          const checkResult = await handleCognitiveTaskResponse(checkResponse);
          console.log(`[CognitiveTaskAPI] Resultado de verificación:`, checkResult);
          
          // Preparar URL y método según si existe o no
          let url = checkUrl;
          let method = 'PUT'; // Por defecto asumimos actualización
          
          // Si no existe o hay error 404, usamos POST para crear
          if (checkResult.notFound || (checkResult.error && checkResult.status === 404)) {
            console.log(`[CognitiveTaskAPI] No se encontró tarea cognitiva existente. Creando nueva.`);
            method = 'POST';
          } else {
            console.log(`[CognitiveTaskAPI] Tarea cognitiva existente encontrada. Actualizando.`);
            
            // Si tenemos un ID, podemos añadirlo a los datos
            if (checkResult.id) {
              data.id = checkResult.id;
            }
          }
          
          // Preparar datos completos para el backend
          const cleanData = {
            ...data,
            researchId
          };
          
          console.log(`[CognitiveTaskAPI] Enviando ${method} a ${url} con datos:`, JSON.stringify(cleanData, null, 2));
          
          // Realizar la petición HTTP
          const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(cleanData)
          });
          
          const result = await handleCognitiveTaskResponse(response);
          console.log(`[CognitiveTaskAPI] Resultado de ${method}:`, result);
          
          return result;
        } catch (error) {
          console.error('[CognitiveTaskAPI] Error de red controlado:', error);
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