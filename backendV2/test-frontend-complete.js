#!/usr/bin/env node

/**
 * Script completo para emular el frontend en puerto 3000
 * y probar TODOS los endpoints de la aplicación EmotioXV2
 */

const fs = require('fs');
const path = require('path');

// 🎯 CONFIGURACIÓN - Simulando frontend en localhost:3000
const BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const FRONTEND_ORIGIN = 'http://localhost:3000';

// Headers que simularían venir del frontend en puerto 3000
const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': FRONTEND_ORIGIN,
  'Referer': FRONTEND_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (Frontend-Test) EmotioXV2-Test/1.0',
  'Accept': 'application/json, text/plain, */*',
  'X-Requested-With': 'XMLHttpRequest'
};

// Token JWT de prueba (necesitaremos uno real)
let AUTH_TOKEN = null;

// IDs que se crearán durante las pruebas
let testResearchId = null;
let testParticipantId = null;
let testModuleResponseId = null;

console.log('🚀 Iniciando pruebas completas del frontend EmotioXV2');
console.log(`📡 Backend: ${BASE_URL}`);
console.log(`🖥️  Frontend simulado: ${FRONTEND_ORIGIN}`);
console.log('=' .repeat(60));

// Función helper para hacer requests
async function makeRequest(method, endpoint, data = null, includeAuth = true) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = { ...HEADERS };
  if (includeAuth && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  const options = {
    method,
    headers
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

// 🔐 PRUEBA 1: AUTENTICACIÓN
async function testAuthentication() {
  console.log('\n🔐 === PRUEBAS DE AUTENTICACIÓN ===');
  
  // Crear usuario de prueba
  const userData = {
    name: 'Test Frontend User',
    email: `test-frontend-${Date.now()}@emotioxv2.com`,
    password: 'TestPassword123!'
  };
  
  // Intentar login (probablemente falle, pero vemos la respuesta)
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: userData.email,
    password: userData.password
  }, false);
  
  if (loginResult.ok && loginResult.data?.token) {
    AUTH_TOKEN = loginResult.data.token;
    console.log('🎉 Login exitoso! Token obtenido.');
  } else {
    console.log('⚠️  Login falló, continuando sin token...');
  }
}

// 📊 PRUEBA 2: RESEARCH ENDPOINTS
async function testResearchEndpoints() {
  console.log('\n📊 === PRUEBAS DE RESEARCH ===');
  
  // GET todas las research
  await makeRequest('GET', '/research');
  
  // Crear nueva research
  const researchData = {
    title: `Test Research ${Date.now()}`,
    description: 'Research creada por el test del frontend',
    status: 'draft',
    createdBy: 'test-frontend',
    metadata: {
      createdFrom: 'frontend-test',
      version: '2.0'
    }
  };
  
  const createResult = await makeRequest('POST', '/research', researchData);
  
  if (createResult.ok && createResult.data?.id) {
    testResearchId = createResult.data.id;
    console.log(`✅ Research creada: ${testResearchId}`);
    
    // GET research específica
    await makeRequest('GET', `/research/${testResearchId}/forms`);
    await makeRequest('GET', `/research/${testResearchId}/metrics`);
    await makeRequest('GET', `/research/${testResearchId}/participants`);
  }
}

// 👥 PRUEBA 3: PARTICIPANTS
async function testParticipantsEndpoints() {
  console.log('\n👥 === PRUEBAS DE PARTICIPANTES ===');
  
  // Generar participantes
  const generateResult = await makeRequest('POST', '/participants/generate', {
    count: 3,
    researchId: testResearchId || 'test-research-id'
  });
  
  // Login de participante
  const participantData = {
    name: 'Test Participant',
    email: `participant-${Date.now()}@test.com`,
    researchId: testResearchId || 'test-research-id'
  };
  
  const participantLogin = await makeRequest('POST', '/participants/login', participantData, false);
  
  if (participantLogin.ok && participantLogin.data?.participant?.id) {
    testParticipantId = participantLogin.data.participant.id;
    console.log(`✅ Participante logueado: ${testParticipantId}`);
  }
  
  // GET participantes
  await makeRequest('GET', '/participants');
  
  if (testResearchId) {
    await makeRequest('GET', `/research/${testResearchId}/participants`);
    await makeRequest('GET', `/research/${testResearchId}/participants/status`);
  }
}

