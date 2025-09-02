import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { uuidv4 } from '../utils/id-generator';
import { structuredLog } from '../utils/logging.util';

/**
 * Interfaz para una empresa
 */
export interface Company {
  id?: string;
  name: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interfaz para el modelo DynamoDB de una empresa
 */
export interface CompanyDynamoItem {
  // Clave primaria
  id: string;
  // Clave de ordenación
  sk: string;
  // Usuario que crea la empresa (para tracking)
  userId: string;
  // Datos básicos
  name: string;
  status: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
  EntityType: string;
}

/**
 * Modelo para manejar las operaciones de empresas en DynamoDB
 */
export class CompanyModel {
  private tableName: string;
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    console.log('======== COMPANY MODEL CONSTRUCTOR ========');
    
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
   * Crea una nueva empresa en DynamoDB
   * @param data Datos de la empresa
   * @param userId ID del usuario que crea la empresa
   * @returns La empresa creada con su ID generado
   */
  async create(data: Company, userId: string): Promise<Company> {
    // Generar ID único para la empresa
    const companyId = uuidv4();
    console.log('ID de empresa generado:', companyId);
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Convertir a formato para DynamoDB
    const item: CompanyDynamoItem = {
      id: companyId,
      sk: `COMPANY#${companyId}`,
      userId,
      EntityType: 'COMPANY',
      name: data.name,
      status: data.status || 'active',
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
      console.log('Intentando guardar empresa en DynamoDB con params:', JSON.stringify(params));
      await this.dynamoClient.send(params);
      console.log('Operación put completada exitosamente');
      
      // Devolver el objeto creado con su ID
      return {
        id: companyId,
        name: data.name,
        status: data.status || 'active',
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error detallado al crear empresa en DynamoDB:', error);
      throw new Error('Failed to create company');
    }
  }

  /**
   * Obtiene una empresa por su ID
   * @param id ID de la empresa
   * @returns La empresa encontrada o null
   */
  async getById(id: string): Promise<Company | null> {
    const params = new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `COMPANY#${id}`
      }
    });

    try {
      const result = await this.dynamoClient.send(params);
      
      if (!result.Item) {
        return null;
      }

      const item = result.Item as CompanyDynamoItem;
      
      // Convertir de formato DynamoDB a la interfaz Company
      return {
        id: item.id,
        name: item.name,
        status: item.status as 'active' | 'inactive',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error(`Error getting company by ID ${id}:`, error);
      
      // Si es un error de "resource not found" de DynamoDB, retornar null
      if (error && typeof error === 'object') {
        const errorName = (error as Error & { name?: string }).name;
        const errorMessage = (error as Error).message || '';
        
        if (errorName === 'ResourceNotFoundException' || 
            errorMessage.includes('Requested resource not found') ||
            errorMessage.includes('resource not found')) {
          console.log(`Company table/resource not found for ID ${id}, returning null. Error:`, errorMessage);
          return null;
        }
      }
      
      // Para otros errores de DynamoDB, también logear el detalle pero retornar null
      console.warn(`Company ${id} not found or database error, treating as not found. Error:`, error);
      return null;
    }
  }

  /**
   * Obtiene todas las empresas
   * @returns Lista de todas las empresas
   */
  async getAll(): Promise<Company[]> {
    const context = { functionName: 'CompanyModel.getAll' };
    const contextString = context.functionName;
    structuredLog('info', contextString, 'Iniciando modelo getAll() usando Query en EntityTypeSkIndex');

    const params = {
      TableName: this.tableName,
      IndexName: 'EntityTypeSkIndex',
      KeyConditionExpression: 'EntityType = :type AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':type': 'COMPANY',
        ':prefix': 'COMPANY#'
      }
    };
    structuredLog('info', contextString, 'Parámetros de QueryCommand:', { params });

