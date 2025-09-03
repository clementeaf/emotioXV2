#!/usr/bin/env node

/**
 * Script específico para limpiar la tabla researches con clave compuesta (id + sk)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = 'us-east-1';
const TABLE_NAME = 'emotioxv2-backend-researches-dev';

async function clearResearchesTable() {
  console.log(`🧹 Limpiando tabla específica: ${TABLE_NAME}`);
  console.log(`📍 Región: ${REGION}`);
  
  // Crear cliente DynamoDB
  const dynamoClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: REGION })
  );
  
  let itemsDeleted = 0;
  let lastEvaluatedKey = null;
  
  try {
    do {
      // Escanear la tabla
      const scanParams = {
        TableName: TABLE_NAME,
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
      };
      
      console.log(`📡 Escaneando tabla...`);
      const scanResult = await dynamoClient.send(new ScanCommand(scanParams));
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        console.log(`📋 Encontrados ${scanResult.Items.length} items para eliminar`);
        
        // Eliminar items usando clave compuesta (id + sk)
        const deletePromises = scanResult.Items.map(async (item) => {
          const deleteParams = {
            TableName: TABLE_NAME,
            Key: {
              id: item.id,    // HASH key
              sk: item.sk     // RANGE key
            }
          };
          
          console.log(`   🗑️  Eliminando: id=${item.id}, sk=${item.sk}`);
          return dynamoClient.send(new DeleteCommand(deleteParams));
        });
        
        await Promise.all(deletePromises);
        itemsDeleted += scanResult.Items.length;
        
        console.log(`   ✅ Eliminados ${scanResult.Items.length} items (Total: ${itemsDeleted})`);
      }
      
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
      
      if (lastEvaluatedKey) {
        console.log(`🔄 Continuando con siguiente lote...`);
      }
      
    } while (lastEvaluatedKey);
    
    console.log(`\n🎉 ¡Limpieza de researches completada!`);
    console.log(`📊 Total de items eliminados: ${itemsDeleted}`);
    console.log(`✅ La tabla ${TABLE_NAME} está ahora vacía`);
    
    return itemsDeleted;
    
  } catch (error) {
    console.error(`❌ Error limpiando tabla ${TABLE_NAME}:`, error.message);
    throw error;
  }
}

// Ejecutar el script
clearResearchesTable()
  .then((itemsDeleted) => {
    console.log(`\n✨ Script completado exitosamente`);
    console.log(`📈 Items eliminados: ${itemsDeleted}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`💥 Script falló:`, error);
    process.exit(1);
  });