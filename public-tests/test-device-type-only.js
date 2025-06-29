#!/usr/bin/env node

/**
 * Test específico para validar que el backend reciba y almacene correctamente el tipo de dispositivo
 *
 * Este test se enfoca ÚNICAMENTE en el tipo de dispositivo para aislar el problema
 */

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Test data específico para tipo de dispositivo
const testDeviceInfo = {
  deviceType: 'desktop',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  screenWidth: 1920,
  screenHeight: 1080,
  platform: 'MacIntel',
  language: 'es-ES'
};

// Metadata mínima solo con deviceInfo
const minimalMetadata = {
  deviceInfo: testDeviceInfo
};

async function testDeviceTypeStorage() {
  console.log('🎯 TEST ESPECÍFICO: Validación de tipo de dispositivo');
  console.log('==================================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('');

  const testResearchId = 'test-device-type-' + Date.now();
  const testParticipantId = 'test-participant-device-type-' + Date.now();

  try {
    // PASO 1: Crear respuesta con metadata mínima
    console.log('📤 PASO 1: Enviando respuesta con metadata mínima...');
    console.log('📋 Metadata enviada:', JSON.stringify(minimalMetadata, null, 2));

    const responsePayload = {
      researchId: testResearchId,
      participantId: testParticipantId,
      stepType: 'test_device_type',
      stepTitle: 'Test de Tipo de Dispositivo',
      response: {
        testAnswer: 'Respuesta de prueba para tipo de dispositivo',
        timestamp: new Date().toISOString()
      },
      metadata: minimalMetadata
    };

    const createResponse = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responsePayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Error al crear respuesta: ${createResponse.status} ${createResponse.statusText}\n${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Respuesta creada exitosamente');
    console.log('📋 ID de respuesta:', createResult.data?.id || 'No disponible');
    console.log('📋 Respuesta del backend:', JSON.stringify(createResult, null, 2));
    console.log('');

    // PASO 2: Recuperar la respuesta
    console.log('📥 PASO 2: Recuperando respuesta para verificar almacenamiento...');

    const getResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${testResearchId}&participantId=${testParticipantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Error al recuperar respuesta: ${getResponse.status} ${getResponse.statusText}\n${errorText}`);
    }

    const getResult = await getResponse.json();
    console.log('✅ Respuesta recuperada exitosamente');
    console.log('📋 Respuesta completa del GET:', JSON.stringify(getResult, null, 2));
    console.log('');

    // PASO 3: Análisis específico del tipo de dispositivo
    console.log('🔍 PASO 3: Análisis específico del tipo de dispositivo...');

    if (!getResult.data) {
      console.log('❌ No se encontró data en la respuesta');
      return false;
    }

    const retrievedData = getResult.data;
    const hasResponses = retrievedData.responses && retrievedData.responses.length > 0;

    if (!hasResponses) {
      console.log('❌ No se encontraron respuestas en el documento');
      return false;
    }

    const firstResponse = retrievedData.responses[0];
    console.log('📋 Primera respuesta recuperada:', JSON.stringify(firstResponse, null, 2));

    // Verificar metadata en la respuesta individual
    const responseHasMetadata = firstResponse.metadata && typeof firstResponse.metadata === 'object';
    const responseHasDeviceInfo = responseHasMetadata && firstResponse.metadata.deviceInfo;
    const responseHasDeviceType = responseHasDeviceInfo && firstResponse.metadata.deviceInfo.deviceType;

    console.log('📊 Análisis de metadata en respuesta individual:');
    console.log(`   - Tiene metadata: ${responseHasMetadata ? '✅' : '❌'}`);
    console.log(`   - Tiene deviceInfo: ${responseHasDeviceInfo ? '✅' : '❌'}`);
    console.log(`   - Tiene deviceType: ${responseHasDeviceType ? '✅' : '❌'}`);

    if (responseHasDeviceType) {
      console.log(`   - Tipo de dispositivo almacenado: "${firstResponse.metadata.deviceInfo.deviceType}"`);
      console.log(`   - Tipo de dispositivo esperado: "${testDeviceInfo.deviceType}"`);

      const deviceTypeMatches = firstResponse.metadata.deviceInfo.deviceType === testDeviceInfo.deviceType;
      console.log(`   - Coincide: ${deviceTypeMatches ? '✅' : '❌'}`);
    }

    // Verificar metadata en el documento principal
    const docHasMetadata = retrievedData.metadata && typeof retrievedData.metadata === 'object';
    const docHasDeviceInfo = docHasMetadata && retrievedData.metadata.deviceInfo;
    const docHasDeviceType = docHasDeviceInfo && retrievedData.metadata.deviceInfo.deviceType;

    console.log('📊 Análisis de metadata en documento principal:');
    console.log(`   - Tiene metadata: ${docHasMetadata ? '✅' : '❌'}`);
    console.log(`   - Tiene deviceInfo: ${docHasDeviceInfo ? '✅' : '❌'}`);
    console.log(`   - Tiene deviceType: ${docHasDeviceType ? '✅' : '❌'}`);

    if (docHasDeviceType) {
      console.log(`   - Tipo de dispositivo almacenado: "${retrievedData.metadata.deviceInfo.deviceType}"`);
      console.log(`   - Tipo de dispositivo esperado: "${testDeviceInfo.deviceType}"`);

      const docDeviceTypeMatches = retrievedData.metadata.deviceInfo.deviceType === testDeviceInfo.deviceType;
      console.log(`   - Coincide: ${docDeviceTypeMatches ? '✅' : '❌'}`);
    }

    // PASO 4: Resultado final
    console.log('');
    console.log('🎯 RESULTADO FINAL');
    console.log('==================');

    const success = responseHasDeviceType && responseHasDeviceType === testDeviceInfo.deviceType;

    if (success) {
      console.log('✅ ÉXITO: El tipo de dispositivo se está almacenando correctamente');
      console.log(`   - Tipo enviado: "${testDeviceInfo.deviceType}"`);
      console.log(`   - Tipo almacenado: "${firstResponse.metadata.deviceInfo.deviceType}"`);
    } else {
      console.log('❌ FALLO: El tipo de dispositivo NO se está almacenando correctamente');
      console.log('   - Posibles causas:');
      console.log('     * El backend no está procesando la metadata');
      console.log('     * El backend no está guardando la metadata en DynamoDB');
      console.log('     * El backend no está deserializando correctamente la metadata');
      console.log('     * Hay un problema en el esquema de validación');
    }

    // PASO 5: Limpiar datos de prueba
    console.log('');
    console.log('🧹 Limpiando datos de prueba...');

    const deleteResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${testResearchId}&participantId=${testParticipantId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Datos de prueba eliminados');
    } else {
      console.log('⚠️ No se pudieron eliminar los datos de prueba');
    }

    return success;

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Ejecutar el test
testDeviceTypeStorage()
  .then(success => {
    console.log('');
    console.log('🏁 FINALIZADO');
    console.log('=============');
    console.log(`Resultado: ${success ? '✅ ÉXITO' : '❌ FALLO'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
