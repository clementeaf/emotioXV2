/**
 * Servicio para interactuar con AWS S3 mediante URLs prefirmadas
 * Proporciona métodos para subir, descargar y eliminar archivos
 */

import API_CONFIG from '@/config/api.config';
import tokenService from '@/services/tokenService';

// Tipos de archivos soportados
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

// Interfaces
export interface FileUploadParams {
  file: File;
  researchId: string;
  folder?: string;
  progressCallback?: (progress: number) => void;
  onSuccess?: (fileUrl: string, key: string) => void;
  onError?: (error: Error) => void;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresAt: number;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  key: string;
  expiresAt: number;
}

export interface DeleteUrlResponse {
  deleteUrl: string;
  key: string;
  expiresAt: number;
}

// Utils para determinar el tipo de archivo
const determineFileType = (file: File): FileType => {
  const mimeType = file.type.toLowerCase();
  
  if (mimeType.startsWith('image/')) {
    return FileType.IMAGE;
  } else if (mimeType.startsWith('video/')) {
    return FileType.VIDEO;
  } else if (mimeType.startsWith('audio/')) {
    return FileType.AUDIO;
  } else {
    return FileType.DOCUMENT;
  }
};

/**
 * Servicio para gestionar operaciones con S3
 */
class S3Service {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    
    // Registrar información de inicialización
    console.log('S3Service inicializado. Base URL:', this.baseURL);
  }

  /**
   * Obtiene los headers de autenticación con manejo optimizado del token
   */
  private getAuthHeaders(): Record<string, string> {
    // Intentar obtener el token con verificaciones mejoradas 
    const token = tokenService.getToken();
    
    // Mostrar el token completo para que el usuario pueda verificarlo
    console.log('===== DEBUG TOKEN COMPLETO =====');
    console.log('Token enviado en headers:', token);
    console.log('Longitud del token:', token ? token.length : 0);
    
    // IMPORTANTE: Probar EXACTAMENTE con el prefijo "Bearer " (notar el espacio) como debería ser
    const authHeader = token ? `Bearer ${token}` : '';
    console.log('Header Authorization completo:', authHeader);
    
    // Verificación adicional en caso que el token exista pero esté malformado
    if (token && token.split('.').length !== 3) {
      console.error('TOKEN MALFORMADO: No tiene el formato JWT estándar (xxx.yyy.zzz)');
    }
    
    console.log('================================');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };
  }

  /**
   * Obtiene una URL prefirmada para subir un archivo
   */
  private async getUploadPresignedUrl(
    file: File,
    researchId: string,
    folder?: string
  ): Promise<PresignedUrlResponse> {
    const fileType = determineFileType(file);
    
    // Usar el endpoint definido en api.config.ts
    const uploadEndpoint = API_CONFIG.endpoints.s3.UPLOAD;
    
    console.log('S3Service.getUploadPresignedUrl - Solicitando URL para subida a:', 
      this.baseURL + uploadEndpoint);
    
    // Obtener headers para la petición
    const headers = this.getAuthHeaders();
    console.log('S3Service.getUploadPresignedUrl - Headers completos enviados:', headers);
    
    const requestBody = {
      fileType,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      researchId,
      folder: folder || 'general'
    };
    
    console.log('S3Service.getUploadPresignedUrl - Cuerpo de la petición:', requestBody);
    
    const response = await fetch(`${this.baseURL}${uploadEndpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('===== ERROR COMPLETO S3 =====');
      console.error('URL solicitada:', this.baseURL + uploadEndpoint);
      console.error('Código de estado:', response.status, response.statusText);
      console.error('Contenido completo de la respuesta:', errorText);
      
      // Mostrar headers sin convertir a objeto para evitar problemas de iteración
      console.error('Headers de la respuesta:');
      response.headers.forEach((value, key) => {
        console.error(`  ${key}: ${value}`);
      });
      
      console.error('=============================');
      throw new Error(`Error al obtener URL de subida: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('S3Service.getUploadPresignedUrl - URL obtenida:', data.data);
    return data.data;
  }

  /**
   * Obtiene una URL prefirmada para descargar un archivo
   */
  async getDownloadUrl(key: string): Promise<string> {
    // URL encode el key para la ruta
    const encodedKey = encodeURIComponent(key);
    
    // Usar el endpoint definido en api.config.ts
    const downloadEndpoint = API_CONFIG.endpoints.s3.DOWNLOAD.replace('{key}', encodedKey);
    
    console.log('S3Service.getDownloadUrl - Solicitando URL para descarga:', 
      this.baseURL + downloadEndpoint);
    
    const response = await fetch(`${this.baseURL}${downloadEndpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3Service.getDownloadUrl - Error en respuesta:', 
        response.status, response.statusText, errorText);
      throw new Error(`Error al obtener URL de descarga: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('S3Service.getDownloadUrl - URL obtenida:', data.data.downloadUrl);
    return data.data.downloadUrl;
  }

  /**
   * Obtiene una URL prefirmada para eliminar un archivo
   */
  async getDeleteUrl(key: string): Promise<string> {
    // URL encode el key para la ruta
    const encodedKey = encodeURIComponent(key);
    
    // Usar el endpoint definido en api.config.ts
    const deleteEndpoint = API_CONFIG.endpoints.s3.DELETE.replace('{key}', encodedKey);
    
    console.log('S3Service.getDeleteUrl - Solicitando URL para eliminación:', 
      this.baseURL + deleteEndpoint);
    
    const response = await fetch(`${this.baseURL}${deleteEndpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3Service.getDeleteUrl - Error en respuesta:', 
        response.status, response.statusText, errorText);
      throw new Error(`Error al obtener URL de eliminación: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('S3Service.getDeleteUrl - URL obtenida:', data.data.deleteUrl);
    return data.data.deleteUrl;
  }

  /**
   * Sube un archivo a S3 usando URL prefirmada
   */
  async uploadFile({
    file,
    researchId,
    folder,
    progressCallback,
    onSuccess,
    onError
  }: FileUploadParams): Promise<{ fileUrl: string; key: string }> {
    try {
      console.log('S3Service.uploadFile - Iniciando subida para:', file.name, 'en carpeta:', folder);
      
      // VERIFICACIÓN CRÍTICA: Comprobar explícitamente si hay un token antes de continuar
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('============ ERROR CRÍTICO: NO HAY TOKEN =============');
        console.error('No se encontró token en localStorage.');
        console.error('El usuario debe iniciar sesión nuevamente.');
        console.error('Keys disponibles en localStorage:', Object.keys(localStorage));
        console.error('=======================================================');
        
        const error = new Error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        if (onError) {
          onError(error);
        }
        throw error;
      }
      
      console.log('Token encontrado (longitud):', token.length);
      console.log('Primeros 20 caracteres del token:', token.substring(0, 20) + '...');
      
      // ELIMINAMOS EL INTENTO DE REFRESCAR EL TOKEN PARA EVITAR 404
      // Ya que la ruta /auth/refresh-token no existe en el backend
      /*
      try {
        console.log('S3Service.uploadFile - Intentando refrescar el token antes de la operación');
        const refreshResult = await tokenService.forceTokenRefresh();
        console.log('S3Service.uploadFile - Refresco de token completado, resultado:', refreshResult);
      } catch (refreshError) {
        console.warn('S3Service.uploadFile - Error al refrescar token, continuando con token actual:', refreshError);
      }
      */
      
      // 1. Obtener URL prefirmada del backend
      const presignedData = await this.getUploadPresignedUrl(file, researchId, folder);
      
      console.log('S3Service.uploadFile - URL prefirmada obtenida:', presignedData.uploadUrl);
      
      // 2. Subir el archivo a S3 usando la URL prefirmada
      const xhr = new XMLHttpRequest();
      
      // Configurar callbacks de progreso si se proporcionan
      if (progressCallback) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            progressCallback(percentComplete);
          }
        };
      }
      
      // Crear promesa para manejar la respuesta de la subida
      const uploadPromise = new Promise<{ fileUrl: string; key: string }>((resolve, reject) => {
        xhr.open('PUT', presignedData.uploadUrl);
        
        // Asegurarse de que el tipo de contenido esté configurado correctamente
        xhr.setRequestHeader('Content-Type', file.type);
        
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            console.log('S3Service.uploadFile - Subida exitosa:', file.name);
            
            const result = { 
              fileUrl: presignedData.fileUrl,
              key: presignedData.key
            };
            
            if (onSuccess) {
              onSuccess(presignedData.fileUrl, presignedData.key);
            }
            
            resolve(result);
          } else {
            console.error('S3Service.uploadFile - Error en subida:', xhr.status, xhr.statusText);
            const error = new Error(`Error al subir archivo: ${xhr.status} ${xhr.statusText}`);
            if (onError) {
              onError(error);
            }
            reject(error);
          }
        };
        
        xhr.onerror = () => {
          console.error('S3Service.uploadFile - Error de red en subida');
          const error = new Error('Error de red al subir archivo');
          if (onError) {
            onError(error);
          }
          reject(error);
        };
        
        xhr.onabort = () => {
          console.warn('S3Service.uploadFile - Subida cancelada');
          const error = new Error('Subida cancelada');
          if (onError) {
            onError(error);
          }
          reject(error);
        };
        
        // Enviar el archivo
        xhr.send(file);
      });
      
      return uploadPromise;
    } catch (error) {
      console.error('S3Service.uploadFile - Error general:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * Descarga un archivo desde S3 usando URL prefirmada
   */
  async downloadFile(key: string, fileName?: string): Promise<void> {
    try {
      // 1. Obtener URL prefirmada para descarga
      const downloadUrl = await this.getDownloadUrl(key);
      
      // 2. Crear un enlace temporal y simular clic para descargar
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Usar nombre de archivo proporcionado o extraer del key
      if (fileName) {
        link.download = fileName;
      } else {
        // Extraer nombre de archivo de la clave S3
        const keyParts = key.split('/');
        const extractedFileName = keyParts[keyParts.length - 1];
        link.download = extractedFileName;
      }
      
      // Añadir al DOM, hacer clic y luego eliminar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo de S3 usando URL prefirmada
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      // 1. Obtener URL prefirmada para eliminación
      const deleteUrl = await this.getDeleteUrl(key);
      
      // 2. Ejecutar solicitud DELETE usando la URL prefirmada
      const response = await fetch(deleteUrl, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
const s3Service = new S3Service();
export default s3Service; 