#!/usr/bin/env node

const fetch = require('node-fetch');
const readline = require('readline');

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

// Crear interfaz para leer desde la consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Obtener el stage desde los argumentos o usar dev por defecto
const stage = process.argv[2] || 'dev';
const apiUrl = 'https://9ezijj6mtg.execute-api.us-east-1.amazonaws.com';

console.log(`${colors.cyan}Registrando usuario en el entorno ${stage} (API: ${apiUrl})${colors.reset}`);

// Función para registrar un usuario
async function registerUser(email) {
  try {
    console.log(`${colors.blue}Registrando usuario con email: ${email}${colors.reset}`);
    
    // Crear el usuario mediante la API
    const response = await fetch(`${apiUrl}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        profile: {
          name: email.split('@')[0],
          preferences: {
            emailNotifications: true,
            theme: 'light',
            language: 'es'
          }
        }
      }),
    });

    const responseText = await response.text();
    console.log(`${colors.blue}Respuesta del servidor (status): ${response.status}${colors.reset}`);
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log(`${colors.blue}Respuesta del servidor (datos): ${JSON.stringify(responseData, null, 2)}${colors.reset}`);
    } catch (parseError) {
      console.error(`${colors.red}Error al parsear la respuesta: ${parseError.message}${colors.reset}`);
      console.log(`${colors.blue}Respuesta del servidor (texto): ${responseText}${colors.reset}`);
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
    return false;
  }
}

// Función para crear un usuario directamente en la base de datos
async function createUserDirectly(email) {
  try {
    // Aquí iría el código para crear el usuario directamente en DynamoDB
    // Pero como alternativa, vamos a usar el endpoint de solicitud de OTP
    // para verificar si el usuario existe
    
    console.log(`${colors.blue}Verificando si el usuario existe mediante solicitud de OTP...${colors.reset}`);
    
    const response = await fetch(`${apiUrl}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const responseText = await response.text();
    console.log(`${colors.blue}Respuesta del servidor (status): ${response.status}${colors.reset}`);
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      responseData = { message: responseText || 'Error desconocido' };
    }

    if (response.status === 404) {
      console.log(`${colors.yellow}El usuario no existe. Intentando registrarlo...${colors.reset}`);
      return await registerUser(email);
    } else if (response.ok) {
      console.log(`${colors.green}✓ El usuario ya existe y se ha enviado un código OTP a ${email}${colors.reset}`);
      return true;
    } else {
      console.error(`${colors.red}✗ Error al verificar el usuario: ${responseData.message || `Error ${response.status}`}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error al verificar/crear el usuario: ${error.message}${colors.reset}`);
    return false;
  }
}

// Función principal
async function main() {
  try {
    // Solicitar email al usuario
    rl.question(`${colors.yellow}Ingrese el email del usuario a registrar: ${colors.reset}`, async (email) => {
      if (!email || !email.includes('@')) {
        console.error(`${colors.red}✗ Email inválido${colors.reset}`);
        rl.close();
        return;
      }
      
      // Intentar registrar el usuario
      const success = await createUserDirectly(email);
      if (success) {
        console.log(`${colors.green}✓ Ahora puedes iniciar sesión con este email: ${email}${colors.reset}`);
      }
      
      rl.close();
    });
  } catch (error) {
    console.error(`${colors.red}✗ Error inesperado: ${error.message}${colors.reset}`);
    rl.close();
  }
}

// Ejecutar la función principal
main(); 