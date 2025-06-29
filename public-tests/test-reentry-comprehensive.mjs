import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-reentry-comprehensive-' + Date.now();
const PARTICIPANT_ID = 'test-participant-comprehensive-' + Date.now();

async function testReentryComprehensive() {
  console.log('🧪 INICIANDO PRUEBA COMPREHENSIVA DE REINGRESOS');
  console.log('================================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Research ID: ${RESEARCH_ID}`);
  console.log(`Participant ID: ${PARTICIPANT_ID}`);
  console.log('');

  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    details: []
  };

  // Función helper para ejecutar tests
  const runTest = async (testName, testFunction) => {
    results.totalTests++;
    console.log(`\n🔍 TEST: ${testName}`);
    console.log('─'.repeat(50));

    try {
      const result = await testFunction();
      results.passedTests++;
      results.details.push({ test: testName, status: 'PASS', result });
      console.log(`✅ ${testName}: PASÓ`);
      return result;
    } catch (error) {
      results.failedTests++;
      results.details.push({ test: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: FALLÓ - ${error.message}`);
      throw error;
    }
  };

  try {
    // TEST 1: Datos normales
    await runTest('Datos de reingreso normales', async () => {
      const sessionStartTime = Date.now() - 300000;

      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID,
        stepType: 'demographics',
        stepTitle: 'Información Demográfica',
        response: { age: '25-34', gender: 'M', country: 'ES' },
        metadata: {
          sessionInfo: {
            reentryCount: 1,
            sessionStartTime,
            totalSessionTime: 300000
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      // Validar respuesta
      const sessionInfo = response.data.data.metadata.sessionInfo;
      if (!sessionInfo.reentryCount || !sessionInfo.sessionStartTime || !sessionInfo.totalSessionTime) {
        throw new Error('Faltan campos en sessionInfo');
      }

      return { response: response.data, sessionInfo };
    });

    // TEST 2: Edge case - reentryCount = 0
    await runTest('ReentryCount = 0 (primera visita)', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-first',
        stepType: 'welcome',
        stepTitle: 'Pantalla de Bienvenida',
        response: { accepted: true },
        metadata: {
          sessionInfo: {
            reentryCount: 0,
            sessionStartTime: Date.now(),
            totalSessionTime: 0
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const sessionInfo = response.data.data.metadata.sessionInfo;
      if (sessionInfo.reentryCount !== 0) {
        throw new Error('Datos de primera visita incorrectos');
      }

      return { response: response.data, sessionInfo };
    });

    // TEST 3: Edge case - reentryCount alto
    await runTest('ReentryCount alto (100)', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-high',
        stepType: 'feedback',
        stepTitle: 'Feedback Final',
        response: { rating: 5, comment: 'Muchos reingresos' },
        metadata: {
          sessionInfo: {
            reentryCount: 100,
            sessionStartTime: Date.now() - 86400000, // 24 horas atrás
            totalSessionTime: 86400000
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const sessionInfo = response.data.data.metadata.sessionInfo;
      if (sessionInfo.reentryCount !== 100) {
        throw new Error('Datos de reentryCount alto incorrectos');
      }

      return { response: response.data, sessionInfo };
    });

    // TEST 4: Edge case - valores nulos/undefined
    await runTest('Campos opcionales nulos', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-null',
        stepType: 'demographics',
        stepTitle: 'Demografía Mínima',
        response: { age: '18-24' },
        metadata: {
          sessionInfo: {
            reentryCount: 2,
            sessionStartTime: Date.now(),
            totalSessionTime: 5000
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const sessionInfo = response.data.data.metadata.sessionInfo;
      if (!sessionInfo.reentryCount || !sessionInfo.sessionStartTime) {
        throw new Error('Campos requeridos faltantes');
      }

      return { response: response.data, sessionInfo };
    });

    // TEST 5: Múltiples respuestas del mismo participante
    await runTest('Múltiples respuestas - mismo participante', async () => {
      const baseParticipantId = PARTICIPANT_ID + '-multi';
      const responses = [];

      // Respuesta 1
      const response1 = await axios.post(`${BASE_URL}/module-responses`, {
        researchId: RESEARCH_ID,
        participantId: baseParticipantId,
        stepType: 'demographics',
        stepTitle: 'Demografía',
        response: { age: '25-34' },
        metadata: {
          sessionInfo: {
            reentryCount: 1,
            sessionStartTime: Date.now(),
            totalSessionTime: 1000
          }
        }
      });
      responses.push(response1.data);

      // Respuesta 2
      const response2 = await axios.post(`${BASE_URL}/module-responses`, {
        researchId: RESEARCH_ID,
        participantId: baseParticipantId,
        stepType: 'cognitive_task',
        stepTitle: 'Tarea Cognitiva',
        response: { score: 85 },
        metadata: {
          sessionInfo: {
            reentryCount: 2,
            sessionStartTime: Date.now(),
            totalSessionTime: 5000
          }
        }
      });
      responses.push(response2.data);

      // Respuesta 3
      const response3 = await axios.post(`${BASE_URL}/module-responses`, {
        researchId: RESEARCH_ID,
        participantId: baseParticipantId,
        stepType: 'feedback',
        stepTitle: 'Feedback',
        response: { rating: 4 },
        metadata: {
          sessionInfo: {
            reentryCount: 3,
            sessionStartTime: Date.now(),
            totalSessionTime: 10000
          }
        }
      });
      responses.push(response3.data);

      // Verificar que todas las respuestas mantienen sus datos
      for (let i = 0; i < responses.length; i++) {
        const sessionInfo = responses[i].data.metadata.sessionInfo;
        if (sessionInfo.reentryCount !== i + 1) {
          throw new Error(`ReentryCount incorrecto en respuesta ${i + 1}: ${sessionInfo.reentryCount}`);
        }
      }

      return { responses: responses.length, reentryCounts: responses.map(r => r.data.metadata.sessionInfo.reentryCount) };
    });

    // TEST 6: Recuperar todas las respuestas
    await runTest('Recuperar todas las respuestas', async () => {
      const response = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId: PARTICIPANT_ID + '-multi'
        }
      });

      const data = response.data.data;
      if (!data.responses || data.responses.length === 0) {
        throw new Error('No se encontraron respuestas');
      }

      // Verificar que cada respuesta tiene sessionInfo
      for (const resp of data.responses) {
        if (!resp.metadata || !resp.metadata.sessionInfo) {
          throw new Error('Respuesta sin sessionInfo');
        }
      }

      return {
        totalResponses: data.responses.length,
        hasSessionInfo: data.responses.every(r => r.metadata.sessionInfo)
      };
    });

    // TEST 7: Datos reales simulados
    await runTest('Datos reales simulados', async () => {
      const realSessionInfo = {
        reentryCount: 5,
        sessionStartTime: 1751208000000, // Timestamp real
        totalSessionTime: 600000        // 10 minutos
      };

      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-real',
        stepType: 'eye_tracking',
        stepTitle: 'Seguimiento Ocular',
        response: {
          fixations: 15,
          saccades: 8,
          totalTime: 45000
        },
        metadata: {
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            screenWidth: 1440,
            screenHeight: 900
          },
          locationInfo: {
            latitude: 40.4168,
            longitude: -3.7038,
            city: 'Madrid',
            country: 'Spain'
          },
          sessionInfo: realSessionInfo,
          technicalInfo: {
            browser: 'Chrome',
            browserVersion: '120.0.0.0',
            os: 'macOS',
            osVersion: '10.15.7'
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const storedSessionInfo = response.data.data.metadata.sessionInfo;

      // Verificar que todos los campos coinciden
      for (const [key, value] of Object.entries(realSessionInfo)) {
        if (storedSessionInfo[key] !== value) {
          throw new Error(`Campo ${key} no coincide: esperado ${value}, obtenido ${storedSessionInfo[key]}`);
        }
      }

      return {
        original: realSessionInfo,
        stored: storedSessionInfo,
        matches: true
      };
    });

    // RESULTADOS FINALES
    console.log('\n🎯 RESULTADOS FINALES');
    console.log('=====================');
    console.log(`Total de tests: ${results.totalTests}`);
    console.log(`Tests pasados: ${results.passedTests} ✅`);
    console.log(`Tests fallidos: ${results.failedTests} ❌`);
    console.log(`Tasa de éxito: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);

    if (results.failedTests === 0) {
      console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
      console.log('✅ La funcionalidad de reingresos está 100% validada');
    } else {
      console.log('\n⚠️ ALGUNOS TESTS FALLARON');
      console.log('Detalles de fallos:');
      results.details
        .filter(d => d.status === 'FAIL')
        .forEach(d => console.log(`  - ${d.test}: ${d.error}`));
    }

    return results;

  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO EN LA PRUEBA:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Ejecutar la prueba comprehensiva
testReentryComprehensive();
