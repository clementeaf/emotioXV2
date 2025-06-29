const axios = require('axios');

// Configurar para modo local
const BASE_URL = process.env.IS_OFFLINE === 'true' ? 'http://localhost:3000' : 'https://api.emotioxv2.com';
const RESEARCH_ID = 'test-research-metadata-' + Date.now();
const PARTICIPANT_ID = 'test-participant-metadata-' + Date.now();

async function testMetadataStorage() {
  console.log('🧪 INICIANDO PRUEBA DE ALMACENAMIENTO DE METADATA');
  console.log('================================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Research ID: ${RESEARCH_ID}`);
  console.log(`Participant ID: ${PARTICIPANT_ID}`);
  console.log('');

  try {
    // Paso 1: Crear una respuesta con metadata
    console.log('📝 PASO 1: Creando respuesta con metadata...');
    const testMetadata = {
      deviceInfo: {
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        screenWidth: 1920,
        screenHeight: 1080,
        platform: 'Windows',
        language: 'es-ES'
      },
      locationInfo: {
        latitude: 40.4168,
        longitude: -3.7038,
        city: 'Madrid',
        country: 'Spain',
        region: 'Madrid',
        ipAddress: '192.168.1.1'
      },
      timingInfo: {
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        duration: 5000
      },
      sessionInfo: {
        reentryCount: 1,
        sessionStartTime: Date.now(),
        totalSessionTime: 5000
      },
      technicalInfo: {
        browser: 'Chrome',
        browserVersion: '120.0.0.0',
        os: 'Windows',
        osVersion: '11',
        connectionType: 'wifi',
        timezone: 'Europe/Madrid'
      }
    };

    const createResponsePayload = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
      stepType: 'demographics',
      stepTitle: 'Información Demográfica',
      response: {
        age: '25-34',
        gender: 'M',
        country: 'ES'
      },
      metadata: testMetadata
    };

    console.log('📤 Enviando payload con metadata:', JSON.stringify(createResponsePayload, null, 2));

    const createResponse = await axios.post(`${BASE_URL}/module-responses`, createResponsePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Respuesta del backend:', JSON.stringify(createResponse.data, null, 2));
    console.log('✅ Respuesta creada exitosamente');
    console.log('');

    // Paso 2: Recuperar la respuesta y verificar metadata
    console.log('🔍 PASO 2: Recuperando respuesta para verificar metadata...');

    const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
      params: {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Respuesta del GET:', JSON.stringify(getResponse.data, null, 2));
    console.log('✅ Respuesta recuperada exitosamente');
    console.log('');

    // Paso 3: Análisis de resultados
    console.log('📊 PASO 3: Análisis de resultados...');

    const retrievedData = getResponse.data.data; // Acceder a data.data
    const hasMetadata = retrievedData.metadata && Object.keys(retrievedData.metadata).length > 0;
    const hasResponses = retrievedData.responses && retrievedData.responses.length > 0;
    const firstResponseHasMetadata = hasResponses && retrievedData.responses[0].metadata && Object.keys(retrievedData.responses[0].metadata).length > 0;

    console.log(`✅ Metadata en documento principal: ${hasMetadata ? 'SÍ' : 'NO'}`);
    console.log(`✅ Respuestas encontradas: ${hasResponses ? 'SÍ' : 'NO'}`);
    console.log(`✅ Metadata en primera respuesta: ${firstResponseHasMetadata ? 'SÍ' : 'NO'}`);

    if (hasMetadata) {
      console.log('📋 Metadata del documento principal:');
      console.log(JSON.stringify(retrievedData.metadata, null, 2));
    }

    if (firstResponseHasMetadata) {
      console.log('📋 Metadata de la primera respuesta:');
      console.log(JSON.stringify(retrievedData.responses[0].metadata, null, 2));
    }

    // Verificar que la metadata coincide con la enviada
    if (hasMetadata && retrievedData.metadata.deviceInfo) {
      const deviceTypeMatches = retrievedData.metadata.deviceInfo.deviceType === testMetadata.deviceInfo.deviceType;
      console.log(`✅ Tipo de dispositivo coincide: ${deviceTypeMatches ? 'SÍ' : 'NO'}`);
    }

    console.log('');
    console.log('🎉 PRUEBA COMPLETADA');
    console.log('====================');

    if (hasMetadata && firstResponseHasMetadata) {
      console.log('✅ ÉXITO: Metadata se está guardando y recuperando correctamente');
      return true;
    } else {
      console.log('❌ FALLO: Metadata no se está guardando o recuperando correctamente');
      return false;
    }

  } catch (error) {
    console.error('❌ ERROR durante la prueba:', error.message);
    if (error.response) {
      console.error('📥 Respuesta del servidor:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
    return false;
  }
}

// Ejecutar la prueba
testMetadataStorage().then(success => {
  process.exit(success ? 0 : 1);
});
