#!/usr/bin/env node

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuración de colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuración
const email = 'carriagadafalcone@gmail.com';
const apiUrl = 'https://9ezijj6mtg.execute-api.us-east-1.amazonaws.com';

console.log(`${colors.cyan}Registrando usuario específico: ${email}${colors.reset}`);

// Función para registrar un usuario
async function registerUser(email) {
  try {
    console.log(`${colors.blue}Registrando usuario con email: ${email}${colors.reset}`);
    
    // Crear el usuario mediante la API
    console.log(`${colors.blue}Enviando solicitud POST a ${apiUrl}/user${colors.reset}`);
    
    const userData = {
      email: email,
      profile: {
        name: email.split('@')[0],
        preferences: {
          emailNotifications: true,
          theme: 'light',
          language: 'es'
        }
      }
    };
    
    console.log(`${colors.blue}Datos de usuario a enviar: ${JSON.stringify(userData, null, 2)}${colors.reset}`);
    
    const response = await fetch(`${apiUrl}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log(`${colors.blue}Respuesta del servidor (status): ${response.status}${colors.reset}`);
    console.log(`${colors.blue}Respuesta del servidor (headers): ${JSON.stringify(Object.fromEntries([...response.headers]), null, 2)}${colors.reset}`);
    
    const responseText = await response.text();
    console.log(`${colors.blue}Respuesta del servidor (texto): ${responseText}${colors.reset}`);
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log(`${colors.blue}Respuesta del servidor (datos): ${JSON.stringify(responseData, null, 2)}${colors.reset}`);
    } catch (parseError) {
      console.error(`${colors.red}Error al parsear la respuesta: ${parseError.message}${colors.reset}`);
      responseData = { message: responseText || 'Error desconocido' };
    }

    if (!response.ok) {
      if (response.status === 409) {
        console.log(`${colors.yellow}El usuario con email ${email} ya existe. Puedes iniciar sesión directamente.${colors.reset}`);
        return true;
      }
      
      console.error(`${colors.red}Error al registrar el usuario: ${responseData.message || `Error ${response.status}`}${colors.reset}`);
      return false;
    }

    console.log(`${colors.green}✓ Usuario registrado exitosamente${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error al registrar el usuario: ${error.message}${colors.reset}`);
    console.error(`${colors.red}Stack trace: ${error.stack}${colors.reset}`);
    return false;
  }
}

// Función principal
async function main() {
  try {
    // Intentar registrar el usuario
    const success = await registerUser(email);
    if (success) {
      console.log(`${colors.green}✓ Ahora puedes iniciar sesión con este email: ${email}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}No se pudo registrar el usuario. Intenta verificar los logs del backend para más detalles.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error inesperado: ${error.message}${colors.reset}`);
    console.error(`${colors.red}Stack trace: ${error.stack}${colors.reset}`);
  }
}

// Ejecutar la función principal
main(); 