// Script para limpiar respuestas legacy de módulos específicos en DynamoDB
// Elimina respuestas con questionKey legacy de welcomeScreen, smartvoc, cognitiveTask, thankYouScreen

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.MODULE_RESPONSES_TABLE || 'ModuleResponses';
const REGION = process.env.APP_REGION || 'us-east-1';
const LEGACY_KEYS = [
  'welcome', 'welcome_screen', 'WelcomeScreen', 'welcomeScreen',
  'thankyou', 'thank_you_screen', 'ThankYouScreen', 'thankYouScreen',
  'smartvoc', 'SmartVOC', 'smartvoc_csat', 'smartvoc_nev', 'smartvoc_nps', 'smartvoc_voc',
  'cognitiveTask', 'CognitiveTask', 'cognitive_task', 'cognitive_single_choice', 'cognitive_multiple_choice', 'cognitive_short_text', 'cognitive_long_text'
];

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

async function cleanupLegacyModules() {
  console.log('🔍 Buscando documentos con respuestas legacy de módulos...');
  const scanCmd = new ScanCommand({ TableName: TABLE_NAME });
  const result = await ddb.send(scanCmd);
  let updatedCount = 0;

  for (const doc of result.Items || []) {
    if (!doc.responses || !Array.isArray(doc.responses)) continue;
    const legacyResponses = doc.responses.filter(r => LEGACY_KEYS.includes(r.questionKey));
    if (legacyResponses.length === 0) continue;

    // Filtrar solo las respuestas que no son legacy
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
    console.log(`✅ Limpiado documento ${doc.id}: eliminadas ${legacyResponses.length} respuestas legacy de módulos.`);
  }
  console.log(`🎉 Limpieza completada. Documentos actualizados: ${updatedCount}`);
}

cleanupLegacyModules().catch(err => {
  console.error('❌ Error en limpieza:', err);
  process.exit(1);
});
