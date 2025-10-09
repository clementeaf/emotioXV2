import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QuestionType } from '../../../shared/interfaces/question-types.enum';
import { getCorsHeaders } from '../middlewares/cors';

// --- Configuración ---
const MAIN_TABLE_NAME = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev';
const RESEARCH_ID_GSI_NAME = process.env.RESEARCH_ID_GSI_NAME || 'researchId-index';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Inicializar cliente DynamoDB
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Tipos específicos para metadatos
interface QuestionMetadata {
  [key: string]: string | number | boolean | null;
}

// Tipos específicos para configuraciones
interface QuestionConfig {
  [key: string]: string | number | boolean | null | string[] | number[];
}

// Tipo para choices de preguntas
interface QuestionChoice {
  id: string;
  text: string;
  value: string | number;
}

// Tipo para scale config
interface ScaleConfig {
  min: number;
  max: number;
  step?: number;
  labels?: {
    [key: number]: string;
  };
}

// Tipo para archivos adjuntos
interface QuestionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

// Interfaz para los ítems de DynamoDB con tipos específicos
interface DynamoDBItem {
  id?: string;
  sk?: string; // Sort key para identificar el tipo
  researchId?: string;
  stepOrder?: number;
  order?: number;
  questions?: Question[];
  metadata?: QuestionMetadata;
  config?: QuestionConfig;
  parameterOptions?: QuestionConfig;
  backlinks?: string[];
  // Campos específicos de Welcome/Thank You screen
  title?: string;
  message?: string;
  startButtonText?: string;
  isEnabled?: boolean;
  // Campos específicos de Eye Tracking
  demographicQuestions?: Record<string, {
    enabled: boolean;
    [key: string]: string | number | boolean;
  }>;
  stimuli?: {
    items: Array<{
      id: string;
      url: string;
      type: string;
      [key: string]: string | number | boolean;
    }>;
  };
  areasOfInterest?: {
    areas: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      [key: string]: string | number | boolean;
    }>;
  };
  deviceFrame?: boolean;
}

// Interfaz para una pregunta con tipos específicos
interface Question {
  id?: string;
  questionKey?: string;
  type?: string;
  title?: string;
  description?: string;
  instructions?: string;
  required?: boolean;
  choices?: QuestionChoice[];
  scaleConfig?: ScaleConfig;
  files?: QuestionFile[];
  metadata?: QuestionMetadata;
  config?: QuestionConfig;
  order?: number;
  [key: string]: string | number | boolean | null | QuestionChoice[] | ScaleConfig | QuestionFile[] | QuestionMetadata | QuestionConfig | undefined;
}

// Tipos específicos para las configuraciones de contenido
interface WelcomeScreenConfiguration {
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
  metadata: QuestionMetadata;
}

interface ThankYouScreenConfiguration {
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
  metadata: QuestionMetadata;
}


// Tipo para la configuración de contenido
type ContentConfiguration =
  | WelcomeScreenConfiguration
  | ThankYouScreenConfiguration
  | Record<string, string | number | boolean | null | QuestionChoice[] | ScaleConfig | QuestionFile[] | QuestionMetadata | QuestionConfig | Record<string, unknown> | unknown[] | undefined>;

// Interfaz para la configuración de un paso con tipos específicos
interface StepConfiguration {
  questionKey: string;
  contentConfiguration: ContentConfiguration;
}

/**
 * Función para parsear JSON si es string con tipado genérico
 */
function parseJsonField<T = QuestionMetadata | QuestionConfig | Question[] | Record<string, unknown>>(field: string | T | undefined): T | null {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch (e) {
      console.warn(`Error parseando JSON: ${e}`);
      return null;
    }
  }
  if (field === undefined || field === null) {
    return null;
  }
  return field as T;
}

/**
 * Función para extraer configuración de Welcome Screen
 */
