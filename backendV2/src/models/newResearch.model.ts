import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { uuidv4 } from '../utils/id-generator';

/**
 * Enum para los tipos de investigación
 */
export enum ResearchType {
  EYE_TRACKING = 'eye-tracking',
  ATTENTION_PREDICTION = 'attention-prediction',
  COGNITIVE_ANALYSIS = 'cognitive-analysis',
  BEHAVIOURAL = 'behavioural'
}

/**
 * Interfaz para una nueva investigación
 */
export interface NewResearch {
  id?: string;
  name: string;
  enterprise: string;
  type: ResearchType;
  technique: string;
  description?: string;
  targetParticipants?: number;
  objectives?: string[];
  tags?: string[];
  status?: string;
}

/**
 * Interfaz para el modelo DynamoDB de una nueva investigación
 */
export interface NewResearchDynamoItem {
  // Clave primaria
  id: string;
  // Clave de ordenación (para posibles consultas)
  sk: string;
  // Usuario que crea la investigación
  userId: string;
  // Datos básicos
  name: string;
  enterprise: string;
  type: string;
  technique: string;
  description: string;
  targetParticipants: number;
  // Arrays serializados
  objectives: string;
  tags: string;
  // Estado inicial
  status: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
  EntityType: string;
}

/**
 * Modelo para manejar las operaciones de nuevas investigaciones en DynamoDB
 */
