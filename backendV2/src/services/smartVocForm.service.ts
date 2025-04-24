import { smartVocFormModel, SmartVOCFormRecord } from '../models/smartVocForm.model';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
// import { BaseService } from './base.service'; // Remove unavailable import
import { PutCommand, QueryCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'; // Add DynamoDBDocumentClient
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'; // Add DynamoDBClient
import { v4 as uuidv4 } from 'uuid';

/**
 * Clase que proporciona servicios para gestionar formularios SmartVOC
 */
// export class SmartVOCFormService extends BaseService<SmartVOCFormData> { // Remove extends
export class SmartVOCFormService {
  private readonly tableName = process.env.SMART_VOC_FORM_TABLE_NAME;
  // Explicitly define and initialize dynamoDBClient
  protected dynamoDBClient: DynamoDBDocumentClient;

  constructor() {
    // super(); // Remove super call
    if (!this.tableName) {
      throw new Error('La variable de entorno SMART_VOC_FORM_TABLE_NAME no está definida');
    }
    // Initialize the DynamoDB client
    const client = new DynamoDBClient({}); 
    this.dynamoDBClient = DynamoDBDocumentClient.from(client);
  }

  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    console.log(`[SmartVOCFormService.getByResearchId] Buscando por researchId: ${researchId}`);
    const params = {
      TableName: this.tableName,
      IndexName: 'ResearchIdIndex', // Asume que existe un GSI llamado 'ResearchIdIndex'
      KeyConditionExpression: 'researchId = :researchId',
      ExpressionAttributeValues: {
        ':researchId': researchId
      }
    };

    try {
      console.log('[SmartVOCFormService.getByResearchId] Enviando QueryCommand a DynamoDB con params:', JSON.stringify(params, null, 2));
      const { Items } = await this.dynamoDBClient.send(new QueryCommand(params));
      console.log(`[SmartVOCFormService.getByResearchId] QueryCommand completado. Items encontrados: ${Items?.length ?? 0}`);
      
      if (Items && Items.length > 0) {
        // Asumimos que solo debe haber uno por researchId
        const result = Items[0] as SmartVOCFormRecord;
        console.log('[SmartVOCFormService.getByResearchId] Devolviendo resultado:', JSON.stringify(result, null, 2));
        return result;
      }
      console.log('[SmartVOCFormService.getByResearchId] No se encontraron items. Devolviendo null.');
      return null;
    } catch (error) {
      console.error('[SmartVOCFormService.getByResearchId] Error en QueryCommand:', error);
      throw new Error('Error al obtener el formulario SmartVOC por researchId desde DynamoDB');
    }
  }

  async getById(id: string): Promise<SmartVOCFormRecord | null> {
    return await smartVocFormModel.getById(id);
  }

  /**
   * Crea un nuevo registro SmartVOCFormData
   * @param formData Datos a crear
   * @returns El registro creado
   */
  async create(formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    console.log('[SmartVOCFormService.create] Datos recibidos:', JSON.stringify(formData, null, 2));
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const itemToCreate = {
      id,
      ...formData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params = {
      TableName: this.tableName,
      Item: itemToCreate
    };

    try {
      console.log('[SmartVOCFormService.create] Enviando PutCommand a DynamoDB con params:', JSON.stringify(params, null, 2));
      await this.dynamoDBClient.send(new PutCommand(params));
      console.log('[SmartVOCFormService.create] PutCommand exitoso. Devolviendo:', JSON.stringify(itemToCreate, null, 2));
      return itemToCreate;
    } catch (error) {
      console.error('[SmartVOCFormService.create] Error en PutCommand:', error);
      throw new Error('Error al crear el formulario SmartVOC en DynamoDB');
    }
  }

  async update(id: string, formData: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    return await smartVocFormModel.update(id, formData);
  }

  async createOrUpdate(researchId: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    const existingForm = await this.getByResearchId(researchId);
    if (existingForm) {
      return await smartVocFormModel.update(existingForm.id, formData);
    } else {
      return await smartVocFormModel.create(formData, researchId);
    }
  }

  async delete(researchId: string): Promise<void> {
    const existingForm = await this.getByResearchId(researchId);
    if (!existingForm) {
      throw new Error('SmartVOC form not found to delete.');
    }
    await smartVocFormModel.delete(existingForm.id);
  }

  async getAll(): Promise<SmartVOCFormRecord[]> {
    return await smartVocFormModel.getAll();
  }
}

export default new SmartVOCFormService(); 