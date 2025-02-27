#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
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
const region = process.env.AWS_REGION || 'us-east-1';
const profile = process.env.AWS_PROFILE || 'default';

console.log(`${colors.cyan}Generando token JWT para usuario en el entorno ${stage} (región: ${region}, perfil: ${profile})${colors.reset}`);

// Configurar cliente DynamoDB
const dynamodb = new DynamoDB({
  region: region,
  credentials: process.env.AWS_PROFILE ? { profile } : undefined
});

// Nombre de la tabla de usuarios
const userTableName = `emotiox-backend-${stage}-users`;

// Función para verificar si el usuario existe
async function checkUserExists(email) {
  try {
    console.log(`${colors.blue}Verificando si el usuario existe...${colors.reset}`);
    
    const params = {
      TableName: userTableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email }
      }
    };
    
    const result = await dynamodb.query(params);
    
    if (result.Items && result.Items.length > 0) {
      console.log(`${colors.green}✓ Usuario encontrado${colors.reset}`);
      return result.Items[0];
    } else {
      console.log(`${colors.yellow}⚠ Usuario no encontrado${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}Error al verificar usuario: ${error.message}${colors.reset}`);
    throw error;
  }
}

// Función para generar un token JWT
function generateToken(email) {
  // Clave secreta para firmar el token (en producción debería estar en una variable de entorno)
  const jwtSecret = process.env.JWT_SECRET || 'emotiox_secure_jwt_secret_1788805924';
  
  // Crear payload del token
  const payload = {
    email: email,
    sub: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
  };
  
  // Generar token
  return jwt.sign(payload, jwtSecret);
}

// Función principal
async function main() {
  try {
    // Verificar si la tabla existe
    try {
      await dynamodb.describeTable({ TableName: userTableName });
      console.log(`${colors.green}✓ La tabla ${userTableName} existe${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ La tabla ${userTableName} no existe o no tienes permisos para acceder a ella${colors.reset}`);
      process.exit(1);
    }
    
    // Solicitar email al usuario
    rl.question(`${colors.cyan}Ingresa el email del usuario: ${colors.reset}`, async (email) => {
      try {
        // Validar formato de email
        if (!email || !email.includes('@')) {
          console.error(`${colors.red}✗ Email inválido${colors.reset}`);
          rl.close();
          return;
        }
        
        // Verificar si el usuario existe
        const user = await checkUserExists(email);
        
        if (!user) {
          console.error(`${colors.red}✗ El usuario con email ${email} no existe en la base de datos${colors.reset}`);
          console.log(`${colors.yellow}Primero debes registrar al usuario usando el script create-user-direct.js${colors.reset}`);
          rl.close();
          return;
        }
        
        // Generar token JWT
        const token = generateToken(email);
        
        console.log(`${colors.green}✓ Token JWT generado exitosamente${colors.reset}`);
        console.log(`\n${colors.cyan}Token JWT:${colors.reset}`);
        console.log(token);
        console.log(`\n${colors.yellow}Instrucciones:${colors.reset}`);
        console.log(`1. Copia este token`);
        console.log(`2. Abre las DevTools en tu navegador (F12)`);
        console.log(`3. Ve a la pestaña Application > Local Storage`);
        console.log(`4. Agrega una nueva entrada con clave 'token' y pega el token como valor`);
        console.log(`5. Recarga la página y deberías estar autenticado`);
        
        rl.close();
      } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        rl.close();
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar función principal
main(); 