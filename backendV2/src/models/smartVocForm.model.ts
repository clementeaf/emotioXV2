import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { SmartVOCFormData, SmartVOCQuestion } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Registro completo de un formulario SmartVOC como se devuelve por la API/servicio
 */
export interface SmartVOCFormRecord extends Omit<SmartVOCFormData, 'questions'> {
  id: string;
  researchId: string;
  questions: SmartVOCQuestion[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interfaz para el item DynamoDB de un formulario SmartVOC
 */
export interface SmartVOCFormDynamoItem {
  // Clave primaria (UUID único)
  id: string;
  // Clave de ordenación (constante para este tipo)
  sk: string;
  // Research ID relacionado (para GSI)
  researchId: string;
  // Preguntas del formulario (serializado a JSON string)
  questions: string;
  // Configuración
  randomizeQuestions: boolean;
  smartVocRequired: boolean;
  // Metadata (serializado a JSON string)
  metadata: string;
  // Fechas
  createdAt: string;
  updatedAt: string;
}

// Exportar la clase directamente en lugar de una instancia
export class SmartVOCFormModel {
  private readonly tableName: string;
  private readonly dynamoClient: DynamoDBDocumentClient;
  private static readonly SORT_KEY_VALUE = 'SMART_VOC_FORM'; // SK constante

  constructor() {
    // Usar consistentemente la variable de entorno y asegurar que no sea undefined
    this.tableName = process.env.DYNAMODB_TABLE!;
    if (!this.tableName) {
      const errorMsg = 'FATAL ERROR: DYNAMODB_TABLE environment variable is not set.';
      console.error(errorMsg);
      throw new Error('Table name environment variable is missing.');
    }
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    console.log(`[SmartVOCFormModel] Initialized for table: ${this.tableName} in region: ${region}`);
  }

  // Función helper para mapear de DynamoItem a Record
  private mapToRecord(item: SmartVOCFormDynamoItem): SmartVOCFormRecord {
    // Asegurarse de que los campos booleanos tengan valores por defecto si son undefined en DynamoDB
    const randomizeQuestions = typeof item.randomizeQuestions === 'boolean' ? item.randomizeQuestions : false;
    const smartVocRequired = typeof item.smartVocRequired === 'boolean' ? item.smartVocRequired : false;
    
    return {
      id: item.id,
      researchId: item.researchId,
      questions: JSON.parse(item.questions || '[]'), // Deserializar
      randomizeQuestions: randomizeQuestions,
      smartVocRequired: smartVocRequired,
      // Recuperar otros campos de SmartVOCFormData aquí si existen en SmartVOCFormDynamoItem
      // Asegurarse que metadata es un objeto válido tras deserializar
      metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : {},
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  /**
   * Crea un nuevo formulario SmartVOC en DynamoDB.
   * @param formData Datos del formulario.
   * @param researchId ID de la investigación asociada.
   * @returns El registro del formulario creado.
   * @throws Error si falla la operación en DynamoDB.
   */
  async create(formData: SmartVOCFormData, researchId: string): Promise<SmartVOCFormRecord> {
    const now = new Date().toISOString();
    const formId = uuidv4(); // Generar ID único aquí

    // Crear el item para DynamoDB
    const item: SmartVOCFormDynamoItem = {
      id: formId,
      sk: SmartVOCFormModel.SORT_KEY_VALUE,
      researchId: researchId,
      // Asegurarse que los campos booleanos y arrays tengan valores por defecto
      questions: JSON.stringify(formData.questions || []), 
      randomizeQuestions: formData.randomizeQuestions ?? false,
      smartVocRequired: formData.smartVocRequired ?? false,
      metadata: JSON.stringify(formData.metadata || { version: '1.0.0', lastUpdated: now, lastModifiedBy: 'system' }),
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
      // Condición para evitar sobrescribir si ya existe (opcional, pero bueno para 'create')
      ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      console.log(`[SmartVOCFormModel.create] Intentando crear item: ${formId}`);
      await this.dynamoClient.send(command);
      console.log(`[SmartVOCFormModel.create] Item creado exitosamente: ${formId}`);
      return this.mapToRecord(item); // Devolver el item mapeado
    } catch (error: any) {
      console.error('[SmartVOCFormModel.create] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      if (error.name === 'ConditionalCheckFailedException') {
          console.error(`[SmartVOCFormModel.create] Error: Ya existe un formulario con ID ${formId}`);
          // Lanzar error con código específico en el mensaje
          throw new Error('SMART_VOC_FORM_ALREADY_EXISTS'); 
      }
      console.error(`[SmartVOCFormModel.create] Error al crear SmartVOCForm (${formId}):`, error.message);
      // Incluir código de error genérico de DB
      throw new Error(`DATABASE_ERROR: Error al crear el formulario SmartVOC - ${error.message}`); 
    }
  }

  /**
   * Obtiene un formulario SmartVOC por su ID único.
   * @param id ID del formulario.
   * @returns El registro del formulario encontrado o null si no existe.
   * @throws Error si falla la operación en DynamoDB.
   */
  async getById(id: string): Promise<SmartVOCFormRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { 
        id: id,
        sk: SmartVOCFormModel.SORT_KEY_VALUE 
      }
    });

    try {
      console.log(`[SmartVOCFormModel.getById] Buscando item: ${id}`);
      const result = await this.dynamoClient.send(command);
      if (!result.Item) {
        console.log(`[SmartVOCFormModel.getById] Item no encontrado: ${id}`);
        return null;
      }
      console.log(`[SmartVOCFormModel.getById] Item encontrado: ${id}`);
      return this.mapToRecord(result.Item as SmartVOCFormDynamoItem);
    } catch (error: any) {
      console.error('[SmartVOCFormModel.getById] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      console.error(`[SmartVOCFormModel.getById] Error al obtener SmartVOCForm por ID ${id}:`, error.message);
       // Incluir código de error genérico de DB
      throw new Error(`DATABASE_ERROR: Error al obtener el formulario SmartVOC por ID - ${error.message}`); 
    }
  }

  /**
   * Obtiene un formulario SmartVOC por el ID de investigación usando GSI.
   * @param researchId ID de la investigación.
   * @returns El registro del formulario encontrado o null si no existe.
   * @throws Error si falla la operación en DynamoDB.
   */
  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'researchId-index',
      KeyConditionExpression: 'researchId = :rid',
      // FilterExpression: 'sk = :skVal', // <-- Sigue comentado
      ExpressionAttributeValues: {
        ':rid': researchId,
        // ':skVal': SmartVOCFormModel.SORT_KEY_VALUE // <-- Sigue comentado
      },
      // Limit: 1 // <-- QUITAMOS EL LÍMITE
    });