    try {
      const command = new QueryCommand(params);
      const { Items } = await this.dynamoClient.send(command);
      structuredLog('info', contextString, `Query completado. Encontrados: ${Items?.length ?? 0} elementos.`);
      structuredLog('info', contextString, 'Raw items from DynamoDB:', { items: Items });

      const companies = Items?.map(item => this.mapToEntity(item as Record<string, unknown>)) || [];

      structuredLog('info', contextString, 'Items mapeados justo antes de retornar:', { companies });

      return companies;
    } catch (error: unknown) {
       structuredLog('error', contextString, 'Error al obtener todas las empresas:', { error });
       
       // Si es un error de "resource not found" o índice no existe, retornar array vacío
       if (error && typeof error === 'object') {
         const errorName = (error as Error & { name?: string }).name;
         const errorMessage = (error as Error).message || '';
         
         if (errorName === 'ResourceNotFoundException' || 
             errorMessage.includes('Requested resource not found') ||
             errorMessage.includes('resource not found') ||
             errorMessage.includes('Index not found')) {
           console.warn(`[CompanyModel] Table or EntityTypeSkIndex not found, returning empty array. This is normal for new setup.`);
           return [];
         }
       }
       
       // Para otros errores, también retornar array vacío para no romper la aplicación
       console.warn(`[CompanyModel] Error getting all companies, returning empty array:`, error);
       return [];
    }
  }

  /**
   * Actualiza una empresa existente
   * @param id ID de la empresa
   * @param data Datos a actualizar
   * @returns Empresa actualizada
   */
  async update(id: string, data: Partial<Company>): Promise<Company> {
    try {
      // Verificar que la empresa existe
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Empresa no encontrada');
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
      
      if (data.status !== undefined) {
        updateExpression += ', #status = :status';
        expressionAttributeValues[':status'] = data.status;
        expressionAttributeNames['#status'] = 'status';
      }
      
      // Parámetros para la actualización
      const commandParams = {
        TableName: this.tableName,
        Key: {
          id,
          sk: `COMPANY#${id}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW' as const
      } as UpdateCommandInput;
      
      // Solo incluir ExpressionAttributeNames si hay atributos que necesitan alias
      if (Object.keys(expressionAttributeNames).length > 0) {
        commandParams.ExpressionAttributeNames = expressionAttributeNames;
      }
      
      const params = new UpdateCommand(commandParams);
      
      // Ejecutar actualización
      const result = await this.dynamoClient.send(params);
      
      // Convertir resultado a formato de interfaz
      const updated = result.Attributes as CompanyDynamoItem;
      return {
        id: updated.id,
        name: updated.name,
        status: updated.status as 'active' | 'inactive',
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };
    } catch (error) {
      console.error('Error updating company:', error);
      
      // Si es un error de "resource not found", re-lanzar como error específico
      if (error && typeof error === 'object') {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Requested resource not found') || 
            errorMessage.includes('resource not found')) {
          throw new Error('Empresa no encontrada');
        }
      }
      
      throw new Error('Failed to update company');
    }
  }

  /**
   * Elimina una empresa por su ID
   * @param id ID de la empresa
   * @returns Confirmación de la eliminación
   */
  async delete(id: string): Promise<void> {
    const params = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id,
        sk: `COMPANY#${id}`
      }
    });

    try {
      await this.dynamoClient.send(params);
    } catch (error) {
      console.error('Error deleting company:', error);
      
      // Si es un error de "resource not found", considerar como exitoso (ya estaba eliminado)
      if (error && typeof error === 'object') {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Requested resource not found') || 
            errorMessage.includes('resource not found')) {
          console.warn(`[CompanyModel] Company ${id} not found for deletion, assuming already deleted`);
          return;
        }
      }
      
      throw new Error('Failed to delete company');
    }
  }

  private mapToEntity(item: Record<string, unknown>): Company {
    return {
      id: item.id as string,
      name: item.name as string,
      status: item.status as 'active' | 'inactive',
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string
    };
  }
}

// Exportar una instancia única del modelo
export const companyModel = new CompanyModel();