import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QuestionType } from '../../../shared/interfaces/question-types.enum';

// --- Configuración ---
const MAIN_TABLE_NAME = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev';
const RESEARCH_ID_GSI_NAME = process.env.RESEARCH_ID_GSI_NAME || 'researchId-index';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Inicializar cliente DynamoDB
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Interfaz para los ítems de DynamoDB
interface DynamoDBItem {
  id?: string;
  sk?: string; // Sort key para identificar el tipo
  researchId?: string;
  stepOrder?: number;
  order?: number;
  questions?: any;
  metadata?: any;
  config?: any;
  parameterOptions?: any;
  backlinks?: any;
  [key: string]: any;
}

// Interfaz para una pregunta
interface Question {
  id?: string;
  questionKey?: string;
  type?: string;
  title?: string;
  description?: string;
  required?: boolean;
  choices?: any[];
  scaleConfig?: any;
  files?: any[];
  [key: string]: any;
}

// Interfaz para la configuración de un paso
interface StepConfiguration {
  questionKey: string;
  contentConfiguration: any;
}

/**
 * Función para parsear JSON si es string
 */
function parseJsonField(field: any): any {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn(`Error parseando JSON: ${e}`);
      return field;
    }
  }
  return field;
}

/**
 * Función para extraer configuración de Welcome Screen
 */
function extractWelcomeScreenConfig(item: DynamoDBItem): StepConfiguration | null {
  const config = {
    title: item.title || '',
    message: item.message || '',
    startButtonText: item.startButtonText || 'Continuar',
    isEnabled: item.isEnabled !== false,
    metadata: parseJsonField(item.metadata) || {}
  };

  return {
    questionKey: QuestionType.WELCOME_SCREEN,
    contentConfiguration: config
  };
}

/**
 * Función para extraer configuración de Thank You Screen
 */
function extractThankYouScreenConfig(item: DynamoDBItem): StepConfiguration | null {
  const config = {
    title: item.title || '',
    message: item.message || '',
    startButtonText: item.startButtonText || 'Finalizar',
    isEnabled: item.isEnabled !== false,
    metadata: parseJsonField(item.metadata) || {}
  };

  return {
    questionKey: QuestionType.THANK_YOU_SCREEN,
    contentConfiguration: config
  };
}

/**
 * Función para extraer configuración de Eye Tracking (Demographics)
 */
function extractEyeTrackingConfig(item: DynamoDBItem): StepConfiguration | null {
  const config = {
    config: parseJsonField(item.config) || {},
    stimuli: parseJsonField(item.stimuli) || { items: [] },
    areasOfInterest: parseJsonField(item.areasOfInterest) || { areas: [] },
    deviceFrame: item.deviceFrame || false,
    metadata: parseJsonField(item.metadata) || {}
  };

  return {
    questionKey: QuestionType.DEMOGRAPHICS,
    contentConfiguration: config
  };
}

/**
 * Función para extraer configuración de Smart VOC
 */
function extractSmartVOCConfig(item: DynamoDBItem): StepConfiguration[] {
  const questions = parseJsonField(item.questions) || [];
  const configurations: StepConfiguration[] = [];

  questions.forEach((question: Question) => {
    if (question.questionKey) {
      const config = {
        title: question.title || '',
        description: question.description || '',
        type: question.type || '',
        companyName: question.companyName || '',
        required: question.required !== false,
        choices: question.choices || [],
        metadata: parseJsonField(question.metadata) || {}
      };

      configurations.push({
        questionKey: question.questionKey,
        contentConfiguration: config
      });
    }
  });

  return configurations;
}

/**
 * Función para extraer configuración de Cognitive Task
 */
function extractCognitiveTaskConfig(item: DynamoDBItem): StepConfiguration[] {
  const questions = parseJsonField(item.questions) || [];
  const configurations: StepConfiguration[] = [];

  questions.forEach((question: Question) => {
    if (question.questionKey) {
      const config = {
        title: question.title || '',
        description: question.description || '',
        type: question.type || '',
        required: question.required !== false,
        choices: question.choices || [],
        scaleConfig: question.scaleConfig || {},
        files: question.files || [],
        metadata: parseJsonField(question.metadata) || {}
      };

      configurations.push({
        questionKey: question.questionKey,
        contentConfiguration: config
      });
    }
  });

  return configurations;
}

/**
 * Función para obtener los questionKey y configuraciones de los formularios configurados
 */
