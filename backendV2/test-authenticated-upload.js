#!/usr/bin/env node

/**
 * Script específico para probar el flujo de autenticación y upload de archivos
 * Usando el mismo flujo que usa el frontend real
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const FRONTEND_ORIGIN = 'http://localhost:3000';

// Headers que simularían venir del frontend
const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': FRONTEND_ORIGIN,
  'Referer': FRONTEND_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (Frontend-Test) EmotioXV2-Test/1.0',
  'Accept': 'application/json, text/plain, */*',
  'X-Requested-With': 'XMLHttpRequest'
};

let AUTH_TOKEN = null;
let RESEARCH_ID = null;
let PARTICIPANT_ID = null;

console.log('🔍 Probando flujo de autenticación y upload de archivos');
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

// 1. Obtener una research real existente
async function getExistingResearch() {
  console.log('\n📊 === OBTENIENDO RESEARCH EXISTENTE ===');
  
  // Probar algunas research IDs conocidas del log anterior
  const knownResearchIds = [
    '43e990f2-c475-4fd2-e66d-b1e3094d5e15',
    '123e4567-e89b-12d3-a456-426614174000'
  ];
  
  for (const researchId of knownResearchIds) {
    console.log(`\n🔍 Probando research ID: ${researchId}`);
    
    // Probar endpoint de métricas que no requiere auth
    const metricsResult = await makeRequest('GET', `/research/${researchId}/metrics`, null, false);
    
    if (metricsResult.ok) {
      RESEARCH_ID = researchId;
      console.log(`✅ Research encontrada: ${researchId}`);
      return researchId;
    }
  }
  
  console.log('⚠️  No se encontraron research existentes, creando una nueva...');
  return null;
}

// 2. Crear participante sin autenticación (como hace el frontend)
async function createParticipant() {
  console.log('\n👤 === CREANDO PARTICIPANTE ===');
  
  if (!RESEARCH_ID) {
    console.log('❌ Necesitamos una research ID válida');
    return false;
  }
  
  const participantData = {
    name: 'Test Participant Upload',
    email: `upload-test-${Date.now()}@test.com`,
    researchId: RESEARCH_ID
  };
  
  const result = await makeRequest('POST', '/participants/login', participantData, false);
  
  if (result.ok && result.data?.participant?.id) {
    PARTICIPANT_ID = result.data.participant.id;
    console.log(`✅ Participante creado: ${PARTICIPANT_ID}`);
    return true;
  }
  
  return false;
}

// 3. Probar upload de archivo
async function testFileUpload() {
  console.log('\n📤 === PROBANDO UPLOAD DE ARCHIVO ===');
  
  if (!RESEARCH_ID) {
    console.log('❌ Necesitamos una research ID válida');
    return false;
  }
  
  // Datos del archivo
  const fileData = {
    fileName: 'test-upload-real.png',
    contentType: 'image/png',
    size: 1024 * 100, // 100KB
    mimeType: 'image/png'
  };
  
  console.log('🖼️  Solicitando URL de upload...');
  
  // Solicitar URL de upload SIN autenticación
  const uploadUrlResult = await makeRequest('POST', `/research/${RESEARCH_ID}/cognitive-task/upload-url`, fileData, false);
  
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
          return true;
        } else {
          const errorText = await uploadResponse.text();
          console.log(`❌ Error en upload:`, errorText);
        }
        
      } catch (error) {
        console.log(`💥 Error leyendo/subiendo imagen:`, error.message);
      }
    } else {
      console.log('⚠️  Imagen no encontrada en Desktop');
      
      // Crear una imagen de prueba pequeña
      const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      
      const testUpload = await fetch(uploadUrlResult.data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png'
        },
        body: testImageData
      });
      
      console.log(`📤 Prueba de upload: ${testUpload.status}`);
      return testUpload.ok;
    }
  } else {
    console.log('❌ No se pudo obtener URL de upload');
    return false;
  }
  
  return false;
}

// 4. Probar algunos endpoints que funcionan sin auth
async function testPublicEndpoints() {
  console.log('\n🌐 === PROBANDO ENDPOINTS PÚBLICOS ===');
  
  if (!RESEARCH_ID) {
    console.log('❌ Necesitamos una research ID válida');
    return;
  }
  
  // Endpoints que deberían funcionar sin autenticación
  await makeRequest('GET', `/research/${RESEARCH_ID}/metrics`, null, false);
  await makeRequest('GET', `/module-responses/smartvoc/${RESEARCH_ID}`, null, false);
  await makeRequest('GET', `/module-responses/cpv/${RESEARCH_ID}`, null, false);
  await makeRequest('GET', `/module-responses/trustflow/${RESEARCH_ID}`, null, false);
}

// Función principal
async function runUploadTest() {
  try {
    console.log('⏰ Iniciando prueba de upload...\n');
    
    // 1. Obtener research existente
    await getExistingResearch();
    
    if (!RESEARCH_ID) {
      console.log('❌ No se pudo obtener una research válida');
      return;
    }
    
    // 2. Crear participante
    await createParticipant();
    
    // 3. Probar upload
    const uploadSuccess = await testFileUpload();
    
    // 4. Probar endpoints públicos
    await testPublicEndpoints();
    
    console.log('\n' + '='.repeat(60));
    if (uploadSuccess) {
      console.log('🎉 ¡PRUEBA DE UPLOAD EXITOSA!');
    } else {
      console.log('❌ Prueba de upload falló');
    }
    console.log(`📊 Research ID: ${RESEARCH_ID}`);
    console.log(`👤 Participant ID: ${PARTICIPANT_ID}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n💥 Error durante la prueba:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runUploadTest();
}

module.exports = { runUploadTest };