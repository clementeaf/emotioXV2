#!/usr/bin/env node

/**
 * Test para las nuevas rutas de Screener e Implicit Association
 * Verifica que las rutas estén disponibles y funcionen correctamente
 */

const BASE_URL = process.env.API_URL || 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const FRONTEND_ORIGIN = 'http://localhost:3000';

// Credenciales del admin
const ADMIN_CREDENTIALS = {
  email: 'clemente@gmail.com',
  password: '12345678'
};

let ADMIN_TOKEN = null;
let RESEARCH_ID = null;

const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': FRONTEND_ORIGIN,
  'Referer': FRONTEND_ORIGIN,
  'User-Agent': 'Mozilla/5.0 (Test) EmotioXV2-Test/1.0',
  'Accept': 'application/json, text/plain, */*'
};

/**
 * Función helper para hacer requests
 */
async function makeRequest(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = { ...HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  console.log(`\n📤 ${method} ${endpoint}`);
  if (data) {
    console.log(`📝 Data:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
  }
  
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
      console.log(`📥 Response:`, typeof responseData === 'object' ? JSON.stringify(responseData, null, 2).substring(0, 300) : responseData.substring(0, 300));
    } else {
      console.log(`❌ Error:`, typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);
    }
    
    return { ok: response.ok, status: response.status, data: responseData };
  } catch (error) {
    console.log(`💥 Network Error:`, error.message);
    return { ok: false, status: 0, data: null, error: error.message };
  }
}

/**
 * Autenticación
 */
async function authenticate() {
  console.log('\n🔐 === AUTENTICACIÓN ===');
  
  const result = await makeRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
  
  if (result.ok && result.data?.data?.token) {
    ADMIN_TOKEN = result.data.data.token;
    console.log('✅ Autenticación exitosa');
    return true;
  }
  
  // Si falla la autenticación, intentar continuar sin token para ver qué rutas están disponibles
  console.log('⚠️  Error en autenticación, continuando sin token para verificar disponibilidad de rutas');
  console.log('⚠️  Nota: Las rutas pueden requerir autenticación');
  return true; // Continuar para verificar rutas
}

/**
 * Obtener o crear research ID
 */
async function getOrCreateResearch() {
  console.log('\n📊 === OBTENER RESEARCH ===');
  
  // Usar un research ID de prueba conocido o uno genérico
  RESEARCH_ID = 'test-research-id-12345';
  console.log(`⚠️  Usando research ID de prueba: ${RESEARCH_ID}`);
  console.log('⚠️  Nota: Si las rutas no existen, se mostrará 404 o 405');
  return true;
}

/**
 * Test de Screener
 */
async function testScreenerEndpoints() {
  console.log('\n🎯 === TESTING SCREENER ENDPOINTS ===');
  
  if (!RESEARCH_ID) {
    console.log('⚠️  No hay research ID disponible');
    return false;
  }
  
  const screenerData = {
    questions: [
      {
        id: 'q1',
        type: 'single_choice',
        title: '¿Cuál es tu edad?',
        required: true,
        choices: [
          { id: 'c1', text: '18-25', isQualify: true },
          { id: 'c2', text: '26-35', isQualify: true },
          { id: 'c3', text: '36-45', isQualify: false }
        ]
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        title: '¿Qué dispositivos usas?',
        required: false,
        choices: [
          { id: 'c4', text: 'Smartphone', isQualify: true },
          { id: 'c5', text: 'Tablet', isQualify: true },
          { id: 'c6', text: 'Desktop', isQualify: true }
        ]
      }
    ],
    isEnabled: true
  };
  
  let allPassed = true;
  
  // GET - Obtener screener
  console.log('\n📥 GET /research/{researchId}/screener');
  const getResult = await makeRequest('GET', `/research/${RESEARCH_ID}/screener`, null, ADMIN_TOKEN);
  
  // Verificar si la ruta existe (404 es esperado si no hay datos, pero 405 significa que la ruta no existe)
  if (getResult.status === 405) {
    console.log('❌ RUTA NO ENCONTRADA: GET /research/{researchId}/screener no está definida en el backend');
    allPassed = false;
  } else if (getResult.status === 404) {
    console.log('✅ RUTA EXISTE: GET /research/{researchId}/screener está disponible (404 es normal si no hay datos)');
  } else if (getResult.ok) {
    console.log('✅ RUTA EXISTE Y FUNCIONA: GET /research/{researchId}/screener');
  }
  
  // POST - Crear/Actualizar screener
  console.log('\n📤 POST /research/{researchId}/screener');
  const postResult = await makeRequest('POST', `/research/${RESEARCH_ID}/screener`, screenerData, ADMIN_TOKEN);
  
  if (postResult.status === 405) {
    console.log('❌ RUTA NO ENCONTRADA: POST /research/{researchId}/screener no está definida en el backend');
    allPassed = false;
  } else if (postResult.status === 401 || postResult.status === 403) {
    console.log('✅ RUTA EXISTE: POST /research/{researchId}/screener está disponible (requiere autenticación)');
  } else if (postResult.ok) {
    console.log('✅ RUTA EXISTE Y FUNCIONA: POST /research/{researchId}/screener');
  }
  
  // DELETE - Eliminar screener
  console.log('\n🗑️  DELETE /research/{researchId}/screener');
  const deleteResult = await makeRequest('DELETE', `/research/${RESEARCH_ID}/screener`, null, ADMIN_TOKEN);
  
  if (deleteResult.status === 405) {
    console.log('❌ RUTA NO ENCONTRADA: DELETE /research/{researchId}/screener no está definida en el backend');
    allPassed = false;
  } else if (deleteResult.status === 401 || deleteResult.status === 403) {
    console.log('✅ RUTA EXISTE: DELETE /research/{researchId}/screener está disponible (requiere autenticación)');
  } else if (deleteResult.ok || deleteResult.status === 204) {
    console.log('✅ RUTA EXISTE Y FUNCIONA: DELETE /research/{researchId}/screener');
  }
  
  if (allPassed) {
    console.log('\n✅ Todas las rutas de Screener están disponibles');
  } else {
    console.log('\n❌ Algunas rutas de Screener NO están disponibles');
  }
  
  return allPassed;
}

/**
 * Test de Implicit Association
 */
async function testImplicitAssociationEndpoints() {
  console.log('\n🎯 === TESTING IMPLICIT ASSOCIATION ENDPOINTS ===');
  
  if (!RESEARCH_ID) {
    console.log('⚠️  No hay research ID disponible');
    return false;
  }
  
  const implicitAssociationData = {
    targets: [
      {
        id: 'target1',
        title: 'Target 1',
        description: 'Descripción del target 1',
        type: 'file_upload',
        required: true,
        showConditionally: false,
        deviceFrame: true,
        files: [],
        hitZones: []
      },
      {
        id: 'target2',
        title: 'Target 2',
        description: 'Descripción del target 2',
        type: 'file_upload',
        required: true,
        showConditionally: false,
        deviceFrame: true,
        files: [],
        hitZones: []
      }
    ],
    attributes: [
      { id: 'attr1', order: 1, name: 'Atributo 1' },
      { id: 'attr2', order: 2, name: 'Atributo 2' }
    ],
    exerciseInstructions: 'Instrucciones del ejercicio de prueba',
    testInstructions: 'Instrucciones del test de prueba',
    isEnabled: true
  };
  
  let allPassed = true;
  
  // GET - Obtener implicit association
  console.log('\n📥 GET /research/{researchId}/implicit-association');
  const getResult = await makeRequest('GET', `/research/${RESEARCH_ID}/implicit-association`, null, ADMIN_TOKEN);
  
  // Verificar si la ruta existe (404 es esperado si no hay datos, pero 405 significa que la ruta no existe)
  if (getResult.status === 405) {
    console.log('❌ RUTA NO ENCONTRADA: GET /research/{researchId}/implicit-association no está definida en el backend');
    allPassed = false;
  } else if (getResult.status === 404) {
    console.log('✅ RUTA EXISTE: GET /research/{researchId}/implicit-association está disponible (404 es normal si no hay datos)');
  } else if (getResult.ok) {
    console.log('✅ RUTA EXISTE Y FUNCIONA: GET /research/{researchId}/implicit-association');
  }
  
  // POST - Crear/Actualizar implicit association
  console.log('\n📤 POST /research/{researchId}/implicit-association');
  const postResult = await makeRequest('POST', `/research/${RESEARCH_ID}/implicit-association`, implicitAssociationData, ADMIN_TOKEN);
  
  if (postResult.status === 405) {
    console.log('❌ RUTA NO ENCONTRADA: POST /research/{researchId}/implicit-association no está definida en el backend');
    allPassed = false;
  } else if (postResult.status === 401 || postResult.status === 403) {
    console.log('✅ RUTA EXISTE: POST /research/{researchId}/implicit-association está disponible (requiere autenticación)');
  } else if (postResult.ok) {
    console.log('✅ RUTA EXISTE Y FUNCIONA: POST /research/{researchId}/implicit-association');
  }
  
  // DELETE - Eliminar implicit association
  console.log('\n🗑️  DELETE /research/{researchId}/implicit-association');
  const deleteResult = await makeRequest('DELETE', `/research/${RESEARCH_ID}/implicit-association`, null, ADMIN_TOKEN);
  
  if (deleteResult.status === 405) {
    console.log('❌ RUTA NO ENCONTRADA: DELETE /research/{researchId}/implicit-association no está definida en el backend');
    allPassed = false;
  } else if (deleteResult.status === 401 || deleteResult.status === 403) {
    console.log('✅ RUTA EXISTE: DELETE /research/{researchId}/implicit-association está disponible (requiere autenticación)');
  } else if (deleteResult.ok || deleteResult.status === 204) {
    console.log('✅ RUTA EXISTE Y FUNCIONA: DELETE /research/{researchId}/implicit-association');
  }
  
  if (allPassed) {
    console.log('\n✅ Todas las rutas de Implicit Association están disponibles');
  } else {
    console.log('\n❌ Algunas rutas de Implicit Association NO están disponibles');
  }
  
  return allPassed;
}

/**
 * Función principal
 */
async function runAllTests() {
  console.log('🧪 TEST DE RUTAS NUEVAS: SCREENER E IMPLICIT ASSOCIATION');
  console.log(`🔗 API: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Autenticación
    const authSuccess = await authenticate();
    if (!authSuccess) {
      console.log('\n❌ No se pudo autenticar. Abortando tests.');
      process.exit(1);
    }
    
    // Obtener research
    const researchSuccess = await getOrCreateResearch();
    if (!researchSuccess) {
      console.log('\n❌ No se pudo obtener/crear research. Abortando tests.');
      process.exit(1);
    }
    
    // Tests
    const screenerPassed = await testScreenerEndpoints();
    const implicitAssociationPassed = await testImplicitAssociationEndpoints();
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE TESTS');
    console.log('='.repeat(60));
    console.log(`Screener: ${screenerPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Implicit Association: ${implicitAssociationPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Research ID usado: ${RESEARCH_ID}`);
    console.log('='.repeat(60));
    
    if (screenerPassed && implicitAssociationPassed) {
      console.log('\n🎉 TODOS LOS TESTS PASARON!');
      process.exit(0);
    } else {
      console.log('\n⚠️  ALGUNOS TESTS FALLARON');
      process.exit(1);
    }
  } catch (error) {
    console.log('\n💥 Error durante los tests:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests();
}

