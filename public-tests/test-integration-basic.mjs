#!/usr/bin/env node

/**
 * TEST BÁSICO: INTEGRACIÓN BACKEND-FRONTEND
 *
 * Este test valida la conectividad básica y funcionalidad esencial
 * entre el frontend y el backend.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-basic-integration';
const PARTICIPANT_ID = 'test-basic-participant';

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
// TESTS BÁSICOS DE INTEGRACIÓN
// ============================================================================

async function testConnectivity() {
  logSection('CONECTIVIDAD BÁSICA');
  let allPassed = true;

  try {
    // Test 1: Verificar que el endpoint responde
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const connectivityPassed = response.status === 200 || response.status === 404;
    logTest('Endpoint responde', connectivityPassed,
      connectivityPassed ? `Status: ${response.status}` : `Error: ${response.status}`);

    if (!connectivityPassed) allPassed = false;

  } catch (error) {
    logTest('Endpoint responde', false, `Error de conectividad: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testBasicDataFlow() {
  logSection('FLUJO BÁSICO DE DATOS');
  let allPassed = true;

  const basicData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-basic`,
    stepType: 'test',
    stepTitle: 'Test Básico',
    response: { test: true },
    metadata: {
      deviceInfo: { deviceType: 'desktop' },
      timingInfo: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
      sessionInfo: { reentryCount: 0, isFirstVisit: true },
      technicalInfo: { browser: 'Chrome' }
    }
  };

  try {
    // 1. Enviar datos básicos
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basicData)
    });

    const result = await response.json();
    const savePassed = response.status === 201;

    logTest('Enviar datos básicos', savePassed,
      savePassed ? 'Status: 201 - Datos enviados correctamente' : `Error: ${result.error || response.status}`);

    if (!savePassed) {
      allPassed = false;
      return allPassed;
    }

    // 2. Recuperar datos
    const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-basic`);

    if (retrieveResponse.status === 200) {
      const retrievedData = await retrieveResponse.json();
      const responseData = retrievedData.data?.responses?.[0];

      if (responseData) {
        // Validar estructura básica
        const hasBasicStructure = responseData.stepType && responseData.stepTitle && responseData.response;
        logTest('Estructura básica de respuesta', hasBasicStructure,
          hasBasicStructure ? 'StepType, StepTitle y Response presentes' : 'Faltan campos básicos');

        // Validar metadata básica
        const metadata = responseData.metadata;
        const hasDeviceInfo = metadata?.deviceInfo?.deviceType;
        const hasTimingInfo = metadata?.timingInfo?.startTime;
        const hasSessionInfo = metadata?.sessionInfo?.reentryCount;

        logTest('Metadata básica presente', hasDeviceInfo && hasTimingInfo && hasSessionInfo,
          `Device: ${hasDeviceInfo ? '✅' : '❌'}, Timing: ${hasTimingInfo ? '✅' : '❌'}, Session: ${hasSessionInfo ? '✅' : '❌'}`);

        allPassed = hasBasicStructure && hasDeviceInfo && hasTimingInfo && hasSessionInfo;

      } else {
        logTest('Recuperar datos básicos', false, 'No se encontraron datos de respuesta');
        allPassed = false;
      }
    } else {
      logTest('Recuperar datos básicos', false, `Error: ${retrieveResponse.status}`);
      allPassed = false;
    }

  } catch (error) {
    logTest('Flujo básico de datos', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testErrorHandling() {
  logSection('MANEJO BÁSICO DE ERRORES');
  let allPassed = true;

  // Test 1: Datos faltantes
  const missingData = {
    stepType: 'test',
    response: { test: true }
    // Sin researchId ni participantId
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
  logSection('PERSISTENCIA BÁSICA DE DATOS');
  let allPassed = true;

  const persistenceData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-persistence`,
    stepType: 'test',
    stepTitle: 'Test Persistencia',
    response: { test: true, timestamp: Date.now() },
    metadata: {
      deviceInfo: { deviceType: 'desktop' },
      timingInfo: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
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
            responseData.response?.test === persistenceData.response.test;

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

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runBasicIntegrationTests() {
  const startTime = Date.now();

  log(`${colors.bright}🚀 INICIANDO TESTS BÁSICOS DE INTEGRACIÓN BACKEND-FRONTEND${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  const results = {
    connectivity: await testConnectivity(),
    basicFlow: await testBasicDataFlow(),
    errorHandling: await testErrorHandling(),
    persistence: await testDataPersistence()
  };

  const endTime = Date.now();
  const duration = endTime - startTime;

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN FINAL: TESTS BÁSICOS DE INTEGRACIÓN BACKEND-FRONTEND${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}`);
  log(`⏱️  Duración total: ${duration}ms`);
  log(`📊 Tests pasados: ${passedTests}/${totalTests}`);
  log(`📈 Porcentaje de éxito: ${successRate}%`);

  // Detalles por categoría
  log(`\n${colors.blue}📊 DETALLES POR CATEGORÍA:${colors.reset}`);
  log(`   Conectividad: ${results.connectivity ? '✅' : '❌'}`);
  log(`   Flujo básico: ${results.basicFlow ? '✅' : '❌'}`);
  log(`   Manejo de errores: ${results.errorHandling ? '✅' : '❌'}`);
  log(`   Persistencia: ${results.persistence ? '✅' : '❌'}`);

  if (successRate === 100) {
    log(`\n${colors.green}🎉 ¡TODOS LOS TESTS BÁSICOS PASARON! La integración backend-frontend está funcionando.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS BÁSICOS FALLARON. Revisar la integración backend-frontend.${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return successRate === 100;
}

// Ejecutar tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error ejecutando tests básicos de integración:', error);
      process.exit(1);
    });
}

export { runBasicIntegrationTests };
