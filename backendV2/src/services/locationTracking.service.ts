import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

interface LocationData {
  researchId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps' | 'ip';
  timestamp: string;
}

interface LocationRecord extends LocationData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface LocationStats {
  totalLocations: number;
  gpsCount: number;
  ipCount: number;
  averageAccuracy?: number;
  countries: string[];
  cities: string[];
}

export class LocationTrackingService {
  private dynamodb: DynamoDB.DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.tableName = process.env.LOCATION_TRACKING_TABLE || 'location-tracking-table';
  }

  /**
   * Guardar ubicación del participante
   */
  async saveLocation(locationData: LocationData): Promise<LocationRecord> {
    const timestamp = new Date().toISOString();
    const locationRecord: LocationRecord = {
      id: uuidv4(),
      ...locationData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: locationRecord
    };

    try {
      await this.dynamodb.put(params).promise();

      console.log('[LocationTrackingService] Ubicación guardada:', {
        id: locationRecord.id,
        researchId: locationRecord.researchId,
        source: locationRecord.source
      });

      return locationRecord;
    } catch (error) {
      console.error('[LocationTrackingService] Error guardando ubicación:', error);
      throw new Error('Error guardando ubicación en la base de datos');
    }
  }

  /**
   * Obtener ubicaciones por researchId
   */
  async getLocationsByResearchId(researchId: string): Promise<LocationRecord[]> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex',
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    };

    try {
      const result = await this.dynamodb.query(params).promise();

      console.log('[LocationTrackingService] Ubicaciones obtenidas:', {
        researchId,
        count: result.Items?.length || 0
      });

      return (result.Items || []) as LocationRecord[];
    } catch (error) {
      console.error('[LocationTrackingService] Error obteniendo ubicaciones:', error);
      throw new Error('Error obteniendo ubicaciones de la base de datos');
    }
  }

  /**
   * Obtener estadísticas de ubicación por researchId
   */
  async getLocationStats(researchId: string): Promise<LocationStats> {
    const locations = await this.getLocationsByResearchId(researchId);

    const stats: LocationStats = {
      totalLocations: locations.length,
      gpsCount: locations.filter(loc => loc.source === 'gps').length,
      ipCount: locations.filter(loc => loc.source === 'ip').length,
      countries: [],
      cities: []
    };

    // Calcular precisión promedio solo para GPS
    const gpsLocations = locations.filter(loc => loc.source === 'gps' && loc.accuracy);
    if (gpsLocations.length > 0) {
      const totalAccuracy = gpsLocations.reduce((sum, loc) => sum + (loc.accuracy || 0), 0);
      stats.averageAccuracy = totalAccuracy / gpsLocations.length;
    }

    console.log('[LocationTrackingService] Estadísticas calculadas:', {
      researchId,
      stats
    });

    return stats;
  }

  /**
   * Eliminar ubicaciones por researchId
   */
  async deleteLocationsByResearchId(researchId: string): Promise<void> {
    const locations = await this.getLocationsByResearchId(researchId);

    const deletePromises = locations.map(location => {
      const params: DynamoDB.DocumentClient.DeleteItemInput = {
        TableName: this.tableName,
        Key: {
          id: location.id
        }
      };
      return this.dynamodb.delete(params).promise();
    });

    try {
      await Promise.all(deletePromises);

      console.log('[LocationTrackingService] Ubicaciones eliminadas:', {
        researchId,
        count: locations.length
      });
    } catch (error) {
      console.error('[LocationTrackingService] Error eliminando ubicaciones:', error);
      throw new Error('Error eliminando ubicaciones de la base de datos');
    }
  }
}
