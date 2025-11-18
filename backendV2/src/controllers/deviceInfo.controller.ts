import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCorsHeaders } from '../middlewares/cors';
import { structuredLog } from '../utils/logging.util';

/**
 * Controlador para obtener información de dispositivo y ubicación
 * Hace proxy de servicios externos para evitar problemas de CORS
 */
export class DeviceInfoController {
  /**
   * Obtiene información de ubicación basada en IP
   * Hace proxy de ipapi.co para evitar problemas de CORS
   */
  async getLocationInfo(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      structuredLog('info', 'DeviceInfoController.getLocationInfo', 'Obteniendo información de ubicación');

      // Obtener IP del cliente desde headers de API Gateway
      const clientIp = event.requestContext?.identity?.sourceIp || 
                      event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      event.headers['X-Forwarded-For']?.split(',')[0]?.trim() ||
                      'unknown';

      structuredLog('info', 'DeviceInfoController.getLocationInfo', 'IP del cliente detectada', { clientIp });

      // Intentar múltiples servicios como fallback
      let locationData = null;
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://api.ipify.org?format=json'
      ];

      for (const serviceUrl of services) {
        try {
          structuredLog('info', 'DeviceInfoController.getLocationInfo', `Intentando servicio: ${serviceUrl}`);
          
          const response = await fetch(serviceUrl, {
            headers: {
              'User-Agent': 'EmotioXV2-Backend/1.0'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();

          // Procesar según el formato del servicio
          if (serviceUrl.includes('ipapi.co')) {
            locationData = {
              ip: data.ip || clientIp,
              country: data.country_name || data.country || 'Unknown',
              city: data.city || 'Unknown',
              region: data.region || data.region_code || null,
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              timezone: data.timezone || null
            };
          } else if (serviceUrl.includes('ip-api.com')) {
            locationData = {
              ip: data.query || clientIp,
              country: data.country || 'Unknown',
              city: data.city || 'Unknown',
              region: data.regionName || data.region || null,
              latitude: data.lat || null,
              longitude: data.lon || null,
              timezone: data.timezone || null
            };
          } else if (serviceUrl.includes('ipify.org')) {
            // ipify solo devuelve IP, necesitamos otro servicio para geolocalización
            const ip = data.ip || clientIp;
            // Intentar obtener geolocalización con otro servicio
            try {
              const geoResponse = await fetch(`https://ip-api.com/json/${ip}`);
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                locationData = {
                  ip: ip,
                  country: geoData.country || 'Unknown',
                  city: geoData.city || 'Unknown',
                  region: geoData.regionName || null,
                  latitude: geoData.lat || null,
                  longitude: geoData.lon || null,
                  timezone: geoData.timezone || null
                };
              }
            } catch {
              // Si falla, al menos devolver la IP
              locationData = {
                ip: ip,
                country: 'Unknown',
                city: 'Unknown',
                region: null,
                latitude: null,
                longitude: null,
                timezone: null
              };
            }
          }

          if (locationData) {
            structuredLog('info', 'DeviceInfoController.getLocationInfo', 'Información de ubicación obtenida exitosamente', {
              service: serviceUrl,
              country: locationData.country,
              city: locationData.city
            });
            break; // Salir del loop si obtuvimos datos
          }
        } catch (error) {
          structuredLog('warn', 'DeviceInfoController.getLocationInfo', `Error con servicio ${serviceUrl}`, { error });
          continue; // Intentar siguiente servicio
        }
      }

      // Si no se pudo obtener información, devolver valores por defecto
      if (!locationData) {
        structuredLog('warn', 'DeviceInfoController.getLocationInfo', 'No se pudo obtener información de ubicación, usando valores por defecto');
        locationData = {
          ip: clientIp,
          country: 'Chile',
          city: 'Valparaíso',
          region: null,
          latitude: null,
          longitude: null,
          timezone: null
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: locationData,
          status: 200
        })
      };
    } catch (error: unknown) {
      structuredLog('error', 'DeviceInfoController.getLocationInfo', 'Error obteniendo información de ubicación', { error });
      
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: 'Error al obtener información de ubicación',
          status: 500,
          data: {
            ip: 'N/A',
            country: 'Chile',
            city: 'Valparaíso',
            region: null,
            latitude: null,
            longitude: null,
            timezone: null
          }
        })
      };
    }
  }
}

// Instancia del controlador
const controller = new DeviceInfoController();

/**
 * Handler principal para las rutas de device info
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: ''
      };
    }

    const path = event.path.toLowerCase();
    const method = event.httpMethod;

    // Enrutar según el método y path
    // El path puede incluir el stage (ej: /dev/device-info/location) o no (ej: /device-info/location)
    const normalizedPath = path.replace(/^\/[^\/]+/, ''); // Remover stage si existe
    if (method === 'GET' && (path === '/device-info/location' || normalizedPath === '/device-info/location' || path.endsWith('/device-info/location'))) {
      return controller.getLocationInfo(event);
    }

    // Ruta no encontrada
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Ruta no encontrada',
        status: 404
      })
    };
  } catch (error: unknown) {
    structuredLog('error', 'DeviceInfoController.mainHandler', 'Error en handler principal', { error });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Error interno del servidor',
        status: 500
      })
    };
  }
};