    try {
      console.log(`[SmartVOCFormModel.getByResearchId] SUPER_DEBUG: Buscando por researchId: ${researchId} usando índice 'researchId-index' SIN filtro SK y SIN límite`); 
      const result = await this.dynamoClient.send(command);
      
      // Imprimir cuántos items devuelve la consulta SIN límite
      console.log(`[SmartVOCFormModel.getByResearchId] SUPER_DEBUG: Query devolvió ${result.Items?.length ?? 0} items.`);

      if (!result.Items || result.Items.length === 0) {
        console.log(`[SmartVOCFormModel.getByResearchId] SUPER_DEBUG: Ningún item encontrado para researchId: ${researchId} usando índice 'researchId-index' SIN filtro SK y SIN límite`);
        return null;
      }
      
      // Iterar sobre los resultados para encontrar el correcto
      for (const item of result.Items) {
          const dynamoItem = item as SmartVOCFormDynamoItem;
          // Imprimir el SK de cada item encontrado para depurar
          console.log(`[SmartVOCFormModel.getByResearchId] SUPER_DEBUG: Verificando item con SK: ${dynamoItem.sk}`);
          if (dynamoItem.sk === SmartVOCFormModel.SORT_KEY_VALUE) {
              console.log(`[SmartVOCFormModel.getByResearchId] SUPER_DEBUG: Item SMART_VOC_FORM encontrado! ID: ${dynamoItem.id}`);
              return this.mapToRecord(dynamoItem);
          }
      }

      // Si el bucle termina sin encontrarlo
      console.log(`[SmartVOCFormModel.getByResearchId] SUPER_DEBUG: Se encontraron ${result.Items.length} items, pero ninguno tenía SK = SMART_VOC_FORM.`);
      return null;

    } catch (error: any) {
      console.error('[SmartVOCFormModel.getByResearchId] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      console.error(`[SmartVOCFormModel.getByResearchId] Error al obtener SmartVOCForm por researchId ${researchId}:`, error.message);
       if ((error as Error).message?.includes('index')) {
         console.error("Error: Parece que el índice GSI 'researchId-index' no existe o no está configurado correctamente.");
         throw new Error("DATABASE_CONFIG_ERROR: Falta índice para búsqueda por researchId.");
       }
      throw new Error(`DATABASE_ERROR: Error al obtener el formulario SmartVOC por Research ID - ${error.message}`);
    }
  }

