#!/usr/bin/env node

/**
 * Script para probar la funcionalidad OTP
 * Uso:
 *  - Para solicitar OTP: node test-otp.js request test@example.com
 *  - Para validar OTP: node test-otp.js validate test@example.com 123456
 */

const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para solicitar un OTP
async function requestOTP(email) {
  console.log(`${colors.blue}Solicitando OTP para: ${email}${colors.reset}`);
  console.log('-'.repeat(50));
  
  try {
    const body = JSON.stringify({ email });
    
    // Llamada a la API local (Serverless Offline)
    const command = `curl -s -X POST http://localhost:4000/auth/request-otp \
      -H "Content-Type: application/json" \
      -d '${body}'`;
    
    console.log(`${colors.cyan}Ejecutando: ${command}${colors.reset}`);
    const result = execSync(command).toString();
    
    try {
      const parsedResult = JSON.parse(result);
      if (parsedResult.message) {
        console.log(`${colors.green}✓ OTP solicitado exitosamente${colors.reset}`);
        console.log(`${colors.green}✓ Mensaje: ${parsedResult.message}${colors.reset}`);
      } else if (parsedResult.error) {
        console.log(`${colors.red}✗ Error: ${parsedResult.error}${colors.reset}`);
        if (parsedResult.details) {
          console.log(`${colors.red}✗ Detalles: ${JSON.stringify(parsedResult.details)}${colors.reset}`);
        }
      }
    } catch (e) {
      console.log(`${colors.yellow}Respuesta no es JSON válido: ${result}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error al solicitar OTP: ${error.message}${colors.reset}`);
  }
}

// Función para validar un OTP
async function validateOTP(email, code) {
  console.log(`${colors.blue}Validando OTP para: ${email} con código: ${code}${colors.reset}`);
  console.log('-'.repeat(50));
  
  try {
    const body = JSON.stringify({ email, code });
    
    // Llamada a la API local (Serverless Offline)
    const command = `curl -s -X POST http://localhost:4000/auth/validate-otp \
      -H "Content-Type: application/json" \
      -d '${body}'`;
    
    console.log(`${colors.cyan}Ejecutando: ${command}${colors.reset}`);
    const result = execSync(command).toString();
    
    try {
      const parsedResult = JSON.parse(result);
      if (parsedResult.token) {
        console.log(`${colors.green}✓ OTP validado exitosamente${colors.reset}`);
        console.log(`${colors.green}✓ Token JWT: ${parsedResult.token.substring(0, 20)}...${colors.reset}`);
        console.log(`${colors.green}✓ Usuario: ${JSON.stringify(parsedResult.user)}${colors.reset}`);
      } else if (parsedResult.error) {
        console.log(`${colors.red}✗ Error: ${parsedResult.error}${colors.reset}`);
        if (parsedResult.details) {
          console.log(`${colors.red}✗ Detalles: ${JSON.stringify(parsedResult.details)}${colors.reset}`);
        }
      }
    } catch (e) {
      console.log(`${colors.yellow}Respuesta no es JSON válido: ${result}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error al validar OTP: ${error.message}${colors.reset}`);
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  const email = process.argv[3];
  
  if (!command || !email) {
    console.log(`${colors.yellow}Uso:${colors.reset}`);
    console.log('  Para solicitar OTP: node test-otp.js request test@example.com');
    console.log('  Para validar OTP: node test-otp.js validate test@example.com 123456');
    process.exit(1);
  }
  
  if (command === 'request') {
    await requestOTP(email);
  } else if (command === 'validate') {
    const code = process.argv[4];
    if (!code) {
      console.log(`${colors.red}Error: Se requiere un código para validar${colors.reset}`);
      process.exit(1);
    }
    await validateOTP(email, code);
  } else {
    console.log(`${colors.red}Comando desconocido: ${command}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 