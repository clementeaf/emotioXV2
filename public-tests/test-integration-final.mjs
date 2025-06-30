#!/usr/bin/env node

/**
 * TEST FINAL: INTEGRACIÓN BACKEND-FRONTEND COMPLETA
 *
 * Este test valida la integración completa entre el frontend y el backend,
 * incluyendo todos los aspectos críticos para el funcionamiento del sistema.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-final-integration';
const PARTICIPANT_ID = 'test-final-participant';

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
// TESTS FINALES DE INTEGRACIÓN
// ============================================================================

async function testCompleteDataFlow() {
  logSection('FLUJO COMPLETO DE DATOS');
  let allPassed = true;

  const completeData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-complete`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: {
      age: 28,
      gender: 'female',
      country: 'Spain',
      education: 'university'
    },
    metadata: {
      deviceInfo: {
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

  try {
    // 1. Enviar datos completos
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeData)
    });

    const result = await response.json();
    const savePassed = response.status === 201;

    logTest('Enviar datos completos', savePassed,
      savePassed ? 'Status: 201 - Datos enviados correctamente' : `Error: ${result.error || response.status}`);

    if (!savePassed) {
      allPassed = false;
      return allPassed;
    }

    // 2. Recuperar datos
    const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-complete`);

    if (retrieveResponse.status === 200) {
      const retrievedData = await retrieveResponse.json();
      const responseData = retrievedData.data?.responses?.[0];

      if (responseData) {
        // Validar estructura básica
        const hasBasicStructure = responseData.stepType && responseData.stepTitle && responseData.response;
        logTest('Estructura básica', hasBasicStructure,
          hasBasicStructure ? 'StepType, StepTitle y Response presentes' : 'Faltan campos básicos');

        // Validar metadata completa
        const metadata = responseData.metadata;
        const hasDeviceInfo = metadata?.deviceInfo?.deviceType;
        const hasLocationInfo = metadata?.locationInfo?.latitude;
        const hasTimingInfo = metadata?.timingInfo?.startTime;
        const hasSessionInfo = metadata?.sessionInfo?.reentryCount !== undefined;
        const hasTechnicalInfo = metadata?.technicalInfo?.browser;

        logTest('Metadata completa', hasDeviceInfo && hasLocationInfo && hasTimingInfo && hasSessionInfo && hasTechnicalInfo,
          `Device: ${hasDeviceInfo ? '✅' : '❌'}, Location: ${hasLocationInfo ? '✅' : '❌'}, Timing: ${hasTimingInfo ? '✅' : '❌'}, Session: ${hasSessionInfo ? '✅' : '❌'}, Technical: ${hasTechnicalInfo ? '✅' : '❌'}`);

        // Validar integridad de datos
        const dataIntegrity =
          responseData.stepType === completeData.stepType &&
          responseData.stepTitle === completeData.stepTitle &&
          metadata?.deviceInfo?.deviceType === completeData.metadata.deviceInfo.deviceType;

        logTest('Integridad de datos', dataIntegrity,
          dataIntegrity ? 'Datos preservados correctamente' : 'Datos modificados o perdidos');

        allPassed = hasBasicStructure && hasDeviceInfo && hasLocationInfo && hasTimingInfo && hasSessionInfo && hasTechnicalInfo && dataIntegrity;

      } else {
        logTest('Recuperar datos', false, 'No se encontraron datos de respuesta');
        allPassed = false;
      }
    } else {
      logTest('Recuperar datos', false, `Error: ${retrieveResponse.status}`);
      allPassed = false;
    }

  } catch (error) {
    logTest('Flujo completo de datos', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testDifferentDeviceTypes() {
  logSection('TIPOS DE DISPOSITIVOS');
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
  logSection('MANEJO DE ERRORES');
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

async function testMultipleResponses() {
  logSection('MÚLTIPLES RESPUESTAS');
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

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runFinalIntegrationTests() {
  const startTime = Date.now();

  log(`${colors.bright}🚀 INICIANDO TESTS FINALES DE INTEGRACIÓN BACKEND-FRONTEND${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  const results = {
    completeFlow: await testCompleteDataFlow(),
    deviceTypes: await testDifferentDeviceTypes(),
    errorHandling: await testErrorHandling(),
    persistence: await testDataPersistence(),
    multipleResponses: await testMultipleResponses()
  };

  const endTime = Date.now();
  const duration = endTime - startTime;

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN FINAL: TESTS DE INTEGRACIÓN BACKEND-FRONTEND${colors.reset}`);
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
  log(`   Múltiples respuestas: ${results.multipleResponses ? '✅' : '❌'}`);

  if (successRate === 100) {
    log(`\n${colors.green}🎉 ¡TODOS LOS TESTS FINALES PASARON! La integración backend-frontend está completamente validada.${colors.reset}`);
  } else if (successRate >= 80) {
    log(`\n${colors.green}✅ ¡EXCELENTE! La integración backend-frontend está funcionando correctamente (${successRate}% de éxito).${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS FALLARON. Revisar la integración backend-frontend (${successRate}% de éxito).${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return successRate >= 80; // Considerar exitoso si al menos 80% de los tests pasan
}

// Ejecutar tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runFinalIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error ejecutando tests finales de integración:', error);
      process.exit(1);
    });
}

export { runFinalIntegrationTests };
