import API_CONFIG from '@/config/api.config';
import tokenService from '@/services/tokenService';
import { ApiEndpointManager } from '@/config/api-client';

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
  private endpointManager: ApiEndpointManager;

  constructor() {
    this.endpointManager = new ApiEndpointManager();
    this.baseURL = this.endpointManager.getBaseUrl(); 
    console.log('S3Service inicializado. Base URL:', this.baseURL);
  }

  /**
   * Obtiene los headers de autenticación con manejo optimizado del token
   */
  private getAuthHeaders(): Record<string, string> {
    const token = tokenService.getToken();
    
    console.log('===== DEBUG TOKEN COMPLETO =====');
    console.log('Token enviado en headers:', token);
    console.log('Longitud del token:', token ? token.length : 0);
    
    const authHeader = token ? `Bearer ${token}` : '';
    console.log('Header Authorization completo:', authHeader);
    
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
    
    const uploadEndpoint = API_CONFIG.endpoints.s3.UPLOAD;
    
    console.log('S3Service.getUploadPresignedUrl - Solicitando URL para subida a:', 
      this.baseURL + uploadEndpoint);
    
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
    const encodedKey = encodeURIComponent(key);
    
    const downloadEndpointBase = API_CONFIG.endpoints.s3.DOWNLOAD;
    const url = `${this.baseURL}${downloadEndpointBase}?key=${encodedKey}`;
    
    console.log('S3Service.getDownloadUrl - Solicitando URL para descarga a:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      console.error('S3Service.getDownloadUrl - Error en respuesta:', 
        response.status, response.statusText, errorDetails);
      throw new Error(errorDetails || `Error al obtener URL de descarga: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data?.data?.downloadUrl) {
       console.error('S3Service.getDownloadUrl - Respuesta exitosa pero falta downloadUrl:', data);
       throw new Error('La respuesta del servidor no contiene la URL de descarga esperada.');
    }
    console.log('S3Service.getDownloadUrl - URL obtenida:', data.data.downloadUrl);
    return data.data.downloadUrl;
  }

  /**
   * Elimina un archivo de S3 llamando al endpoint del backend POST /s3/delete-object
   * @param key Clave S3 del archivo a eliminar
   * @throws Error si la eliminación falla
   */
  async deleteFile(key: string): Promise<void> { 
    const operation = '[Frontend S3Service.deleteFile - POST]';
    if (!key) {
      console.error(`${operation} - Se requiere clave S3 para eliminar.`);
      throw new Error('Se requiere clave S3 para eliminar');
    }
    
    try {
      const deleteEndpoint = API_CONFIG.endpoints.s3.DELETE_OBJECT;
      const url = `${this.baseURL}${deleteEndpoint}`; 
      
      console.log(`${operation} - Enviando solicitud POST a: ${url}`);

      const response = await fetch(url, { 
        method: 'POST',
        headers: {
           ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ key: key })
      });

      if (!response.ok) {
         let errorBody = '{}';
         try {
             const errorData = await response.json();
             errorBody = errorData.error || JSON.stringify(errorData);
         } catch (e) { 
             try {
               errorBody = await response.text();
             } catch (readErr) {
               errorBody = 'No se pudo leer el cuerpo del error.';
             }
         }
         
         console.error(`${operation} - Error en respuesta fetch: ${response.status} ${response.statusText}`, errorBody);
         throw new Error(errorBody || `Error al eliminar archivo: ${response.status} ${response.statusText}`);
      }

      console.log(`${operation} - Solicitud POST completada exitosamente para: ${key}`);

    } catch (error: any) {
      console.error(`${operation} - Error en llamada POST para ${key}:`, error);
      throw new Error(error.message || 'Error desconocido durante la eliminación del archivo');
    }
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
      
      const presignedData = await this.getUploadPresignedUrl(file, researchId, folder);
      
      console.log('S3Service.uploadFile - URL prefirmada obtenida:', presignedData.uploadUrl);
      
      const xhr = new XMLHttpRequest();
      
      if (progressCallback) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            progressCallback(percentComplete);
          }
        };
      }
      
      const uploadPromise = new Promise<{ fileUrl: string; key: string }>((resolve, reject) => {
        xhr.open('PUT', presignedData.uploadUrl);
        
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
      const downloadUrl = await this.getDownloadUrl(key);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      if (fileName) {
        link.download = fileName;
      } else {
        const keyParts = key.split('/');
        const extractedFileName = keyParts[keyParts.length - 1];
        link.download = extractedFileName;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      throw error;
    }
  }
}

const s3Service = new S3Service();
export default s3Service; 