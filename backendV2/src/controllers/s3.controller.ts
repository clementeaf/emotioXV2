import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createController, RouteMap } from '../utils/controller.decorator';
import { createResponse } from '../utils/controller.utils';
import s3Service, { FileType, PresignedUrlParams } from '../services/s3.service';

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
      console.log('S3Controller.generateUploadUrl - Inicio');
      
      // Verificar que haya un cuerpo en la petición
      if (!event.body) {
        return createResponse(400, { error: 'Se requiere un cuerpo en la petición' });
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
        });
      }
      
      // Verificar que fileType sea un valor válido de FileType
      if (!Object.values(FileType).includes(fileType)) {
        return createResponse(400, {
          error: 'Tipo de archivo inválido',
          details: `El tipo ${fileType} no es válido. Debe ser uno de: ${Object.values(FileType).join(', ')}`
        });
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
      
      console.log('S3Controller.generateUploadUrl - URL generada exitosamente');
      
      // Devolver respuesta exitosa
      return createResponse(200, {
        success: true,
        data: presignedUrlData
      });
      
    } catch (error: any) {
      console.error('S3Controller.generateUploadUrl - Error:', error);
      
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
        });
      }
      
      // Error general
      return createResponse(500, {
        error: 'Error al generar URL prefirmada',
        details: error.message || 'Error interno del servidor'
      });
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
      console.log('S3Controller.generateDownloadUrl - Inicio');
      
      // Obtener la clave del objeto desde los parámetros de ruta
      const key = event.pathParameters?.key;
      
      // Verificar que se proporcionó una clave
      if (!key) {
        return createResponse(400, { error: 'Se requiere la clave del objeto (key)' });
      }
      
      // Extraer tiempo de expiración (opcional)
      let expiresIn: number | undefined;
      
      // Verificar si hay un cuerpo en la petición
      if (event.body) {
        const requestBody = JSON.parse(event.body);
        expiresIn = requestBody.expiresIn;
      }
      
      // Generar URL prefirmada para descarga
      const downloadUrl = await s3Service.generateDownloadUrl(key, expiresIn);
      
      console.log('S3Controller.generateDownloadUrl - URL generada exitosamente');
      
      // Devolver respuesta exitosa
      return createResponse(200, {
        success: true,
        data: {
          downloadUrl,
          key,
          expiresAt: Math.floor(Date.now() / 1000) + (expiresIn || 3600)
        }
      });
      
    } catch (error: any) {
      console.error('S3Controller.generateDownloadUrl - Error:', error);
      
      return createResponse(500, {
        error: 'Error al generar URL prefirmada para descarga',
        details: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Elimina un objeto de S3 directamente (obteniendo key de query param)
   * @param event Evento API Gateway
   * @param _userId ID del usuario autenticado
   * @returns Respuesta de éxito (204 No Content) o error
   */
  async deleteObject(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    const operation = 'S3Controller.deleteObject';
    try {
      console.log(`${operation} - Inicio`);

      // Obtener la clave del objeto desde los query string parameters
      const encodedKey = event.queryStringParameters?.key;

      // Verificar que se proporcionó una clave
      if (!encodedKey) {
        console.warn(`${operation} - Falta el query parameter 'key'`);
        return createResponse(400, { error: 'Se requiere el parámetro de consulta \'key\'' });
      }

      // Decodificar la clave de la URL
      let decodedKey: string;
      try {
        decodedKey = decodeURIComponent(encodedKey);
        console.log(`${operation} - Clave decodificada: ${decodedKey}`);
      } catch (decodeError) {
        console.error(`${operation} - Error decodificando la clave: ${encodedKey}`, decodeError);
        return createResponse(400, { error: 'La clave del objeto proporcionada no es válida (error de decodificación)' });
      }

      // Llamar al servicio para eliminar el objeto
      await s3Service.deleteObject(decodedKey);

      console.log(`${operation} - Objeto eliminado exitosamente: ${decodedKey}`);

      // Devolver respuesta exitosa (204 No Content es estándar para DELETE exitoso sin cuerpo)
      return createResponse(204, {}); 

    } catch (error: any) {
      console.error(`${operation} - Error eliminando objeto:`, error);

      // Podríamos añadir manejo específico para errores de S3 si es necesario
      // ej. if (error.name === 'AccessDenied') return createResponse(403, {...})

      // Error general
      return createResponse(500, {
        error: 'Error al eliminar objeto de S3',
        details: error.message || 'Error interno del servidor'
      });
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
  // Clave relativa: '/download/:key' corresponde a GET /s3/download/:key
  '/download/:key': {
    GET: s3Controller.generateDownloadUrl
  },
  // Clave relativa: '/delete' corresponde a DELETE /s3/delete
  '/delete': {
    DELETE: s3Controller.deleteObject
  }
};

// Exportar el handler para uso con Lambda
export const s3Handler = createController(routeMap, {
  basePath: '/s3', // <--- createController usará esto como prefijo
  publicRoutes: [] // Todas las rutas requieren autenticación
});

// Exportar controlador para uso en otros módulos
export default s3Controller; 