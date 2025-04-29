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

/**
 * Función interna para buscar ítems asociados a un researchId en DynamoDB.
 * @param researchId El ID de la investigación.
 * @returns Una promesa que resuelve a un array de ítems (formularios, etc.).
 * @throws Un error si la consulta a DynamoDB falla.
 */
async function fetchItemsByResearchId(researchId: string): Promise<any[]> { // Renombrado para claridad
  console.log(`[fetchItemsByResearchId] Buscando ítems para researchId: ${researchId} en tabla ${MAIN_TABLE_NAME} usando índice ${RESEARCH_ID_GSI_NAME}`);

  const params: QueryCommandInput = {
    TableName: MAIN_TABLE_NAME, // Usar la tabla principal
    IndexName: RESEARCH_ID_GSI_NAME, // Usar el índice GSI por researchId
    KeyConditionExpression: 'researchId = :rid', // Asumiendo que la clave del GSI se llama 'researchId'
    ExpressionAttributeValues: {
      ':rid': researchId,
    },
    // AÑADIR FILTRO OPCIONALMENTE AQUÍ para seleccionar solo formularios si es necesario
    // FilterExpression: 'EntityType = :entityType',
    // ExpressionAttributeValues: { ':rid': researchId, ':entityType': 'FORM_CONFIG' }, 
    // ProjectionExpression: 'id, stepType, config, stepOrder', // Opcional
  };

  try {
    console.log('[fetchItemsByResearchId] Ejecutando QueryCommand con params:', JSON.stringify(params));
    const command = new QueryCommand(params);
    const result = await docClient.send(command);
    console.log('[fetchItemsByResearchId] Respuesta de DynamoDB:', JSON.stringify(result));

    const items = result.Items || []; // Renombrado de forms a items

    // Ordenar los items si existe un atributo de orden (ej: 'stepOrder' o 'order')
    if (items.length > 0) {
        if (items[0].hasOwnProperty('stepOrder')) {
            items.sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
            console.log('[fetchItemsByResearchId] Ítems ordenados por "stepOrder".');
        } else if (items[0].hasOwnProperty('order')) {
            items.sort((a, b) => (a.order || 0) - (b.order || 0));
            console.log('[fetchItemsByResearchId] Ítems ordenados por "order".');
        }
    }

    console.log(`[fetchItemsByResearchId] Ítems encontrados: ${items.length}`);
    return items;

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