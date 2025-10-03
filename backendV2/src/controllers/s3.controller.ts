import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createController, RouteMap } from '../utils/controller.decorator';
import { createResponse } from '../utils/controller.utils';
import s3Service, { FileType, PresignedUrlParams } from '../services/s3.service';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador para operaciones relacionadas con Amazon S3
 */
export class S3Controller {
  /**
   * Genera una URL prefirmada para subir un archivo a S3
   * @param event Evento API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta con la URL prefirmada o error
   */
  async generateUploadUrl(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      structuredLog('info', 'S3Controller.generateUploadUrl', 'Inicio');
      
      // Verificar que haya un cuerpo en la petición
      if (!event.body) {
        return createResponse(400, { error: 'Se requiere un cuerpo en la petición' }, event);
      }
      
      // Parsear el cuerpo de la petición
      const requestBody = JSON.parse(event.body);
      
      // Extraer parámetros necesarios
      const {
        fileType,
        fileName,
        mimeType,
        fileSize,
        researchId,
        folder,
        expiresIn
      } = requestBody;
      
      // Validar parámetros obligatorios
      if (!fileType || !fileName || !mimeType || !fileSize || !researchId) {
        return createResponse(400, {
          error: 'Parámetros incompletos',
          details: 'Se requieren fileType, fileName, mimeType, fileSize y researchId'
        }, event);
      }
      
      // Verificar que fileType sea un valor válido de FileType
      if (!Object.values(FileType).includes(fileType)) {
        return createResponse(400, {
          error: 'Tipo de archivo inválido',
          details: `El tipo ${fileType} no es válido. Debe ser uno de: ${Object.values(FileType).join(', ')}`
        }, event);
      }
      
      // Construir parámetros para generar URL
      const params: PresignedUrlParams = {
        fileType: fileType as FileType,
        fileName,
        mimeType,
        fileSize,
        researchId,
        folder,
        expiresIn
      };
      
      // Generar URL prefirmada
      const presignedUrlData = await s3Service.generateUploadUrl(params);
      
      structuredLog('info', 'S3Controller.generateUploadUrl', 'URL generada exitosamente');
      
      // Devolver respuesta exitosa
      return createResponse(200, {
        success: true,
        data: presignedUrlData
      }, event);
      
    } catch (error: unknown) {
      structuredLog('error', 'S3Controller.generateUploadUrl', 'Error', { error });
      
      // Determinar el tipo de error para una respuesta apropiada
      if (error.message && (
        error.message.includes('Extensión no permitida') ||
        error.message.includes('Tipo MIME no permitido') ||
        error.message.includes('Tamaño de archivo inválido') ||
        error.message.includes('Tipo de archivo inválido')
      )) {
        return createResponse(400, {
          error: 'Validación fallida',
          details: error.message
        }, event);
      }
      
      // Error general
      return createResponse(500, {
        error: 'Error al generar URL prefirmada',
        details: error.message || 'Error interno del servidor'
      }, event);
    }
  }

  /**
   * Genera una URL prefirmada para descargar un archivo de S3
   * @param event Evento API Gateway
   * @param userId ID del usuario autenticado
   * @returns Respuesta con la URL prefirmada o error
   */
  async generateDownloadUrl(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      structuredLog('info', 'S3Controller.generateDownloadUrl', 'Inicio');
      
      // <<< LEER key DESDE QUERY STRING PARAMETERS >>>
      const key = event.queryStringParameters?.key;
      
      // Verificar que se proporcionó una clave
      if (!key) {
        return createResponse(400, { error: 'Se requiere el parámetro "key" en la query string' }, event);
      }
      
      // Decodificar la clave si viene codificada en la URL
      const decodedKey = decodeURIComponent(key);
      structuredLog('info', 'S3Controller.generateDownloadUrl', 'Key decodificada', { decodedKey });
      
      // Extraer tiempo de expiración (opcional del body o query string? Usaremos body por consistencia)
      let expiresIn: number | undefined;
      if (event.body) {
        try {
          const requestBody = JSON.parse(event.body);
          expiresIn = requestBody.expiresIn;
        } catch (parseError) {
            structuredLog('warn', 'S3Controller.generateDownloadUrl', 'No se pudo parsear el body para expiresIn');
        }
      }
      
      // Generar URL prefirmada para descarga
      const downloadUrl = await s3Service.generateDownloadUrl(decodedKey, expiresIn);
      
      structuredLog('info', 'S3Controller.generateDownloadUrl', 'URL generada exitosamente');
      
      // Devolver respuesta exitosa
      return createResponse(200, {
        success: true,
        data: {
          downloadUrl,
          key: decodedKey,
          expiresAt: Math.floor(Date.now() / 1000) + (expiresIn || 3600)
        }
      }, event);
      
    } catch (error: unknown) {
      structuredLog('error', 'S3Controller.generateDownloadUrl', 'Error', { error });
      // Manejar caso específico si s3Service lanza error por clave no encontrada
      if (error.name === 'NoSuchKey') { 
          return createResponse(404, { error: `No se encontró el archivo con la clave proporcionada.` }, event);
      }
      return createResponse(500, {
        error: 'Error al generar URL prefirmada para descarga',
        details: error.message || 'Error interno del servidor'
      }, event);
    }
  }

  /**
   * Elimina un objeto de S3 directamente (obteniendo key de path param)
   * @param event Evento API Gateway
   * @param _userId ID del usuario autenticado
   * @returns Respuesta de éxito (204 No Content) o error
   */
  async deleteObject(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    structuredLog('info', 'S3Controller.deleteObject', 'Iniciando eliminación', { hasBody: !!event.body });

    let key: string | undefined;
    try {
      // Leer la clave del cuerpo de la solicitud POST
      if (event.body) {
        const body = JSON.parse(event.body);
        key = body.key;
        structuredLog('info', 'S3Controller.deleteObject', 'Key obtenida del body', { key });
      } else {
        structuredLog('warn', 'S3Controller.deleteObject', 'El cuerpo de la solicitud está vacío');
      }

      if (!key) {
        structuredLog('warn', 'S3Controller.deleteObject', 'Falta el parámetro key en el body de la solicitud');
        return createResponse(400, { error: 'Falta el parámetro "key" en el body' }, event);
      }

      // Decodificar la clave si está codificada como URL (aunque viene del body, podría estarlo)
      const decodedKey = decodeURIComponent(key);
      structuredLog('info', 'S3Controller.deleteObject', 'Key decodificada', { decodedKey });

      await s3Service.deleteObject(decodedKey);
      structuredLog('info', 'S3Controller.deleteObject', 'Archivo eliminado exitosamente de S3', { decodedKey });
      return createResponse(200, { message: 'Archivo eliminado exitosamente' }, event);

    } catch (error: unknown) {
      structuredLog('error', 'S3Controller.deleteObject', 'Error al eliminar objeto de S3', { key, error });
      if (error.name === 'NoSuchKey') {
        return createResponse(404, { error: 'El archivo no existe en S3' }, event);
      }
      return createResponse(500, {
        error: 'Error interno del servidor al eliminar el archivo',
        details: error.message,
      }, event);
    }
  }
}

// Crear instancia del controlador
const s3Controller = new S3Controller();

// Definir el mapa de rutas (claves relativas al basePath '/s3')
const routeMap: RouteMap = {
  // Clave relativa: '/upload' corresponde a POST /s3/upload
  '/upload': {
    POST: s3Controller.generateUploadUrl
  },
  // <<< CAMBIAR RUTA PARA DESCARGA >>>
  // Clave relativa: '/download' corresponde a GET /s3/download?key=...
  '/download': { 
    GET: s3Controller.generateDownloadUrl
  },
  // Ruta para eliminar usando POST y la clave en el body
  '/delete-object': {
    POST: s3Controller.deleteObject
  }
};

// Exportar el handler para uso con Lambda
// export const s3Handler = createController(routeMap, {
export const mainHandler = createController(routeMap, {
  basePath: '/s3', // <--- createController usará esto como prefijo
  publicRoutes: [] // Todas las rutas requieren autenticación
});

// Exportar controlador para uso en otros módulos
export default mainHandler;

export const handler = mainHandler;
