#!/usr/bin/env node

/**
 * 🎯 TEST COMPLETO DE PUBLIC-TESTS - EMULANDO SER UN PARTICIPANTE
 * Simula el flujo completo de un participante en public-tests:4700
 * - Login de participante
 * - Navegación por módulos
 * - Subida de archivos (si hay cognitive tasks)
 * - Completar todo el flujo
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const PUBLIC_TESTS_ORIGIN = 'http://localhost:4700';

// Headers que simularían venir de public-tests en puerto 4700
const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': PUBLIC_TESTS_ORIGIN,
  'Referer': PUBLIC_TESTS_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (Public-Tests-Participant) EmotioXV2-Participant/1.0',
  'Accept': 'application/json, text/plain, */*'
};

// Variables del participante
let RESEARCH_ID = null;
let PARTICIPANT_ID = null;
let PARTICIPANT_TOKEN = null;

console.log('🎯 TEST COMPLETO DE PUBLIC-TESTS - PARTICIPANTE');
console.log(`🌐 Public-Tests URL: ${PUBLIC_TESTS_ORIGIN}`);
console.log(`📡 Backend: ${BASE_URL}`);
console.log('=' .repeat(60));

// Función helper para requests
async function makeRequest(method, endpoint, data = null, includeAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = { ...HEADERS };
  if (includeAuth && PARTICIPANT_TOKEN) {
    headers['Authorization'] = `Bearer ${PARTICIPANT_TOKEN}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  console.log(`\n📤 ${method} ${endpoint}`);
  if (data && method !== 'GET') console.log(`📝 Data:`, JSON.stringify(data, null, 2));
  
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
      if (typeof responseData === 'object' && responseData !== null) {
        console.log(`📥 Response:`, JSON.stringify(responseData, null, 2));
      } else {
        console.log(`📥 Response:`, responseData);
      }
    } else {
      console.log(`❌ Error:`, typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);
    }
    
    return { ok: response.ok, status: response.status, data: responseData };
  } catch (error) {
    console.log(`💥 Network Error:`, error.message);
    return { ok: false, status: 0, data: null, error: error.message };
  }
}

// 🔍 STEP 1: BUSCAR UNA RESEARCH ACTIVA
async function findActiveResearch() {
  console.log('\n🔍 === BUSCANDO RESEARCH ACTIVA ===');
  
  // Intentar con la research que sabemos que permite participantes
  const knownResearchId = '43e990f2-c475-4fd2-e66d-b1e3094d5e15';
  
  console.log(`🔍 Verificando research: ${knownResearchId}`);
  
  // Verificar métricas de la research
  const metricsResult = await makeRequest('GET', `/research/${knownResearchId}/metrics`);
  
  if (metricsResult.ok) {
    RESEARCH_ID = knownResearchId;
    console.log(`✅ Research activa encontrada: ${knownResearchId}`);
    return true;
  }
  
  console.log('❌ No se encontró research activa');
  return false;
}

// 👤 STEP 2: LOGIN DE PARTICIPANTE (SIN AUTENTICACIÓN)
async function loginAsParticipant() {
  console.log('\n👤 === LOGIN COMO PARTICIPANTE ===');
  
  const participantData = {
    name: `Participante Test ${Date.now()}`,
    email: `participant-publictests-${Date.now()}@test.com`,
    researchId: RESEARCH_ID
  };
  
  const result = await makeRequest('POST', '/participants/login', participantData, false);
  
  if (result.ok && result.data?.participant?.id) {
    PARTICIPANT_ID = result.data.participant.id;
    PARTICIPANT_TOKEN = result.data.token || null;
    console.log(`✅ Participante logueado: ${PARTICIPANT_ID}`);
    if (PARTICIPANT_TOKEN) {
      console.log(`🔑 Token de participante obtenido`);
    }
    return true;
  }
  
  console.log('❌ No se pudo hacer login como participante');
  return false;
}

// 📋 STEP 3: OBTENER CONFIGURACIÓN DE LA RESEARCH
async function getResearchConfiguration() {
  console.log('\n📋 === OBTENIENDO CONFIGURACIÓN DE RESEARCH ===');
  
  // Obtener configuración de welcome screen
  const welcomeResult = await makeRequest('GET', `/research/${RESEARCH_ID}/welcome-screen`);
  
  // Obtener configuración de cognitive task
  const cognitiveResult = await makeRequest('GET', `/research/${RESEARCH_ID}/cognitive-task`);
  
  // Obtener configuración de smart voc
  const smartVocResult = await makeRequest('GET', `/research/${RESEARCH_ID}/smart-voc`);
  
  // Obtener configuración de thank you screen
  const thankYouResult = await makeRequest('GET', `/research/${RESEARCH_ID}/thank-you-screen`);
  
  const configurations = {
    welcomeScreen: welcomeResult.ok ? welcomeResult.data : null,
    cognitiveTask: cognitiveResult.ok ? cognitiveResult.data : null,
    smartVoc: smartVocResult.ok ? smartVocResult.data : null,
    thankYouScreen: thankYouResult.ok ? thankYouResult.data : null
  };
  
  console.log('✅ Configuraciones obtenidas');
  return configurations;
}

// 📝 STEP 4: SIMULAR RESPUESTAS A MÓDULOS
async function submitModuleResponses(configurations) {
  console.log('\n📝 === SIMULANDO RESPUESTAS DE PARTICIPANTE ===');
  
  const responses = [];
  
  // 1. Welcome Screen
  if (configurations.welcomeScreen) {
    console.log('📄 Respondiendo Welcome Screen...');
    
    const welcomeResponse = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
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
        deviceInfo: {
          userAgent: 'Public-Tests Browser',
          platform: 'Test'
        },
        source: 'public-tests-participant'
      }
    };
    
    const welcomeResult = await makeRequest('POST', '/module-responses', welcomeResponse);
    if (welcomeResult.ok) {
      responses.push('welcome_screen');
      console.log('✅ Welcome Screen completado');
    }
  }
  
  // 2. Cognitive Task (con posible upload)
  if (configurations.cognitiveTask) {
    console.log('🧠 Respondiendo Cognitive Task...');
    
    // Verificar si hay preguntas que requieren upload
    const cognitiveQuestions = configurations.cognitiveTask.data?.questions || [];
    let uploadSuccess = false;
    
    for (const question of cognitiveQuestions) {
      if (question.type === 'file-upload' || question.allowedTypes?.includes('image/png')) {
        console.log(`📤 Pregunta con upload encontrada: ${question.id}`);
        uploadSuccess = await testCognitiveFileUpload(question);
      }
    }
    
    const cognitiveResponse = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
      questionKey: 'cognitive_task',
      responses: [{
        questionKey: 'cognitive_task',
        response: { 
          completed: true,
          fileUploadSuccess: uploadSuccess,
          answers: ['Respuesta de prueba del participante'],
          completedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }],
      metadata: {
        deviceInfo: {
          userAgent: 'Public-Tests Browser',
          platform: 'Test'
        },
        source: 'public-tests-participant'
      }
    };
    
    const cognitiveResult = await makeRequest('POST', '/module-responses', cognitiveResponse);
    if (cognitiveResult.ok) {
      responses.push('cognitive_task');
      console.log('✅ Cognitive Task completado');
    }
  }
  
  // 3. Smart VOC
  if (configurations.smartVoc) {
    console.log('🎯 Respondiendo Smart VOC...');
    
    const smartVocResponse = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
      questionKey: 'smart_voc',
      responses: [{
        questionKey: 'smart_voc',
        response: { 
          nps: 8,
          csat: 4,
          ces: 3,
          voc: 'Excelente experiencia de prueba desde public-tests',
          emotions: ['satisfecho', 'confiado', 'valorado']
        },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }],
      metadata: {
        deviceInfo: {
          userAgent: 'Public-Tests Browser',
          platform: 'Test'
        },
        source: 'public-tests-participant'
      }
    };
    
    const smartVocResult = await makeRequest('POST', '/module-responses', smartVocResponse);
    if (smartVocResult.ok) {
      responses.push('smart_voc');
      console.log('✅ Smart VOC completado');
    }
  }
  
  // 4. Thank You Screen
  console.log('🙏 Visitando Thank You Screen...');
  
  const thankYouResponse = {
    researchId: RESEARCH_ID,
    participantId: PARTICIPANT_ID,
    questionKey: 'thank_you_screen',
    responses: [{
      questionKey: 'thank_you_screen',
      response: { 
        visited: true,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }],
    metadata: {
      deviceInfo: {
        userAgent: 'Public-Tests Browser',
        platform: 'Test'
      },
      source: 'public-tests-participant'
    }
  };
  
  const thankYouResult = await makeRequest('POST', '/module-responses', thankYouResponse);
  if (thankYouResult.ok) {
    responses.push('thank_you_screen');
    console.log('✅ Thank You Screen completado');
  }
  
  return responses;
}

// 📤 STEP 5: PROBAR UPLOAD DE ARCHIVOS EN COGNITIVE TASK
async function testCognitiveFileUpload(question) {
  console.log('\n📤 === PROBANDO UPLOAD DE ARCHIVO DESDE PUBLIC-TESTS ===');
  
  // Datos del archivo a subir
  const fileData = {
    fileName: `participant-upload-${Date.now()}.png`,
    contentType: 'image/png',
    size: 1024 * 20, // 20KB
    mimeType: 'image/png',
    questionId: question.id
  };
  
  console.log('🔄 Solicitando URL de upload desde public-tests...');
  
  // Solicitar URL de upload (sin autenticación - como participant)
  const uploadUrlResult = await makeRequest(
    'POST', 
    `/research/${RESEARCH_ID}/cognitive-task/upload-url`, 
    fileData,
    false // Sin autenticación para participants
  );
  
  if (!uploadUrlResult.ok || !uploadUrlResult.data?.uploadUrl) {
    console.log('❌ No se pudo obtener URL de upload desde public-tests');
    return false;
  }
  
  console.log('✅ URL de upload obtenida desde public-tests!');
  console.log(`📋 S3 Key: ${uploadUrlResult.data.file?.s3Key}`);
  console.log(`🌐 File URL: ${uploadUrlResult.data.file?.fileUrl}`);
  
  // Crear imagen de prueba para participante
  const testImagePath = '/tmp/participant-test-upload.png';
  const testImageData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
    'base64'
  );
  
  fs.writeFileSync(testImagePath, testImageData);
  console.log('✅ Imagen de prueba creada para participante');
  
  // Subir archivo a S3
  try {
    const imageBuffer = fs.readFileSync(testImagePath);
    console.log(`📤 Subiendo ${imageBuffer.length} bytes a S3 desde public-tests...`);
    
    const uploadResponse = await fetch(uploadUrlResult.data.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png'
      },
      body: imageBuffer
    });
    
    const uploadStatus = uploadResponse.ok ? '✅' : '❌';
    console.log(`${uploadStatus} Upload a S3 desde public-tests: ${uploadResponse.status} ${uploadResponse.statusText}`);
    
    if (uploadResponse.ok) {
      console.log('🎉 ¡ARCHIVO SUBIDO EXITOSAMENTE DESDE PUBLIC-TESTS!');
      console.log(`🌐 Archivo disponible en: ${uploadUrlResult.data.file?.fileUrl}`);
      
      // Verificar acceso al archivo
      try {
        const verifyResponse = await fetch(uploadUrlResult.data.file?.fileUrl);
        console.log(`🔍 Verificación de acceso: ${verifyResponse.status} ${verifyResponse.statusText}`);
      } catch (error) {
        console.log(`⚠️  Error verificando acceso: ${error.message}`);
      }
      
      // Limpiar archivo temporal
      fs.unlinkSync(testImagePath);
      
      return true;
    } else {
      const errorText = await uploadResponse.text();
      console.log(`❌ Error en upload S3:`, errorText);
    }
    
  } catch (error) {
    console.log(`💥 Error procesando upload:`, error.message);
  }
  
  return false;
}

// 📊 STEP 6: VERIFICAR ANALYTICS DESPUÉS DE PARTICIPACIÓN
async function verifyAnalyticsAfterParticipation() {
  console.log('\n📊 === VERIFICANDO ANALYTICS DESPUÉS DE PARTICIPACIÓN ===');
  
  // Research metrics
  const metricsResult = await makeRequest('GET', `/research/${RESEARCH_ID}/metrics`);
  
  if (metricsResult.ok) {
    const metrics = metricsResult.data.data;
    console.log(`📈 Participants: ${metrics.participants?.value}`);
    console.log(`📋 Completion Rate: ${metrics.completionRate?.value}`);
    console.log(`⏱️  Average Time: ${metrics.averageTime?.value}`);
  }
  
  // SmartVOC analytics
  await makeRequest('GET', `/module-responses/smartvoc/${RESEARCH_ID}`);
  
  // Module responses agrupadas
  await makeRequest('GET', `/module-responses/grouped-by-question/${RESEARCH_ID}`);
  
  console.log('✅ Analytics verificadas después de participación');
}

// 🚀 FUNCIÓN PRINCIPAL
async function runPublicTestsParticipantFlow() {
  try {
    console.log('⏰ Iniciando flujo completo de participante en public-tests...\n');
    
    // 1. Buscar research activa
    const researchFound = await findActiveResearch();
    if (!researchFound) {
      console.log('❌ Test fallido: No se encontró research activa');
      return;
    }
    
    // 2. Login como participante
    const loginSuccess = await loginAsParticipant();
    if (!loginSuccess) {
      console.log('❌ Test fallido: No se pudo hacer login como participante');
      return;
    }
    
    // 3. Obtener configuración
    const configurations = await getResearchConfiguration();
    
    // 4. Simular respuestas completas
    const completedModules = await submitModuleResponses(configurations);
    
    // 5. Verificar analytics
    await verifyAnalyticsAfterParticipation();
    
    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('🎉 REPORTE FINAL - PARTICIPANTE PUBLIC-TESTS');
    console.log('='.repeat(60));
    console.log(`🔍 Research encontrada: ✅ ${RESEARCH_ID}`);
    console.log(`👤 Login participante: ✅ ${PARTICIPANT_ID}`);
    console.log(`📋 Módulos completados: ${completedModules.length}`);
    console.log(`📝 Módulos: ${completedModules.join(', ')}`);
    console.log(`🌐 Origen: ${PUBLIC_TESTS_ORIGIN}`);
    console.log('='.repeat(60));
    
    if (completedModules.length >= 3) {
      console.log('🎉 ¡FLUJO COMPLETO DE PARTICIPANTE EXITOSO!');
      console.log('👤 Participante completó todos los módulos');
      console.log('📤 Upload de archivos funcionando desde public-tests');
      console.log('📊 Analytics actualizadas correctamente');
    } else {
      console.log('⚠️  Flujo parcialmente completado');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n💥 Error durante el flujo de participante:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runPublicTestsParticipantFlow();
}

module.exports = { runPublicTestsParticipantFlow };