async function getAvailableFormTypesAndConfigurations(researchId: string): Promise<{
  steps: string[];
  stepsConfiguration: StepConfiguration[];
}> {
  console.log(`[getAvailableFormTypesAndConfigurations] Buscando tipos de formularios para researchId: ${researchId}`);

  const params: QueryCommandInput = {
    TableName: MAIN_TABLE_NAME,
    IndexName: RESEARCH_ID_GSI_NAME,
    KeyConditionExpression: 'researchId = :rid',
    ExpressionAttributeValues: { ':rid': researchId },
  };

  try {
    const command = new QueryCommand(params);
    const result = await docClient.send(command);
    const items: DynamoDBItem[] = (result.Items || []) as DynamoDBItem[];

    const availableTypes: string[] = [];
    const configurations: StepConfiguration[] = [];

    // Procesar cada ítem para extraer los tipos de formularios y configuraciones
    items.forEach((item: DynamoDBItem) => {
      console.log(`[getAvailableFormTypesAndConfigurations] Procesando ítem con sk: ${item.sk}`);

      // Determinar el tipo basado en el sort key (sk) usando QuestionType enum
      switch (item.sk) {
        case 'WELCOME_SCREEN':
          availableTypes.push(QuestionType.WELCOME_SCREEN);
          const welcomeConfig = extractWelcomeScreenConfig(item);
          if (welcomeConfig) {
            configurations.push(welcomeConfig);
          }
          break;

        case 'THANK_YOU_SCREEN':
          availableTypes.push(QuestionType.THANK_YOU_SCREEN);
          const thankYouConfig = extractThankYouScreenConfig(item);
          if (thankYouConfig) {
            configurations.push(thankYouConfig);
          }
          break;

        case 'EYE_TRACKING_CONFIG':
          availableTypes.push(QuestionType.DEMOGRAPHICS);
          const eyeTrackingConfig = extractEyeTrackingConfig(item);
          if (eyeTrackingConfig) {
            configurations.push(eyeTrackingConfig);
          }
          break;

        case 'COGNITIVE_TASK':
          // Para cognitive task, extraer questionKey y configuración de cada pregunta
          if (item.questions && Array.isArray(item.questions)) {
            item.questions.forEach((question: Question) => {
              if (question.questionKey) {
                availableTypes.push(question.questionKey);
              }
            });
            const cognitiveConfigs = extractCognitiveTaskConfig(item);
            configurations.push(...cognitiveConfigs);
          }
          break;

        case 'SMART_VOC':
          // Para smart voc, extraer questionKey y configuración de cada pregunta
          if (item.questions && Array.isArray(item.questions)) {
            item.questions.forEach((question: Question) => {
              if (question.questionKey) {
                availableTypes.push(question.questionKey);
              }
            });
            const smartVOCConfigs = extractSmartVOCConfig(item);
            configurations.push(...smartVOCConfigs);
          }
          break;

        default:
          console.log(`[getAvailableFormTypesAndConfigurations] Tipo no reconocido: ${item.sk}`);
          break;
      }
    });

    // Eliminar duplicados y ordenar
    const uniqueTypes = [...new Set(availableTypes)].sort();

    console.log(`[getAvailableFormTypesAndConfigurations] Tipos encontrados: ${uniqueTypes.join(', ')}`);
    console.log(`[getAvailableFormTypesAndConfigurations] Configuraciones encontradas: ${configurations.length}`);

    return {
      steps: uniqueTypes,
      stepsConfiguration: configurations
    };

  } catch (error: any) {
    console.error('[getAvailableFormTypesAndConfigurations] Error al consultar DynamoDB:', error);
    throw new Error(`Error al consultar DynamoDB: ${error.message}`);
  }
}

/**
 * Handler de API Gateway para obtener los tipos de formularios disponibles para una investigación específica.
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[GetResearchAvailableForms] Evento recibido:', JSON.stringify(event));

  const researchId = event.pathParameters?.researchId;

  if (!researchId) {
    console.warn('[GetResearchAvailableForms] Falta researchId en la ruta.');
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Falta el parámetro researchId en la ruta' }),
    };
  }

  try {
    // Obtener los tipos de formularios disponibles y sus configuraciones
    const { steps, stepsConfiguration } = await getAvailableFormTypesAndConfigurations(researchId);

    // Devolver la respuesta exitosa
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        steps,
        stepsConfiguration,
        researchId: researchId,
        count: steps.length
      }),
    };

  } catch (error: any) {
    console.error('[GetResearchAvailableForms] Error al obtener tipos de formularios:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
          message: 'Error interno del servidor al obtener los tipos de formularios.',
          error: error.message,
      }),
    };
  }
};
