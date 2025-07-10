#!/usr/bin/env node

/**
 * Script de migración para generar questionKeys para formularios existentes
 *
 * Este script:
 * 1. Escanea todos los formularios en DynamoDB
 * 2. Genera questionKeys únicos para cada uno
 * 3. Actualiza los registros con los nuevos questionKeys
 *
 * Uso: node scripts/migrate-question-keys.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Configuración
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Inicializar cliente DynamoDB
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Genera un questionKey único basado en el módulo, tipo e ID
 */
function generateQuestionKey(module, type, id) {
  return `${module}:${type}:${id}`;
}

/**
 * Infiere el módulo basado en el SK del item
 */
function inferModule(sk) {
  if (!sk) return 'custom';

  const skLower = sk.toLowerCase();
  if (skLower.includes('smart_voc')) return 'smartvoc';
  if (skLower.includes('cognitive')) return 'cognitive_task';
  if (skLower.includes('welcome')) return 'welcome_screen';
  if (skLower.includes('thank')) return 'thank_you_screen';
  if (skLower.includes('eye')) return 'eye_tracking';
  if (skLower.includes('demographic')) return 'demographic';

  return 'custom';
}

/**
 * Infiere el tipo basado en el SK y otros campos
 */
function inferType(item) {
  // Intentar obtener el tipo de las preguntas si existen
  if (item.questions) {
    try {
      const questions = JSON.parse(item.questions);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions[0].type || 'unknown';
      }
    } catch (e) {
      console.warn('Error parseando questions:', e.message);
    }
  }

  // Fallback basado en SK
  const sk = item.sk || '';
  if (sk.includes('SMART_VOC')) return 'VOC';
  if (sk.includes('COGNITIVE')) return 'COGNITIVE_TASK';
  if (sk.includes('WELCOME')) return 'WELCOME_SCREEN';
  if (sk.includes('THANK')) return 'THANK_YOU_SCREEN';
  if (sk.includes('EYE')) return 'EYE_TRACKING';

  return 'unknown';
}

/**
 * Escanea todos los formularios y los actualiza con questionKeys
 */
async function migrateQuestionKeys() {
  console.log('🚀 Iniciando migración de questionKeys...');
  console.log(`📋 Tabla: ${TABLE_NAME}`);
  console.log(`🌍 Región: ${AWS_REGION}`);

  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  try {
    // Escanear todos los items
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'sk IN (:smart_voc, :cognitive, :welcome, :thank_you, :eye_tracking)',
      ExpressionAttributeValues: {
        ':smart_voc': 'SMART_VOC_FORM',
        ':cognitive': 'COGNITIVE_TASK',
        ':welcome': 'WELCOME_SCREEN',
        ':thank_you': 'THANK_YOU_SCREEN',
        ':eye_tracking': 'EYE_TRACKING_CONFIG'
      }
    });

    const result = await docClient.send(scanCommand);
    const items = result.Items || [];

    console.log(`📊 Encontrados ${items.length} formularios para procesar`);

    // Procesar cada item
    for (const item of items) {
      processedCount++;

      try {
        // Verificar si ya tiene questionKey
        if (item.questionKey) {
          console.log(`⏭️  Item ${item.id} ya tiene questionKey: ${item.questionKey}`);
          continue;
        }

        // Generar questionKey
        const module = inferModule(item.sk);
        const type = inferType(item);
        const questionKey = generateQuestionKey(module, type, item.id);

        console.log(`🔑 Generando questionKey para ${item.id}: ${questionKey}`);

        // Actualizar el item
        const updateCommand = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            id: item.id,
            sk: item.sk
          },
          UpdateExpression: 'SET questionKey = :questionKey',
          ExpressionAttributeValues: {
            ':questionKey': questionKey
          }
        });

        await docClient.send(updateCommand);
        updatedCount++;

        console.log(`✅ Actualizado ${item.id} con questionKey: ${questionKey}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error procesando ${item.id}:`, error.message);
      }
    }

    console.log('\n📈 RESUMEN DE MIGRACIÓN:');
    console.log(`   Total procesados: ${processedCount}`);
    console.log(`   Actualizados: ${updatedCount}`);
    console.log(`   Errores: ${errorCount}`);
    console.log(`   Ya tenían questionKey: ${processedCount - updatedCount - errorCount}`);

    if (errorCount === 0) {
      console.log('🎉 ¡Migración completada exitosamente!');
    } else {
      console.log('⚠️  Migración completada con errores. Revisar logs.');
    }

  } catch (error) {
    console.error('💥 Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateQuestionKeys()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { migrateQuestionKeys };
