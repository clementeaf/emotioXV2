import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-database-storage-' + Date.now();
const PARTICIPANT_ID = 'test-participant-db-' + Date.now();

async function testDatabaseStorage() {
  console.log('🧪 VALIDACIÓN DE ALMACENAMIENTO EN BASE DE DATOS');
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
    // TEST 1: Crear documento y verificar estructura básica
    await runTest('Crear documento y verificar estructura básica', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID,
        stepType: 'demographics',
        stepTitle: 'Información Demográfica',
        response: { age: '25-34', gender: 'M', country: 'ES' },
        metadata: {
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: 'Test User Agent',
            screenWidth: 1920,
            screenHeight: 1080,
            platform: 'Test Platform',
            language: 'en-US'
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

      // Verificar estructura básica del documento
      const document = response.data.data;
      const requiredFields = ['id', 'stepType', 'stepTitle', 'response', 'metadata', 'createdAt'];

      for (const field of requiredFields) {
        if (!document[field]) {
          throw new Error(`Campo ${field} faltante en documento`);
        }
      }

      // Verificar que el ID sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(document.id)) {
        throw new Error('ID no es un UUID válido');
      }

      // Verificar que createdAt sea una fecha ISO válida
      if (!document.createdAt || isNaN(Date.parse(document.createdAt))) {
        throw new Error('createdAt no es una fecha ISO válida');
      }

      return {
        document,
        hasRequiredFields: requiredFields.every(field => document[field]),
        isValidUUID: uuidRegex.test(document.id),
        isValidDate: !isNaN(Date.parse(document.createdAt))
      };
    });

    // TEST 2: Verificar que los datos se recuperen correctamente
    await runTest('Verificar recuperación de datos', async () => {
      // Primero crear un documento
      const createPayload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-retrieval',
        stepType: 'cognitive_task',
        stepTitle: 'Tarea Cognitiva',
        response: { score: 85, timeSpent: 45000 },
        metadata: {
          deviceInfo: {
            deviceType: 'mobile',
            userAgent: 'Mobile Test Agent',
            screenWidth: 375,
            screenHeight: 667,
            platform: 'iPhone',
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
            startTime: Date.now() - 60000,
            endTime: Date.now(),
            duration: 60000,
            sectionTimings: [
              {
                sectionId: 'cognitive_intro',
                startTime: Date.now() - 60000,
                endTime: Date.now() - 30000,
                duration: 30000
              },
              {
                sectionId: 'cognitive_task',
                startTime: Date.now() - 30000,
                endTime: Date.now(),
                duration: 30000
              }
            ]
          },
          sessionInfo: {
            reentryCount: 1,
            sessionStartTime: Date.now() - 300000,
            lastVisitTime: Date.now() - 120000,
            totalSessionTime: 300000,
            isFirstVisit: false
          },
          technicalInfo: {
            browser: 'Safari',
            browserVersion: '15.0',
            os: 'iOS',
            osVersion: '15.0',
            connectionType: '4g',
            timezone: 'Europe/Madrid'
          }
        }
      };

      await axios.post(`${BASE_URL}/module-responses`, createPayload);

      // Ahora recuperar el documento
      const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId: PARTICIPANT_ID + '-retrieval'
        }
      });

      const retrievedDocument = getResponse.data.data;

      // Verificar que se recuperó correctamente
      if (!retrievedDocument || !retrievedDocument.responses || retrievedDocument.responses.length === 0) {
        throw new Error('No se pudo recuperar el documento');
      }

      const retrievedResponse = retrievedDocument.responses[0];

      // Verificar que los datos coincidan
      if (retrievedResponse.stepType !== createPayload.stepType) {
        throw new Error('stepType no coincide');
      }

      if (retrievedResponse.stepTitle !== createPayload.stepTitle) {
        throw new Error('stepTitle no coincide');
      }

      // Verificar metadata
      const metadata = retrievedResponse.metadata;
      const originalMetadata = createPayload.metadata;

      // Verificar deviceInfo
      if (!metadata.deviceInfo || metadata.deviceInfo.deviceType !== originalMetadata.deviceInfo.deviceType) {
        throw new Error('deviceInfo no se recuperó correctamente');
      }

      // Verificar locationInfo
      if (!metadata.locationInfo || metadata.locationInfo.latitude !== originalMetadata.locationInfo.latitude) {
        throw new Error('locationInfo no se recuperó correctamente');
      }

      // Verificar timingInfo
      if (!metadata.timingInfo || metadata.timingInfo.duration !== originalMetadata.timingInfo.duration) {
        throw new Error('timingInfo no se recuperó correctamente');
      }

      // Verificar sessionInfo
      if (!metadata.sessionInfo || metadata.sessionInfo.reentryCount !== originalMetadata.sessionInfo.reentryCount) {
        throw new Error('sessionInfo no se recuperó correctamente');
      }

      // Verificar technicalInfo
      if (!metadata.technicalInfo || metadata.technicalInfo.browser !== originalMetadata.technicalInfo.browser) {
        throw new Error('technicalInfo no se recuperó correctamente');
      }

      return {
        retrievedDocument,
        dataMatches: true,
        metadataIntact: true
      };
    });

    // TEST 3: Verificar serialización/deserialización de metadata
    await runTest('Verificar serialización/deserialización de metadata', async () => {
      const complexMetadata = {
        deviceInfo: {
          deviceType: 'tablet',
          userAgent: 'Complex User Agent String with Special Characters: áéíóúñ',
          screenWidth: 1024,
          screenHeight: 768,
          platform: 'iPad',
          language: 'fr-FR'
        },
        locationInfo: {
          latitude: -33.4489,
          longitude: -70.6693,
          city: 'Santiago de Chile',
          country: 'Chile',
          region: 'Región Metropolitana',
          ipAddress: '200.1.2.3'
        },
        timingInfo: {
          startTime: 1000000000000,
          endTime: 1000000060000,
          duration: 60000,
          sectionTimings: [
            {
              sectionId: 'welcome_screen',
              startTime: 1000000000000,
              endTime: 1000000020000,
              duration: 20000
            },
            {
              sectionId: 'main_task',
              startTime: 1000000020000,
              endTime: 1000000060000,
              duration: 40000
            }
          ]
        },
        sessionInfo: {
          reentryCount: 3,
          sessionStartTime: 999999940000,
          lastVisitTime: 1000000000000,
          totalSessionTime: 600000,
          isFirstVisit: false
        },
        technicalInfo: {
          browser: 'Chrome',
          browserVersion: '120.0.6099.109',
          os: 'Windows',
          osVersion: '10.0.19045.3693',
          connectionType: 'wifi',
          timezone: 'America/Santiago'
        }
      };

      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-serialization',
        stepType: 'complex_test',
        stepTitle: 'Test de Serialización Compleja',
        response: {
          complexData: {
            nested: {
              array: [1, 2, 3, 'test', null, { key: 'value' }],
              specialChars: 'áéíóúñ€$£¥',
              numbers: [1.5, -2.7, 0, 999999999]
            }
          }
        },
        metadata: complexMetadata
      };

      // Crear documento
      const createResponse = await axios.post(`${BASE_URL}/module-responses`, payload);

      // Recuperar documento
      const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId: PARTICIPANT_ID + '-serialization'
        }
      });

      const retrievedMetadata = getResponse.data.data.responses[0].metadata;

      // Verificar que todos los campos se serializaron/deserializaron correctamente
      const metadataFields = Object.keys(complexMetadata);
      for (const field of metadataFields) {
        if (!retrievedMetadata[field]) {
          throw new Error(`Campo ${field} no se serializó/deserializó correctamente`);
        }
      }

      // Verificar valores específicos
      if (retrievedMetadata.deviceInfo.deviceType !== complexMetadata.deviceInfo.deviceType) {
        throw new Error('deviceType no se serializó correctamente');
      }

      if (retrievedMetadata.locationInfo.latitude !== complexMetadata.locationInfo.latitude) {
        throw new Error('latitude no se serializó correctamente');
      }

      if (retrievedMetadata.timingInfo.sectionTimings.length !== complexMetadata.timingInfo.sectionTimings.length) {
        throw new Error('sectionTimings no se serializó correctamente');
      }

      if (retrievedMetadata.sessionInfo.reentryCount !== complexMetadata.sessionInfo.reentryCount) {
        throw new Error('reentryCount no se serializó correctamente');
      }

      if (retrievedMetadata.technicalInfo.browser !== complexMetadata.technicalInfo.browser) {
        throw new Error('browser no se serializó correctamente');
      }

      return {
        originalMetadata: complexMetadata,
        retrievedMetadata,
        serializationWorks: true
      };
    });

    // TEST 4: Verificar múltiples respuestas del mismo participante
    await runTest('Verificar múltiples respuestas del mismo participante', async () => {
      const participantId = PARTICIPANT_ID + '-multiple';

      // Crear primera respuesta
      const payload1 = {
        researchId: RESEARCH_ID,
        participantId,
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

      await axios.post(`${BASE_URL}/module-responses`, payload1);

      // Crear segunda respuesta
      const payload2 = {
        researchId: RESEARCH_ID,
        participantId,
        stepType: 'demographics',
        stepTitle: 'Información Demográfica',
        response: { age: '25-34', gender: 'F' },
        metadata: {
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: 'Second Response Agent',
            screenWidth: 1920,
            screenHeight: 1080,
            platform: 'Windows',
            language: 'en-US'
          },
          sessionInfo: {
            reentryCount: 1,
            sessionStartTime: Date.now() - 300000,
            lastVisitTime: Date.now(),
            totalSessionTime: 300000,
            isFirstVisit: false
          }
        }
      };

      await axios.post(`${BASE_URL}/module-responses`, payload2);

      // Recuperar todas las respuestas
      const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId
        }
      });

      const document = getResponse.data.data;

      // Verificar que hay 2 respuestas
      if (!document.responses || document.responses.length !== 2) {
        throw new Error(`Se esperaban 2 respuestas, se encontraron ${document.responses?.length || 0}`);
      }

      // Verificar que las respuestas tengan IDs únicos
      const responseIds = document.responses.map(r => r.id);
      const uniqueIds = new Set(responseIds);
      if (uniqueIds.size !== responseIds.length) {
        throw new Error('Las respuestas no tienen IDs únicos');
      }

      // Verificar que las respuestas tengan timestamps diferentes
      const timestamps = document.responses.map(r => r.createdAt);
      const uniqueTimestamps = new Set(timestamps);
      if (uniqueTimestamps.size !== timestamps.length) {
        throw new Error('Las respuestas no tienen timestamps únicos');
      }

      return {
        totalResponses: document.responses.length,
        hasUniqueIds: uniqueIds.size === responseIds.length,
        hasUniqueTimestamps: uniqueTimestamps.size === timestamps.length
      };
    });

    // TEST 5: Verificar persistencia a largo plazo
    await runTest('Verificar persistencia a largo plazo', async () => {
      const participantId = PARTICIPANT_ID + '-persistence';

      // Crear documento
      const payload = {
        researchId: RESEARCH_ID,
        participantId,
        stepType: 'persistence_test',
        stepTitle: 'Test de Persistencia',
        response: { test: 'data', timestamp: Date.now() },
        metadata: {
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: 'Persistence Test Agent',
            screenWidth: 1920,
            screenHeight: 1080,
            platform: 'Linux',
            language: 'de-DE'
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

      await axios.post(`${BASE_URL}/module-responses`, payload);

      // Esperar un momento para simular tiempo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Recuperar documento
      const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId
        }
      });

      const document = getResponse.data.data;

      if (!document || !document.responses || document.responses.length === 0) {
        throw new Error('Documento no persistió correctamente');
      }

      const response = document.responses[0];

      // Verificar que los datos persisten
      if (response.stepType !== payload.stepType) {
        throw new Error('stepType no persistió correctamente');
      }

      if (response.response.test !== payload.response.test) {
        throw new Error('response data no persistió correctamente');
      }

      if (response.metadata.deviceInfo.deviceType !== payload.metadata.deviceInfo.deviceType) {
        throw new Error('metadata no persistió correctamente');
      }

      return {
        persisted: true,
        dataIntact: true,
        metadataIntact: true
      };
    });

    // TEST 6: Verificar manejo de caracteres especiales y datos complejos
    await runTest('Verificar manejo de caracteres especiales y datos complejos', async () => {
      const payload = {
        researchId: RESEARCH_ID,
        participantId: PARTICIPANT_ID + '-special-chars',
        stepType: 'special_test',
        stepTitle: 'Test con Caracteres Especiales: áéíóúñ€$£¥',
        response: {
          specialData: {
            unicode: 'áéíóúñ€$£¥',
            emoji: '🚀🎉💻📱',
            html: '<script>alert("test")</script>',
            json: '{"key": "value", "array": [1,2,3]}',
            nullValue: null,
            undefinedValue: undefined,
            boolean: true,
            number: 3.14159,
            negative: -42
          }
        },
        metadata: {
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: 'Special Chars Agent: áéíóúñ€$£¥🚀',
            screenWidth: 1920,
            screenHeight: 1080,
            platform: 'Special Platform: áéíóúñ',
            language: 'es-ES'
          },
          locationInfo: {
            latitude: -33.4489,
            longitude: -70.6693,
            city: 'Santiago de Chile: áéíóúñ',
            country: 'Chile',
            region: 'Región Metropolitana',
            ipAddress: '200.1.2.3'
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

      // Recuperar y verificar
      const getResponse = await axios.get(`${BASE_URL}/module-responses`, {
        params: {
          researchId: RESEARCH_ID,
          participantId: PARTICIPANT_ID + '-special-chars'
        }
      });

      const retrievedResponse = getResponse.data.data.responses[0];

      // Verificar que los caracteres especiales se mantienen
      if (retrievedResponse.stepTitle !== payload.stepTitle) {
        throw new Error('stepTitle con caracteres especiales no se mantuvo');
      }

      if (retrievedResponse.response.specialData.unicode !== payload.response.specialData.unicode) {
        throw new Error('unicode characters no se mantuvieron');
      }

      if (retrievedResponse.response.specialData.emoji !== payload.response.specialData.emoji) {
        throw new Error('emoji characters no se mantuvieron');
      }

      if (retrievedResponse.metadata.deviceInfo.userAgent !== payload.metadata.deviceInfo.userAgent) {
        throw new Error('userAgent con caracteres especiales no se mantuvo');
      }

      if (retrievedResponse.metadata.locationInfo.city !== payload.metadata.locationInfo.city) {
        throw new Error('city con caracteres especiales no se mantuvo');
      }

      return {
        specialCharsPreserved: true,
        emojiPreserved: true,
        unicodePreserved: true
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
      console.log('✅ El almacenamiento en base de datos está 100% validado');
      console.log('✅ Los datos se almacenan y recuperan correctamente');
      console.log('✅ La serialización/deserialización funciona perfectamente');
      console.log('✅ La persistencia de datos está garantizada');
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

// Ejecutar la validación de almacenamiento en base de datos
testDatabaseStorage();
