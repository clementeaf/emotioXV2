import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleHttpRequest } from '../httpHandler';
import { LocationTrackingService } from '../services/locationTracking.service';
import { validateLocationData } from '../utils/validation';

export class LocationTrackingController {
  private locationTrackingService: LocationTrackingService;

  constructor() {
    this.locationTrackingService = new LocationTrackingService();
  }

  /**
   * Guardar datos de ubicación del participante
   */
  async saveLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return handleHttpRequest(async () => {
      const body = JSON.parse(event.body || '{}');

      // Validar datos de entrada
      const validationResult = validateLocationData(body);
      if (!validationResult.isValid) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Datos de ubicación inválidos',
            details: validationResult.errors
          })
        };
      }

      const { researchId, location, timestamp } = body;

      // Guardar ubicación en el backend
      const savedLocation = await this.locationTrackingService.saveLocation({
        researchId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        source: location.source,
        timestamp: timestamp || new Date().toISOString()
      });

      console.log('[LocationTrackingController] Ubicación guardada:', {
        researchId,
        locationId: savedLocation.id,
        source: location.source
      });

      return {
        statusCode: 201,
        body: JSON.stringify({
          message: 'Ubicación guardada exitosamente',
          locationId: savedLocation.id
        })
      };
    });
  }

  /**
   * Obtener ubicaciones por researchId
   */
  async getLocationsByResearchId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return handleHttpRequest(async () => {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'researchId es requerido'
          })
        };
      }

      const locations = await this.locationTrackingService.getLocationsByResearchId(researchId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          researchId,
          locations,
          count: locations.length
        })
      };
    });
  }

  /**
   * Obtener estadísticas de ubicación por researchId
   */
  async getLocationStats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return handleHttpRequest(async () => {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'researchId es requerido'
          })
        };
      }

      const stats = await this.locationTrackingService.getLocationStats(researchId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          researchId,
          stats
        })
      };
    });
  }
}
