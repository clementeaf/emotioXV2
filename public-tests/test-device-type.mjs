#!/usr/bin/env node

/**
 * TEST COMPREHENSIVO: VALIDACIÓN DE REGISTRO DE TIPO DE DISPOSITIVO
 *
 * Este test valida que el tipo de dispositivo (mobile, tablet, desktop) se detecte,
 * envíe y almacene correctamente en el backend, y se recupere de forma íntegra.
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.emotiox.com';
const RESEARCH_ID = 'test-device-type-research';
const PARTICIPANT_ID = 'test-device-type-participant';

const DEVICE_TYPES = [
  { type: 'mobile', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  { type: 'tablet', userAgent: 'Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1' },
  { type: 'desktop', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
];

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

async function testDeviceTypeRegistration() {
  logSection('REGISTRO Y PERSISTENCIA DE TIPO DE DISPOSITIVO');
  let allPassed = true;

  for (const device of DEVICE_TYPES) {
    const participantId = `${PARTICIPANT_ID}-${device.type}`;
    const payload = {
      researchId: RESEARCH_ID,
      participantId,
      stepType: 'demographic',
      stepTitle: 'Datos Demográficos',
      response: { age: 28, gender: 'other' },
      metadata: {
        deviceInfo: {
          deviceType: device.type,
          userAgent: device.userAgent,
          screenWidth: device.type === 'desktop' ? 1920 : device.type === 'tablet' ? 1024 : 375,
          screenHeight: device.type === 'desktop' ? 1080 : device.type === 'tablet' ? 768 : 667,
          platform: device.type === 'desktop' ? 'Win32' : 'iOS',
          language: 'es'
        }
      }
    };

    // Enviar al backend
    let savePassed = false;
    let retrievePassed = false;
    let retrievedType = null;
    try {
      const response = await fetch(`${API_BASE_URL}/module-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      savePassed = response.status === 201 && result.data && result.data.metadata && result.data.metadata.deviceInfo && result.data.metadata.deviceInfo.deviceType === device.type;
      logTest(`Guardar tipo de dispositivo (${device.type})`, savePassed, savePassed ? `Registrado como: ${result.data.metadata.deviceInfo.deviceType}` : result.error || 'No se registró correctamente');
    } catch (error) {
      logTest(`Guardar tipo de dispositivo (${device.type})`, false, `Error: ${error.message}`);
    }

    // Recuperar del backend
    try {
      const retrieveResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${RESEARCH_ID}&participantId=${participantId}`);
      const retrievedData = await retrieveResponse.json();
      retrievedType = retrievedData.data?.responses?.[0]?.metadata?.deviceInfo?.deviceType;
      retrievePassed = retrieveResponse.status === 200 && retrievedType === device.type;
      logTest(`Recuperar tipo de dispositivo (${device.type})`, retrievePassed, retrievePassed ? `Recuperado: ${retrievedType}` : 'No coincide o no encontrado');
    } catch (error) {
      logTest(`Recuperar tipo de dispositivo (${device.type})`, false, `Error: ${error.message}`);
    }

    if (!savePassed || !retrievePassed) allPassed = false;
  }

  return allPassed;
}

async function runDeviceTypeTests() {
  const startTime = Date.now();
  log(`${colors.bright}🚀 INICIANDO TEST: REGISTRO DE TIPO DE DISPOSITIVO${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}\n`);

  const passed = await testDeviceTypeRegistration();

  const endTime = Date.now();
  const duration = endTime - startTime;
  log(`\n${colors.bright}================================================================================${colors.reset}`);
  log(`${colors.bright}📋 RESUMEN FINAL: REGISTRO DE TIPO DE DISPOSITIVO${colors.reset}`);
  log(`${colors.bright}================================================================================${colors.reset}`);
  log(`⏱️  Duración total: ${duration}ms`);
  log(`📊 Tests pasados: ${passed ? 3 : 0}/3`);
  log(`📈 Porcentaje de éxito: ${passed ? 100 : 0}%`);

  if (passed) {
    log(`\n${colors.green}🎉 ¡TODOS LOS TESTS PASARON! El tipo de dispositivo se registra y recupera correctamente.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  ALGUNOS TESTS FALLARON. Revisar el registro de tipo de dispositivo.${colors.reset}`);
  }

  log(`\n${colors.bright}================================================================================${colors.reset}`);

  return passed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeviceTypeTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Error ejecutando tests:', error);
      process.exit(1);
    });
}

export { runDeviceTypeTests };
