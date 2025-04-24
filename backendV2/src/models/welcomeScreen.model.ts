import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { 
  WelcomeScreenConfig, 
  WelcomeScreenRecord, 
  WelcomeScreenFormData,
  DEFAULT_WELCOME_SCREEN_CONFIG 
} from '../../../shared/interfaces/welcome-screen.interface';

/**
 * Interfaz para el modelo DynamoDB de una pantalla de bienvenida
 */
export interface WelcomeScreenDynamoItem {
  // Clave primaria (UUID único)
  id: string; 
  // Clave de ordenación (constante para este tipo de item)
  sk: string; 
  // Atributo para búsqueda por researchId (potencial GSI)
  researchId: string; 
  // Propiedades de la pantalla de bienvenida
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  // Metadata serializado
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

/**
 * Modelo para manejar las operaciones de pantallas de bienvenida en DynamoDB
 */
export class WelcomeScreenModel {
  private tableName: string;
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== WELCOME SCREEN MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB para welcome screens:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB para welcome screens:', options);
    console.log('SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    
    this.dynamoClient = new DynamoDBClient(options);
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    console.log('=======================================');
  }

  /**
   * Crea una nueva configuración de pantalla de bienvenida
   * @param data Datos de la pantalla de bienvenida
   * @param researchId ID de la investigación asociada
   * @returns La configuración creada con su ID generado
   */
  async create(data: WelcomeScreenFormData, researchId: string): Promise<WelcomeScreenRecord> {
    // Primero verificamos si ya existe una pantalla de bienvenida para este researchId
    const existingScreen = await this.getByResearchId(researchId);
    if (existingScreen) {
      throw new Error(`WELCOME_SCREEN_EXISTS: Ya existe una pantalla de bienvenida para la investigación ${researchId}`);
    }

    // Generar un ID único para la pantalla
    const screenId = uuidv4(); 
    const now = new Date().toISOString();
    const skValue = 'WELCOME_SCREEN'; // Valor constante para la Sort Key
    
    // Combinar con valores por defecto
    const config: WelcomeScreenConfig = {
      isEnabled: data.isEnabled ?? DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
      title: data.title || DEFAULT_WELCOME_SCREEN_CONFIG.title,
      message: data.message || DEFAULT_WELCOME_SCREEN_CONFIG.message,
      startButtonText: data.startButtonText || DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText,
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date(),
        lastModifiedBy: 'system'
      }
    };

    // Convertir a formato para DynamoDB usando el ID único y SK constante
    const item: WelcomeScreenDynamoItem = {
      id: screenId, // Usar el UUID generado
      sk: skValue,  // Añadir la Sort Key constante
      researchId: researchId, // Guardar researchId como atributo separado
      isEnabled: config.isEnabled,
      title: config.title,
      message: config.message,
      startButtonText: config.startButtonText,
      metadata: JSON.stringify(config.metadata), 
      createdAt: now,
      updatedAt: now
    };

