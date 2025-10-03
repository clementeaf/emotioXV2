import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { uuidv4 } from '../utils/id-generator';
import { structuredLog } from '../utils/logging.util';

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
  companyId: string;
  enterprise?: string;
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
  companyId: string;
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
    structuredLog('info', 'NewResearchModel', '======== RESEARCH MODEL CONSTRUCTOR ========');
    
    // Obtenemos el nombre de la tabla desde variables de entorno o usamos un valor por defecto
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
    structuredLog('info', 'NewResearchModel', 'Nombre de tabla DynamoDB', { tableName: this.tableName });
    
    // Configuración para DynamoDB en AWS Cloud (producción)
    const options = {
      region: process.env.APP_REGION || 'us-east-1'
    };
    
    structuredLog('info', 'NewResearchModel', 'Configuración DynamoDB - SIEMPRE usando AWS Cloud', { options });
    
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
    structuredLog('info', 'NewResearchModel', '=======================================');
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
    structuredLog('info', 'NewResearchModel.create', 'ID de investigación generado', { researchId });
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Convertir a formato para DynamoDB
    const item: NewResearchDynamoItem = {
      id: researchId,
      sk: `RESEARCH#${researchId}`,
      userId,
      EntityType: 'RESEARCH',
      name: data.name,
      companyId: data.companyId,
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

    structuredLog('info', 'NewResearchModel.create', 'Item a insertar en DynamoDB', { item, tableName: this.tableName });

    // Guardar en DynamoDB
    const params = new PutCommand({
      TableName: this.tableName,
      Item: item
    });

    try {
      structuredLog('info', 'NewResearchModel.create', 'Intentando guardar en DynamoDB', { params });
      await this.dynamoClient.send(params);
      structuredLog('info', 'NewResearchModel.create', 'Operación put completada exitosamente');

      // VERIFICACIÓN: Confirmar que la investigación realmente se guardó
      structuredLog('info', 'NewResearchModel.create', 'Verificando que la investigación se guardó correctamente');
      const savedResearch = await this.getById(researchId);

      if (!savedResearch) {
        structuredLog('error', 'NewResearchModel.create', 'FALLO CRÍTICO: La investigación no se encontró después del save', { researchId });
        throw new Error('Critical error: Research was not saved to database despite successful put operation');
      }

      structuredLog('info', 'NewResearchModel.create', 'Verificación exitosa: La investigación se guardó correctamente', { savedResearchId: savedResearch.id });

      // Devolver la investigación tal como se guardó en la base de datos
      return savedResearch;
    } catch (error: unknown) {
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
        companyId: item.companyId,
        type: item.type as ResearchType,
        technique: item.technique,
        description: item.description,
        targetParticipants: item.targetParticipants,
        objectives: JSON.parse(item.objectives),
        tags: JSON.parse(item.tags),
        status: item.status
      };
    } catch (error: unknown) {
      console.error(`Error getting research by ID ${id}:`, error);
      
      // Si es un error de "resource not found" de DynamoDB, retornar null
      if (error && typeof error === 'object') {
        const errorName = (error as Error & { name?: string }).name;
        const errorMessage = (error as Error).message || '';
        
        if (errorName === 'ResourceNotFoundException' || 
            errorMessage.includes('Requested resource not found') ||
            errorMessage.includes('resource not found')) {
          console.log(`Research table/resource not found for ID ${id}, returning null. Error:`, errorMessage);
          return null;
        }
      }
      
      // Para otros errores de DynamoDB, también logear el detalle pero retornar null
      // ya que puede ser que el research simplemente no exista
      console.warn(`Research ${id} not found or database error, treating as not found. Error:`, error);
      return null;
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
      return result.Items.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: item.name as string,
        companyId: item.companyId as string,
        type: item.type as ResearchType,
        technique: item.technique as string,
        description: item.description as string,
        targetParticipants: item.targetParticipants as number,
        objectives: JSON.parse(item.objectives as string),
        tags: JSON.parse(item.tags as string),
        status: item.status as string
      }));
    } catch (error: unknown) {
      console.error(`Error getting researches by user ID ${userId}:`, error);
      
      // Si es un error de "resource not found" o índice no existe, retornar array vacío
      if (error && typeof error === 'object') {
        const errorName = (error as Error & { name?: string }).name;
        const errorMessage = (error as Error).message || '';
        
        if (errorName === 'ResourceNotFoundException' || 
            errorMessage.includes('Requested resource not found') ||
            errorMessage.includes('resource not found') ||
            errorMessage.includes('Index not found')) {
          console.warn(`[NewResearchModel] Table or index not found for user ${userId}, returning empty array. This is normal for new setup.`);
          return [];
        }
      }
      
      // Para otros errores, también retornar array vacío para no romper la aplicación
      console.warn(`[NewResearchModel] Error getting user researches, returning empty array:`, error);
      return [];
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
      const expressionAttributeValues: Record<string, unknown> = {
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
      
      if (data.companyId !== undefined) {
        updateExpression += ', companyId = :companyId';
        expressionAttributeValues[':companyId'] = data.companyId;
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
      const commandParams: UpdateCommandInput = {
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
        companyId: updated.companyId,
        type: updated.type as ResearchType,
        technique: updated.technique,
        description: updated.description,
        targetParticipants: updated.targetParticipants,
        objectives: JSON.parse(updated.objectives),
        tags: JSON.parse(updated.tags),
        status: updated.status
      };
    } catch (error: unknown) {
      console.error('Error updating research:', error);
      
      // Si es un error de "resource not found", re-lanzar como error específico
      if (error && typeof error === 'object') {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Requested resource not found') || 
            errorMessage.includes('resource not found')) {
          throw new Error('Investigación no encontrada');
        }
      }
      
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error deleting research:', error);
      
      // Si es un error de "resource not found", considerar como exitoso (ya estaba eliminado)
      if (error && typeof error === 'object') {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Requested resource not found') || 
            errorMessage.includes('resource not found')) {
          console.warn(`[NewResearchModel] Research ${id} not found for deletion, assuming already deleted`);
          return;
        }
      }
      
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
    } catch (error: unknown) {
      console.error('Error checking research ownership:', error);
      
      // Si es un error de "resource not found", retornar false (no es propietario)
      if (error && typeof error === 'object') {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Requested resource not found') || 
            errorMessage.includes('resource not found')) {
          console.warn(`[NewResearchModel] Research ${researchId} not found for ownership check, assuming not owner`);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Obtiene todas las investigaciones
   * @returns Lista de todas las investigaciones
   */
  async getAll(): Promise<NewResearch[]> {
    const context = { functionName: 'NewResearchModel.getAll' };
    const contextString = context.functionName; // Extract string context
    structuredLog('info', contextString, 'Iniciando modelo getAll() usando Query en EntityTypeSkIndex');

    const params = {
      TableName: this.tableName,
      IndexName: 'EntityTypeSkIndex',
      KeyConditionExpression: 'EntityType = :type AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':type': 'RESEARCH',
        ':prefix': 'RESEARCH#'
      }
    };
    structuredLog('info', contextString, 'Parámetros de QueryCommand:', { params });

    try {
      const command = new QueryCommand(params);
      const { Items } = await this.dynamoClient.send(command);
      structuredLog('info', contextString, `Query completado. Encontrados: ${Items?.length ?? 0} elementos.`);
      structuredLog('info', contextString, 'Raw items from DynamoDB:', { items: Items });

      const researches = Items?.map(item => this.mapToEntity(item as unknown as NewResearch)) || [];

      structuredLog('info', contextString, 'Items mapeados justo antes de retornar:', { researches });

      return researches;
    } catch (error: unknown) {
       structuredLog('error', contextString, 'Error al obtener todas las investigaciones:', { error });
       
       // Si es un error de "resource not found" o índice no existe, retornar array vacío
       if (error && typeof error === 'object') {
         const errorName = (error as Error & { name?: string }).name;
         const errorMessage = (error as Error).message || '';
         
         if (errorName === 'ResourceNotFoundException' || 
             errorMessage.includes('Requested resource not found') ||
             errorMessage.includes('resource not found') ||
             errorMessage.includes('Index not found')) {
           console.warn(`[NewResearchModel] Table or EntityTypeSkIndex not found, returning empty array. This is normal for new setup.`);
           return [];
         }
       }
       
       // Para otros errores, también retornar array vacío para no romper la aplicación
       console.warn(`[NewResearchModel] Error getting all researches, returning empty array:`, error);
       return [];
    }
  }

  /**
   * Obtiene todas las investigaciones de un usuario específico
   * @param userId ID del usuario
   * @returns Lista de investigaciones del usuario
   */
  async getAllByUserId(userId: string): Promise<NewResearch[]> {
    const context = { functionName: 'NewResearchModel.getAllByUserId' };
    const contextString = context.functionName;
    structuredLog('info', contextString, 'Iniciando consulta por userId usando userId-index', { userId });

    const params = {
      TableName: this.tableName,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    structuredLog('info', contextString, 'Parámetros de QueryCommand:', { params });

    try {
      const command = new QueryCommand(params);
      const { Items } = await this.dynamoClient.send(command);
      structuredLog('info', contextString, `Query completado. Encontrados: ${Items?.length ?? 0} elementos para userId: ${userId}`);
      structuredLog('info', contextString, 'Raw items from DynamoDB:', { items: Items });

      // Filtrar solo los items que son de tipo RESEARCH
      const researchItems = Items?.filter(item => {
        const dynamoItem = item as Record<string, unknown>;
        return dynamoItem.EntityType === 'RESEARCH';
      }) || [];

      const researches = researchItems.map(item => this.mapToEntity(item as unknown as NewResearch));

      structuredLog('info', contextString, 'Items filtrados y mapeados:', { researches });

      return researches;
    } catch (error: unknown) {
       structuredLog('error', contextString, 'Error al obtener investigaciones por userId:', { error, userId });
       
       // Si es un error de "resource not found" o índice no existe, retornar array vacío
       if (error && typeof error === 'object') {
         const errorName = (error as Error & { name?: string }).name;
         const errorMessage = (error as Error).message || '';
         
         if (errorName === 'ResourceNotFoundException' || 
             errorMessage.includes('Requested resource not found') ||
             errorMessage.includes('resource not found') ||
             errorMessage.includes('Index not found')) {
           console.warn(`[NewResearchModel] Table or userId-index not found, returning empty array. This is normal for new setup.`);
           return [];
         }
       }
       
       // Para otros errores, también retornar array vacío para no romper la aplicación
       console.warn(`[NewResearchModel] Error getting researches by userId, returning empty array:`, error);
       return [];
    }
  }

  private mapToEntity(item: unknown): NewResearch {
    // Implement the logic to map a DynamoDB item to a NewResearch object
    // This is a placeholder and should be replaced with the actual implementation
    const dynamoItem = item as NewResearchDynamoItem;
    return {
      id: dynamoItem.id,
      name: dynamoItem.name,
      companyId: dynamoItem.companyId,
      type: dynamoItem.type as ResearchType,
      technique: dynamoItem.technique,
      description: dynamoItem.description,
      targetParticipants: dynamoItem.targetParticipants,
      objectives: JSON.parse(dynamoItem.objectives),
      tags: JSON.parse(dynamoItem.tags),
      status: dynamoItem.status
    };
  }
}

// Exportar una instancia única del modelo
export const newResearchModel = new NewResearchModel(); 