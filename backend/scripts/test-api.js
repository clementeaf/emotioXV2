/**
 * Script para probar la API localmente
 * - Prueba los endpoints principales
 * - Verifica la autenticación
 * - Muestra resultados de las pruebas
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Configuración
const API_URL = `http://localhost:${process.env.SERVERLESS_OFFLINE_PORT || 4700}`;
const EMAIL_TEST = 'test@example.com';
const PASSWORD_TEST = 'Test123!';
const NAME_TEST = 'Usuario Test';

// Colores para la consola
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

// Cliente HTTP
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  validateStatus: () => true // No rechazar promesas por código de estado
});

// Resultados
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Función para registrar resultado
function logResult(name, success, response, error = null) {
  const result = {
    name,
    success,
    statusCode: response?.status,
    data: response?.data,
    error: error?.message
  };
  
  results.tests.push(result);
  
  if (success) {
    results.passed++;
    console.log(`${colors.green}✅ PASÓ: ${name}${colors.reset}`);
  } else {
    results.failed++;
    console.log(`${colors.red}❌ FALLÓ: ${name}${colors.reset}`);
    if (error) console.log(`   Error: ${error.message}`);
  }
  
  if (response) {
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
  }
  
  console.log(''); // Línea en blanco
}

// Funciones de prueba
async function testRegister() {
  try {
    const response = await api.post('/api/auth/register', {
      email: EMAIL_TEST,
      password: PASSWORD_TEST,
      name: NAME_TEST
    });
    
    const success = response.status === 201 && response.data?.token;
    logResult('Registro de usuario', success, response);
    return success ? response.data.token : null;
  } catch (error) {
    logResult('Registro de usuario', false, error.response, error);
    return null;
  }
}

async function testLogin() {
  try {
    const response = await api.post('/api/auth/login', {
      email: EMAIL_TEST,
      password: PASSWORD_TEST
    });
    
    const success = response.status === 200 && response.data?.token;
    logResult('Login de usuario', success, response);
    return success ? response.data.token : null;
  } catch (error) {
    logResult('Login de usuario', false, error.response, error);
    return null;
  }
}

async function testGetUser(token) {
  try {
    const response = await api.get('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const success = response.status === 200 && response.data?.id;
    logResult('Obtener perfil de usuario', success, response);
    return success;
  } catch (error) {
    logResult('Obtener perfil de usuario', false, error.response, error);
    return false;
  }
}

async function testUpdateUser(token) {
  try {
    const response = await api.put('/api/users/me', {
      name: `${NAME_TEST} Actualizado`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const success = response.status === 200 && response.data?.name.includes('Actualizado');
    logResult('Actualizar perfil de usuario', success, response);
    return success;
  } catch (error) {
    logResult('Actualizar perfil de usuario', false, error.response, error);
    return false;
  }
}

async function testLogout(token) {
  try {
    const response = await api.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const success = response.status === 200;
    logResult('Logout de usuario', success, response);
    return success;
  } catch (error) {
    logResult('Logout de usuario', false, error.response, error);
    return false;
  }
}

// Función principal
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}======================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  PRUEBAS DE API EMOTIO-X BACKEND${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}======================================${colors.reset}`);
  console.log(`URL API: ${API_URL}\n`);

  try {
    // Registrar usuario (o iniciar sesión si ya existe)
    let token = await testRegister();
    
    // Si el registro falla (posiblemente porque el usuario ya existe), intentar login
    if (!token) {
      console.log(`${colors.yellow}⚠️  El usuario posiblemente ya existe, intentando login...${colors.reset}\n`);
      token = await testLogin();
    }
    
    // Si tenemos token, continuar con las pruebas
    if (token) {
      await testGetUser(token);
      await testUpdateUser(token);
      await testLogout(token);
    }
    
    // Mostrar resultados
    console.log(`${colors.bright}${colors.cyan}======================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  RESUMEN DE PRUEBAS${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}======================================${colors.reset}`);
    console.log(`Total: ${results.passed + results.failed}`);
    console.log(`${colors.green}Pasaron: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Fallaron: ${results.failed}${colors.reset}`);
    console.log('');
    
    if (results.failed > 0) {
      console.log(`${colors.yellow}⚠️  Algunas pruebas fallaron. Revisa los logs para más detalles.${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✅ Todas las pruebas pasaron correctamente.${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error general: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 