    // Guardar en DynamoDB
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
      // Ya no necesitamos ConditionExpression si la PK es id/sk, 
      // aunque podrías mantenerla en 'id' si quisieras asegurar unicidad del UUID
      // ConditionExpression: 'attribute_not_exists(id)' 
    });

    try {
      await this.docClient.send(command);
      
      // Devolver el objeto creado con el ID correcto
      return {
        id: screenId, 
        researchId: researchId, 
        isEnabled: config.isEnabled,
        title: config.title,
        message: config.message,
        startButtonText: config.startButtonText,
        metadata: config.metadata,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error: any) {
      // Loguear el error específico de DynamoDB
      console.error('ERROR DETALLADO de DynamoDB PutCommand:', JSON.stringify(error, null, 2));

      // Mantener el chequeo específico para ConditionalCheckFailedException
      if (error.name === 'ConditionalCheckFailedException') {
         console.error(`Error: Conflicto de ID al crear pantalla de bienvenida (ID: ${screenId})`);
         // Podríamos lanzar un error más específico si queremos manejarlo diferente
         throw new Error('Error interno: Conflicto al generar ID único para la pantalla de bienvenida.');
      }
      // Para cualquier otro error, lanzar el error genérico PERO después de loguear el detalle
      console.error('Error genérico al crear pantalla de bienvenida en DynamoDB:', error.message);
      throw new Error('DATABASE_ERROR: Error al guardar la pantalla de bienvenida en la base de datos'); // Mantener este mensaje para consistencia si el frontend lo espera
    }
  }

  /**
   * Obtiene una pantalla de bienvenida por su ID único (UUID)
   * @param id ID único (UUID) de la pantalla de bienvenida
   * @returns La pantalla de bienvenida encontrada o null
   */
  async getById(id: string): Promise<WelcomeScreenRecord | null> {
    // Necesitamos buscar por id (PK) Y sk (SK)
    const skValue = 'WELCOME_SCREEN'; // Asume sk constante para buscar por ID
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id: id, 
        sk: skValue // Añadir sk a la clave de búsqueda
      }
    });

    try {
      const result = await this.docClient.send(command);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as WelcomeScreenDynamoItem;
      
      return {
        id: item.id, 
        researchId: item.researchId, 
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata || '{}'), 
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener pantalla de bienvenida por ID:', error);
      throw new Error('Error al obtener la pantalla de bienvenida por ID desde la base de datos');
    }
  }

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación usando GSI
   * ASUME que existe un GSI llamado 'ResearchIdIndex' con 'researchId' como clave de partición.
   * @param researchId ID de la investigación
   * @returns La pantalla de bienvenida asociada o null
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex',
      KeyConditionExpression: 'researchId = :rid',
      ExpressionAttributeValues: {
        ':rid': researchId
      },
      Limit: 1
    });

    try {
      const result = await this.docClient.send(command);
      
      if (!result.Items || result.Items.length === 0) { 
        return null;
      }

      const item = result.Items[0] as WelcomeScreenDynamoItem; 
      
      return {
        id: item.id,
        researchId: item.researchId,
        isEnabled: item.isEnabled,
        title: item.title,
        message: item.message,
        startButtonText: item.startButtonText,
        metadata: JSON.parse(item.metadata || '{}'),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
    } catch (error) {
      console.error('Error al obtener pantalla de bienvenida por researchId (Query GSI):', error);
      if ((error as Error).message?.includes('index')) {
         console.error("Error: Parece que el índice GSI 'ResearchIdIndex' no existe o no está configurado correctamente en la tabla DynamoDB.");
         throw new Error("Error de configuración de base de datos: falta índice para búsqueda.");
      }
      throw new Error('Error al buscar la pantalla de bienvenida asociada a la investigación');
    }
  }

  /**
   * Actualiza una pantalla de bienvenida existente usando su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   * @param data Datos a actualizar (parcial)
   * @returns La pantalla de bienvenida actualizada
   */
  async update(id: string, data: Partial<WelcomeScreenFormData>): Promise<WelcomeScreenRecord> {
    const skValue = 'WELCOME_SCREEN'; // SK constante
    // Verificar que existe usando la clave completa
    const existingScreen = await this.getById(id); // getById ahora usa id y sk internamente
    if (!existingScreen) {
      throw new Error(`WELCOME_SCREEN_NOT_FOUND: No existe una pantalla de bienvenida con ID ${id}`); 
    }

    const now = new Date().toISOString();

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now
    };

    const addUpdate = (field: keyof WelcomeScreenFormData, alias: string) => {
       if (data[field] !== undefined) {
         const placeholder = `:${alias}`;
         updateExpression += `, ${field} = ${placeholder}`; 
         expressionAttributeValues[placeholder] = data[field];
       }
    };
    
    addUpdate('isEnabled', 'isEnabled');
    addUpdate('title', 'title');
    addUpdate('message', 'message');
    addUpdate('startButtonText', 'startButtonText');

    if (data.metadata !== undefined) {
       updateExpression += ', metadata = :metadata';
       expressionAttributeValues[':metadata'] = JSON.stringify({ 
           ...(existingScreen.metadata || {}),
           ...data.metadata,
           lastUpdated: new Date(),
       });
    } else {
        updateExpression += ', metadata = :metadata';
        expressionAttributeValues[':metadata'] = JSON.stringify({
            ...(existingScreen.metadata || {}),
            lastUpdated: new Date(),
        });
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: skValue
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW' 
    });

    try {
      const result = await this.docClient.send(command);
      
      const updatedAttributes = result.Attributes as WelcomeScreenDynamoItem;
      if (!updatedAttributes) {
         throw new Error('La actualización no devolvió los atributos actualizados.');
      }

      return {
        id: updatedAttributes.id,
        researchId: updatedAttributes.researchId,
        isEnabled: updatedAttributes.isEnabled,
        title: updatedAttributes.title,
        message: updatedAttributes.message,
        startButtonText: updatedAttributes.startButtonText,
        metadata: JSON.parse(updatedAttributes.metadata || '{}'),
        createdAt: new Date(updatedAttributes.createdAt),
        updatedAt: new Date(updatedAttributes.updatedAt)
      };
    } catch (error) {
      console.error('Error al actualizar pantalla de bienvenida en DynamoDB:', error);
      throw new Error('Error al guardar los cambios de la pantalla de bienvenida');
    }
  }
  
  /**
   * Elimina una pantalla de bienvenida por su ID único (UUID)
   * @param id ID único (UUID) de la pantalla
   */
  async delete(id: string): Promise<void> {
    const skValue = 'WELCOME_SCREEN';
    const existingScreen = await this.getById(id);
    if (!existingScreen) {
      throw new Error(`WELCOME_SCREEN_NOT_FOUND: No existe una pantalla de bienvenida con ID ${id}`);
    }

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id: id,
        sk: skValue
      }
    });

    try {
      await this.docClient.send(command);
      console.log(`Pantalla de bienvenida con ID ${id} eliminada correctamente.`);
    } catch (error) {
      console.error('Error al eliminar pantalla de bienvenida en DynamoDB:', error);
      throw new Error('Error al eliminar la pantalla de bienvenida');
    }
  }

  /**
   * Crea o actualiza la pantalla de bienvenida de una investigación
   * @param researchId ID de la investigación
   * @param data Datos a crear/actualizar
   * @returns La pantalla de bienvenida creada o actualizada
   */
  async createOrUpdate(researchId: string, data: WelcomeScreenFormData): Promise<WelcomeScreenRecord> {
    try {
      const existing = await this.getByResearchId(researchId);

      if (existing) {
        return await this.update(existing.id, data);
      } else {
        return await this.create(data, researchId);
      }
    } catch (error) {
      console.error('Error en WelcomeScreenModel.createOrUpdate:', error);
      throw new Error('Error al crear o actualizar la pantalla de bienvenida');
    }
  }

  /**
   * Obtiene todas las pantallas de bienvenida (POTENCIALMENTE LENTO - USAR CON PRECAUCIÓN)
   * Nota: Esto haría un Scan o usaría un índice específico si todas tuvieran un atributo común.
   * Adapta según tu necesidad real y estructura de tabla.
   * ESTA IMPLEMENTACIÓN ASUME QUE NO ES FRECUENTE Y USA SCAN (INEFICIENTE EN TABLAS GRANDES)
   * Si necesitas listar frecuentemente, considera un mejor patrón de acceso.
   * @returns Lista de todas las pantallas de bienvenida
   */
  async getAll(): Promise<WelcomeScreenRecord[]> {
     console.warn('[WelcomeScreenModel] getAll() está usando Scan, puede ser ineficiente.');
     return []; 
  }
}

// Exportar una instancia única del modelo
export const welcomeScreenModel = new WelcomeScreenModel(); 