function extractWelcomeScreenConfig(item: DynamoDBItem): StepConfiguration | null {
  const config: WelcomeScreenConfiguration = {
    title: item.title || '',
    message: item.message || '',
    startButtonText: item.startButtonText || 'Continuar',
    isEnabled: item.isEnabled !== false,
    metadata: parseJsonField<QuestionMetadata>(item.metadata) || {}
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
  const config: ThankYouScreenConfiguration = {
    title: item.title || '',
    message: item.message || '',
    startButtonText: item.startButtonText || 'Finalizar',
    isEnabled: item.isEnabled !== false,
    metadata: parseJsonField<QuestionMetadata>(item.metadata) || {}
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
  // Parsear demographicQuestions del item
  const allDemographicQuestions = parseJsonField(item.demographicQuestions) || {};

  // Filtrar solo las preguntas que están habilitadas (enabled: true)
  const enabledDemographicQuestions: Record<string, unknown> = {};

  Object.entries(allDemographicQuestions).forEach(([key, questionData]: [string, unknown]) => {
    if (questionData && typeof questionData === 'object' && questionData !== null && 'enabled' in questionData && (questionData as Record<string, unknown>).enabled === true) {
      enabledDemographicQuestions[key] = questionData;
    }
  });

  const config = {
    config: parseJsonField(item.config) || {},
    stimuli: parseJsonField(item.stimuli) || { items: [] },
    areasOfInterest: parseJsonField(item.areasOfInterest) || { areas: [] },
    deviceFrame: item.deviceFrame || false,
    metadata: parseJsonField(item.metadata) || {},
    demographicQuestions: enabledDemographicQuestions
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

  if (Array.isArray(questions)) {
    questions.forEach((question: Question) => {
      if (question.questionKey) {
        const config = {
          title: question.title || '',
          description: question.description || '',
          instructions: question.instructions || '',
          type: question.type || '',
          required: question.required !== false,
          choices: question.choices || [],
          metadata: parseJsonField(question.metadata) || {},
          // ✅ INCLUIR LA CONFIGURACIÓN ORIGINAL DE LA PREGUNTA
          ...(question.config && typeof question.config === 'object' && question.config !== null ? question.config as Record<string, unknown> : {})
        };

        configurations.push({
          questionKey: question.questionKey,
          contentConfiguration: config
        });
      }
    });
  }

  return configurations;
}

/**
 * Función para aplicar el orden específico de los steps según las reglas establecidas
 * 1. demographics siempre primero (posición 0)
 * 2. welcome_screen segundo (posición 1, o 0 si no hay demographics)
 * 3. thank_you_screen siempre último
 * 4. Preguntas de smartvoc y cognitive_task van en el medio
 */
function applySpecificOrder(steps: string[]): string[] {
  const orderedSteps: string[] = [];

  // 1. demographics siempre primero
  if (steps.includes('demographics')) {
    orderedSteps.push('demographics');
  }

  // 2. welcome_screen segundo (o primero si no hay demographics)
  if (steps.includes('welcome_screen')) {
    orderedSteps.push('welcome_screen');
  }

  // 3. Preguntas de smartvoc y cognitive_task van en el medio
  const middleSteps = steps.filter(step =>
    step !== 'demographics' &&
    step !== 'welcome_screen' &&
    step !== 'thank_you_screen'
  );

  // Agregar los steps del medio en el orden que vengan
  orderedSteps.push(...middleSteps);

  // 4. thank_you_screen siempre último
  if (steps.includes('thank_you_screen')) {
    orderedSteps.push('thank_you_screen');
  }

  return orderedSteps;
}

/**
 * Función para extraer configuración de Cognitive Task
 */
function extractCognitiveTaskConfig(item: DynamoDBItem): StepConfiguration[] {
  const questions = parseJsonField(item.questions) || [];
  const configurations: StepConfiguration[] = [];

  if (Array.isArray(questions)) {
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
          metadata: parseJsonField(question.metadata) || {},
          answerPlaceholder: question.answerPlaceholder || '' // 🎯 AGREGADO: Campo answerPlaceholder
        };

        configurations.push({
          questionKey: question.questionKey,
          contentConfiguration: config
        });
      }
    });
  }

  return configurations;
}

/**
 * Función para obtener configuraciones por defecto cuando no hay configuraciones en DynamoDB
 */
