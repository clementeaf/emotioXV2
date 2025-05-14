import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// --- Configuración ---
// Obtener de variables de entorno o usar valores predeterminados
// APUNTAR A LA TABLA PRINCIPAL DONDE ESTÁN LAS INVESTIGACIONES (NOMBRE CORREGIDO)
const MAIN_TABLE_NAME = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev'; 
// NOMBRE CORRECTO DEL GSI BASADO EN researchId EN LA TABLA PRINCIPAL
const RESEARCH_ID_GSI_NAME = process.env.RESEARCH_ID_GSI_NAME || 'researchId-index'; 
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'; 

// Inicializar cliente DynamoDB
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Interfaz para los ítems de DynamoDB (simplificada)
interface DynamoDBItem {
  id?: string; // Asumiendo que los ítems tienen un id
  stepOrder?: number;
  order?: number;
  questions?: any; // Puede ser string o ya parseado
  metadata?: any;  // Puede ser string o ya parseado
  config?: any;    // Puede ser string o ya parseado
  parameterOptions?: any; // Puede ser string o ya parseado
  backlinks?: any; // Puede ser string o ya parseado
  [key: string]: any; // Para otras propiedades
}

/**
 * Función interna para buscar ítems asociados a un researchId en DynamoDB.
 * @param researchId El ID de la investigación.
 * @returns Una promesa que resuelve a un array de ítems (formularios, etc.).
 * @throws Un error si la consulta a DynamoDB falla.
 */
async function fetchItemsByResearchId(researchId: string): Promise<DynamoDBItem[]> {
  console.log(`[fetchItemsByResearchId] Buscando ítems para researchId: ${researchId}`);

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

    // Parsear campos JSON y procesar items
    const processedItems: DynamoDBItem[] = items.map((item: DynamoDBItem) => {
      const newItem = { ...item }; 

      for (const key of ['questions', 'metadata', 'config', 'parameterOptions', 'backlinks', 'demographicQuestions', 'areasOfInterest', 'stimuli', 'participantLimit', 'linkConfig']) {
        if (typeof newItem[key] === 'string') {
          try {
            newItem[key] = JSON.parse(newItem[key]);
          } catch (e) {
            console.warn(`[fetchItemsByResearchId] Error parseando JSON para la clave '${key}' en el ítem con id '${newItem.id || 'unknown'}':`, e);
          }
        }
      }
      return newItem;
    });

    // Ordenar los items procesados
    if (processedItems.length > 0) {
      // Verificar si el primer ítem tiene stepOrder para decidir la clave de ordenación
      const sortByStepOrder = processedItems[0].hasOwnProperty('stepOrder');
      const sortByOrder = processedItems[0].hasOwnProperty('order');

      if (sortByStepOrder) {
        processedItems.sort((a: DynamoDBItem, b: DynamoDBItem) => (a.stepOrder ?? Infinity) - (b.stepOrder ?? Infinity));
        console.log('[fetchItemsByResearchId] Ítems procesados y ordenados por "stepOrder".');
      } else if (sortByOrder) {
        processedItems.sort((a: DynamoDBItem, b: DynamoDBItem) => (a.order ?? Infinity) - (b.order ?? Infinity));
        console.log('[fetchItemsByResearchId] Ítems procesados y ordenados por "order".');
      } else {
        console.log("[fetchItemsByResearchId] Ítems procesados. No se encontró clave de orden explícita ('stepOrder' u 'order').");
      }
    }

    console.log(`[fetchItemsByResearchId] Ítems procesados encontrados: ${processedItems.length}`);
    return processedItems;

  } catch (error: any) {
    console.error('[fetchItemsByResearchId] Error al consultar DynamoDB:', error);
    throw new Error(`Error al consultar DynamoDB: ${error.message}`);
  }
}

/**
 * Handler de API Gateway para obtener los formularios/pasos disponibles para una investigación específica.
 * Espera researchId como path parameter.
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
        'Access-Control-Allow-Origin': '*' // CORS
      },
      body: JSON.stringify({ message: 'Falta el parámetro researchId en la ruta' }),
    };
  }

  try {
    // Llamar a la función interna renombrada
    const forms = await fetchItemsByResearchId(researchId);

    // Devolver la respuesta exitosa
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // CORS
      },
      body: JSON.stringify({ data: forms }), // Devuelve los formularios dentro de 'data'
    };

  } catch (error: any) {
    // Manejar errores provenientes de fetchItemsByResearchId
    console.error('[GetResearchAvailableForms] Error al obtener formularios:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // CORS
      },
      body: JSON.stringify({
          message: 'Error interno del servidor al obtener los formularios.',
          error: error.message,
      }),
    };
  }
}; 