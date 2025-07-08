import tokenService from '@/services/tokenService';
import { API_BASE_URL, apiClient } from '../config/api';

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
    this.baseURL = API_BASE_URL;
  }

  /**
   * Obtiene los headers de autenticación con manejo optimizado del token
   */
  private getAuthHeaders(): Record<string, string> {
    const token = tokenService.getToken();
    const authHeader = token ? `Bearer ${token}` : '';

    if (token && token.split('.').length !== 3) {
      console.error('TOKEN MALFORMADO: No tiene el formato JWT estándar (xxx.yyy.zzz)');
    }

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

    const requestBody = {
      fileType,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      researchId,
      folder: folder || 'general'
    };

    try {
      const response = await apiClient.post('s3', 'upload', requestBody);

      return response.data;
    } catch (error) {
      console.error('===== ERROR COMPLETO S3 =====');
      console.error('Error al obtener URL de subida:', error);
      console.error('=============================');
      throw new Error(`Error al obtener URL de subida: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene una URL prefirmada para descargar un archivo
   */
  async getDownloadUrl(key: string): Promise<string> {
    const encodedKey = encodeURIComponent(key);

    try {
      const response = await apiClient.get('s3', 'download', undefined, { key: encodedKey });

      if (!response?.data?.downloadUrl) {
        console.error('S3Service.getDownloadUrl - Respuesta exitosa pero falta downloadUrl:', response);
        throw new Error('La respuesta del servidor no contiene la URL de descarga esperada.');
      }

      return response.data.downloadUrl;
    } catch (error) {
      console.error('S3Service.getDownloadUrl - Error en respuesta:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al obtener URL de descarga');
    }
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
      await apiClient.post('s3', 'deleteObject', { key: key });
    } catch (error) {
      console.error(`${operation} - Error al eliminar archivo:`, error);
      throw new Error(`Error al eliminar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

      const token = tokenService.getToken();
      if (!token) {
        console.error('============ ERROR CRÍTICO: NO HAY TOKEN =============');
        console.error('No se encontró token en tokenService.');
        console.error('El usuario debe iniciar sesión nuevamente.');
        console.error('=======================================================');

        const error = new Error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        if (onError) {
          onError(error);
        }
        throw error;
      }

      const presignedData = await this.getUploadPresignedUrl(file, researchId, folder);

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
