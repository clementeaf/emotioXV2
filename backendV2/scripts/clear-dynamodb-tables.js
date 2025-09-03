#!/usr/bin/env node

/**
 * Script para eliminar TODO el contenido de las tablas DynamoDB
 * MANTIENE las tablas, solo elimina los datos
 * 
 * USO: node scripts/clear-dynamodb-tables.js [--stage dev|prod] [--region us-east-1]
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Configuración por defecto
const DEFAULT_STAGE = 'dev';
const DEFAULT_REGION = 'us-east-1';

// Parse argumentos de línea de comandos
function parseArgs() {
  const args = process.argv.slice(2);
  let stage = DEFAULT_STAGE;
  let region = DEFAULT_REGION;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stage' && i + 1 < args.length) {
      stage = args[i + 1];
    } else if (args[i] === '--region' && i + 1 < args.length) {
      region = args[i + 1];
    }
  }
  
  return { stage, region };
}

// Lista de todas las tablas DynamoDB del proyecto
function getTableNames(stage) {
  const servicePrefix = `emotioxv2-backend`;
  
  return {
    // Tabla principal de investigaciones
    researches: `${servicePrefix}-researches-${stage}`,
    
    // Tabla de usuarios
    users: `${servicePrefix}-users-${stage}`,
    
    // Tablas de participantes y respuestas
    participants: `${servicePrefix}-participants-${stage}`,
    moduleResponses: `${servicePrefix}-module-responses-${stage}`,
    
    // Tablas de Eye Tracking Recruit
    eyeTrackingRecruitConfig: `${servicePrefix}-eye-tracking-recruit-config-${stage}`,
    eyeTrackingRecruitParticipant: `${servicePrefix}-eye-tracking-recruit-participant-${stage}`,
    recruitmentLink: `${servicePrefix}-recruitment-link-${stage}`,
    
    // Tablas adicionales
    locationTracking: 'location-tracking-table',
    quotaRecords: `${servicePrefix}-quota-records-${stage}`
  };
}

// Función para escanear y eliminar todos los items de una tabla
async function clearTable(dynamoClient, tableName) {
  console.log(`\n🧹 Limpiando tabla: ${tableName}`);
  
  try {
    let itemsDeleted = 0;
    let lastEvaluatedKey = null;
    
    do {
      // Escanear la tabla
      const scanParams = {
        TableName: tableName,
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
      };
      
      const scanResult = await dynamoClient.send(new ScanCommand(scanParams));
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        // Eliminar items en lotes
        const deletePromises = scanResult.Items.map(async (item) => {
          // Determinar las claves primarias basadas en la estructura del item
          const keyAttributes = getKeyAttributes(item, tableName);
          
          const deleteParams = {
            TableName: tableName,
            Key: keyAttributes
          };
          
          return dynamoClient.send(new DeleteCommand(deleteParams));
        });
        
        await Promise.all(deletePromises);
        itemsDeleted += scanResult.Items.length;
        
        console.log(`   ✓ Eliminados ${scanResult.Items.length} items (Total: ${itemsDeleted})`);
      }
      
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    console.log(`   ✅ Completado: ${itemsDeleted} items eliminados de ${tableName}`);
    return itemsDeleted;
    
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`   ⚠️  Tabla ${tableName} no existe - saltando`);
      return 0;
    }
    console.error(`   ❌ Error limpiando ${tableName}:`, error.message);
    throw error;
  }
}

// Función para determinar las claves primarias según la tabla
function getKeyAttributes(item, tableName) {
  // Para tablas con estructura PK/SK
  if (item.PK && item.SK) {
    return { PK: item.PK, SK: item.SK };
  }
  
  // Para tablas con 'id' simple
  if (item.id) {
    return { id: item.id };
  }
  
  // Para tablas específicas con estructuras diferentes
  if (tableName.includes('users') && item.email) {
    return { id: item.id };
  }
  
  if (tableName.includes('participants') && item.email) {
    return { id: item.id };
  }
  
  if (tableName.includes('module-responses')) {
    return { id: item.id };
  }
  
  if (tableName.includes('location-tracking')) {
    return { id: item.id };
  }
  
  if (tableName.includes('quota-records')) {
    return { id: item.id };
  }
  
  // Fallback - usar 'id' si existe
  if (item.id) {
    return { id: item.id };
  }
  
  console.warn(`⚠️  No se pudo determinar la clave primaria para el item en ${tableName}:`, Object.keys(item));
  throw new Error(`No se pudo determinar la clave primaria para la tabla ${tableName}`);
}

// Función principal
async function main() {
  const { stage, region } = parseArgs();
  
  console.log(`🚀 Iniciando limpieza de tablas DynamoDB`);
  console.log(`📍 Región: ${region}`);
  console.log(`🏷️  Stage: ${stage}`);
  
  // Confirmación de seguridad
  if (process.env.NODE_ENV === 'production' || stage === 'prod') {
    console.log('\n⚠️  ¡ATENCIÓN! Estás a punto de eliminar datos de PRODUCCIÓN');
    console.log('Este script eliminará TODOS los datos de las siguientes tablas:');
  }
  
  const tableNames = getTableNames(stage);
  console.log('\n📋 Tablas que serán limpiadas:');
  Object.entries(tableNames).forEach(([key, tableName]) => {
    console.log(`   • ${key}: ${tableName}`);
  });
  
  // Crear cliente DynamoDB
  const dynamoClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({ 
      region,
      // Configuración adicional si es necesario
    })
  );
  
  let totalItemsDeleted = 0;
  const startTime = Date.now();
  
  // Limpiar cada tabla
  for (const [tableKey, tableName] of Object.entries(tableNames)) {
    try {
      const itemsDeleted = await clearTable(dynamoClient, tableName);
      totalItemsDeleted += itemsDeleted;
    } catch (error) {
      console.error(`❌ Error procesando tabla ${tableKey} (${tableName}):`, error.message);
      // Continuar con las demás tablas
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n🎉 ¡Limpieza completada!`);
  console.log(`📊 Total de items eliminados: ${totalItemsDeleted}`);
  console.log(`⏱️  Tiempo transcurrido: ${duration} segundos`);
  console.log(`\n✅ Las tablas están ahora vacías pero siguen existiendo`);
}

// Manejo de errores globales
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  Operación cancelada por el usuario');
  process.exit(0);
});

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error ejecutando el script:', error);
    process.exit(1);
  });
}

module.exports = { clearTable, getTableNames };