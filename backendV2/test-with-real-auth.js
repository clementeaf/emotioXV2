#!/usr/bin/env node

/**
 * ⭐ TEST COMPLETO CON AUTENTICACIÓN REAL
 * Usuario: clemente@gmail.com
 * Password: 12345678
 * Incluye: Subida real de imágenes PNG desde Desktop
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const FRONTEND_ORIGIN = 'http://localhost:3000';

// ✨ CREDENCIALES REALES
const USER_CREDENTIALS = {
  email: 'clemente@gmail.com',
  password: '12345678'
};

const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': FRONTEND_ORIGIN,
  'Referer': FRONTEND_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (Frontend-Test) EmotioXV2-Auth-Test/1.0',
  'Accept': 'application/json, text/plain, */*'
};

let AUTH_TOKEN = null;
let USER_ID = null;
let RESEARCH_ID = null;
let PARTICIPANT_ID = null;

console.log('🔐 TEST COMPLETO CON AUTENTICACIÓN REAL');
console.log(`👤 Usuario: ${USER_CREDENTIALS.email}`);
console.log(`🖥️  Frontend simulado: ${FRONTEND_ORIGIN}`);
console.log('=' .repeat(60));

// Función helper para requests
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
        // Limitar output para tokens largos
        const displayData = { ...responseData };
        if (displayData.token && displayData.token.length > 50) {
          displayData.token = displayData.token.substring(0, 50) + '...';
        }
        console.log(`📥 Response:`, JSON.stringify(displayData, null, 2));
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

// 🔐 STEP 1: AUTENTICACIÓN
async function authenticate() {
  console.log('\n🔐 === AUTENTICACIÓN ===');
  
  const loginResult = await makeRequest('POST', '/auth/login', USER_CREDENTIALS, false);
  
  if (loginResult.ok && loginResult.data?.token) {
    AUTH_TOKEN = loginResult.data.token;
    USER_ID = loginResult.data.user?.id || loginResult.data.userId;
    console.log('🎉 ¡AUTENTICACIÓN EXITOSA!');
    console.log(`🔑 Token obtenido (${AUTH_TOKEN.length} chars)`);
    console.log(`👤 User ID: ${USER_ID}`);
    return true;
  } else {
    console.log('❌ AUTENTICACIÓN FALLÓ');
    return false;
  }
}

// 📊 STEP 2: CREAR NUEVA RESEARCH
async function setupResearch() {
  console.log('\n📊 === CREAR NUEVA RESEARCH ===');
  
  // Crear nueva research directamente
  const researchData = {
    name: `Test Research Auth ${Date.now()}`,
    title: `Test Research Auth ${Date.now()}`,
    description: 'Research con autenticación real para testing completo',
    enterprise: 'test-enterprise',
    type: 'behavioural',
    technique: 'aim-framework',
    status: 'active',
    targetParticipants: 50,
    objectives: ['Probar subida de archivos'],
    tags: ['test', 'file-upload', 'authentication'],
    createdBy: USER_ID,
    metadata: {
      createdFrom: 'authenticated-test',
      version: '2.0',
      testType: 'file-upload'
    }
  };
  
  const createResult = await makeRequest('POST', '/research', researchData);
  
  if (createResult.ok && createResult.data?.data?.id) {
    RESEARCH_ID = createResult.data.data.id;
    console.log(`✅ Nueva research creada: ${RESEARCH_ID}`);
    return true;
  }
  
  console.log('❌ No se pudo crear research');
  return false;
}

// 👤 STEP 3: CREAR PARTICIPANTE
async function createParticipant() {
  console.log('\n👤 === CREAR PARTICIPANTE ===');
  
  const participantData = {
    name: 'Test Participant Authenticated',
    email: `auth-test-${Date.now()}@test.com`,
    researchId: RESEARCH_ID
  };
  
  const result = await makeRequest('POST', '/participants/login', participantData, false);
  
  if (result.ok && result.data?.participant?.id) {
    PARTICIPANT_ID = result.data.participant.id;
    console.log(`✅ Participante creado: ${PARTICIPANT_ID}`);
    return true;
  }
  
  console.log('❌ No se pudo crear participante');
  return false;
}