function getDefaultStepConfigurations(): {
  steps: string[];
  stepsConfiguration: StepConfiguration[];
} {
  const defaultSteps = [QuestionType.WELCOME_SCREEN, QuestionType.THANK_YOU_SCREEN];
  
  const defaultConfigurations: StepConfiguration[] = [
    {
      questionKey: QuestionType.WELCOME_SCREEN,
      contentConfiguration: {
        title: 'Bienvenido a la investigación',
        message: 'Gracias por participar en esta investigación. A continuación, encontrarás una serie de preguntas y actividades.',
        startButtonText: 'Continuar',
        isEnabled: true,
        metadata: {}
      }
    },
    {
      questionKey: QuestionType.THANK_YOU_SCREEN,
      contentConfiguration: {
        title: 'Gracias por tu participación',
        message: 'Has completado exitosamente la investigación. Tus respuestas han sido registradas correctamente.',
        startButtonText: 'Finalizar',
        isEnabled: true,
        metadata: {}
      }
    }
  ];

  return {
    steps: defaultSteps,
    stepsConfiguration: defaultConfigurations
  };
}

/**
 * Función para obtener los questionKey y configuraciones de los formularios configurados
 * Si no hay configuraciones, retorna configuraciones por defecto en lugar de error
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

    // Si no hay elementos configurados, devolver configuración por defecto
    if (items.length === 0) {
      console.log(`[getAvailableFormTypesAndConfigurations] No se encontraron configuraciones para researchId: ${researchId}, devolviendo configuración por defecto`);
      return getDefaultStepConfigurations();
    }

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
          const parsedCognitiveQuestions = parseJsonField(item.questions);
          if (parsedCognitiveQuestions && Array.isArray(parsedCognitiveQuestions)) {
            parsedCognitiveQuestions.forEach((question: Question) => {
              if (question.questionKey) {
                availableTypes.push(question.questionKey);
              }
            });
            const cognitiveConfigs = extractCognitiveTaskConfig(item);
            configurations.push(...cognitiveConfigs);
          }
          break;

        case 'SMART_VOC_FORM':
          // Para smart voc, extraer questionKey y configuración de cada pregunta
          const parsedQuestions = parseJsonField(item.questions);

          if (parsedQuestions && Array.isArray(parsedQuestions)) {
            parsedQuestions.forEach((question: Question) => {
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

    // Eliminar duplicados
    const uniqueTypes = [...new Set(availableTypes)];

    // Si después de procesar no hay tipos válidos, devolver configuración por defecto
    if (uniqueTypes.length === 0) {
      console.log(`[getAvailableFormTypesAndConfigurations] No se encontraron tipos válidos después del procesamiento, devolviendo configuración por defecto`);
      return getDefaultStepConfigurations();
    }

    // Aplicar orden específico según las reglas
    const orderedSteps = applySpecificOrder(uniqueTypes);

    console.log(`[getAvailableFormTypesAndConfigurations] Tipos encontrados: ${uniqueTypes.join(', ')}`);
    console.log(`[getAvailableFormTypesAndConfigurations] Tipos ordenados: ${orderedSteps.join(', ')}`);
    console.log(`[getAvailableFormTypesAndConfigurations] Configuraciones encontradas: ${configurations.length}`);

    return {
      steps: orderedSteps,
      stepsConfiguration: configurations
    };

  } catch (error: unknown) {
    console.error('[getAvailableFormTypesAndConfigurations] Error al consultar DynamoDB:', error);
    // En caso de error de DynamoDB, devolver configuración por defecto en lugar de fallar
    console.log('[getAvailableFormTypesAndConfigurations] Devolviendo configuración por defecto debido a error en DynamoDB');
    return getDefaultStepConfigurations();
  }
}

/**
 * Handler de API Gateway para obtener los tipos de formularios disponibles para una investigación específica.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return mainHandler(event);
};

export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[GetResearchAvailableForms] Evento recibido:', JSON.stringify(event));

  const researchId = event.pathParameters?.researchId;

  if (!researchId) {
    console.warn('[GetResearchAvailableForms] Falta researchId en la ruta.');
    return {
      statusCode: 400,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ message: 'Falta el parámetro researchId en la ruta' }),
    };
  }

  try {
    // Obtener los tipos de formularios disponibles y sus configuraciones
    const { steps, stepsConfiguration } = await getAvailableFormTypesAndConfigurations(researchId);

    // Devolver la respuesta exitosa
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        steps,
        stepsConfiguration,
        researchId: researchId,
        count: steps.length
      }),
    };

  } catch (error: unknown) {
    console.error('[GetResearchAvailableForms] Error al obtener tipos de formularios:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        message: 'Error interno del servidor al obtener los tipos de formularios.',
        error: ((error as Error)?.message || 'Error desconocido'),
      }),
    };
  }
};