export class NewResearchModel {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== RESEARCH MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    console.log('Nombre de tabla DynamoDB:', this.tableName);
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    console.log('Configuración DynamoDB:', options);
    console.log('SIEMPRE usando DynamoDB en AWS Cloud - NO LOCAL');
    
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
    console.log('=======================================');
  }

  /**
   * Crea una nueva investigación en DynamoDB
   * @param data Datos del formulario de nueva investigación
   * @param userId ID del usuario que crea la investigación
   * @returns La investigación creada con su ID generado
   */
  async create(data: NewResearch, userId: string): Promise<NewResearch> {
    // Generar ID único para la investigación
    const researchId = uuidv4();
    console.log('ID de investigación generado:', researchId);
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Convertir a formato para DynamoDB
    const item: NewResearchDynamoItem = {
      id: researchId,
      sk: `RESEARCH#${researchId}`,
      userId,
      EntityType: 'RESEARCH',
      name: data.name,
      enterprise: data.enterprise,
      type: data.type,
      technique: data.technique,
      description: data.description || '',
      targetParticipants: data.targetParticipants || 100,
      objectives: JSON.stringify(data.objectives || []),
      tags: JSON.stringify(data.tags || []),
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };

    console.log('Item a insertar en DynamoDB:', JSON.stringify(item));
    console.log('Nombre de la tabla de DynamoDB:', this.tableName);

    // Guardar en DynamoDB
    const params = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      console.log('Intentando guardar en DynamoDB con params:', JSON.stringify(params));
      await this.dynamoClient.send(params);
      console.log('Operación put completada exitosamente');
      
      // Devolver el objeto creado con su ID
      return {
        id: researchId,
        name: data.name,
        enterprise: data.enterprise,
        type: data.type,
        technique: data.technique,
        description: data.description || '',
        targetParticipants: data.targetParticipants || 100,
        objectives: data.objectives || [],
        tags: data.tags || [],
        status: 'draft'
      };
    } catch (error) {
      console.error('Error detallado al crear nueva investigación en DynamoDB:', error);
      throw new Error('Failed to create new research');
    }
  }

  /**
   * Obtiene una investigación por su ID
   * @param id ID de la investigación
   * @returns La investigación encontrada o null
   */
  async getById(id: string): Promise<NewResearch | null> {
    const params = new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `RESEARCH#${id}`
      }
    });

    try {
      const result = await this.dynamoClient.send(params);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as NewResearchDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz NewResearch
      return {
        id: item.id,
        name: item.name,
        enterprise: item.enterprise,
        type: item.type as ResearchType,
        technique: item.technique,
        description: item.description,
        targetParticipants: item.targetParticipants,
        objectives: JSON.parse(item.objectives),
        tags: JSON.parse(item.tags),
        status: item.status
      };
    } catch (error) {
      console.error('Error getting research by ID:', error);
      throw new Error('Failed to get research');
    }
  }

  /**
   * Obtiene todas las investigaciones de un usuario
   * @param userId ID del usuario
   * @returns Lista de investigaciones del usuario
   */
  async getByUserId(userId: string): Promise<NewResearch[]> {
    // Consulta por índice secundario (requerirá crear un GSI en DynamoDB)
    const params = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    try {
      const result = await this.dynamoClient.send(params);
      
      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      // Mapear resultados al formato de la interfaz
      return result.Items.map((item: any) => ({
        id: item.id,
        name: item.name,
        enterprise: item.enterprise,
        type: item.type as ResearchType,
        technique: item.technique,
        description: item.description,
        targetParticipants: item.targetParticipants,
        objectives: JSON.parse(item.objectives),
        tags: JSON.parse(item.tags),
        status: item.status
      }));
    } catch (error) {
      console.error('Error getting researches by user ID:', error);
      throw new Error('Failed to get user researches');
    }
  }

  /**
   * Actualiza una investigación existente
   * @param id ID de la investigación
   * @param data Datos a actualizar
   * @returns Investigación actualizada
   */
  async update(id: string, data: Partial<NewResearch>): Promise<NewResearch> {
    try {
      // Verificar que la investigación existe
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Investigación no encontrada');
      }

      // Fecha actual para updated
      const now = new Date().toISOString();
      
      // Preparar expresiones para actualización
      let updateExpression = 'set updatedAt = :updatedAt';
      const expressionAttributeValues: Record<string, any> = {
        ':updatedAt': now
      };
      
      // Objeto para los nombres de atributos que necesitan alias
      const expressionAttributeNames: Record<string, string> = {};
      
      // Añadir solo los campos que vienen en data
      if (data.name !== undefined) {
        updateExpression += ', #name = :name';
        expressionAttributeValues[':name'] = data.name;
        expressionAttributeNames['#name'] = 'name';
      }
      
      if (data.enterprise !== undefined) {
        updateExpression += ', enterprise = :enterprise';
        expressionAttributeValues[':enterprise'] = data.enterprise;
      }
      
      if (data.type !== undefined) {
        updateExpression += ', #type = :type';
        expressionAttributeValues[':type'] = data.type;
        expressionAttributeNames['#type'] = 'type';
      }
      
      if (data.technique !== undefined) {
        updateExpression += ', technique = :technique';
        expressionAttributeValues[':technique'] = data.technique;
      }
      
      if (data.description !== undefined) {
        updateExpression += ', description = :description';
        expressionAttributeValues[':description'] = data.description || '';
      }
      
      if (data.targetParticipants !== undefined) {
        updateExpression += ', targetParticipants = :targetParticipants';
        expressionAttributeValues[':targetParticipants'] = data.targetParticipants || 100;
      }
      
      if (data.objectives !== undefined) {
        updateExpression += ', objectives = :objectives';
        expressionAttributeValues[':objectives'] = JSON.stringify(data.objectives || []);
      }
      
      if (data.tags !== undefined) {
        updateExpression += ', tags = :tags';
        expressionAttributeValues[':tags'] = JSON.stringify(data.tags || []);
      }

      if (data.status !== undefined) {
        updateExpression += ', #status = :status';
        expressionAttributeValues[':status'] = data.status;
        expressionAttributeNames['#status'] = 'status';
      }
      
      // Parámetros para la actualización
      const commandParams: any = {
        TableName: this.tableName,
        Key: {
          id,
          sk: `RESEARCH#${id}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };
      
      // Solo incluir ExpressionAttributeNames si hay atributos que necesitan alias
      if (Object.keys(expressionAttributeNames).length > 0) {
        commandParams.ExpressionAttributeNames = expressionAttributeNames;
      }
      
      const params = new UpdateCommand(commandParams);
      
      // Ejecutar actualización
      const result = await this.dynamoClient.send(params);
      
      // Convertir resultado a formato de interfaz
      const updated = result.Attributes as NewResearchDynamoItem;
      return {
        id: updated.id,
        name: updated.name,
        enterprise: updated.enterprise,
        type: updated.type as ResearchType,
        technique: updated.technique,
        description: updated.description,
        targetParticipants: updated.targetParticipants,
        objectives: JSON.parse(updated.objectives),
        tags: JSON.parse(updated.tags),
        status: updated.status
      };
    } catch (error) {
      console.error('Error updating research:', error);
      throw new Error('Failed to update research');
    }
  }

  /**
   * Actualiza el estado de una investigación
   * @param id ID de la investigación
   * @param status Nuevo estado
   * @returns Investigación actualizada
   */
  async updateStatus(id: string, status: string): Promise<NewResearch> {
    try {
      // Verificar que la investigación existe
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Investigación no encontrada');
      }
      
      // Actualizar solo el estado
      return await this.update(id, { status });
    } catch (error) {
      console.error('Error updating research status:', error);
      throw new Error('Failed to update research status');
    }
  }

  /**
   * Elimina una investigación por su ID
   * @param id ID de la investigación
   * @returns Confirmación de la eliminación
   */
  async delete(id: string): Promise<void> {
    const params = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `RESEARCH#${id}`
      }
    });

    try {
      await this.dynamoClient.send(params);
    } catch (error) {
      console.error('Error deleting research:', error);
      throw new Error('Failed to delete research');
    }
  }

  /**
   * Verifica si un usuario es propietario de una investigación
   * @param researchId ID de la investigación
   * @param userId ID del usuario
   * @returns true si es propietario, false en caso contrario
   */
  async isOwner(researchId: string, userId: string): Promise<boolean> {
    try {
      // Consulta específica para verificar propiedad
      const params = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: researchId,
          sk: `RESEARCH#${researchId}`
        },
        ProjectionExpression: 'userId'
      });
      
      const result = await this.dynamoClient.send(params);
      
      if (!result.Item) {
        return false;
      }
      
      // Comparar el userId almacenado con el proporcionado
      return result.Item.userId === userId;
    } catch (error) {
      console.error('Error checking research ownership:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las investigaciones
   * @returns Array con todas las investigaciones
   */
  async getAll(): Promise<NewResearch[]> {
    try {
      console.log('Iniciando modelo getAll() usando Query en EntityTypeSkIndex');
      
      const params = {
        TableName: this.tableName,
        IndexName: 'EntityTypeSkIndex',
        KeyConditionExpression: 'EntityType = :type AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':type': 'RESEARCH',
          ':prefix': 'RESEARCH#'
        }
      };

      console.log('Parámetros de QueryCommand:', JSON.stringify(params, null, 2));
      
      const command = new QueryCommand(params);
      const result = await this.dynamoClient.send(command);
      
      console.log(`Query completado. Encontrados: ${result.Items?.length || 0} elementos.`);
      
      if (!result.Items || result.Items.length === 0) {
        console.log('No se encontraron investigaciones');
        return [];
      }

      // Mapear resultados al formato de la interfaz
      return result.Items.map((item: any) => ({
        id: item.id,
        name: item.name,
        enterprise: item.enterprise,
        type: item.type as ResearchType,
        technique: item.technique,
        description: item.description,
        targetParticipants: item.targetParticipants,
        objectives: JSON.parse(item.objectives || '[]'),
        tags: JSON.parse(item.tags || '[]'),
        status: item.status,
        userId: item.userId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error detallado en newResearchModel.getAll:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del modelo
export const newResearchModel = new NewResearchModel(); 