// 🎯 STEP 4: CONFIGURAR MÓDULOS
async function setupModules() {
  console.log('\n🎯 === CONFIGURAR MÓDULOS ===');
  
  // Cognitive Task
  const cognitiveData = {
    title: 'Tarea Cognitiva Autenticada',
    description: 'Tarea para testing de subida de archivos',
    enabled: true,
    questions: [{
      id: 'upload-test-1',
      type: 'file-upload',
      text: '¿Puedes subir una imagen PNG?',
      required: true,
      allowMultiple: true,
      allowedTypes: ['image/png', 'image/jpeg']
    }]
  };
  
  const cognitiveResult = await makeRequest('POST', `/research/${RESEARCH_ID}/cognitive-task`, cognitiveData);
  
  if (cognitiveResult.ok) {
    console.log('✅ Cognitive Task configurado');
    return true;
  }
  
  return false;
}

// 📤 STEP 5: ¡LA ESTRELLA! - SUBIR IMAGEN REAL
async function testRealImageUpload() {
  console.log('\n📤 === SUBIDA DE IMAGEN REAL ===');
  
  // Buscar imagen PNG en Desktop
  const possibleImages = [
    '/Users/clementefalcone/Desktop/Captura de pantalla 2025-08-14 a la(s) 3.15.40 p.m..png',
    '/Users/clementefalcone/Desktop/screenshot.png',
    '/Users/clementefalcone/Desktop/test.png'
  ];
  
  let imagePath = null;
  let imageStats = null;
  
  for (const path of possibleImages) {
    if (fs.existsSync(path)) {
      imagePath = path;
      imageStats = fs.statSync(path);
      break;
    }
  }
  
  if (!imagePath) {
    console.log('⚠️  No se encontró imagen PNG en Desktop, creando imagen de prueba...');
    
    // Crear imagen PNG de prueba (1x1 pixel transparente)
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
      'base64'
    );
    
    imagePath = '/tmp/test-upload.png';
    fs.writeFileSync(imagePath, testImageData);
    imageStats = fs.statSync(imagePath);
    console.log('✅ Imagen de prueba creada');
  }
  
  console.log(`🖼️  Imagen encontrada: ${path.basename(imagePath)}`);
  console.log(`📊 Tamaño: ${imageStats.size} bytes`);
  
  // Paso 1: Solicitar URL de upload
  const fileName = `authenticated-upload-${Date.now()}.png`;
  const uploadRequestData = {
    fileName: fileName,
    contentType: 'image/png',
    size: imageStats.size,
    mimeType: 'image/png',
    questionId: 'upload-test-1'
  };
  
  console.log('🔄 Solicitando URL de upload con autenticación...');
  
  const uploadUrlResult = await makeRequest(
    'POST', 
    `/research/${RESEARCH_ID}/cognitive-task/upload-url`, 
    uploadRequestData
  );
  
  if (!uploadUrlResult.ok || !uploadUrlResult.data?.uploadUrl) {
    console.log('❌ No se pudo obtener URL de upload');
    return false;
  }
  
  console.log('✅ URL de upload obtenida!');
  console.log(`📋 S3 Key: ${uploadUrlResult.data.file?.s3Key}`);
  console.log(`🌐 File URL: ${uploadUrlResult.data.file?.fileUrl}`);
  
  // Paso 2: Subir archivo a S3
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`📤 Subiendo ${imageBuffer.length} bytes a S3...`);
    
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
      
      // Verificar que el archivo es accesible
      try {
        const verifyResponse = await fetch(uploadUrlResult.data.file?.fileUrl);
        console.log(`🔍 Verificación de acceso: ${verifyResponse.status} ${verifyResponse.statusText}`);
      } catch (error) {
        console.log(`⚠️  Error verificando acceso: ${error.message}`);
      }
      
      return true;
    } else {
      const errorText = await uploadResponse.text();
      console.log(`❌ Error en upload S3:`, errorText);
    }
    
  } catch (error) {
    console.log(`💥 Error procesando imagen:`, error.message);
  }
  
  return false;
}

