import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-metadata-validation-' + Date.now();
const PARTICIPANT_ID = 'test-participant-metadata-' + Date.now();

async function testMetadataValidation() {
  console.log('🧪 INICIANDO PRUEBA DE VALIDACIÓN DE METADATA');
  console.log('=============================================');
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
    // TEST 1: Metadata completa con todos los parámetros habilitados
    await runTest('Metadata completa - todos los parámetros habilitados', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID,
        stepType: 'demographics',
        stepTitle: 'Información Demográfica Completa',
        response: { age: '25-34', gender: 'M', country: 'ES' },
        metadata: {
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            screenWidth: 1440,
            screenHeight: 900,
            platform: 'MacIntel',
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
            startTime: Date.now() - 300000,
            endTime: Date.now(),
            duration: 300000,
            sectionTimings: [
              {
                sectionId: 'demographics',
                startTime: Date.now() - 300000,
                endTime: Date.now(),
                duration: 300000
              }
            ]
          },
          sessionInfo: {
            reentryCount: 1,
            sessionStartTime: Date.now() - 600000,
            lastVisitTime: Date.now() - 300000,
            totalSessionTime: 600000,
            isFirstVisit: false
          },
          technicalInfo: {
            browser: 'Chrome',
            browserVersion: '120.0.0.0',
            os: 'macOS',
            osVersion: '10.15.7',
            connectionType: 'wifi',
            timezone: 'Europe/Madrid'
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      // Validar que todos los campos de metadata estén presentes
      const metadata = response.data.data.metadata;
      const requiredFields = ['deviceInfo', 'locationInfo', 'timingInfo', 'sessionInfo', 'technicalInfo'];

      for (const field of requiredFields) {
        if (!metadata[field]) {
          throw new Error(`Campo ${field} faltante en metadata`);
        }
      }

      return {
        response: response.data,
        metadataFields: Object.keys(metadata),
        hasAllFields: requiredFields.every(field => metadata[field])
      };
    });

    // TEST 2: Metadata mínima (solo sessionInfo que siempre se envía)
    await runTest('Metadata mínima - solo sessionInfo', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-minimal',
        stepType: 'welcome',
        stepTitle: 'Pantalla de Bienvenida',
        response: { accepted: true },
        metadata: {
          sessionInfo: {
            reentryCount: 0,
            sessionStartTime: Date.now(),
            lastVisitTime: Date.now(),
            totalSessionTime: 0,
            isFirstVisit: true
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const metadata = response.data.data.metadata;
      if (!metadata.sessionInfo) {
        throw new Error('sessionInfo faltante en metadata mínima');
      }

      return {
        response: response.data,
        metadataFields: Object.keys(metadata),
        hasSessionInfo: !!metadata.sessionInfo
      };
    });

    // TEST 3: Metadata con deviceInfo y technicalInfo
    await runTest('Metadata con deviceInfo y technicalInfo', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-device',
        stepType: 'cognitive_task',
        stepTitle: 'Tarea Cognitiva',
        response: { score: 85, timeSpent: 45000 },
        metadata: {
          deviceInfo: {
            deviceType: 'mobile',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
            screenWidth: 375,
            screenHeight: 667,
            platform: 'iPhone',
            language: 'en-US'
          },
          technicalInfo: {
            browser: 'Safari',
            browserVersion: '14.1.2',
            os: 'iOS',
            osVersion: '14.7.1',
            connectionType: '4g',
            timezone: 'America/New_York'
          },
          sessionInfo: {
            reentryCount: 2,
            sessionStartTime: Date.now() - 120000,
            lastVisitTime: Date.now() - 60000,
            totalSessionTime: 120000,
            isFirstVisit: false
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const metadata = response.data.data.metadata;
      const expectedFields = ['deviceInfo', 'technicalInfo', 'sessionInfo'];

      for (const field of expectedFields) {
        if (!metadata[field]) {
          throw new Error(`Campo ${field} faltante en metadata`);
        }
      }

      return {
        response: response.data,
        metadataFields: Object.keys(metadata),
        hasExpectedFields: expectedFields.every(field => metadata[field])
      };
    });

    // TEST 4: Metadata con locationInfo y timingInfo
    await runTest('Metadata con locationInfo y timingInfo', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-location',
        stepType: 'eye_tracking',
        stepTitle: 'Seguimiento Ocular',
        response: { fixations: 15, saccades: 8, totalTime: 45000 },
        metadata: {
          locationInfo: {
            latitude: 34.0522,
            longitude: -118.2437,
            city: 'Los Angeles',
            country: 'United States',
            region: 'California',
            ipAddress: '10.0.0.1'
          },
          timingInfo: {
            startTime: Date.now() - 60000,
            endTime: Date.now(),
            duration: 60000,
            sectionTimings: [
              {
                sectionId: 'eye_tracking',
                startTime: Date.now() - 60000,
                endTime: Date.now(),
                duration: 60000
              }
            ]
          },
          sessionInfo: {
            reentryCount: 1,
            sessionStartTime: Date.now() - 300000,
            lastVisitTime: Date.now() - 120000,
            totalSessionTime: 300000,
            isFirstVisit: false
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const metadata = response.data.data.metadata;
      const expectedFields = ['locationInfo', 'timingInfo', 'sessionInfo'];

      for (const field of expectedFields) {
        if (!metadata[field]) {
          throw new Error(`Campo ${field} faltante en metadata`);
        }
      }

      return {
        response: response.data,
        metadataFields: Object.keys(metadata),
        hasExpectedFields: expectedFields.every(field => metadata[field])
      };
    });

    // TEST 5: Validar estructura de deviceInfo
    await runTest('Validar estructura de deviceInfo', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-device-structure',
        stepType: 'demographics',
        stepTitle: 'Demografía',
        response: { age: '18-24', gender: 'F' },
        metadata: {
          deviceInfo: {
            deviceType: 'tablet',
            userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
            screenWidth: 768,
            screenHeight: 1024,
            platform: 'iPad',
            language: 'fr-FR'
          },
          sessionInfo: {
            reentryCount: 0,
            sessionStartTime: Date.now(),
            lastVisitTime: Date.now(),
            totalSessionTime: 0,
            isFirstVisit: true
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const deviceInfo = response.data.data.metadata.deviceInfo;
      const requiredDeviceFields = ['deviceType', 'userAgent', 'screenWidth', 'screenHeight', 'platform', 'language'];

      for (const field of requiredDeviceFields) {
        if (!deviceInfo[field]) {
          throw new Error(`Campo ${field} faltante en deviceInfo`);
        }
      }

      return {
        deviceInfo,
        hasAllFields: requiredDeviceFields.every(field => deviceInfo[field])
      };
    });

    // TEST 6: Validar estructura de sessionInfo
    await runTest('Validar estructura de sessionInfo', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-session-structure',
        stepType: 'feedback',
        stepTitle: 'Feedback',
        response: { rating: 5, comment: 'Excelente experiencia' },
        metadata: {
          sessionInfo: {
            reentryCount: 3,
            sessionStartTime: Date.now() - 900000,
            lastVisitTime: Date.now() - 300000,
            totalSessionTime: 900000,
            isFirstVisit: false
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      const sessionInfo = response.data.data.metadata.sessionInfo;
      const requiredSessionFields = ['reentryCount', 'sessionStartTime', 'lastVisitTime', 'totalSessionTime', 'isFirstVisit'];

      for (const field of requiredSessionFields) {
        if (sessionInfo[field] === undefined) {
          throw new Error(`Campo ${field} faltante en sessionInfo`);
        }
      }

      return {
        sessionInfo,
        hasAllFields: requiredSessionFields.every(field => sessionInfo[field] !== undefined)
      };
    });

    // TEST 7: Validar que los datos se almacenen correctamente
    await runTest('Validar almacenamiento correcto de metadata', async () => {
      const testMetadata = {
        deviceInfo: {
          deviceType: 'desktop',
          userAgent: 'Test User Agent',
          screenWidth: 1920,
          screenHeight: 1080,
          platform: 'Test Platform',
          language: 'en-US'
        },
        locationInfo: {
          latitude: 0.0,
          longitude: 0.0,
          city: 'Test City',
          country: 'Test Country',
          region: 'Test Region',
          ipAddress: '127.0.0.1'
        },
        timingInfo: {
          startTime: 1000000,
          endTime: 2000000,
          duration: 1000000,
          sectionTimings: [
            {
              sectionId: 'test_section',
              startTime: 1000000,
              endTime: 2000000,
              duration: 1000000
            }
          ]
        },
        sessionInfo: {
          reentryCount: 5,
          sessionStartTime: 500000,
          lastVisitTime: 1500000,
          totalSessionTime: 1000000,
          isFirstVisit: false
        },
        technicalInfo: {
          browser: 'Test Browser',
          browserVersion: '1.0.0',
          os: 'Test OS',
          osVersion: '1.0.0',
          connectionType: 'test',
          timezone: 'UTC'
        }
      };

      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-storage',
        stepType: 'test',
        stepTitle: 'Test de Almacenamiento',
        response: { test: true },
        metadata: testMetadata
      };

      const response = await axios.post(`${BASE_URL}/module-responses`, payload);

      // Recuperar la respuesta para validar que se almacenó correctamente
      const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId: PARTICIPANT_ID + '-storage'
        }
      });

      const storedMetadata = getResponse.data.data.responses[0].metadata;

      // Comparar metadata original con almacenada
      const metadataFields = Object.keys(testMetadata);
      for (const field of metadataFields) {
        if (!storedMetadata[field]) {
          throw new Error(`Campo ${field} no se almacenó correctamente`);
        }
      }

      return {
        originalFields: metadataFields,
        storedFields: Object.keys(storedMetadata),
        matches: metadataFields.every(field => storedMetadata[field])
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
      console.log('✅ La validación de metadata está 100% validada');
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

// Ejecutar la prueba de validación de metadata
testMetadataValidation();
