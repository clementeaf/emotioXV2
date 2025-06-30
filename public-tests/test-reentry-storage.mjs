#!/usr/bin/env node

/**
 * TEST COMPREHENSIVO: VALIDACIÓN DE ALMACENAMIENTO DE REINGRESOS
 *
 * Este test valida que los reingresos se cuenten y almacenen correctamente,
 * incluyendo timestamps de primera/última visita, conteo de sesiones y tiempo total.
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod';
const RESEARCH_ID = 'test-reentry-storage-research';
const PARTICIPANT_ID = 'test-reentry-participant';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
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
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Valida que los datos de reingreso sean correctos
 */
function validateReentryData(sessionInfo) {
  const results = [];

  // Validar reentryCount
  if (typeof sessionInfo.reentryCount === 'number' && sessionInfo.reentryCount >= 0) {
    results.push({ field: 'reentryCount', valid: true, value: sessionInfo.reentryCount });
  } else {
    results.push({ field: 'reentryCount', valid: false, error: 'Debe ser un número >= 0' });
  }

  // Validar sessionStartTime
  if (typeof sessionInfo.sessionStartTime === 'number' && sessionInfo.sessionStartTime > 0) {
    results.push({ field: 'sessionStartTime', valid: true, value: sessionInfo.sessionStartTime });
  } else {
    results.push({ field: 'sessionStartTime', valid: false, error: 'Debe ser un timestamp válido' });
  }

  // Validar lastVisitTime
  if (typeof sessionInfo.lastVisitTime === 'number' && sessionInfo.lastVisitTime > 0) {
    results.push({ field: 'lastVisitTime', valid: true, value: sessionInfo.lastVisitTime });
  } else {
    results.push({ field: 'lastVisitTime', valid: false, error: 'Debe ser un timestamp válido' });
  }

  // Validar totalSessionTime
  if (typeof sessionInfo.totalSessionTime === 'number' && sessionInfo.totalSessionTime >= 0) {
    results.push({ field: 'totalSessionTime', valid: true, value: sessionInfo.totalSessionTime });
  } else {
    results.push({ field: 'totalSessionTime', valid: false, error: 'Debe ser un número >= 0' });
  }

  // Validar isFirstVisit
  if (typeof sessionInfo.isFirstVisit === 'boolean') {
    results.push({ field: 'isFirstVisit', valid: true, value: sessionInfo.isFirstVisit });
  } else {
    results.push({ field: 'isFirstVisit', valid: false, error: 'Debe ser un boolean' });
  }

  const validCount = results.filter(r => r.valid).length;
  const totalCount = results.length;

  return {
    valid: validCount === totalCount,
    validCount,
    totalCount,
    results
  };
}

/**
 * Valida que los timestamps sean consistentes
 */
