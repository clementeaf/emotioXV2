import { v4 as uuidv4 } from 'uuid';
import { getDynamoDBClient } from '../config/aws';
import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Definir localmente las interfaces y valores por defecto
interface WelcomeScreenConfig {
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  metadata?: {
    version?: string;
    lastUpdated?: Date;
    lastModifiedBy?: string;
  };
}

interface WelcomeScreenFormData {
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
}

interface WelcomeScreenRecord extends WelcomeScreenConfig {
  id: string;
  researchId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Valores por defecto
const DEFAULT_WELCOME_SCREEN_CONFIG: WelcomeScreenConfig = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research',
  metadata: {
    version: '1.0.0'
  }
};

/**
 * Servicio para la gestión del Welcome Screen
 */
export class WelcomeScreenService {
  private readonly tableName: string;

  constructor() {
    // Obtener el nombre de la tabla desde las variables de entorno
    this.tableName = process.env.WELCOME_SCREEN_TABLE || 'emotio-x-backend-v2-dev-welcome-screen';
  }

  /**
   * Guardar la configuración del Welcome Screen
   */
  async saveWelcomeScreen(
    researchId: string,
    userId: string,
    data: Partial<WelcomeScreenFormData>
  ): Promise<WelcomeScreenRecord> {
    try {
      const dynamoDb = getDynamoDBClient();
      
      // Verificar si ya existe una configuración para esta investigación
      const existingConfig = await this.getWelcomeScreen(researchId, userId);
      
      // Preparar los datos para guardar
      const timestamp = new Date().toISOString();
      
      let welcomeScreenData: WelcomeScreenRecord;
      
      if (existingConfig) {
        // Actualizar configuración existente
        welcomeScreenData = {
          ...existingConfig,
          ...data,
          updatedAt: new Date(timestamp),
        };
      } else {
        // Crear nueva configuración
        const id = `welcome-screen-${uuidv4()}`;
        
        welcomeScreenData = {
          ...DEFAULT_WELCOME_SCREEN_CONFIG,
          ...data,
          id,
          researchId,
          isEnabled: data.isEnabled ?? DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
          createdAt: new Date(timestamp),
          updatedAt: new Date(timestamp),
        };
      }
      
      // Guardar en DynamoDB
      await dynamoDb.send(
        new PutCommand({
          TableName: this.tableName,
          Item: welcomeScreenData,
        })
      );
      
      return welcomeScreenData;
    } catch (error) {
      console.error('Error saving welcome screen:', error);
      throw error;
    }
  }

  /**
   * Obtener la configuración del Welcome Screen para una investigación
   */
  async getWelcomeScreen(
    researchId: string,
    userId: string
  ): Promise<WelcomeScreenRecord | null> {
    try {
      const dynamoDb = getDynamoDBClient();
      
      // Buscar por el ID de la investigación
      const result = await dynamoDb.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'researchId = :researchId',
          ExpressionAttributeValues: {
            ':researchId': researchId,
          },
          Limit: 1,
        })
      );
      
      // Si no hay resultados, devolver null
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      
      // Devolver el primer resultado
      return result.Items[0] as WelcomeScreenRecord;
    } catch (error) {
      console.error('Error getting welcome screen:', error);
      throw error;
    }
  }
} 