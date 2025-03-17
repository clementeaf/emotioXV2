/**
 * Script para probar la API de investigaciones
 * Este script permite verificar que la API funciona correctamente después de las correcciones
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL base de la API
const API_URL = 'https://3ueuv61odi.execute-api.us-east-1.amazonaws.com';

// Si existe un token de autenticación guardado, usarlo
let authToken = '';
try {
  const tokenPath = path.join(__dirname, '.auth-token');
  if (fs.existsSync(tokenPath)) {
    authToken = fs.readFileSync(tokenPath, 'utf8').trim();
    console.log('Token de autenticación cargado');
  }
} catch (error) {
  console.warn('No se pudo cargar el token de autenticación:', error.message);
}

// Función para iniciar sesión y obtener un token
async function login(email, password) {
  try {
    console.log(`Iniciando sesión con: ${email}`);
    const response = await axios.post('https://fww0ghfvga.execute-api.us-east-1.amazonaws.com/auth/login', {
      email,
      password
    });
    
    authToken = response.data.token;
    console.log('Inicio de sesión exitoso, token obtenido');
    
    // Guardar el token para uso futuro
    fs.writeFileSync(path.join(__dirname, '.auth-token'), authToken);
    
    return authToken;
  } catch (error) {
    console.error('Error al iniciar sesión:', error.response?.data || error.message);
    throw error;
  }
}

// Función para crear una investigación
async function createResearch(data) {
  try {
    console.log('Creando nueva investigación con los siguientes datos:');
    console.log(JSON.stringify(data, null, 2));
    
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('Usando token de autenticación');
    } else {
      console.log('ADVERTENCIA: No se encontró token de autenticación, la solicitud podría fallar');
    }
    
    const response = await axios.post(`${API_URL}/research`, data, { headers });
    
    console.log('Investigación creada exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error al crear investigación:', error.response?.data || error.message);
    throw error;
  }
}

// Función para listar investigaciones
async function listResearch() {
  try {
    console.log('Obteniendo lista de investigaciones...');
    
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await axios.get(`${API_URL}/research`, { headers });
    
    console.log('Investigaciones encontradas:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error al listar investigaciones:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    // Si no hay token, intentar iniciar sesión
    if (!authToken) {
      await login('clemente@gmail.com', 'clemente');
    }
    
    // Crear una investigación de prueba
    const researchData = {
      name: "Investigación de prueba " + new Date().toISOString(),
      type: "EYE_TRACKING",
      technique: "aim-framework",
      description: "Una investigación creada para probar la API",
      enterprise: "Empresa de prueba",
      targetParticipants: 50
    };
    
    const newResearch = await createResearch(researchData);
    
    // Listar investigaciones
    await listResearch();
    
    console.log('¡Prueba completada exitosamente!');
  } catch (error) {
    console.error('Error en la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
main().catch(console.error); 