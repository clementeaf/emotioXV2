import { 
  DynamoDBClient, 
  CreateTableCommand, 
  DescribeTableCommand,
  UpdateTableCommand,
  ResourceNotFoundException,
  TableStatus,
  ScalarAttributeType,
  KeyType,
  ProjectionType,
  BillingMode
} from '@aws-sdk/client-dynamodb';

/**
 * Configuración automática de tablas DynamoDB con GSI necesarios
 */
export class DynamoDBSetup {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({
      // AWS_REGION es automáticamente proporcionada por Lambda
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
    });
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table-dev';
  }

  /**
   * Inicializa todas las tablas necesarias
   */
  async initializeTables(): Promise<void> {
    console.log('🚀 Iniciando configuración de DynamoDB...');
    
    try {
      await this.createMainTable();
      console.log('✅ Configuración de DynamoDB completada');
    } catch (error) {
      console.error('❌ Error configurando DynamoDB:', error);
      throw error;
    }
  }

  /**
   * Crea la tabla principal con todos los GSI necesarios
   */
  private async createMainTable(): Promise<void> {
    try {
      // Verificar si la tabla ya existe
      await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
      console.log(`📋 Tabla ${this.tableName} ya existe`);
      
      // Verificar y crear GSI faltantes
      await this.ensureGSIExists();
      return;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        console.log(`📋 Creando tabla ${this.tableName}...`);
      } else {
        throw error;
      }
    }

    const createTableParams = {
      TableName: this.tableName,
      KeySchema: [
        { AttributeName: 'id', KeyType: KeyType.HASH },
        { AttributeName: 'sk', KeyType: KeyType.RANGE }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
        { AttributeName: 'sk', AttributeType: ScalarAttributeType.S },
        { AttributeName: 'userId', AttributeType: ScalarAttributeType.S },
        { AttributeName: 'EntityType', AttributeType: ScalarAttributeType.S },
        { AttributeName: 'researchId', AttributeType: ScalarAttributeType.S },
        { AttributeName: 'participantId', AttributeType: ScalarAttributeType.S }
      ],
      GlobalSecondaryIndexes: [
        // GSI para obtener researches por usuario
        {
          IndexName: 'userId-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: KeyType.HASH },
            { AttributeName: 'sk', KeyType: KeyType.RANGE }
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        // GSI para obtener todos los researches por tipo de entidad
        {
          IndexName: 'EntityTypeSkIndex',
          KeySchema: [
            { AttributeName: 'EntityType', KeyType: KeyType.HASH },
            { AttributeName: 'sk', KeyType: KeyType.RANGE }
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        // GSI para obtener datos por researchId (usado por otros módulos)
        {
          IndexName: 'researchId-index',
          KeySchema: [
            { AttributeName: 'researchId', KeyType: KeyType.HASH },
            { AttributeName: 'sk', KeyType: KeyType.RANGE }
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        // GSI para module responses por research y participante
        {
          IndexName: 'ResearchIndex',
          KeySchema: [
            { AttributeName: 'researchId', KeyType: KeyType.HASH },
            { AttributeName: 'participantId', KeyType: KeyType.RANGE }
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        // GSI para buscar por research y participante específico
        {
          IndexName: 'ResearchParticipantIndex',
          KeySchema: [
            { AttributeName: 'researchId', KeyType: KeyType.HASH },
            { AttributeName: 'participantId', KeyType: KeyType.RANGE }
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      BillingMode: BillingMode.PROVISIONED,
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    };

    try {
      await this.client.send(new CreateTableCommand(createTableParams));
      console.log(`✅ Tabla ${this.tableName} creada exitosamente`);
      
      // Esperar a que la tabla esté activa
      await this.waitForTableActive();
    } catch (error) {
      console.error(`❌ Error creando tabla ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Verifica que todos los GSI necesarios existan, si no los crea
   */
  private async ensureGSIExists(): Promise<void> {
    try {
      const description = await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
      const existingIndexes = description.Table?.GlobalSecondaryIndexes?.map(gsi => gsi.IndexName) || [];
      
      const requiredIndexes = [
        'userId-index',
        'EntityTypeSkIndex', 
        'researchId-index',
        'ResearchIndex',
        'ResearchParticipantIndex'
      ];

      const missingIndexes = requiredIndexes.filter(index => !existingIndexes.includes(index));
      
      if (missingIndexes.length > 0) {
        console.log(`📋 Faltan los siguientes GSI: ${missingIndexes.join(', ')}`);
        console.log('ℹ️  Para agregar GSI a una tabla existente, use la consola de AWS o CLI');
        console.log('ℹ️  Comando CLI ejemplo:');
        missingIndexes.forEach(indexName => {
          console.log(`   aws dynamodb update-table --table-name ${this.tableName} --global-secondary-index-updates ...`);
        });
      } else {
        console.log('✅ Todos los GSI necesarios están presentes');
      }
    } catch (error) {
      console.error('❌ Error verificando GSI:', error);
    }
  }

  /**
   * Espera a que la tabla esté en estado ACTIVE
   */
  private async waitForTableActive(): Promise<void> {
    console.log(`⏳ Esperando a que la tabla ${this.tableName} esté activa...`);
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutos máximo
    
    while (attempts < maxAttempts) {
      try {
        const description = await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
        const status = description.Table?.TableStatus;
        
        if (status === TableStatus.ACTIVE) {
          console.log(`✅ Tabla ${this.tableName} está activa`);
          return;
        }
        
        console.log(`⏳ Estado actual: ${status}, esperando...`);
        await this.delay(10000); // Esperar 10 segundos
        attempts++;
      } catch (error) {
        console.error('❌ Error verificando estado de tabla:', error);
        attempts++;
        await this.delay(5000);
      }
    }
    
    throw new Error(`Timeout esperando que la tabla ${this.tableName} esté activa`);
  }

  /**
   * Utlidad para delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica la conexión a DynamoDB
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
      return true;
    } catch (error) {
      console.error('❌ No se puede conectar a DynamoDB:', error);
      return false;
    }
  }
}

// Función utilitaria para inicializar DynamoDB automáticamente
export async function initializeDynamoDB(): Promise<void> {
  const setup = new DynamoDBSetup();
  await setup.initializeTables();
}

// Auto-ejecutar si se llama directamente
if (require.main === module) {
  initializeDynamoDB()
    .then(() => {
      console.log('🎉 Configuración de DynamoDB completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en configuración de DynamoDB:', error);
      process.exit(1);
    });
}