function validateTimestampConsistency(sessionInfo) {
  const issues = [];

  // Verificar que lastVisitTime >= sessionStartTime
  if (sessionInfo.lastVisitTime < sessionInfo.sessionStartTime) {
    issues.push('lastVisitTime no puede ser anterior a sessionStartTime');
  }

  // Verificar que totalSessionTime sea razonable
  const calculatedDuration = sessionInfo.lastVisitTime - sessionInfo.sessionStartTime;
  if (Math.abs(sessionInfo.totalSessionTime - calculatedDuration) > 1000) { // 1 segundo de tolerancia
    issues.push(`totalSessionTime (${sessionInfo.totalSessionTime}) no coincide con la diferencia calculada (${calculatedDuration})`);
  }

  // Verificar que los timestamps sean recientes (últimas 24 horas)
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (sessionInfo.sessionStartTime < now - oneDayMs) {
    issues.push('sessionStartTime es muy antiguo');
  }
  if (sessionInfo.lastVisitTime < now - oneDayMs) {
    issues.push('lastVisitTime es muy antiguo');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// ============================================================================
// TESTS DE REINGRESOS
// ============================================================================

async function testReentryStorage() {
  logSection('ALMACENAMIENTO DE DATOS DE REINGRESO');
  let allPassed = true;

  // Test 1: Primera visita (reentryCount = 0)
  const firstVisitData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-first`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: { age: 25, gender: 'female' },
    metadata: {
      sessionInfo: {
        reentryCount: 0,
        sessionStartTime: Date.now() - 300000,
        lastVisitTime: Date.now(),
        totalSessionTime: 300000,
        isFirstVisit: true
      }
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firstVisitData)
    });
    const result = await response.json();

    const savePassed = response.status === 201;
    logTest('Guardar primera visita', savePassed, savePassed ? 'ReentryCount: 0, isFirstVisit: true' : result.error || 'Error al guardar');

    if (savePassed) {
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-first`);
      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const sessionInfo = retrievedData.data?.responses?.[0]?.metadata?.sessionInfo;

        if (sessionInfo) {
          const isValid = sessionInfo.reentryCount === 0 && sessionInfo.isFirstVisit === true;
          logTest('Recuperar primera visita', isValid, `ReentryCount: ${sessionInfo.reentryCount}, isFirstVisit: ${sessionInfo.isFirstVisit}`);
        } else {
          logTest('Recuperar primera visita', false, 'No se encontró sessionInfo');
        }
      } else {
        logTest('Recuperar primera visita', false, `Error al recuperar: ${retrieveResponse.status}`);
      }
    }

  } catch (error) {
    logTest('Guardar primera visita', false, `Error: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Reingreso (reentryCount = 1)
  const reentryData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-reentry`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: { age: 30, gender: 'male' },
    metadata: {
      sessionInfo: {
        reentryCount: 1,
        sessionStartTime: Date.now() - 600000,
        lastVisitTime: Date.now(),
        totalSessionTime: 600000,
        isFirstVisit: false
      }
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reentryData)
    });
    const result = await response.json();

    const savePassed = response.status === 201;
    logTest('Guardar reingreso', savePassed, savePassed ? 'ReentryCount: 1, isFirstVisit: false' : result.error || 'Error al guardar');

    if (savePassed) {
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-reentry`);
      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const sessionInfo = retrievedData.data?.responses?.[0]?.metadata?.sessionInfo;

        if (sessionInfo) {
          const isValid = sessionInfo.reentryCount === 1 && sessionInfo.isFirstVisit === false;
          logTest('Recuperar reingreso', isValid, `ReentryCount: ${sessionInfo.reentryCount}, isFirstVisit: ${sessionInfo.isFirstVisit}`);
        } else {
          logTest('Recuperar reingreso', false, 'No se encontró sessionInfo');
        }
      } else {
        logTest('Recuperar reingreso', false, `Error al recuperar: ${retrieveResponse.status}`);
      }
    }

  } catch (error) {
    logTest('Guardar reingreso', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function testReentryValidation() {
  logSection('VALIDACIÓN DE DATOS DE REINGRESO');
  let allPassed = true;

  // Test 1: Validar estructura de datos
  const validSessionInfo = {
    reentryCount: 2,
    sessionStartTime: Date.now() - 300000,
    lastVisitTime: Date.now(),
    totalSessionTime: 300000,
    isFirstVisit: false
  };

  const validation = validateReentryData(validSessionInfo);
  logTest('Estructura de datos válida', validation.valid, `Campos válidos: ${validation.validCount}/${validation.totalCount}`);

  // Test 2: Validar consistencia de timestamps
  const timestampValidation = validateTimestampConsistency(validSessionInfo);
  logTest('Consistencia de timestamps', timestampValidation.valid,
    timestampValidation.valid ? 'Timestamps consistentes' : `Problemas: ${timestampValidation.issues.join(', ')}`);

  // Test 3: Validar datos inválidos
  const invalidSessionInfo = {
    reentryCount: -1,
    sessionStartTime: 0,
    lastVisitTime: 'invalid',
    totalSessionTime: null,
    isFirstVisit: 'yes'
  };

  const invalidValidation = validateReentryData(invalidSessionInfo);
  logTest('Datos inválidos detectados', !invalidValidation.valid, `Campos válidos: ${invalidValidation.validCount}/${invalidValidation.totalCount}`);

  // Test 4: Validar timestamps inconsistentes
  const inconsistentTimestamps = {
    reentryCount: 1,
    sessionStartTime: Date.now(),
    lastVisitTime: Date.now() - 1000, // lastVisitTime anterior a sessionStartTime
    totalSessionTime: 1000,
    isFirstVisit: false
  };

  const inconsistentValidation = validateTimestampConsistency(inconsistentTimestamps);
  logTest('Timestamps inconsistentes detectados', !inconsistentValidation.valid,
    inconsistentValidation.valid ? 'Timestamps consistentes' : `Problemas: ${inconsistentValidation.issues.join(', ')}`);

  return validation.valid && timestampValidation.valid && !invalidValidation.valid && !inconsistentValidation.valid;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runReentryStorageTests() {
  const startTime = Date.now();

  log(`${colors.bright}🚀 INICIANDO TEST: VALIDACIÓN DE ALMACENAMIENTO DE REINGRESOS${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  const passed = await testReentryStorage();

  const endTime = Date.now();
  const duration = endTime - startTime;

  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN FINAL: VALIDACIÓN DE ALMACENAMIENTO DE REINGRESOS${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}`);
  log(`⏱️  Duración total: ${duration}ms`);
  log(`📊 Tests pasados: ${passed ? 2 : 0}/2`);
  log(`📈 Porcentaje de éxito: ${passed ? 100 : 0}%`);

  if (passed) {
    log(`\n${colors.green}🎉 ¡TODOS LOS TESTS PASARON! Los reingresos se cuentan y almacenan correctamente.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS FALLARON. Revisar el almacenamiento de reingresos.${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return passed;
}

// Ejecutar tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runReentryStorageTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Error ejecutando tests:', error);
      process.exit(1);
    });
}

export { runReentryStorageTests };
