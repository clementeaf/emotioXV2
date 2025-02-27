#!/usr/bin/env node

const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');
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

console.log(`${colors.cyan}Creando usuario en el entorno ${stage} (región: ${region}, perfil: ${profile})${colors.reset}`);

// Configurar cliente DynamoDB
const dynamodb = new DynamoDB({
  region: region,
  credentials: process.env.AWS_PROFILE ? { profile } : undefined
});

// Nombre de la tabla de usuarios
const userTableName = `emotiox-backend-${stage}-users`;

// Función para crear un usuario
async function createUser(email) {
  const userId = uuidv4();
  const now = new Date().toISOString();
  
  const userItem = {
    id: { S: userId },
    email: { S: email },
    createdAt: { S: now },
    updatedAt: { S: now },
    profile: { 
      M: {
        name: { S: email.split('@')[0] },
        preferences: { 
          M: {
            emailNotifications: { BOOL: true },
            theme: { S: 'light' },
            language: { S: 'es' }
          }
        }
      }
    }
  };
  
  try {
    await dynamodb.putItem({
      TableName: userTableName,
      Item: userItem,
      ConditionExpression: 'attribute_not_exists(email)'
    });
    
    console.log(`${colors.green}✓ Usuario creado exitosamente:${colors.reset}`);
    console.log(`  ID: ${userId}`);
    console.log(`  Email: ${email}`);
    console.log(`  Creado: ${now}`);
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.error(`${colors.red}✗ El usuario con email ${email} ya existe${colors.reset}`);
    } else {
      console.error(`${colors.red}✗ Error al crear el usuario: ${error.message}${colors.reset}`);
    }
    return false;
  }
}

// Función para verificar si la tabla existe
async function checkTableExists() {
  try {
    await dynamodb.describeTable({ TableName: userTableName });
    console.log(`${colors.green}✓ Tabla ${userTableName} encontrada${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ La tabla ${userTableName} no existe: ${error.message}${colors.reset}`);
    return false;
  }
}

// Función principal
async function main() {
  try {
    // Verificar si la tabla existe
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.error(`${colors.red}✗ No se puede continuar sin la tabla de usuarios${colors.reset}`);
      rl.close();
      return;
    }
    
    // Solicitar email al usuario
    rl.question(`${colors.yellow}Ingrese el email del usuario a crear: ${colors.reset}`, async (email) => {
      if (!email || !email.includes('@')) {
        console.error(`${colors.red}✗ Email inválido${colors.reset}`);
        rl.close();
        return;
      }
      
      // Crear el usuario
      const success = await createUser(email);
      if (success) {
        console.log(`${colors.green}✓ Ahora puedes iniciar sesión con este email${colors.reset}`);
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