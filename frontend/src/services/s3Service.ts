import { apiClient } from '../api/config';

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
      return response;
    } catch (error) {
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
      

      // El backend devuelve: { success: true, data: { downloadUrl, key, expiresAt } }
      // El apiClient probablemente devuelve toda la respuesta o solo la data
      const downloadUrl = response?.data?.downloadUrl || response?.downloadUrl;
      
      if (!downloadUrl) {
        throw new Error('La respuesta del servidor no contiene la URL de descarga esperada.');
      }

      return downloadUrl;
    } catch (error) {
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
      throw new Error('Se requiere clave S3 para eliminar');
    }

    try {
      await apiClient.post('s3', 'deleteObject', { key: key });
    } catch (error) {
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
      throw error;
    }
  }
}

const s3Service = new S3Service();
export default s3Service;
