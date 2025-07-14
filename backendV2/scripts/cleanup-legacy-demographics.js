// Script para limpiar respuestas demográficas legacy en DynamoDB
// Elimina respuestas con questionKey 'demographics-form' o 'demographic', dejando solo 'demographics'

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.MODULE_RESPONSES_TABLE || 'ModuleResponses';
const REGION = process.env.APP_REGION || 'us-east-1';
const LEGACY_KEYS = ['demographics-form', 'demographic'];
const CORRECT_KEY = 'demographics';

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

async function cleanupLegacyDemographics() {
  console.log('🔍 Buscando documentos con respuestas legacy...');
  const scanCmd = new ScanCommand({ TableName: TABLE_NAME });
  const result = await ddb.send(scanCmd);
  let updatedCount = 0;

  for (const doc of result.Items || []) {
    if (!doc.responses || !Array.isArray(doc.responses)) continue;
    const legacyResponses = doc.responses.filter(r => LEGACY_KEYS.includes(r.questionKey));
    if (legacyResponses.length === 0) continue;

    // Filtrar solo las respuestas correctas y las que no son legacy
    const cleanedResponses = doc.responses.filter(r => !LEGACY_KEYS.includes(r.questionKey));

    const updateCmd = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: doc.id },
      UpdateExpression: 'SET #responses = :cleaned, #updatedAt = :now',
      ExpressionAttributeNames: { '#responses': 'responses', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: { ':cleaned': cleanedResponses, ':now': new Date().toISOString() },
    });
    await ddb.send(updateCmd);
    updatedCount++;
    console.log(`✅ Limpiado documento ${doc.id}: eliminadas ${legacyResponses.length} respuestas legacy.`);
  }
  console.log(`🎉 Limpieza completada. Documentos actualizados: ${updatedCount}`);
}

cleanupLegacyDemographics().catch(err => {
  console.error('❌ Error en limpieza:', err);
  process.exit(1);
});
