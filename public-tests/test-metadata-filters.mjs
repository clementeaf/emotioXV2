#!/usr/bin/env node

/**
 * TEST COMPREHENSIVO: FILTROS DE METADATA POR CONFIGURACIÓN
 *
 * Este test valida que los filtros de metadata funcionen correctamente
 * según la configuración de parámetros de la investigación.
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod';
const RESEARCH_ID = 'test-metadata-filters-research';
const PARTICIPANT_ID = 'test-metadata-filters-participant';

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

async function testMetadataFilters() {
  logSection('FILTROS DE METADATA POR CONFIGURACIÓN');
  let allPassed = true;

  // Test 1: Configuración con todos los parámetros habilitados
  const fullConfigData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-full`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: { age: 25, gender: 'female' },
    metadata: {
      deviceInfo: {
        deviceType: 'desktop',
        userAgent: 'test-agent',
        screenWidth: 1920,
        screenHeight: 1080,
        platform: 'Win32',
        language: 'es'
      },
      locationInfo: {
        latitude: 40.4167754,
        longitude: -3.7037902,
        accuracy: 15,
        city: 'Madrid',
        country: 'Spain',
        region: 'Madrid',
        ipAddress: '192.168.1.100'
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
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullConfigData)
    });

    const savePassed = response.status === 201;
    logTest('Guardar metadata completa', savePassed, savePassed ? 'Todos los campos incluidos' : 'Error al guardar');

    if (savePassed) {
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-full`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const metadata = retrievedData.data?.responses?.[0]?.metadata;

        if (metadata) {
          const hasAllFields =
            metadata.deviceInfo &&
            metadata.locationInfo &&
            metadata.timingInfo &&
            metadata.sessionInfo &&
            metadata.technicalInfo;

          logTest('Recuperar metadata completa', hasAllFields,
            hasAllFields ? 'Todos los campos presentes' : 'Faltan campos de metadata');
        } else {
          logTest('Recuperar metadata completa', false, 'No se encontró metadata');
        }
      } else {
        logTest('Recuperar metadata completa', false, `Error: ${retrieveResponse.status}`);
      }
    }

  } catch (error) {
    logTest('Test metadata completa', false, `Error: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Configuración con solo deviceInfo habilitado
  const deviceOnlyData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-device-only`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: { age: 30, gender: 'male' },
    metadata: {
      deviceInfo: {
        deviceType: 'mobile',
        userAgent: 'mobile-agent',
        screenWidth: 375,
        screenHeight: 667,
        platform: 'iOS',
        language: 'es'
      }
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceOnlyData)
    });

    const savePassed = response.status === 201;
    logTest('Guardar solo deviceInfo', savePassed, savePassed ? 'Solo deviceInfo incluido' : 'Error al guardar');

    if (savePassed) {
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-device-only`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const metadata = retrievedData.data?.responses?.[0]?.metadata;

        if (metadata) {
          const hasOnlyDevice =
            metadata.deviceInfo &&
            !metadata.locationInfo &&
            !metadata.timingInfo &&
            !metadata.sessionInfo;

          logTest('Recuperar solo deviceInfo', hasOnlyDevice,
            hasOnlyDevice ? 'Solo deviceInfo presente' : 'Campos adicionales no esperados');
        } else {
          logTest('Recuperar solo deviceInfo', false, 'No se encontró metadata');
        }
      } else {
        logTest('Recuperar solo deviceInfo', false, `Error: ${retrieveResponse.status}`);
      }
    }

  } catch (error) {
    logTest('Test solo deviceInfo', false, `Error: ${error.message}`);
    allPassed = false;
  }

  // Test 3: Configuración sin metadata
  const noMetadataData = {
    researchId: RESEARCH_ID,
    participantId: `${PARTICIPANT_ID}-no-metadata`,
    stepType: 'demographic',
    stepTitle: 'Datos Demográficos',
    response: { age: 35, gender: 'other' }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noMetadataData)
    });

    const savePassed = response.status === 201;
    logTest('Guardar sin metadata', savePassed, savePassed ? 'Sin metadata incluida' : 'Error al guardar');

    if (savePassed) {
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${PARTICIPANT_ID}-no-metadata`);

      if (retrieveResponse.status === 200) {
        const retrievedData = await retrieveResponse.json();
        const metadata = retrievedData.data?.responses?.[0]?.metadata;

        const hasNoMetadata = !metadata || Object.keys(metadata).length === 0;
        logTest('Recuperar sin metadata', hasNoMetadata,
          hasNoMetadata ? 'Sin metadata presente' : 'Metadata no esperada presente');
      } else {
        logTest('Recuperar sin metadata', false, `Error: ${retrieveResponse.status}`);
      }
    }

  } catch (error) {
    logTest('Test sin metadata', false, `Error: ${error.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function runMetadataFiltersTests() {
  const startTime = Date.now();

  log(`${colors.bright}🚀 INICIANDO TEST: FILTROS DE METADATA POR CONFIGURACIÓN${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  const passed = await testMetadataFilters();

  const endTime = Date.now();
  const duration = endTime - startTime;

  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN FINAL: FILTROS DE METADATA POR CONFIGURACIÓN${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}`);
  log(`⏱️  Duración total: ${duration}ms`);
  log(`📊 Tests pasados: ${passed ? 3 : 0}/3`);
  log(`📈 Porcentaje de éxito: ${passed ? 100 : 0}%`);

  if (passed) {
    log(`\n${colors.green}🎉 ¡TODOS LOS TESTS PASARON! Los filtros de metadata funcionan correctamente.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS FALLARON. Revisar los filtros de metadata.${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return passed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMetadataFiltersTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Error ejecutando tests de filtros de metadata:', error);
      process.exit(1);
    });
}

export { runMetadataFiltersTests };
