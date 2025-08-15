#!/usr/bin/env node

/**
 * Script para probar endpoints públicos que no requieren autenticación
 * Verificar que el sistema funciona correctamente para análisis y métricas
 */

const BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const FRONTEND_ORIGIN = 'http://localhost:3000';

const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': FRONTEND_ORIGIN,
  'Referer': FRONTEND_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (Frontend-Test) EmotioXV2-Public-Test/1.0',
  'Accept': 'application/json, text/plain, */*'
};

// Research ID conocida que funciona
const RESEARCH_ID = '43e990f2-c475-4fd2-e66d-b1e3094d5e15';

console.log('🌐 Probando endpoints públicos de EmotioXV2');
console.log(`📊 Research ID de prueba: ${RESEARCH_ID}`);
console.log('=' .repeat(60));

// Función helper para requests sin auth
async function makePublicRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: HEADERS
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  console.log(`\n📤 ${method} ${endpoint}`);
  if (data) console.log(`📝 Data:`, JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`📥 Response:`, typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);
    } else {
      console.log(`❌ Error:`, typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);
    }
    
    return { ok: response.ok, status: response.status, data: responseData };
  } catch (error) {
    console.log(`💥 Network Error:`, error.message);
    return { ok: false, status: 0, data: null, error: error.message };
  }
}

// Test 1: Research Metrics (Público)
async function testResearchMetrics() {
  console.log('\n📊 === TESTING RESEARCH METRICS ===');
  
  const result = await makePublicRequest('GET', `/research/${RESEARCH_ID}/metrics`);
  
  if (result.ok && result.data?.data) {
    console.log('✅ Research metrics funcionando correctamente');
    const metrics = result.data.data;
    console.log(`📈 Status: ${metrics.status?.value}`);
    console.log(`👥 Participants: ${metrics.participants?.value}`);
    console.log(`📋 Completion Rate: ${metrics.completionRate?.value}`);
    console.log(`⏱️  Average Time: ${metrics.averageTime?.value}`);
    return true;
  }
  
  return false;
}

// Test 2: SmartVOC Analytics (Público)
async function testSmartVOCAnalytics() {
  console.log('\n🎯 === TESTING SMARTVOC ANALYTICS ===');
  
  const endpoints = [
    `/module-responses/smartvoc/${RESEARCH_ID}`,
    `/module-responses/cpv/${RESEARCH_ID}`,
    `/module-responses/trustflow/${RESEARCH_ID}`
  ];
  
  let allWorking = true;
  
  for (const endpoint of endpoints) {
    const result = await makePublicRequest('GET', endpoint);
    
    if (result.ok && result.data?.data) {
      console.log(`✅ ${endpoint.split('/').pop()?.toUpperCase()} analytics working`);
      
      if (endpoint.includes('smartvoc')) {
        const data = result.data.data;
        console.log(`📊 Total Responses: ${data.totalResponses}`);
        console.log(`👤 Unique Participants: ${data.uniqueParticipants}`);
        console.log(`⭐ NPS Score: ${data.npsScore}`);
      }
      
      if (endpoint.includes('cpv')) {
        const data = result.data.data;
        console.log(`💰 CPV Value: ${data.cpvValue}`);
        console.log(`😊 Satisfaction: ${data.satisfaction}`);
        console.log(`🔄 Retention: ${data.retention}`);
        console.log(`📈 Impact: ${data.impact}`);
      }
      
    } else {
      console.log(`❌ ${endpoint} failed`);
      allWorking = false;
    }
  }
  
  return allWorking;
}

// Test 3: Module Responses Grouped (Público)
async function testModuleResponsesGrouped() {
  console.log('\n📝 === TESTING MODULE RESPONSES GROUPED ===');
  
  const result = await makePublicRequest('GET', `/module-responses/grouped-by-question/${RESEARCH_ID}`);
  
  if (result.ok && Array.isArray(result.data?.data)) {
    console.log('✅ Module responses grouped funcionando');
    console.log(`📊 Total question groups: ${result.data.data.length}`);
    return true;
  }
  
  return false;
}

// Test 4: Participants List (Público)
async function testParticipantsList() {
  console.log('\n👥 === TESTING PARTICIPANTS LIST ===');
  
  const result = await makePublicRequest('GET', '/participants');
  
  if (result.ok && Array.isArray(result.data?.data)) {
    console.log('✅ Participants list funcionando');
    console.log(`👤 Total participants: ${result.data.data.length}`);
    return true;
  }
  
  return false;
}

// Test 5: Quota Analysis Stats (Público)
async function testQuotaAnalysisStats() {
  console.log('\n📈 === TESTING QUOTA ANALYSIS STATS ===');
  
  const result = await makePublicRequest('GET', `/quota-analysis/stats/${RESEARCH_ID}`);
  
  if (result.ok && result.data?.success) {
    console.log('✅ Quota analysis stats funcionando');
    console.log(`📊 Quota stats: ${Array.isArray(result.data.data) ? result.data.data.length : 0} entries`);
    return true;
  }
  
  return false;
}

// Test 6: Test Reset Functionality (Público)
async function testQuotaReset() {
  console.log('\n🔄 === TESTING QUOTA RESET ===');
  
  const result = await makePublicRequest('POST', '/quota-analysis/reset', {
    researchId: RESEARCH_ID
  });
  
  if (result.ok && result.data?.success) {
    console.log('✅ Quota reset funcionando');
    console.log(`✅ Message: ${result.data.message}`);
    return true;
  }
  
  return false;
}

// Test 7: Health Check del Sistema
async function testSystemHealth() {
  console.log('\n🏥 === TESTING SYSTEM HEALTH ===');
  
  const tests = [
    { name: 'Research Metrics', test: testResearchMetrics },
    { name: 'SmartVOC Analytics', test: testSmartVOCAnalytics },
    { name: 'Module Responses', test: testModuleResponsesGrouped },
    { name: 'Participants List', test: testParticipantsList },
    { name: 'Quota Stats', test: testQuotaAnalysisStats },
    { name: 'Quota Reset', test: testQuotaReset }
  ];
  
  const results = {};
  
  for (const { name, test } of tests) {
    try {
      results[name] = await test();
    } catch (error) {
      console.log(`❌ ${name} failed with error:`, error.message);
      results[name] = false;
    }
  }
  
  return results;
}

// Función principal
async function runPublicEndpointsTest() {
  try {
    console.log('⏰ Iniciando pruebas de endpoints públicos...\n');
    
    const healthResults = await testSystemHealth();
    
    console.log('\n' + '='.repeat(60));
    console.log('🏥 REPORTE DE SALUD DEL SISTEMA');
    console.log('='.repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    
    Object.entries(healthResults).forEach(([testName, passed]) => {
      totalTests++;
      if (passed) passedTests++;
      
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${testName}: ${passed ? 'WORKING' : 'FAILED'}`);
    });
    
    console.log('='.repeat(60));
    console.log(`📊 Tests passed: ${passedTests}/${totalTests}`);
    console.log(`📈 Success rate: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ¡TODOS LOS ENDPOINTS PÚBLICOS FUNCIONANDO!');
    } else {
      console.log('⚠️  Algunos endpoints públicos presentan problemas');
    }
    
    console.log(`📊 Research ID used: ${RESEARCH_ID}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n💥 Error durante las pruebas:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runPublicEndpointsTest();
}

module.exports = { runPublicEndpointsTest };