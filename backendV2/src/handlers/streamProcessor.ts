import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';

/**
 * Procesa streams de DynamoDB y envía actualizaciones via WebSocket
 */
export const streamProcessor: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.log('📡 Procesando DynamoDB Stream:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const tableName = record.eventSourceARN?.split('/')[1] || 'unknown';
      const eventName = record.eventName || 'unknown';
      
      console.log(`🔄 Procesando evento ${eventName} en tabla ${tableName}`);

      // Procesar según el tipo de tabla
      if (tableName?.includes('participants')) {
        await processParticipantChange(record, eventName);
      } else if (tableName?.includes('module-responses')) {
        await processModuleResponseChange(record, eventName);
      }
    } catch (error) {
      console.error('❌ Error procesando stream record:', error);
    }
  }
};

/**
 * Procesa cambios en la tabla de participantes
 */
async function processParticipantChange(record: DynamoDBStreamEvent['Records'][0], eventName: string) {
  const participant = record.dynamodb?.NewImage || record.dynamodb?.OldImage;
  
  if (!participant) return;

  const participantData = {
    id: participant.id?.S,
    name: participant.name?.S,
    email: participant.email?.S,
    researchId: participant.researchId?.S,
    status: participant.status?.S,
    progress: participant.progress?.N,
    lastActivity: participant.lastActivity?.S,
    createdAt: participant.createdAt?.S,
    updatedAt: participant.updatedAt?.S
  };

  const message = {
    type: 'PARTICIPANT_UPDATE',
    event: eventName,
    data: participantData,
    timestamp: new Date().toISOString()
  };

  // Enviar a todas las conexiones WebSocket activas
  await broadcastToConnections(message);
}

/**
 * Procesa cambios en la tabla de respuestas de módulos
 */
async function processModuleResponseChange(record: DynamoDBStreamEvent['Records'][0], eventName: string) {
  const response = record.dynamodb?.NewImage || record.dynamodb?.OldImage;
  
  if (!response) return;

  const responseData = {
    id: response.id?.S,
    researchId: response.researchId?.S,
    participantId: response.participantId?.S,
    questionKey: response.questionKey?.S,
    responses: response.responses?.L,
    isCompleted: response.isCompleted?.BOOL,
    createdAt: response.createdAt?.S,
    updatedAt: response.updatedAt?.S
  };

  const message = {
    type: 'RESPONSE_UPDATE',
    event: eventName,
    data: responseData,
    timestamp: new Date().toISOString()
  };

  // Enviar a todas las conexiones WebSocket activas
  await broadcastToConnections(message);
}

/**
 * Envía mensaje a todas las conexiones WebSocket activas
 */
async function broadcastToConnections(message: { type: string; event: string; data: Record<string, unknown>; timestamp: string }) {
  try {
    // TODO: Implementar lógica para obtener conexiones activas
    // Por ahora, solo logueamos el mensaje
    console.log('📤 Enviando actualización WebSocket:', JSON.stringify(message, null, 2));
    
    // En una implementación completa, aquí obtendrías las conexiones activas
    // desde una tabla de conexiones y enviarías el mensaje a cada una
    
  } catch (error) {
    console.error('❌ Error enviando mensaje WebSocket:', error);
  }
}