// 📝 PRUEBA 4: MODULE RESPONSES
async function testModuleResponsesEndpoints() {
  console.log('\n📝 === PRUEBAS DE MODULE RESPONSES ===');
  
  const moduleResponseData = {
    researchId: testResearchId || 'test-research-id',
    participantId: testParticipantId || 'test-participant-id',
    questionKey: 'welcome_screen',
    responses: [{
      questionKey: 'welcome_screen',
      response: { 
        consent: true, 
        startTime: new Date().toISOString() 
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }],
    metadata: {
      deviceInfo: 'Frontend Test Device',
      userAgent: 'Test Browser'
    }
  };
  
  // Crear module response
  const createResponse = await makeRequest('POST', '/module-responses', moduleResponseData);
  
  if (createResponse.ok && createResponse.data?.id) {
    testModuleResponseId = createResponse.data.id;
    console.log(`✅ Module Response creado: ${testModuleResponseId}`);
    
    // Update module response
    await makeRequest('PUT', `/module-responses/${testModuleResponseId}`, {
      ...moduleResponseData,
      responses: [{
        ...moduleResponseData.responses[0],
        response: { 
          ...moduleResponseData.responses[0].response,
          updated: true 
        }
      }]
    });
  }
  
  // GET module responses
  await makeRequest('GET', '/module-responses');
  
  if (testResearchId) {
    await makeRequest('GET', `/module-responses/research/${testResearchId}`);
    await makeRequest('GET', `/module-responses/grouped-by-question/${testResearchId}`);
  }
}

// 🎯 PRUEBA 5: RESEARCH MODULES (Welcome, Cognitive, etc.)
async function testResearchModulesEndpoints() {
  console.log('\n🎯 === PRUEBAS DE MÓDULOS DE RESEARCH ===');
  
  if (!testResearchId) {
    console.log('⚠️  Necesitamos un research ID para probar módulos');
    return;
  }
  
  // Welcome Screen
  const welcomeData = {
    title: 'Bienvenido al Test',
    description: 'Esta es una pantalla de bienvenida de prueba',
    enabled: true,
    settings: {
      showLogo: true,
      theme: 'default'
    }
  };
  
  await makeRequest('GET', `/research/${testResearchId}/welcome-screen`);
  await makeRequest('POST', `/research/${testResearchId}/welcome-screen`, welcomeData);
  
  // Cognitive Task
  const cognitiveData = {
    title: 'Tarea Cognitiva de Prueba',
    description: 'Descripción de la tarea cognitiva',
    enabled: true,
    questions: [{
      id: 'q1',
      type: 'text',
      text: '¿Cómo te sientes?',
      required: true
    }]
  };
  
  await makeRequest('GET', `/research/${testResearchId}/cognitive-task`);
  await makeRequest('POST', `/research/${testResearchId}/cognitive-task`, cognitiveData);
  
  // Smart VOC
  const smartVocData = {
    title: 'Smart VOC Test',
    description: 'Prueba de Smart VOC',
    enabled: true,
    questions: [{
      id: 'voc1',
      type: 'rating',
      text: '¿Qué tan satisfecho estás?',
      scale: { min: 1, max: 10 }
    }]
  };
  
  await makeRequest('GET', `/research/${testResearchId}/smart-voc`);
  await makeRequest('POST', `/research/${testResearchId}/smart-voc`, smartVocData);
  
  // Thank You Screen
  const thankYouData = {
    title: 'Gracias por participar',
    description: 'Has completado la investigación exitosamente',
    enabled: true,
    settings: {
      showSummary: true,
      redirectUrl: 'https://example.com'
    }
  };
  
  await makeRequest('GET', `/research/${testResearchId}/thank-you-screen`);
  await makeRequest('POST', `/research/${testResearchId}/thank-you-screen`, thankYouData);
  
  // Eye Tracking
  const eyeTrackingData = {
    enabled: true,
    settings: {
      calibrationPoints: 9,
      trackingDuration: 60000
    }
  };
  
  await makeRequest('GET', `/research/${testResearchId}/eye-tracking`);
  await makeRequest('POST', `/research/${testResearchId}/eye-tracking`, eyeTrackingData);
}

// 📤 PRUEBA 6: FILE UPLOAD (¡LA ESTRELLA!)
async function testFileUploadEndpoints() {
  console.log('\n📤 === PRUEBAS DE SUBIDA DE ARCHIVOS ===');
  
  if (!testResearchId) {
    console.log('⚠️  Creando research ID temporal para prueba de upload');
    testResearchId = 'test-research-upload-' + Date.now();
  }
  
  // Simular datos de archivo
  const fileData = {
    fileName: 'test-image-frontend.png',
    contentType: 'image/png',
    size: 1024 * 50, // 50KB simulado
    mimeType: 'image/png'
  };
  
  console.log('🖼️  Solicitando URL de upload para imagen PNG...');
  
  // Solicitar URL de upload
  const uploadUrlResult = await makeRequest('POST', `/research/${testResearchId}/cognitive-task/upload-url`, fileData);
  
  if (uploadUrlResult.ok && uploadUrlResult.data?.uploadUrl) {
    console.log('✅ URL de upload obtenida!');
    console.log(`📋 Upload URL: ${uploadUrlResult.data.uploadUrl}`);
    console.log(`🔑 S3 Key: ${uploadUrlResult.data.file?.s3Key}`);
    
    // Intentar subir archivo real
    const imagePath = '/Users/clementefalcone/Desktop/Captura de pantalla 2025-08-14 a la(s) 3.15.40 p.m..png';
    
    if (fs.existsSync(imagePath)) {
      console.log('🖼️  Subiendo imagen real desde Desktop...');
      
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        console.log(`📊 Tamaño de imagen: ${imageBuffer.length} bytes`);
        
        // Subir a S3 con la URL presignada
        const uploadResponse = await fetch(uploadUrlResult.data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png'
          },
          body: imageBuffer
        });
        
        const uploadStatus = uploadResponse.ok ? '✅' : '❌';
        console.log(`${uploadStatus} Upload a S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
        
        if (uploadResponse.ok) {
          console.log('🎉 ¡IMAGEN SUBIDA EXITOSAMENTE A S3!');
          console.log(`🌐 Archivo disponible en: ${uploadUrlResult.data.file?.fileUrl}`);
        } else {
          const errorText = await uploadResponse.text();
          console.log(`❌ Error en upload:`, errorText);
        }
        
      } catch (error) {
        console.log(`💥 Error leyendo/subiendo imagen:`, error.message);
      }
    } else {
      console.log('⚠️  Imagen no encontrada en Desktop, simulando upload...');
      
      // Simular upload con datos dummy
      const dummyUpload = await fetch(uploadUrlResult.data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png'
        },
        body: 'fake-image-data-for-testing'
      });
      
      console.log(`📤 Simulación de upload: ${dummyUpload.status}`);
    }
  } else {
    console.log('❌ No se pudo obtener URL de upload');
  }
}

// 📊 PRUEBA 7: ANALYTICS Y RESULTADOS
async function testAnalyticsEndpoints() {
  console.log('\n📊 === PRUEBAS DE ANALYTICS ===');
  
  if (!testResearchId) {
    console.log('⚠️  Sin research ID para analytics');
    return;
  }
  
  // SmartVOC Analytics
  await makeRequest('GET', `/module-responses/smartvoc/${testResearchId}`);
  await makeRequest('GET', `/module-responses/cpv/${testResearchId}`);
  await makeRequest('GET', `/module-responses/trustflow/${testResearchId}`);
  
  // Métricas generales
  await makeRequest('GET', `/research/${testResearchId}/metrics`);
  
  // Respuestas agrupadas
  await makeRequest('GET', `/module-responses/grouped-by-question/${testResearchId}`);
}

// 🔍 PRUEBA 8: LOCATION TRACKING
async function testLocationTrackingEndpoints() {
  console.log('\n🔍 === PRUEBAS DE LOCATION TRACKING ===');
  
  // Enviar ubicación
  const locationData = {
    researchId: testResearchId || 'test-research-id',
    participantId: testParticipantId || 'test-participant-id',
    latitude: -33.4489,
    longitude: -70.6693,
    accuracy: 10,
    timestamp: new Date().toISOString(),
    metadata: {
      device: 'frontend-test',
      source: 'manual'
    }
  };
  
  await makeRequest('POST', '/location-tracking', locationData);
  
  if (testResearchId) {
    await makeRequest('GET', `/location-tracking/${testResearchId}`);
    await makeRequest('GET', `/location-tracking/${testResearchId}/stats`);
  }
}

// 📈 PRUEBA 9: QUOTA ANALYSIS
async function testQuotaAnalysisEndpoints() {
  console.log('\n📈 === PRUEBAS DE QUOTA ANALYSIS ===');
  
  // Analizar cuotas
  const quotaData = {
    researchId: testResearchId || 'test-research-id',
    participantData: {
      age: '25-34',
      gender: 'female',
      location: 'Santiago'
    }
  };
  
  await makeRequest('POST', '/quota-analysis/analyze', quotaData);
  
  if (testResearchId) {
    await makeRequest('GET', `/quota-analysis/stats/${testResearchId}`);
  }
  
  // Reset cuotas
  await makeRequest('POST', '/quota-analysis/reset', {
    researchId: testResearchId || 'test-research-id'
  });
}

// 🔌 PRUEBA 10: WEBSOCKET (Simulado)
async function testWebSocketEndpoints() {
  console.log('\n🔌 === PRUEBAS DE WEBSOCKET ===');
  
  // Monitoring events
  const monitoringData = {
    type: 'PARTICIPANT_LOGIN',
    data: {
      researchId: testResearchId || 'test-research-id',
      participantId: testParticipantId || 'test-participant-id',
      timestamp: new Date().toISOString(),
      userAgent: 'Frontend Test Browser'
    }
  };
  
  await makeRequest('POST', '/monitoring/event', monitoringData);
  
  // Subscribe to monitoring
  await makeRequest('POST', '/monitoring/subscribe', {
    researchId: testResearchId || 'test-research-id',
    clientType: 'frontend'
  });
}

// 🧹 PRUEBA 11: CLEANUP
async function testCleanupEndpoints() {
  console.log('\n🧹 === PRUEBAS DE LIMPIEZA ===');
  
  // Delete module responses
  if (testModuleResponseId) {
    await makeRequest('DELETE', `/module-responses/${testModuleResponseId}`);
  }
  
  // Delete participants
  if (testParticipantId) {
    await makeRequest('DELETE', `/participants/${testParticipantId}`);
  }
  
  // Delete research (si es necesario)
  if (testResearchId) {
    console.log(`⚠️  Research ${testResearchId} creada para pruebas`);
    // await makeRequest('DELETE', `/research/${testResearchId}`);
  }
}

// 🚀 FUNCIÓN PRINCIPAL
async function runAllTests() {
  console.log('⏰ Iniciando todas las pruebas...\n');
  
  try {
    await testAuthentication();
    await testResearchEndpoints();
    await testParticipantsEndpoints();
    await testModuleResponsesEndpoints();
    await testResearchModulesEndpoints();
    await testFileUploadEndpoints(); // ⭐ LA ESTRELLA
    await testAnalyticsEndpoints();
    await testLocationTrackingEndpoints();
    await testQuotaAnalysisEndpoints();
    await testWebSocketEndpoints();
    await testCleanupEndpoints();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS!');
    console.log(`📊 Research ID de prueba: ${testResearchId}`);
    console.log(`👤 Participant ID de prueba: ${testParticipantId}`);
    console.log(`📝 Module Response ID de prueba: ${testModuleResponseId}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n💥 Error durante las pruebas:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  makeRequest,
  BASE_URL,
  FRONTEND_ORIGIN
};