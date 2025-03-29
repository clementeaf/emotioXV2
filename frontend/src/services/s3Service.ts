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
  }

  /**
   * Obtiene los headers de autenticación
   */
  private getAuthHeaders(): Record<string, string> {
    const token = tokenService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
    
    const response = await fetch(`${this.baseURL}/s3/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        fileType,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        researchId,
        folder: folder || 'general'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener URL de subida: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Obtiene una URL prefirmada para descargar un archivo
   */
  async getDownloadUrl(key: string): Promise<string> {
    // URL encode el key para la ruta
    const encodedKey = encodeURIComponent(key);
    
    const response = await fetch(`${this.baseURL}/s3/download/${encodedKey}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener URL de descarga: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.data.downloadUrl;
  }

  /**
   * Obtiene una URL prefirmada para eliminar un archivo
   */
  async getDeleteUrl(key: string): Promise<string> {
    // URL encode el key para la ruta
    const encodedKey = encodeURIComponent(key);
    
    const response = await fetch(`${this.baseURL}/s3/delete/${encodedKey}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener URL de eliminación: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
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
      // 1. Obtener URL prefirmada del backend
      const presignedData = await this.getUploadPresignedUrl(file, researchId, folder);
      
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
            const result = { 
              fileUrl: presignedData.fileUrl,
              key: presignedData.key
            };
            
            if (onSuccess) {
              onSuccess(presignedData.fileUrl, presignedData.key);
            }
            
            resolve(result);
          } else {
            const error = new Error(`Error al subir archivo: ${xhr.status} ${xhr.statusText}`);
            if (onError) {
              onError(error);
            }
            reject(error);
          }
        };
        
        xhr.onerror = () => {
          const error = new Error('Error de red al subir archivo');
          if (onError) {
            onError(error);
          }
          reject(error);
        };
        
        xhr.onabort = () => {
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