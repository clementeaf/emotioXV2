import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uuidv4 } from '../utils/id-generator';

/**
 * Tipos de archivos permitidos
 */
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

/**
 * Extensiones permitidas por tipo de archivo
 */
const ALLOWED_EXTENSIONS: Record<FileType, string[]> = {
  [FileType.IMAGE]: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
  [FileType.VIDEO]: ['.mp4', '.webm', '.avi', '.mov'],
  [FileType.DOCUMENT]: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx'],
  [FileType.AUDIO]: ['.mp3', '.wav', '.ogg', '.m4a']
};

/**
 * Tipos MIME permitidos por tipo de archivo
 */
const ALLOWED_MIME_TYPES: Record<FileType, string[]> = {
  [FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  [FileType.VIDEO]: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'],
  [FileType.DOCUMENT]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  [FileType.AUDIO]: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
};

/**
 * Límites de tamaño por tipo de archivo (en bytes)
 */
const MAX_FILE_SIZE: Record<FileType, number> = {
  [FileType.IMAGE]: 10 * 1024 * 1024, // 10 MB
  [FileType.VIDEO]: 100 * 1024 * 1024, // 100 MB
  [FileType.DOCUMENT]: 50 * 1024 * 1024, // 50 MB
  [FileType.AUDIO]: 30 * 1024 * 1024 // 30 MB
};

/**
 * Parámetros para la generación de URL prefirmada
 */
export interface PresignedUrlParams {
  /**
   * Tipo de archivo (determina las validaciones)
   */
  fileType: FileType;

  /**
   * Nombre original del archivo (para conservar extensión)
   */
  fileName: string;

  /**
   * Tipo MIME del archivo
   */
  mimeType: string;

  /**
   * Tamaño del archivo en bytes
   */
  fileSize: number;

  /**
   * ID de la investigación a la que pertenece el archivo
   */
  researchId: string;

  /**
   * Carpeta dentro del bucket (opcional, default 'general')
   */
  folder?: string;

  /**
   * Tiempo de expiración en segundos (opcional, default 15 minutos)
   */
  expiresIn?: number;
}

/**
 * Respuesta de generación de URL prefirmada
 */
export interface PresignedUrlResponse {
  /**
   * URL prefirmada para subir archivo
   */
  uploadUrl: string;

  /**
   * URL donde quedará el archivo después de subido
   */
  fileUrl: string;

  /**
   * Clave del objeto en S3
   */
  key: string;

  /**
   * Tiempo de expiración de la URL prefirmada (timestamp)
   */
  expiresAt: number;
}

/**
 * Servicio para operaciones con Amazon S3
 */
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Configuración para S3
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };

    // Crear cliente S3
    this.s3Client = new S3Client(options);

    // Obtener nombre del bucket desde variables de entorno
    this.bucketName = process.env.S3_BUCKET_NAME || `emotiox-v2-${process.env.STAGE || 'dev'}-storage`;

    console.log('S3Service inicializado con bucket:', this.bucketName);
  }

  /**
   * Valida los parámetros para generar una URL prefirmada
   * @param params Parámetros de la URL prefirmada
   * @throws Error si los parámetros no son válidos
   */
  private validateParams(params: PresignedUrlParams): void {
    // Verificar tipo de archivo
    if (!Object.values(FileType).includes(params.fileType)) {
      throw new Error(`Tipo de archivo inválido: ${params.fileType}`);
    }

    // Verificar extensión del archivo
    const extension = this.getFileExtension(params.fileName);
    if (!ALLOWED_EXTENSIONS[params.fileType].includes(extension.toLowerCase())) {
      throw new Error(`Extensión no permitida para ${params.fileType}: ${extension}`);
    }

    // Verificar MIME type
    if (!ALLOWED_MIME_TYPES[params.fileType].includes(params.mimeType)) {
      throw new Error(`Tipo MIME no permitido para ${params.fileType}: ${params.mimeType}`);
    }

    // Verificar tamaño del archivo
    if (params.fileSize <= 0 || params.fileSize > MAX_FILE_SIZE[params.fileType]) {
      throw new Error(
        `Tamaño de archivo inválido. Máximo permitido para ${params.fileType}: ${MAX_FILE_SIZE[params.fileType] / (1024 * 1024)} MB`
      );
    }

    // Verificar ID de investigación
    if (!params.researchId || params.researchId.trim() === '') {
      throw new Error('Se requiere un ID de investigación válido');
    }
  }

  /**
   * Obtiene la extensión de un archivo
   * @param fileName Nombre del archivo
   * @returns Extensión del archivo con punto incluido
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return fileName.slice(lastDotIndex);
  }

  /**
   * Genera una URL prefirmada para subir un archivo a S3
   * @param params Parámetros para la URL prefirmada
   * @returns Respuesta con URL prefirmada y metadatos
   */
  async generateUploadUrl(params: PresignedUrlParams): Promise<PresignedUrlResponse> {
    try {
      this.validateParams(params);
      const extension = this.getFileExtension(params.fileName);
      const fileId = uuidv4();
      const folder = params.folder || 'general';
      const key = `${params.researchId}/${folder}/${fileId}${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: params.mimeType,
        Metadata: {
          'original-filename': params.fileName,
          'research-id': params.researchId,
          'file-type': params.fileType,
          'upload-date': new Date().toISOString()
        }
      });

      const expiresIn = params.expiresIn || 15 * 60;
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      const fileUrl = `https://${this.bucketName}.s3.${process.env.APP_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

      return {
        uploadUrl,
        fileUrl,
        key,
        expiresAt
      };
    } catch (error) {
      console.error('Error al generar URL prefirmada para subida:', error);
      throw error;
    }
  }

  /**
   * Genera una URL prefirmada para descargar un archivo de S3
   * @param key Clave del objeto en S3
   * @param expiresIn Tiempo de expiración en segundos (default: 1 hora)
   * @returns URL prefirmada para descargar
   */
  async generateDownloadUrl(key: string, expiresIn: number = 60 * 60): Promise<string> {
    const operation = 'S3Service.generateDownloadUrl';
    console.log(`${operation} - Solicitando URL de descarga para la clave: ${key}`);

    try {
      // PASO 1: Verificar existencia con HeadObjectCommand
      console.log(`${operation} - Verificando existencia con HeadObject para la clave: ${key}`);
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      await this.s3Client.send(headCommand);
      console.log(`${operation} - Verificación de existencia exitosa (HeadObject OK) para la clave: ${key}`);

      // PASO 2: Si existe, generar la URL de descarga
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      console.log(`${operation} - Comando GetObject preparado para la clave: ${key}`);
      console.log(`${operation} - Llamando a getSignedUrl para la clave: ${key}`);
      const downloadUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn });
      console.log(`${operation} - URL de descarga generada exitosamente para la clave: ${key}`);

      return downloadUrl;

    } catch (error: any) {
      // Comprobar si el error viene de HeadObject (o GetObject)
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
          console.error(`${operation} - Error específico: El objeto con clave ${key} no existe en S3 (Error: ${error.name}).`);
          // Crear y lanzar un error específico que el controlador pueda identificar
          const notFoundError = new Error(`El objeto con clave ${key} no se encontró.`);
          notFoundError.name = 'NoSuchKey'; // Usar un nombre consistente
          throw notFoundError;
      }
      // Para otros errores, también relanzamos
      console.error(`${operation} - Error inesperado al generar URL de descarga (${key}):`, error);
      throw error;
    }
  }

  /**
   * Genera una URL prefirmada para eliminar un archivo de S3
   * @param key Clave del objeto en S3
   * @param expiresIn Tiempo de expiración en segundos (default: 15 minutos)
   * @returns URL prefirmada para eliminar
   */
  async generateDeleteUrl(key: string, expiresIn: number = 15 * 60): Promise<string> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const deleteUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return deleteUrl;
    } catch (error) {
      console.error('Error al generar URL prefirmada para eliminación:', error);
      throw error;
    }
  }

  /**
   * Elimina un objeto de S3
   * @param key Clave del objeto a eliminar
   */
  async deleteObject(key: string): Promise<void> {
    const operation = 'S3Service.deleteObject';
    try {
      if (!key || key.trim() === '') {
        console.warn(`${operation} - Se intentó eliminar con una clave vacía.`);
        throw new Error('Se requiere una clave de objeto válida para eliminar');
      }

      console.log(`${operation} - Intentando eliminar objeto con clave: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      console.log(`${operation} - Comando DeleteObject preparado para la clave: ${key}`);
      console.log(`${operation} - Llamando a s3Client.send(command) para la clave: ${key}`);

      // Ejecutar el comando
      const output = await this.s3Client.send(command);

      console.log(`${operation} - Resultado de s3Client.send(command):`, output);
      console.log(`${operation} - Objeto eliminado con éxito de S3 (o ya no existía): ${key}`);

    } catch (error: any) { // Usar any temporalmente para acceder a error.name
      console.error(`${operation} - Error CAPTURADO al llamar a s3Client.send(command) para clave (${key}):`, error);
      // Si el error es que la clave no existe, lo tratamos como éxito (idempotencia)
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        console.warn(`${operation} - El objeto con clave ${key} no existía en S3 (Error: ${error.name}), considerado éxito.`);
        return; // No lanzar error
      }
      // Para otros errores, sí los relanzamos
      console.error(`${operation} - Error INESPERADO al eliminar objeto de S3 (${key}), relanzando:`, error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
const s3Service = new S3Service();

export default s3Service;