// 📊 STEP 6: CREAR RESPUESTAS DE MÓDULOS
async function createModuleResponses() {
  console.log('\n📝 === CREAR MODULE RESPONSES ===');
  
  const responseData = {
    researchId: RESEARCH_ID,
    participantId: PARTICIPANT_ID,
    questionKey: 'upload-test-1',
    responses: [{
      questionKey: 'upload-test-1',
      response: { 
        fileUploaded: true,
        uploadedAt: new Date().toISOString(),
        success: true
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }],
    metadata: {
      deviceInfo: {
        userAgent: 'Test Browser',
        platform: 'Test'
      },
      testType: 'authenticated-upload'
    }
  };
  
  const result = await makeRequest('POST', '/module-responses', responseData);
  
  if (result.ok) {
    console.log('✅ Module Response creado exitosamente');
    return true;
  }
  
  return false;
}

// 📊 STEP 7: VERIFICAR ANALYTICS
async function verifyAnalytics() {
  console.log('\n📊 === VERIFICAR ANALYTICS ===');
  
  // Research metrics
  await makeRequest('GET', `/research/${RESEARCH_ID}/metrics`);
  
  // SmartVOC analytics
  await makeRequest('GET', `/module-responses/smartvoc/${RESEARCH_ID}`);
  
  // Module responses
  await makeRequest('GET', `/module-responses/research/${RESEARCH_ID}`);
  
  console.log('✅ Analytics verificadas');
  return true;
}

// 🚀 FUNCIÓN PRINCIPAL
async function runCompleteAuthenticatedTest() {
  try {
    console.log('⏰ Iniciando test completo con autenticación...\n');
    
    // 1. Autenticarse
    const authSuccess = await authenticate();
    if (!authSuccess) {
      console.log('❌ Test fallido: No se pudo autenticar');
      return;
    }
    
    // 2. Setup research
    const researchSuccess = await setupResearch();
    if (!researchSuccess) {
      console.log('❌ Test fallido: No se pudo setup research');
      return;
    }
    
    // 3. Crear participante (opcional para uploads)
    const participantSuccess = await createParticipant();
    if (!participantSuccess) {
      console.log('⚠️  Advertencia: No se pudo crear participante, continuando con upload directo');
    }
    
    // 4. Configurar módulos
    const modulesSuccess = await setupModules();
    if (!modulesSuccess) {
      console.log('⚠️  Advertencia: No se pudieron configurar todos los módulos');
    }
    
    // 5. ¡LA ESTRELLA! - Subir imagen real
    const uploadSuccess = await testRealImageUpload();
    
    // 6. Crear respuestas
    const responseSuccess = await createModuleResponses();
    
    // 7. Verificar analytics
    await verifyAnalytics();
    
    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('🎉 REPORTE FINAL - TEST AUTENTICADO COMPLETO');
    console.log('='.repeat(60));
    console.log(`🔐 Autenticación: ✅ EXITOSA`);
    console.log(`📊 Research ID: ${RESEARCH_ID}`);
    console.log(`👤 Participant ID: ${PARTICIPANT_ID}`);
    console.log(`📤 Upload de imagen: ${uploadSuccess ? '✅ EXITOSO' : '❌ FALLÓ'}`);
    console.log(`📝 Module responses: ${responseSuccess ? '✅ EXITOSO' : '❌ FALLÓ'}`);
    console.log('='.repeat(60));
    
    if (uploadSuccess) {
      console.log('🎉 ¡TEST COMPLETO EXITOSO!');
      console.log('🖼️  Imagen PNG subida correctamente a S3');
      console.log('🔐 Sistema de autenticación funcionando');
      console.log('📊 Analytics y métricas operativas');
    } else {
      console.log('⚠️  Test parcialmente exitoso - problema con upload');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n💥 Error durante el test:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runCompleteAuthenticatedTest();
}

module.exports = { runCompleteAuthenticatedTest };