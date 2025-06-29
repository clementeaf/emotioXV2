#!/usr/bin/env node

/**
 * Test Comprehensivo: Validación de Formatos de Tiempo
 *
 * Este test valida que todos los formatos de tiempo utilizados en el sistema
 * sean compatibles entre frontend y backend, incluyendo:
 *
 * 1. Timestamps Unix (milisegundos)
 * 2. Fechas ISO strings
 * 3. Conversiones entre formatos
 * 4. Validación de formatos en el backend
 * 5. Compatibilidad de timezones
 */

import fetch from 'node-fetch';

// Configuración
const API_BASE_URL = process.env.API_BASE_URL || 'https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod';
const TEST_RESEARCH_ID = 'test-time-formats-research';
const TEST_PARTICIPANT_ID = 'test-time-formats-participant';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Función para generar diferentes formatos de tiempo
function generateTimeFormats() {
  const now = Date.now();
  const date = new Date(now);

  return {
    unixTimestamp: now,
    unixTimestampSeconds: Math.floor(now / 1000),
    isoString: date.toISOString(),
    isoStringLocal: date.toLocaleString(),
    isoDate: date.toISOString().split('T')[0],
    isoTime: date.toISOString().split('T')[1].split('.')[0],
    customFormat: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}Z`
  };
}

// Función para validar formato de tiempo
function validateTimeFormat(timeValue, expectedType) {
  try {
    switch (expectedType) {
      case 'unix':
        return typeof timeValue === 'number' && timeValue > 0 && timeValue < Number.MAX_SAFE_INTEGER;
      case 'iso':
        return typeof timeValue === 'string' && new Date(timeValue).toISOString() === timeValue;
      case 'date':
        return !isNaN(new Date(timeValue).getTime());
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

// Test 1: Validar formatos de tiempo básicos
async function testBasicTimeFormats() {
  logSection('FORMATOS DE TIEMPO BÁSICOS');

  const formats = generateTimeFormats();
  let passedTests = 0;
  let totalTests = 0;

  // Test Unix timestamp
  totalTests++;
  const unixValid = validateTimeFormat(formats.unixTimestamp, 'unix');
  logTest('Unix Timestamp (milisegundos)', unixValid, `Valor: ${formats.unixTimestamp}`);
  if (unixValid) passedTests++;

  // Test Unix timestamp en segundos
  totalTests++;
  const unixSecondsValid = validateTimeFormat(formats.unixTimestampSeconds, 'unix');
  logTest('Unix Timestamp (segundos)', unixSecondsValid, `Valor: ${formats.unixTimestampSeconds}`);
  if (unixSecondsValid) passedTests++;

  // Test ISO string
  totalTests++;
  const isoValid = validateTimeFormat(formats.isoString, 'iso');
  logTest('ISO String', isoValid, `Valor: ${formats.isoString}`);
  if (isoValid) passedTests++;

  // Test conversión entre formatos
  totalTests++;
  const convertedUnix = new Date(formats.isoString).getTime();
  const conversionValid = Math.abs(convertedUnix - formats.unixTimestamp) < 1000; // Tolerancia de 1 segundo
  logTest('Conversión ISO → Unix', conversionValid, `Original: ${formats.unixTimestamp}, Convertido: ${convertedUnix}`);
  if (conversionValid) passedTests++;

  // Test conversión Unix → ISO
  totalTests++;
  const convertedIso = new Date(formats.unixTimestamp).toISOString();
  const reverseConversionValid = convertedIso === formats.isoString;
  logTest('Conversión Unix → ISO', reverseConversionValid, `Original: ${formats.isoString}, Convertido: ${convertedIso}`);
  if (reverseConversionValid) passedTests++;

  log(`\n📊 Resultados: ${passedTests}/${totalTests} tests pasaron`, passedTests === totalTests ? 'green' : 'red');
  return passedTests === totalTests;
}

// Test 2: Validar formatos de tiempo en metadata
async function testMetadataTimeFormats() {
  logSection('FORMATOS DE TIEMPO EN METADATA');

  const formats = generateTimeFormats();
  let passedTests = 0;
  let totalTests = 0;

  // Crear metadata con diferentes formatos de tiempo
  const metadataWithTimes = {
    deviceInfo: {
      timestamp: formats.unixTimestamp,
      lastUpdate: formats.isoString,
      sessionStart: formats.unixTimestamp
    },
    locationInfo: {
      timestamp: formats.unixTimestamp,
      lastKnown: formats.isoString
    },
    timingInfo: {
      startTime: formats.unixTimestamp,
      endTime: formats.unixTimestamp + 5000,
      duration: 5000,
      sectionTimings: [
        {
          sectionId: 'test-section',
          startTime: formats.unixTimestamp,
          endTime: formats.unixTimestamp + 2000,
          duration: 2000
        }
      ]
    },
    sessionInfo: {
      sessionStartTime: formats.unixTimestamp,
      lastVisitTime: formats.unixTimestamp + 10000,
      totalSessionTime: 10000,
      isFirstVisit: true
    },
    technicalInfo: {
      timestamp: formats.unixTimestamp,
      createdAt: formats.isoString,
      updatedAt: formats.isoString
    }
  };

  // Test metadata completa
  totalTests++;
  try {
    const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        researchId: TEST_RESEARCH_ID,
        participantId: TEST_PARTICIPANT_ID,
        responses: [],
        metadata: metadataWithTimes
      })
    });

    const result = await response.json();
    const metadataValid = response.status === 200 || response.status === 201;
    logTest('Metadata con formatos de tiempo', metadataValid, `Status: ${response.status}`);
    if (metadataValid) passedTests++;
  } catch (error) {
    logTest('Metadata con formatos de tiempo', false, `Error: ${error.message}`);
  }

  // Test cada tipo de metadata individualmente
  const metadataTypes = ['deviceInfo', 'locationInfo', 'timingInfo', 'sessionInfo', 'technicalInfo'];

  for (const type of metadataTypes) {
    totalTests++;
    try {
      const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          researchId: TEST_RESEARCH_ID,
          participantId: `${TEST_PARTICIPANT_ID}-${type}`,
          responses: [],
          metadata: { [type]: metadataWithTimes[type] }
        })
      });

      const result = await response.json();
      const typeValid = response.status === 200 || response.status === 201;
      logTest(`${type} formatos de tiempo`, typeValid, `Status: ${response.status}`);
      if (typeValid) passedTests++;
    } catch (error) {
      logTest(`${type} formatos de tiempo`, false, `Error: ${error.message}`);
    }
  }

  log(`\n📊 Resultados: ${passedTests}/${totalTests} tests pasaron`, passedTests === totalTests ? 'green' : 'red');
  return passedTests === totalTests;
}

// Test 3: Validar formatos de tiempo en respuestas de módulos
async function testModuleResponseTimeFormats() {
  logSection('FORMATOS DE TIEMPO EN RESPUESTAS DE MÓDULOS');

  const formats = generateTimeFormats();
  let passedTests = 0;
  let totalTests = 0;

  // Crear respuesta de módulo con diferentes formatos de tiempo
  const moduleResponse = {
    id: 'test-module-response',
    stepType: 'demographic',
    stepTitle: 'Test Module',
    response: {
      question1: 'Test answer'
    },
    metadata: {
      totalTime: 5000,
      startTime: formats.unixTimestamp,
      endTime: formats.unixTimestamp + 5000,
      createdAt: formats.isoString,
      updatedAt: formats.isoString
    },
    createdAt: formats.isoString,
    updatedAt: formats.isoString
  };

  // Test respuesta de módulo completa
  totalTests++;
  try {
    const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        researchId: TEST_RESEARCH_ID,
        participantId: `${TEST_PARTICIPANT_ID}-module`,
        responses: [moduleResponse],
        metadata: {
          startTime: formats.unixTimestamp,
          endTime: formats.unixTimestamp + 5000,
          duration: 5000
        }
      })
    });

    const result = await response.json();
    const moduleValid = response.status === 200 || response.status === 201;
    logTest('Respuesta de módulo con formatos de tiempo', moduleValid, `Status: ${response.status}`);
    if (moduleValid) passedTests++;
  } catch (error) {
    logTest('Respuesta de módulo con formatos de tiempo', false, `Error: ${error.message}`);
  }

  // Test diferentes tipos de módulos
  const moduleTypes = ['demographic', 'cognitive_task', 'eye_tracking', 'smartvoc'];

  for (const moduleType of moduleTypes) {
    totalTests++;
    try {
      const moduleResponseWithType = {
        ...moduleResponse,
        stepType: moduleType,
        id: `test-${moduleType}-response`
      };

      const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          researchId: TEST_RESEARCH_ID,
          participantId: `${TEST_PARTICIPANT_ID}-${moduleType}`,
          responses: [moduleResponseWithType],
          metadata: {
            startTime: formats.unixTimestamp,
            endTime: formats.unixTimestamp + 5000,
            duration: 5000
          }
        })
      });

      const result = await response.json();
      const typeValid = response.status === 200 || response.status === 201;
      logTest(`${moduleType} formatos de tiempo`, typeValid, `Status: ${response.status}`);
      if (typeValid) passedTests++;
    } catch (error) {
      logTest(`${moduleType} formatos de tiempo`, false, `Error: ${error.message}`);
    }
  }

  log(`\n📊 Resultados: ${passedTests}/${totalTests} tests pasaron`, passedTests === totalTests ? 'green' : 'red');
  return passedTests === totalTests;
}

// Test 4: Validar compatibilidad de timezones
async function testTimezoneCompatibility() {
  logSection('COMPATIBILIDAD DE TIMEZONES');

  let passedTests = 0;
  let totalTests = 0;

  // Test diferentes timezones
  const timezones = [
    'UTC',
    'America/New_York',
    'Europe/Madrid',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  for (const timezone of timezones) {
    totalTests++;
    try {
      // Crear fecha en timezone específico
      const date = new Date();
      const utcTime = date.getTime();
      const isoString = date.toISOString(); // Siempre en UTC

      // Test que el backend acepte ISO string (que siempre está en UTC)
      const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          researchId: TEST_RESEARCH_ID,
          participantId: `${TEST_PARTICIPANT_ID}-${timezone}`,
          responses: [],
          metadata: {
            deviceInfo: {
              timestamp: utcTime,
              timezone: timezone,
              localTime: date.toLocaleString('en-US', { timeZone: timezone }),
              utcTime: isoString
            }
          }
        })
      });

      const result = await response.json();
      const timezoneValid = response.status === 200 || response.status === 201;
      logTest(`Timezone ${timezone}`, timezoneValid, `Status: ${response.status}`);
      if (timezoneValid) passedTests++;
    } catch (error) {
      logTest(`Timezone ${timezone}`, false, `Error: ${error.message}`);
    }
  }

  // Test conversión de timezones
  totalTests++;
  try {
    const utcDate = new Date();
    const utcTime = utcDate.getTime();
    const utcIso = utcDate.toISOString();

    // Simular conversión a timezone local
    const localDate = new Date(utcTime);
    const localIso = localDate.toISOString(); // Debería ser igual a UTC

    const conversionValid = utcIso === localIso;
    logTest('Conversión UTC ↔ Local', conversionValid, `UTC: ${utcIso}, Local: ${localIso}`);
    if (conversionValid) passedTests++;
  } catch (error) {
    logTest('Conversión UTC ↔ Local', false, `Error: ${error.message}`);
  }

  log(`\n📊 Resultados: ${passedTests}/${totalTests} tests pasaron`, passedTests === totalTests ? 'green' : 'red');
  return passedTests === totalTests;
}

// Test 5: Validar formatos de tiempo en reingresos
async function testReentryTimeFormats() {
  logSection('FORMATOS DE TIEMPO EN REINGRESOS');

  const formats = generateTimeFormats();
  let passedTests = 0;
  let totalTests = 0;

  // Test datos de reingreso con diferentes formatos de tiempo
  const reentryData = {
    researchId: TEST_RESEARCH_ID,
    participantId: TEST_PARTICIPANT_ID,
    reentryCount: 1,
    sessionStartTime: formats.unixTimestamp,
    lastVisitTime: formats.unixTimestamp + 10000,
    totalSessionTime: 10000,
    isFirstVisit: false,
    metadata: {
      deviceInfo: {
        timestamp: formats.unixTimestamp,
        lastUpdate: formats.isoString
      },
      sessionInfo: {
        sessionStartTime: formats.unixTimestamp,
        lastVisitTime: formats.unixTimestamp + 10000,
        totalSessionTime: 10000,
        isFirstVisit: false
      }
    }
  };

  // Test reingreso completo
  totalTests++;
  try {
    const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        ...reentryData,
        responses: []
      })
    });

    const result = await response.json();
    const reentryValid = response.status === 200 || response.status === 201;
    logTest('Reingreso con formatos de tiempo', reentryValid, `Status: ${response.status}`);
    if (reentryValid) passedTests++;
  } catch (error) {
    logTest('Reingreso con formatos de tiempo', false, `Error: ${error.message}`);
  }

  // Test múltiples reingresos con diferentes timestamps
  for (let i = 1; i <= 3; i++) {
    totalTests++;
    try {
      const multipleReentryData = {
        ...reentryData,
        participantId: `${TEST_PARTICIPANT_ID}-reentry-${i}`,
        reentryCount: i,
        sessionStartTime: formats.unixTimestamp - (i * 86400000), // Diferentes días
        lastVisitTime: formats.unixTimestamp,
        totalSessionTime: i * 86400000
      };

      const response = await fetch(`${API_BASE_URL}/api/participant-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          ...multipleReentryData,
          responses: []
        })
      });

      const result = await response.json();
      const multipleValid = response.status === 200 || response.status === 201;
      logTest(`Reingreso #${i} con formatos de tiempo`, multipleValid, `Status: ${response.status}`);
      if (multipleValid) passedTests++;
    } catch (error) {
      logTest(`Reingreso #${i} con formatos de tiempo`, false, `Error: ${error.message}`);
    }
  }

  log(`\n📊 Resultados: ${passedTests}/${totalTests} tests pasaron`, passedTests === totalTests ? 'green' : 'red');
  return passedTests === totalTests;
}

