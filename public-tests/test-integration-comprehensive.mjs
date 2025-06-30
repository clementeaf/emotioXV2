#!/usr/bin/env node

/**
 * TEST COMPREHENSIVO: INTEGRACIÓN BACKEND-FRONTEND AVANZADO
 *
 * Este test valida el flujo completo de datos desde el frontend hasta el backend
 * y viceversa, incluyendo todos los tipos de metadata, respuestas y casos edge.
 *
 * Cobertura:
 * - Flujo completo de datos
 * - Validación de metadata completa
 * - Diferentes tipos de dispositivos
 * - Manejo de errores y casos edge
 * - Persistencia de datos
 * - Performance y timeouts
 * - Geolocalización y consentimiento GDPR
 * - Múltiples respuestas por participante
 * - Cleanup y limpieza de datos
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-integration-comprehensive';
const PARTICIPANT_ID = 'test-integration-participant';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}============================================================`);
  console.log(`🔍 ${title}`);
  console.log(`============================================================${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'reset');
  }
}

// ============================================================================
// DATOS DE PRUEBA COMPLETOS
// ============================================================================

const completeTestData = {
  researchId: RESEARCH_ID,
  participantId: `${PARTICIPANT_ID}-complete`,
  stepType: 'demographic',
  stepTitle: 'Datos Demográficos',
  response: {
    age: 28,
    gender: 'female',
    country: 'Spain',
    education: 'university',
    employment: 'employed'
  },
  metadata: {
    deviceInfo: {
      deviceType: 'desktop',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'Win32',
      language: 'es-ES'
    },
    locationInfo: {
      latitude: 40.4167754,
      longitude: -3.7037902,
      accuracy: 15,
      city: 'Madrid',
      country: 'Spain',
      region: 'Madrid',
      ipAddress: '192.168.1.100',
      source: 'gps'
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
      lastVisitTime: Date.now(),
      totalSessionTime: 600000,
      isFirstVisit: false
    },
    technicalInfo: {
      browser: 'Chrome',
      browserVersion: '91.0.4472.124',
      os: 'Windows',
      osVersion: '10.0',
      connectionType: 'wifi',
      timezone: 'Europe/Madrid'
    }
  }
};

// ============================================================================
// TESTS DE INTEGRACIÓN AVANZADOS
// ============================================================================

async function testCompleteDataFlow() {
  logSection('FLUJO COMPLETO DE DATOS');
  let allPassed = true;

  try {
    // 1. Enviar datos completos al backend
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeTestData)
    });

    const result = await response.json();
    const savePassed = response.status === 201;

    logTest('Enviar datos completos al backend', savePassed,
      savePassed ? 'Status: 201 - Datos enviados correctamente' : `Error: ${result.error || response.status}`);

    if (!savePassed) {
      allPassed = false;
      return allPassed;
    }

    // 2. Recuperar datos del backend
    const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-complete`);

    if (retrieveResponse.status === 200) {
      const retrievedData = await retrieveResponse.json();
      const responseData = retrievedData.data?.responses?.[0];

      if (responseData) {
        // Validar estructura básica
        const hasBasicStructure = responseData.stepType && responseData.stepTitle && responseData.response;
        logTest('Estructura básica de respuesta', hasBasicStructure,
          hasBasicStructure ? 'StepType, StepTitle y Response presentes' : 'Faltan campos básicos');

        // Validar metadata completa
        const metadata = responseData.metadata;
        const hasDeviceInfo = metadata?.deviceInfo?.deviceType;
        const hasLocationInfo = metadata?.locationInfo?.latitude;
        const hasTimingInfo = metadata?.timingInfo?.startTime;
        const hasSessionInfo = metadata?.sessionInfo?.reentryCount;
        const hasTechnicalInfo = metadata?.technicalInfo?.browser;

        logTest('Metadata completa presente', hasDeviceInfo && hasLocationInfo && hasTimingInfo && hasSessionInfo && hasTechnicalInfo,
          `Device: ${hasDeviceInfo ? '✅' : '❌'}, Location: ${hasLocationInfo ? '✅' : '❌'}, Timing: ${hasTimingInfo ? '✅' : '❌'}, Session: ${hasSessionInfo ? '✅' : '❌'}, Technical: ${hasTechnicalInfo ? '✅' : '❌'}`);

        // Validar integridad de datos
        const dataIntegrity =
          responseData.stepType === completeTestData.stepType &&
          responseData.stepTitle === completeTestData.stepTitle &&
          metadata?.deviceInfo?.deviceType === completeTestData.metadata.deviceInfo.deviceType &&
          metadata?.sessionInfo?.reentryCount === completeTestData.metadata.sessionInfo.reentryCount;

        logTest('Integridad de datos', dataIntegrity,
          dataIntegrity ? 'Datos preservados correctamente' : 'Datos modificados o perdidos');

        allPassed = hasBasicStructure && hasDeviceInfo && hasLocationInfo && hasTimingInfo && hasSessionInfo && hasTechnicalInfo && dataIntegrity;

      } else {
        logTest('Recuperar datos del backend', false, 'No se encontraron datos de respuesta');
        allPassed = false;
      }
    } else {
      logTest('Recuperar datos del backend', false, `Error: ${retrieveResponse.status}`);
      allPassed = false;
    }

  } catch (error) {
    logTest('Flujo completo de datos', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testDifferentDeviceTypes() {
  logSection('DIFERENTES TIPOS DE DISPOSITIVOS');
  let allPassed = true;

  const deviceTypes = ['mobile', 'tablet', 'desktop'];

  for (const deviceType of deviceTypes) {
    const deviceData = {
      researchId: RESEARCH_ID,
      participantId: `${PARTICIPANT_ID}-${deviceType}`,
      stepType: 'demographic',
      stepTitle: 'Datos Demográficos',
      response: { age: 25, gender: 'male' },
      metadata: {
        deviceInfo: { deviceType },
        locationInfo: { latitude: 40.4167754, longitude: -3.7037902 },
        timingInfo: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
        sessionInfo: { reentryCount: 0, isFirstVisit: true },
        technicalInfo: { browser: 'Chrome' }
      }
    };

    try {
      // Enviar
      const response = await fetch(`${API_BASE_URL}/module-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });

      const savePassed = response.status === 201;
      logTest(`Enviar datos ${deviceType}`, savePassed, savePassed ? 'Enviado correctamente' : 'Error al enviar');

      if (savePassed) {
        // Recuperar
        const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-${deviceType}`);

        if (retrieveResponse.status === 200) {
          const retrievedData = await retrieveResponse.json();
          const retrievedDeviceType = retrievedData.data?.responses?.[0]?.metadata?.deviceInfo?.deviceType;

          const retrievePassed = retrievedDeviceType === deviceType;
          logTest(`Recuperar datos ${deviceType}`, retrievePassed,
            retrievePassed ? `Recuperado como: ${retrievedDeviceType}` : 'Tipo de dispositivo no coincide');

          if (!retrievePassed) allPassed = false;
        } else {
          logTest(`Recuperar datos ${deviceType}`, false, `Error: ${retrieveResponse.status}`);
          allPassed = false;
        }
      } else {
        allPassed = false;
      }

    } catch (error) {
      logTest(`Test ${deviceType}`, false, `Error: ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testErrorHandling() {
  logSection('MANEJO DE ERRORES Y VALIDACIÓN');
  let allPassed = true;

  // Test 1: Datos inválidos
  const invalidData = {
    researchId: '', // ID vacío
    participantId: null, // ID nulo
    stepType: undefined, // Tipo indefinido
    response: 'invalid', // Respuesta inválida
    metadata: 'not-an-object' // Metadata inválida
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const result = await response.json();
    const errorHandled = response.status === 400 || response.status === 422;

    logTest('Manejo de datos inválidos', errorHandled,
      errorHandled ? `Error manejado correctamente (${response.status})` : `Error no manejado (${response.status})`);

    if (!errorHandled) allPassed = false;

  } catch (error) {
    logTest('Manejo de datos inválidos', false, `Error inesperado: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Datos faltantes
  const missingData = {
    // Sin researchId ni participantId
    stepType: 'demographic',
    response: { age: 25 }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missingData)
    });

    const result = await response.json();
    const errorHandled = response.status === 400 || response.status === 422;

    logTest('Manejo de datos faltantes', errorHandled,
      errorHandled ? `Error manejado correctamente (${response.status})` : `Error no manejado (${response.status})`);

    if (!errorHandled) allPassed = false;

  } catch (error) {
    logTest('Manejo de datos faltantes', false, `Error inesperado: ${error.message}`);
    allPassed = false;
  }

  // Test 3: Datos válidos después de errores
  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeTestData)
    });

    const validAfterErrors = response.status === 201;
    logTest('Datos válidos después de errores', validAfterErrors,
      validAfterErrors ? 'Sistema recuperado correctamente' : 'Sistema no se recuperó de errores');

    if (!validAfterErrors) allPassed = false;

  } catch (error) {
    logTest('Datos válidos después de errores', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testDataPersistence() {
  logSection('PERSISTENCIA DE DATOS');
  let allPassed = true;

  const persistenceData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-persistence`,
    stepType: 'cognitive_task',
    stepTitle: 'Tarea Cognitiva',
    response: {
      taskId: 'task-123',
      answers: ['A', 'B', 'C'],
      timeSpent: 45000
    },
    metadata: {
      deviceInfo: { deviceType: 'desktop' },
      timingInfo: { startTime: Date.now() - 50000, endTime: Date.now(), duration: 50000 },
      sessionInfo: { reentryCount: 0, isFirstVisit: true }
    }
  };

  try {
    // Enviar datos
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(persistenceData)
    });

    const savePassed = response.status === 201;
    logTest('Guardar datos para persistencia', savePassed, savePassed ? 'Guardado correctamente' : 'Error al guardar');

    if (savePassed) {
      // Esperar un momento para simular tiempo real
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Recuperar datos
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-persistence`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const responseData = retrievedData.data?.responses?.[0];

        if (responseData) {
          const persistenceValid =
            responseData.stepType === persistenceData.stepType &&
            responseData.response?.taskId === persistenceData.response.taskId &&
            responseData.metadata?.deviceInfo?.deviceType === persistenceData.metadata.deviceInfo.deviceType;

          logTest('Persistencia de datos', persistenceValid,
            persistenceValid ? 'Datos persistentes correctamente' : 'Datos no persistentes');

          allPassed = persistenceValid;
        } else {
          logTest('Persistencia de datos', false, 'No se encontraron datos persistentes');
          allPassed = false;
        }
      } else {
        logTest('Persistencia de datos', false, `Error al recuperar: ${retrieveResponse.status}`);
        allPassed = false;
      }
    } else {
      allPassed = false;
    }

  } catch (error) {
    logTest('Persistencia de datos', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testPerformance() {
  logSection('PERFORMANCE Y TIMEOUTS');
  let allPassed = true;

  const startTime = Date.now();

  // Enviar múltiples requests rápidamente
  const promises = Array.from({ length: 5 }, (_, i) =>
    fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...completeTestData,
        participantId: `${PARTICIPANT_ID}-performance-${i}`
      })
    })
  );

  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Validar que todos los requests fueron exitosos
    const allSuccessful = responses.every(response => response.status === 201);
    logTest('Múltiples requests simultáneos', allSuccessful,
      allSuccessful ? 'Todos los requests exitosos' : 'Algunos requests fallaron');

    // Validar que el tiempo total fue razonable (< 10 segundos)
    const timeReasonable = duration < 10000;
    logTest('Tiempo de respuesta razonable', timeReasonable,
      `Duración: ${duration}ms (máximo 10000ms)`);

    allPassed = allSuccessful && timeReasonable;

  } catch (error) {
    logTest('Performance test', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testGeolocation() {
  logSection('GEOLOCALIZACIÓN Y METADATA DE UBICACIÓN');
  let allPassed = true;

  const locationData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-location`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: { age: 30, country: 'Spain' },
    metadata: {
      deviceInfo: { deviceType: 'mobile' },
      locationInfo: {
        latitude: 40.4167754,
        longitude: -3.7037902,
        accuracy: 15,
        city: 'Madrid',
        country: 'Spain',
        region: 'Madrid',
        ipAddress: '192.168.1.100',
        source: 'gps'
      },
      timingInfo: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
      sessionInfo: { reentryCount: 0, isFirstVisit: true },
      technicalInfo: { browser: 'Safari Mobile' }
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });

    const savePassed = response.status === 201;
    logTest('Enviar datos de geolocalización', savePassed, savePassed ? 'Enviado correctamente' : 'Error al enviar');

    if (savePassed) {
      // Recuperar y validar datos de ubicación
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-location`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const responseData = retrievedData.data?.responses?.[0];

        if (responseData) {
          const locationValid =
            responseData.metadata?.locationInfo?.latitude === 40.4167754 &&
            responseData.metadata?.locationInfo?.longitude === -3.7037902 &&
            responseData.metadata?.locationInfo?.city === 'Madrid' &&
            responseData.metadata?.locationInfo?.source === 'gps';

          logTest('Validación de datos de ubicación', locationValid,
            locationValid ? 'Datos de ubicación preservados correctamente' : 'Datos de ubicación modificados o perdidos');

          allPassed = locationValid;
        } else {
          logTest('Validación de datos de ubicación', false, 'No se encontraron datos de ubicación');
          allPassed = false;
        }
      } else {
        logTest('Validación de datos de ubicación', false, `Error al recuperar: ${retrieveResponse.status}`);
        allPassed = false;
      }
    } else {
      allPassed = false;
    }

  } catch (error) {
    logTest('Geolocalización', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testMultipleResponses() {
  logSection('MÚLTIPLES RESPUESTAS POR PARTICIPANTE');
  let allPassed = true;

  const participantId = `${PARTICIPANT_ID}-multiple`;
  const steps = [
    { stepType: 'demographic', stepTitle: 'Datos Demográficos', response: { age: 25 } },
    { stepType: 'cognitive_task', stepTitle: 'Tarea Cognitiva', response: { taskId: 'task-1', answers: ['A'] } },
    { stepType: 'eye_tracking', stepTitle: 'Eye Tracking', response: { sessionId: 'session-1', fixations: [] } }
  ];

  try {
    // Enviar múltiples respuestas para el mismo participante
    for (const step of steps) {
      const stepData = {
        researchId: RESEARCH_ID,
        participantId,
        ...step,
        metadata: {
          deviceInfo: { deviceType: 'desktop' },
          timingInfo: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
          sessionInfo: { reentryCount: 0, isFirstVisit: true },
          technicalInfo: { browser: 'Chrome' }
        }
      };

      const response = await fetch(`${API_BASE_URL}/module-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData)
      });

      if (response.status !== 201) {
        logTest(`Enviar ${step.stepType}`, false, `Error: ${response.status}`);
        allPassed = false;
        break;
      }
    }

    if (allPassed) {
      // Recuperar todas las respuestas del participante
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${participantId}`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const responses = retrievedData.data?.responses;

        if (responses && responses.length === 3) {
          const stepTypes = responses.map(r => r.stepType);
          const expectedTypes = ['demographic', 'cognitive_task', 'eye_tracking'];

          const multipleResponsesValid = stepTypes.every((type, index) => type === expectedTypes[index]);

          logTest('Múltiples respuestas por participante', multipleResponsesValid,
            multipleResponsesValid ? `Recuperadas ${responses.length} respuestas correctamente` : 'Respuestas no coinciden');

          allPassed = multipleResponsesValid;
        } else {
          logTest('Múltiples respuestas por participante', false, `Se encontraron ${responses?.length || 0} respuestas, se esperaban 3`);
          allPassed = false;
        }
      } else {
        logTest('Múltiples respuestas por participante', false, `Error al recuperar: ${retrieveResponse.status}`);
        allPassed = false;
      }
    }

  } catch (error) {
    logTest('Múltiples respuestas por participante', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testCleanup() {
  logSection('CLEANUP Y LIMPIEZA DE DATOS');
  let allPassed = true;

  const cleanupData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-cleanup`,
    stepType: 'test',
    stepTitle: 'Test Cleanup',
    response: { test: true },
    metadata: {
      deviceInfo: { deviceType: 'desktop' },
      timingInfo: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
      sessionInfo: { reentryCount: 0, isFirstVisit: true },
      technicalInfo: { browser: 'Chrome' }
    }
  };

  try {
    // Enviar datos
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanupData)
    });

    const savePassed = response.status === 201;
    logTest('Guardar datos para cleanup', savePassed, savePassed ? 'Guardado correctamente' : 'Error al guardar');

    if (savePassed) {
      // Verificar que existen
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-cleanup`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const existsBefore = retrievedData.data?.responses?.length === 1;

        if (existsBefore) {
          // Eliminar datos
          const deleteResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-cleanup`, {
            method: 'DELETE'
          });

          const deletePassed = deleteResponse.status === 200;
          logTest('Eliminar datos', deletePassed, deletePassed ? 'Eliminado correctamente' : 'Error al eliminar');

          if (deletePassed) {
            // Verificar que fueron eliminados
            const finalRetrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-cleanup`);

            if (finalRetrieveResponse.status === 200) {
              const finalRetrievedData = await finalRetrieveResponse.json();
              const existsAfter = finalRetrievedData.data?.responses?.length === 0;

              logTest('Verificar eliminación', existsAfter, existsAfter ? 'Datos eliminados correctamente' : 'Datos aún existen');

              allPassed = existsAfter;
            } else {
              logTest('Verificar eliminación', false, `Error al verificar: ${finalRetrieveResponse.status}`);
              allPassed = false;
            }
          } else {
            allPassed = false;
          }
        } else {
          logTest('Verificar datos antes de eliminar', false, 'Datos no encontrados antes de eliminar');
          allPassed = false;
        }
      } else {
        logTest('Verificar datos antes de eliminar', false, `Error: ${retrieveResponse.status}`);
        allPassed = false;
      }
    } else {
      allPassed = false;
    }

  } catch (error) {
    logTest('Cleanup', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runComprehensiveIntegrationTests() {
  const startTime = Date.now();

  log(`${colors.bright}🚀 INICIANDO TESTS DE INTEGRACIÓN BACKEND-FRONTEND COMPREHENSIVOS${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  const results = {
    completeFlow: await testCompleteDataFlow(),
    deviceTypes: await testDifferentDeviceTypes(),
    errorHandling: await testErrorHandling(),
    persistence: await testDataPersistence(),
    performance: await testPerformance(),
    geolocation: await testGeolocation(),
    multipleResponses: await testMultipleResponses(),
    cleanup: await testCleanup()
  };

  const endTime = Date.now();
  const duration = endTime - startTime;

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN FINAL: TESTS DE INTEGRACIÓN BACKEND-FRONTEND COMPREHENSIVOS${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}`);
  log(`⏱️  Duración total: ${duration}ms`);
  log(`📊 Tests pasados: ${passedTests}/${totalTests}`);
  log(`📈 Porcentaje de éxito: ${successRate}%`);

  // Detalles por categoría
  log(`\n${colors.blue}📊 DETALLES POR CATEGORÍA:${colors.reset}`);
  log(`   Flujo completo: ${results.completeFlow ? '✅' : '❌'}`);
  log(`   Tipos de dispositivo: ${results.deviceTypes ? '✅' : '❌'}`);
  log(`   Manejo de errores: ${results.errorHandling ? '✅' : '❌'}`);
  log(`   Persistencia: ${results.persistence ? '✅' : '❌'}`);
  log(`   Performance: ${results.performance ? '✅' : '❌'}`);
  log(`   Geolocalización: ${results.geolocation ? '✅' : '❌'}`);
  log(`   Múltiples respuestas: ${results.multipleResponses ? '✅' : '❌'}`);
  log(`   Cleanup: ${results.cleanup ? '✅' : '❌'}`);

  if (successRate === 100) {
    log(`\n${colors.green}🎉 ¡TODOS LOS TESTS PASARON! La integración backend-frontend está completamente validada.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS FALLARON. Revisar la integración backend-frontend.${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return successRate === 100;
}

// Ejecutar tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error ejecutando tests de integración comprehensivos:', error);
      process.exit(1);
    });
}

export { runComprehensiveIntegrationTests };
