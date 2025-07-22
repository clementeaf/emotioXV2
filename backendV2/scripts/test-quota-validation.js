#!/usr/bin/env node
const axios = require('axios');

// 🎯 CONFIGURACIÓN PARA AWS
const BASE_URL = process.env.API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = process.env.TEST_RESEARCH_ID || 'test-research-123';

// 🎯 FUNCIONES DE LOGGING
const log = (message) => console.log(`ℹ️  ${message}`);
const logSuccess = (message) => console.log(`✅ ${message}`);
const logError = (message) => console.log(`❌ ${message}`);
const logWarning = (message) => console.log(`⚠️  ${message}`);
const logInfo = (message) => console.log(`ℹ️  ${message}`);

console.log('🚀 Iniciando tests de validación de cuotas...');
console.log(`📍 URL Base: ${BASE_URL}`);
console.log(`🔬 Research ID: ${RESEARCH_ID}`);
console.log('');

// 🎯 TEST 1: Validación de cuotas por edad
async function testAgeQuotaValidation() {
  logInfo('🧪 Test 1: Validación de cuotas por edad');

  try {
    const response = await axios.post(`${BASE_URL}/quota-validation/validate`, {
      researchId: RESEARCH_ID,
      demographics: {
        age: '18-24',
        country: 'ES',
        gender: 'M',
        educationLevel: '3',
        householdIncome: '2',
        employmentStatus: 'employed',
        dailyHoursOnline: '4-6',
        technicalProficiency: 'intermediate'
      }
    });

    logSuccess(`✅ Validación de edad exitosa: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    logError(`Error en test de edad: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// 🎯 TEST 2: Validación de cuotas por país
async function testCountryQuotaValidation() {
  logInfo('🧪 Test 2: Validación de cuotas por país');

  try {
    const response = await axios.post(`${BASE_URL}/quota-validation/validate`, {
      researchId: RESEARCH_ID,
      demographics: {
        age: '25-34',
        country: 'MX',
        gender: 'F',
        educationLevel: '4',
        householdIncome: '3',
        employmentStatus: 'student',
        dailyHoursOnline: '2-4',
        technicalProficiency: 'beginner'
      }
    });

    logSuccess(`✅ Validación de país exitosa: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    logError(`Error en test de país: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// 🎯 TEST 3: Obtener estadísticas de cuotas
async function testGetQuotaStats() {
  logInfo('🧪 Test 3: Obtener estadísticas de cuotas');

  try {
    const response = await axios.get(`${BASE_URL}/quota-validation/stats/${RESEARCH_ID}`);
    logSuccess(`✅ Estadísticas obtenidas: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    logError(`Error en test de estadísticas: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// 🎯 TEST 4: Reiniciar contadores de cuotas
async function testResetQuotaCounters() {
  logWarning('⚠️  Ejecutando reinicio de contadores (esto eliminará todos los contadores)...');
  logInfo('🧪 Test 4: Reiniciar contadores de cuotas');

  try {
    const response = await axios.post(`${BASE_URL}/quota-validation/reset`, {
      researchId: RESEARCH_ID,
      confirmReset: true
    });
    logSuccess(`✅ Contadores reiniciados: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    logError(`Error en test de reinicio: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// 🎯 TEST 5: Validación sin configuración de cuotas
async function testNoQuotaConfig() {
  logInfo('🧪 Test 5: Validación sin configuración de cuotas');

  try {
    const response = await axios.post(`${BASE_URL}/quota-validation/validate`, {
      researchId: 'non-existent-research',
      demographics: {
        age: '35-44',
        country: 'AR',
        gender: 'O',
        educationLevel: '5',
        householdIncome: '4',
        employmentStatus: 'retired',
        dailyHoursOnline: '0-2',
        technicalProficiency: 'expert'
      }
    });

    logSuccess(`✅ Validación sin configuración exitosa: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    logError(`Error en test sin configuración: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// 🎯 EJECUTAR TODOS LOS TESTS
async function runAllTests() {
  console.log('🚀 Iniciando tests de validación de cuotas...');
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`🔬 Research ID: ${RESEARCH_ID}`);
  console.log('');

  const results = [];

  // Ejecutar tests en secuencia
  results.push(await testAgeQuotaValidation());
  results.push(await testCountryQuotaValidation());
  results.push(await testGetQuotaStats());
  results.push(await testResetQuotaCounters());
  results.push(await testNoQuotaConfig());

  console.log('');
  console.log('✅ 🎉 Todos los tests completados');

  // Resumen de resultados
  const successfulTests = results.filter(r => r !== null).length;
  const totalTests = results.length;

  console.log(`📊 Resumen: ${successfulTests}/${totalTests} tests exitosos`);

  return results;
}

// 🎯 EJECUTAR SI ES EL ARCHIVO PRINCIPAL
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAgeQuotaValidation,
  testCountryQuotaValidation,
  testGetQuotaStats,
  testResetQuotaCounters,
  testNoQuotaConfig,
  runAllTests
};