  /**
   * Actualiza un formulario SmartVOC existente.
   * @param id ID del formulario a actualizar.
   * @param formData Datos parciales para actualizar.
   * @returns El registro del formulario actualizado.
   * @throws Error si el formulario no se encuentra o falla la operación en DynamoDB.
   */
  async update(id: string, formData: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    const now = new Date().toISOString();
    
    // Nota: La verificación de existencia se hace implícitamente con ConditionExpression abajo
    // Si se quiere un error 404 explícito antes de intentar actualizar, 
    // se podría llamar a this.getById(id) primero, pero aumenta el coste.

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };
    // const expressionAttributeNames: Record<string, string> = {}; // Para atributos con nombres reservados

    // Construir la expresión de actualización dinámicamente
    // Usar Object.entries para manejar cualquier campo de formData
    Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'sk' && key !== 'researchId' && key !== 'createdAt' && key !== 'updatedAt') {
            const attributeKey = `:${key}`;
            updateExpression += `, ${key} = ${attributeKey}`;
            // Serializar si es necesario (questions, metadata)
            if (key === 'questions' || key === 'metadata') {
                expressionAttributeValues[attributeKey] = JSON.stringify(value);
            } else {
                expressionAttributeValues[attributeKey] = value;
            }
        }
    });

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { 
        id: id,
        sk: SmartVOCFormModel.SORT_KEY_VALUE 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      // ConditionExpression para asegurar que el item existe antes de actualizar
      ConditionExpression: 'attribute_exists(id)', 
      ReturnValues: 'ALL_NEW' // Devolver el item completo actualizado
    });

    try {
      console.log(`[SmartVOCFormModel.update] Intentando actualizar item: ${id}`);
      const result = await this.dynamoClient.send(command);
      console.log(`[SmartVOCFormModel.update] Item actualizado exitosamente: ${id}`);
      // Asegurarse que Attributes no sea undefined (aunque con ReturnValues: ALL_NEW debería estar)
      if (!result.Attributes) {
          console.error(`[SmartVOCFormModel.update] La actualización no devolvió atributos para ${id}`);
           // Lanzar error genérico si no hay atributos
          throw new Error('Update operation did not return attributes.');
      }
      return this.mapToRecord(result.Attributes as SmartVOCFormDynamoItem);
    } catch (error: any) {
      console.error('[SmartVOCFormModel.update] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      if (error.name === 'ConditionalCheckFailedException') {
          console.error(`[SmartVOCFormModel.update] Error: No se encontró el formulario con ID ${id} para actualizar.`);
          // Lanzar error con código específico en el mensaje
          throw new Error('SMART_VOC_FORM_NOT_FOUND'); 
      }
      console.error(`[SmartVOCFormModel.update] Error al actualizar SmartVOCForm con ID ${id}:`, error.message);
       // Incluir código de error genérico de DB
      throw new Error(`DATABASE_ERROR: Error al actualizar el formulario SmartVOC - ${error.message}`); 
    }
  }

  /**
   * Elimina un formulario SmartVOC por su ID.
   * @param id ID del formulario a eliminar.
   * @throws Error si falla la operación en DynamoDB.
   */
  async delete(id: string): Promise<void> {
    // Opcional: verificar existencia primero con getById si se quiere devolver error si no existe.
    // La operación Delete es idempotente por defecto si el item no existe.

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { 
        id: id,
        sk: SmartVOCFormModel.SORT_KEY_VALUE 
      }
      // Se podría añadir ConditionExpression: 'attribute_exists(id)' si se quiere error si no existe
    });
    try {
      console.log(`[SmartVOCFormModel.delete] Intentando eliminar item: ${id}`);
      await this.dynamoClient.send(command);
      console.log(`[SmartVOCFormModel.delete] Item eliminado (o no existía): ${id}`);
    } catch (error: any) {
      console.error('[SmartVOCFormModel.delete] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      console.error(`[SmartVOCFormModel.delete] Error al eliminar SmartVOCForm con ID ${id}:`, error.message);
      // Incluir código de error genérico de DB
      throw new Error(`DATABASE_ERROR: Error al eliminar el formulario SmartVOC - ${error.message}`); 
    }
  }

  /**
   * Elimina un formulario SmartVOC por el ID de investigación.
   * Primero busca el formulario por researchId y luego lo elimina.
   * @param researchId ID de la investigación.
   * @returns true si se eliminó exitosamente, false si no se encontró el formulario.
   * @throws Error si falla la operación en DynamoDB.
   */
  async deleteByResearchId(researchId: string): Promise<boolean> {
    try {
      console.log(`[SmartVOCFormModel.deleteByResearchId] Buscando formulario para eliminar por researchId: ${researchId}`);
      
      // Primero obtener el formulario por researchId para conseguir su ID
      const form = await this.getByResearchId(researchId);
      
      if (!form) {
        console.log(`[SmartVOCFormModel.deleteByResearchId] No se encontró formulario SmartVOC para researchId: ${researchId}`);
        return false; // No existe, pero no es un error
      }

      console.log(`[SmartVOCFormModel.deleteByResearchId] Formulario encontrado con ID: ${form.id}, procediendo a eliminar`);
      
      // Eliminar usando el ID del formulario
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { 
          id: form.id,
          sk: SmartVOCFormModel.SORT_KEY_VALUE 
        },
        ConditionExpression: 'attribute_exists(id)' // Asegurar que existe antes de eliminar
      });

      await this.dynamoClient.send(command);
      console.log(`[SmartVOCFormModel.deleteByResearchId] Formulario SmartVOC eliminado exitosamente para researchId: ${researchId}`);
      return true;

    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.warn(`[SmartVOCFormModel.deleteByResearchId] El formulario ya no existe para researchId: ${researchId}`);
        return false; // Ya fue eliminado o no existe
      }
      
      console.error('[SmartVOCFormModel.deleteByResearchId] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      console.error(`[SmartVOCFormModel.deleteByResearchId] Error al eliminar SmartVOCForm para researchId ${researchId}:`, error.message);
      throw new Error(`DATABASE_ERROR: Error al eliminar el formulario SmartVOC por Research ID - ${error.message}`);
    }
  }

  /**
   * Obtiene todos los formularios SmartVOC (operación Scan, usar con precaución).
   * @returns Un array con todos los registros de formularios SmartVOC.
   * @throws Error si falla la operación en DynamoDB.
   */
  async getAll(): Promise<SmartVOCFormRecord[]> {
    console.warn('[SmartVOCFormModel.getAll] Ejecutando Scan para obtener todos los SmartVOC forms. Evitar en producción si es posible.')
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'sk = :skVal',
      ExpressionAttributeValues: { ':skVal': SmartVOCFormModel.SORT_KEY_VALUE }
    });

    try {
      const result = await this.dynamoClient.send(command);
      const items = result.Items || [];
      console.log(`[SmartVOCFormModel.getAll] Scan completado. Items encontrados: ${items.length}`);
      return items.map(item => this.mapToRecord(item as SmartVOCFormDynamoItem));
    } catch (error: any) {
      console.error('[SmartVOCFormModel.getAll] ERROR DETALLADO DynamoDB:', JSON.stringify(error, null, 2));
      console.error('[SmartVOCFormModel.getAll] Error en ScanCommand:', error.message);
      // Incluir código de error genérico de DB
      throw new Error(`DATABASE_ERROR: Error al obtener todos los formularios SmartVOC - ${error.message}`); 
    }
  }
} 