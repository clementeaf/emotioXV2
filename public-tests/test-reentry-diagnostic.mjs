import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-reentry-diagnostic-' + Date.now();
const PARTICIPANT_ID = 'test-participant-diagnostic-' + Date.now();

async function testReentryDiagnostic() {
  console.log('🔍 DIAGNÓSTICO DE REINGRESOS EN PRODUCCIÓN');
  console.log('==========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Research ID: ${RESEARCH_ID}`);
  console.log(`Participant ID: ${PARTICIPANT_ID}`);
  console.log('');

  try {
    // Paso 1: Enviar datos con todos los campos
    console.log('📤 PASO 1: Enviando datos con todos los campos...');

    const payload = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
      stepType: 'demographics',
      stepTitle: 'Información Demográfica',
      response: { age: '25-34', gender: 'M', country: 'ES' },
      metadata: {
        sessionInfo: {
          reentryCount: 1,
          sessionStartTime: Date.now(),
          lastVisitTime: Date.now(),
          totalSessionTime: 300000,
          isFirstVisit: true
        }
      }
    };

    console.log('📋 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const response = await axios.post(`${BASE_URL}/module-responses`, payload);

    console.log('📥 Respuesta del backend:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('');

    console.log('📊 Datos recibidos:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // Paso 2: Analizar sessionInfo
    console.log('🔍 PASO 2: Análisis de sessionInfo...');

    const sessionInfo = response.data.data.metadata.sessionInfo;
    console.log('SessionInfo recibido:');
    console.log(JSON.stringify(sessionInfo, null, 2));
    console.log('');

    // Paso 3: Verificar campos
    console.log('✅ PASO 3: Verificación de campos...');

    const expectedFields = ['reentryCount', 'sessionStartTime', 'lastVisitTime', 'totalSessionTime', 'isFirstVisit'];
    const receivedFields = Object.keys(sessionInfo);

    console.log('Campos esperados:', expectedFields);
    console.log('Campos recibidos:', receivedFields);
    console.log('');

    const missingFields = expectedFields.filter(field => !receivedFields.includes(field));
    const extraFields = receivedFields.filter(field => !expectedFields.includes(field));

    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields);
    } else {
      console.log('✅ Todos los campos esperados están presentes');
    }

    if (extraFields.length > 0) {
      console.log('⚠️ Campos extra recibidos:', extraFields);
    }

    // Paso 4: Verificar tipos de datos
    console.log('\n🔍 PASO 4: Verificación de tipos...');

    if (sessionInfo.reentryCount !== undefined) {
      console.log(`✅ reentryCount: ${sessionInfo.reentryCount} (tipo: ${typeof sessionInfo.reentryCount})`);
    }

    if (sessionInfo.sessionStartTime !== undefined) {
      console.log(`✅ sessionStartTime: ${sessionInfo.sessionStartTime} (tipo: ${typeof sessionInfo.sessionStartTime})`);
    }

    if (sessionInfo.lastVisitTime !== undefined) {
      console.log(`✅ lastVisitTime: ${sessionInfo.lastVisitTime} (tipo: ${typeof sessionInfo.lastVisitTime})`);
    } else {
      console.log('❌ lastVisitTime: NO PRESENTE');
    }

    if (sessionInfo.totalSessionTime !== undefined) {
      console.log(`✅ totalSessionTime: ${sessionInfo.totalSessionTime} (tipo: ${typeof sessionInfo.totalSessionTime})`);
    }

    if (sessionInfo.isFirstVisit !== undefined) {
      console.log(`✅ isFirstVisit: ${sessionInfo.isFirstVisit} (tipo: ${typeof sessionInfo.isFirstVisit})`);
    } else {
      console.log('❌ isFirstVisit: NO PRESENTE');
    }

    // Paso 5: Recuperar y verificar
    console.log('\n📥 PASO 5: Recuperando datos...');

    const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
      params: {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID
      }
    });

    console.log('Datos recuperados:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    console.log('');

    // Paso 6: Conclusión
    console.log('🎯 CONCLUSIÓN:');
    console.log('==============');

    if (missingFields.length === 0) {
      console.log('✅ El backend en producción SÍ almacena todos los campos de reingreso');
    } else {
      console.log('❌ El backend en producción NO almacena todos los campos de reingreso');
      console.log('   Campos faltantes:', missingFields);
      console.log('   Esto indica que el backend desplegado NO tiene el esquema actualizado');
    }

    return {
      success: missingFields.length === 0,
      missingFields,
      extraFields,
      sessionInfo,
      responseData: response.data
    };

  } catch (error) {
    console.error('\n💥 ERROR EN DIAGNÓSTICO:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }

    throw error;
  }
}

// Ejecutar diagnóstico
testReentryDiagnostic();