// Test 6: Validar recuperación y persistencia de formatos de tiempo
async function testTimeFormatPersistence() {
  logSection('PERSISTENCIA DE FORMATOS DE TIEMPO');

  const formats = generateTimeFormats();
  let passedTests = 0;
  let totalTests = 0;

  // Crear datos con formatos de tiempo específicos
  const testData = {
    researchId: TEST_RESEARCH_ID,
    participantId: `${TEST_PARTICIPANT_ID}-persistence`,
    responses: [{
      id: 'test-response-persistence',
      stepType: 'demographic',
      stepTitle: 'Test Persistence',
      response: { question1: 'Test answer' },
      metadata: {
        totalTime: 5000,
        startTime: formats.unixTimestamp,
        endTime: formats.unixTimestamp + 5000,
        createdAt: formats.isoString,
        updatedAt: formats.isoString
      },
      createdAt: formats.isoString,
      updatedAt: formats.isoString
    }],
    metadata: {
      startTime: formats.unixTimestamp,
      endTime: formats.unixTimestamp + 5000,
      duration: 5000,
      deviceInfo: {
        timestamp: formats.unixTimestamp,
        lastUpdate: formats.isoString
      },
      sessionInfo: {
        sessionStartTime: formats.unixTimestamp,
        lastVisitTime: formats.unixTimestamp + 10000,
        totalSessionTime: 10000,
        isFirstVisit: true
      }
    }
  };

  // Test guardar datos
  totalTests++;
  let savedData = null;
  try {
    const saveResponse = await fetch(`${API_BASE_URL}/api/participant-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });

    const saveResult = await saveResponse.json();
    const saveValid = saveResponse.status === 200 || saveResponse.status === 201;
    logTest('Guardar datos con formatos de tiempo', saveValid, `Status: ${saveResponse.status}`);
    if (saveValid) {
      savedData = saveResult;
      passedTests++;
    }
  } catch (error) {
    logTest('Guardar datos con formatos de tiempo', false, `Error: ${error.message}`);
  }

  // Test recuperar datos
  if (savedData) {
    totalTests++;
    try {
      const retrieveResponse = await fetch(`${API_BASE_URL}/api/participant-responses/${TEST_RESEARCH_ID}/${testData.participantId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const retrieveResult = await retrieveResponse.json();
      const retrieveValid = retrieveResponse.status === 200;

      if (retrieveValid) {
        // Validar que los formatos de tiempo se mantuvieron
        const metadata = retrieveResult.metadata;
        const timeFormatsValid =
          metadata.startTime === testData.metadata.startTime &&
          metadata.endTime === testData.metadata.endTime &&
          metadata.duration === testData.metadata.duration &&
          metadata.deviceInfo.timestamp === testData.metadata.deviceInfo.timestamp &&
          metadata.sessionInfo.sessionStartTime === testData.metadata.sessionInfo.sessionStartTime;

        logTest('Recuperar datos con formatos de tiempo', timeFormatsValid, `Status: ${retrieveResponse.status}`);
        if (timeFormatsValid) passedTests++;
      } else {
        logTest('Recuperar datos con formatos de tiempo', false, `Status: ${retrieveResponse.status}`);
      }
    } catch (error) {
      logTest('Recuperar datos con formatos de tiempo', false, `Error: ${error.message}`);
    }
  }

  log(`\n📊 Resultados: ${passedTests}/${totalTests} tests pasaron`, passedTests === totalTests ? 'green' : 'red');
  return passedTests === totalTests;
}

// Función principal
async function runAllTests() {
  console.log('\n🚀 INICIANDO TEST COMPREHENSIVO: VALIDACIÓN DE FORMATOS DE TIEMPO');
  console.log('='.repeat(80));

  const startTime = Date.now();
  let totalPassed = 0;
  let totalTests = 0;

  // Ejecutar todos los tests
  const tests = [
    { name: 'Formatos de Tiempo Básicos', fn: testBasicTimeFormats },
    { name: 'Formatos de Tiempo en Metadata', fn: testMetadataTimeFormats },
    { name: 'Formatos de Tiempo en Respuestas de Módulos', fn: testModuleResponseTimeFormats },
    { name: 'Compatibilidad de Timezones', fn: testTimezoneCompatibility },
    { name: 'Formatos de Tiempo en Reingresos', fn: testReentryTimeFormats },
    { name: 'Persistencia de Formatos de Tiempo', fn: testTimeFormatPersistence }
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) totalPassed++;
      totalTests++;
    } catch (error) {
      log(`❌ Error en test ${test.name}: ${error.message}`, 'red');
      totalTests++;
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Resumen final
  console.log('\n' + '='.repeat(80));
  log('📋 RESUMEN FINAL: VALIDACIÓN DE FORMATOS DE TIEMPO', 'bright');
  console.log('='.repeat(80));

  log(`⏱️  Duración total: ${duration}ms`, 'blue');
  log(`📊 Tests pasados: ${totalPassed}/${totalTests}`, totalPassed === totalTests ? 'green' : 'red');
  log(`📈 Porcentaje de éxito: ${Math.round((totalPassed / totalTests) * 100)}%`, totalPassed === totalTests ? 'green' : 'red');

  if (totalPassed === totalTests) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON! Los formatos de tiempo son completamente compatibles.', 'green');
    log('✅ El sistema maneja correctamente todos los formatos de tiempo entre frontend y backend.', 'green');
  } else {
    log('\n⚠️  ALGUNOS TESTS FALLARON. Revisar la compatibilidad de formatos de tiempo.', 'red');
  }

  console.log('\n' + '='.repeat(80));

  return totalPassed === totalTests;
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { runAllTests };
