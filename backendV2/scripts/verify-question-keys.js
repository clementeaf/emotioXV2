#!/usr/bin/env node

/**
 * Script de verificación para comprobar el estado de questionKeys
 *
 * Este script:
 * 1. Escanea todos los formularios en DynamoDB
 * 2. Verifica cuáles tienen questionKey
 * 3. Reporta estadísticas y ejemplos
 *
 * Uso: node scripts/verify-question-keys.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Configuración
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Inicializar cliente DynamoDB
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Verifica el estado de questionKeys en la tabla
 */
async function verifyQuestionKeys() {
  console.log('🔍 Verificando estado de questionKeys...');
  console.log(`📋 Tabla: ${TABLE_NAME}`);
  console.log(`🌍 Región: ${AWS_REGION}`);

  let totalForms = 0;
  let withQuestionKey = 0;
  let withoutQuestionKey = 0;
  let examples = [];

  try {
    // Escanear todos los formularios
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

    console.log(`📊 Encontrados ${items.length} formularios`);

    // Analizar cada item
    for (const item of items) {
      totalForms++;

      if (item.questionKey) {
        withQuestionKey++;
        if (examples.length < 5) {
          examples.push({
            id: item.id,
            sk: item.sk,
            questionKey: item.questionKey
          });
        }
      } else {
        withoutQuestionKey++;
        console.log(`❌ Formulario sin questionKey: ${item.id} (${item.sk})`);
      }
    }

    // Reportar resultados
    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`   Total de formularios: ${totalForms}`);
    console.log(`   Con questionKey: ${withQuestionKey} (${((withQuestionKey/totalForms)*100).toFixed(1)}%)`);
    console.log(`   Sin questionKey: ${withoutQuestionKey} (${((withoutQuestionKey/totalForms)*100).toFixed(1)}%)`);

    if (examples.length > 0) {
      console.log('\n✅ EJEMPLOS DE QUESTIONKEYS:');
      examples.forEach((example, index) => {
        console.log(`   ${index + 1}. ${example.id} (${example.sk}) -> ${example.questionKey}`);
      });
    }

    if (withoutQuestionKey === 0) {
      console.log('\n🎉 ¡TODOS LOS FORMULARIOS TIENEN QUESTIONKEY!');
      console.log('✅ La migración está completa');
    } else {
      console.log('\n⚠️  HAY FORMULARIOS SIN QUESTIONKEY');
      console.log('🔧 Ejecuta la migración: npm run migrate-question-keys');
    }

    // Verificar duplicados
    const questionKeys = items
      .filter(item => item.questionKey)
      .map(item => item.questionKey);

    const uniqueKeys = new Set(questionKeys);
    const duplicates = questionKeys.length - uniqueKeys.size;

    if (duplicates > 0) {
      console.log(`\n⚠️  ADVERTENCIA: ${duplicates} questionKeys duplicados encontrados`);
    } else {
      console.log('\n✅ Todos los questionKeys son únicos');
    }

  } catch (error) {
    console.error('💥 Error durante la verificación:', error);
    process.exit(1);
  }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  verifyQuestionKeys()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en verificación:', error);
      process.exit(1);
    });
}

module.exports = { verifyQuestionKeys };
