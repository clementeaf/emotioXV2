import axios from 'axios';

// Configurar para modo local
const BASE_URL = process.env.IS_OFFLINE === 'true' ? 'http://localhost:3000' : 'https://api.emotioxv2.com';
const RESEARCH_ID = 'test-reentry-storage-' + Date.now();
const PARTICIPANT_ID = 'test-participant-reentry-' + Date.now();

async function testReentryStorage() {
  console.log('🧪 INICIANDO PRUEBA DE ALMACENAMIENTO DE REINGRESOS');
  console.log('===================================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Research ID: ${RESEARCH_ID}`);
  console.log(`Participant ID: ${PARTICIPANT_ID}`);
  console.log('');

  try {
    // Paso 1: Crear una respuesta con datos de reingreso
    console.log('📝 PASO 1: Creando respuesta con datos de reingreso...');

    const sessionStartTime = Date.now() - 300000; // 5 minutos atrás
    const lastVisitTime = Date.now() - 60000; // 1 minuto atrás
    const totalSessionTime = Date.now() - sessionStartTime;

    const reentryMetadata = {
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
        duration: 5000,
        sectionTimings: [
          {
            sectionId: 'welcome',
            startTime: Date.now(),
            endTime: Date.now() + 2000,
            duration: 2000
          }
        ]
      },
      sessionInfo: {
        reentryCount: 3,
        sessionStartTime: sessionStartTime,
        lastVisitTime: lastVisitTime,
        totalSessionTime: totalSessionTime,
        isFirstVisit: false
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
      metadata: reentryMetadata
    };

    console.log('📤 Enviando payload con datos de reingreso:', JSON.stringify(createResponsePayload, null, 2));

    const createResponse = await axios.post(`${BASE_URL}/module-responses`, createResponsePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Respuesta del backend:', JSON.stringify(createResponse.data, null, 2));
    console.log('✅ Respuesta creada exitosamente');
    console.log('');

    // Paso 2: Recuperar la respuesta y verificar datos de reingreso
    console.log('🔍 PASO 2: Recuperando respuesta para verificar datos de reingreso...');

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
    console.log('📊 PASO 3: Análisis de datos de reingreso...');

    const retrievedData = getResponse.data.data;
    const hasSessionInfo = retrievedData.metadata && retrievedData.metadata.sessionInfo;
    const hasResponses = retrievedData.responses && retrievedData.responses.length > 0;
    const firstResponseHasSessionInfo = hasResponses && retrievedData.responses[0].metadata && retrievedData.responses[0].metadata.sessionInfo;

    console.log(`✅ SessionInfo en documento principal: ${hasSessionInfo ? 'SÍ' : 'NO'}`);
    console.log(`✅ Respuestas encontradas: ${hasResponses ? 'SÍ' : 'NO'}`);
    console.log(`✅ SessionInfo en primera respuesta: ${firstResponseHasSessionInfo ? 'SÍ' : 'NO'}`);

    if (hasSessionInfo) {
      const sessionInfo = retrievedData.metadata.sessionInfo;
      console.log('📋 SessionInfo del documento principal:');
      console.log(JSON.stringify(sessionInfo, null, 2));

      // Validar campos específicos de reingreso
      const validations = {
        reentryCount: typeof sessionInfo.reentryCount === 'number' && sessionInfo.reentryCount === 3,
        sessionStartTime: typeof sessionInfo.sessionStartTime === 'number' && sessionInfo.sessionStartTime === sessionStartTime,
        lastVisitTime: typeof sessionInfo.lastVisitTime === 'number' && sessionInfo.lastVisitTime === lastVisitTime,
        totalSessionTime: typeof sessionInfo.totalSessionTime === 'number' && sessionInfo.totalSessionTime > 0,
        isFirstVisit: typeof sessionInfo.isFirstVisit === 'boolean' && sessionInfo.isFirstVisit === false
      };

      console.log('🔍 Validaciones de campos de reingreso:');
      Object.entries(validations).forEach(([field, isValid]) => {
        console.log(`  ${field}: ${isValid ? '✅' : '❌'}`);
      });

      const allValid = Object.values(validations).every(v => v);
      console.log(`\n🎯 RESULTADO FINAL: ${allValid ? '✅ TODOS LOS CAMPOS VÁLIDOS' : '❌ HAY CAMPOS INVÁLIDOS'}`);
    }

    if (firstResponseHasSessionInfo) {
      const responseSessionInfo = retrievedData.responses[0].metadata.sessionInfo;
      console.log('\n📋 SessionInfo de la primera respuesta:');
      console.log(JSON.stringify(responseSessionInfo, null, 2));
    }

    // Paso 4: Crear una segunda respuesta para simular múltiples reingresos
    console.log('\n📝 PASO 4: Creando segunda respuesta con reingreso incrementado...');

    const secondReentryMetadata = {
      ...reentryMetadata,
      sessionInfo: {
        ...reentryMetadata.sessionInfo,
        reentryCount: 4,
        lastVisitTime: Date.now(),
        totalSessionTime: Date.now() - sessionStartTime
      }
    };

    const secondResponsePayload = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
      stepType: 'feedback',
      stepTitle: 'Feedback del Usuario',
      response: {
        rating: 5,
        comment: 'Excelente experiencia'
      },
      metadata: secondReentryMetadata
    };

    const secondCreateResponse = await axios.post(`${BASE_URL}/module-responses`, secondResponsePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Segunda respuesta del backend:', JSON.stringify(secondCreateResponse.data, null, 2));
    console.log('✅ Segunda respuesta creada exitosamente');

    // Paso 5: Verificar que ambas respuestas mantengan sus datos de reingreso
    console.log('\n🔍 PASO 5: Verificando que ambas respuestas mantengan sus datos de reingreso...');

    const finalGetResponse = await axios.get(`${BASE_URL}/module-responses`, {
      params: {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const finalData = finalGetResponse.data.data;
    const responses = finalData.responses || [];

    console.log(`📊 Total de respuestas: ${responses.length}`);

    responses.forEach((response, index) => {
      const hasSessionInfo = response.metadata && response.metadata.sessionInfo;
      const reentryCount = hasSessionInfo ? response.metadata.sessionInfo.reentryCount : 'N/A';
      console.log(`  Respuesta ${index + 1} (${response.stepType}): reentryCount = ${reentryCount} ${hasSessionInfo ? '✅' : '❌'}`);
    });

    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('===================================');

  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error.response ? error.response.data : error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar la prueba
testReentryStorage();
