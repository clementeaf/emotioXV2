#!/usr/bin/env node

const { DynamoDB } = require('@aws-sdk/client-dynamodb');
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
const stage = process.env.STAGE || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const tableName = `emotiox-backend-${stage}-users`;

console.log(`${colors.cyan}Registrando usuario directamente en DynamoDB${colors.reset}`);
console.log(`${colors.cyan}Email: ${email}${colors.reset}`);
console.log(`${colors.cyan}Tabla: ${tableName}${colors.reset}`);
console.log(`${colors.cyan}Región: ${region}${colors.reset}`);

// Crear cliente DynamoDB
const dynamodb = new DynamoDB({ region });

// Función para verificar si el usuario ya existe
async function checkUserExists(email) {
  try {
    console.log(`${colors.blue}Verificando si el usuario ya existe...${colors.reset}`);
    
    const result = await dynamodb.query({
      TableName: tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
    });

    if (result.Items && result.Items.length > 0) {
      console.log(`${colors.yellow}El usuario con email ${email} ya existe.${colors.reset}`);
      return true;
    }

    console.log(`${colors.green}El usuario no existe, se puede crear.${colors.reset}`);
    return false;
  } catch (error) {
    console.error(`${colors.red}Error al verificar si el usuario existe: ${error.message}${colors.reset}`);
    console.error(`${colors.red}Stack trace: ${error.stack}${colors.reset}`);
    
    // Verificar si el error es por falta del índice
    if (error.message.includes('IndexName') || error.message.includes('index')) {
      console.log(`${colors.yellow}Es posible que el índice EmailIndex no exista. Intentando verificar directamente...${colors.reset}`);
      return false;
    }
    
    throw error;
  }
}

// Función para crear un usuario directamente en DynamoDB
async function createUserDirectly(email) {
  try {
    console.log(`${colors.blue}Creando usuario con email: ${email}${colors.reset}`);
    
    // Datos del usuario
    const userId = uuidv4();
    const now = new Date().toISOString();
    const profile = {
      name: email.split('@')[0],
      preferences: {
        emailNotifications: true,
        theme: 'light',
        language: 'es'
      }
    };
    
    console.log(`${colors.blue}ID generado: ${userId}${colors.reset}`);
    console.log(`${colors.blue}Perfil: ${JSON.stringify(profile, null, 2)}${colors.reset}`);
    
    // Crear el usuario en DynamoDB
    await dynamodb.putItem({
      TableName: tableName,
      Item: {
        id: { S: userId },
        email: { S: email },
        profile: { S: JSON.stringify(profile) },
        createdAt: { S: now },
        updatedAt: { S: now },
      },
    });
    
    console.log(`${colors.green}✓ Usuario creado exitosamente en DynamoDB${colors.reset}`);
    console.log(`${colors.green}✓ ID: ${userId}${colors.reset}`);
    console.log(`${colors.green}✓ Email: ${email}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error al crear el usuario: ${error.message}${colors.reset}`);
    console.error(`${colors.red}Stack trace: ${error.stack}${colors.reset}`);
    return false;
  }
}

// Función para verificar si la tabla existe
async function checkTableExists() {
  try {
    console.log(`${colors.blue}Verificando si la tabla ${tableName} existe...${colors.reset}`);
    
    const result = await dynamodb.describeTable({
      TableName: tableName,
    });
    
    console.log(`${colors.green}✓ La tabla ${tableName} existe${colors.reset}`);
    
    // Verificar si tiene el índice EmailIndex
    const gsi = result.Table.GlobalSecondaryIndexes || [];
    const hasEmailIndex = gsi.some(index => index.IndexName === 'EmailIndex');
    
    if (hasEmailIndex) {
      console.log(`${colors.green}✓ La tabla tiene el índice EmailIndex${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ La tabla no tiene el índice EmailIndex. Esto puede causar problemas al verificar usuarios existentes.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`${colors.red}✗ La tabla ${tableName} no existe${colors.reset}`);
      return false;
    }
    
    console.error(`${colors.red}✗ Error al verificar la tabla: ${error.message}${colors.reset}`);
    return false;
  }
}

// Función principal
async function main() {
  try {
    // Verificar si la tabla existe
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.error(`${colors.red}✗ No se puede continuar sin la tabla${colors.reset}`);
      return;
    }
    
    // Verificar si el usuario ya existe
    const userExists = await checkUserExists(email);
    if (userExists) {
      console.log(`${colors.yellow}El usuario ya existe. Puedes iniciar sesión directamente.${colors.reset}`);
      return;
    }
    
    // Crear el usuario
    const success = await createUserDirectly(email);
    if (success) {
      console.log(`${colors.green}✓ Ahora puedes iniciar sesión con este email: ${email}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}No se pudo crear el usuario. Revisa los errores anteriores.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error inesperado: ${error.message}${colors.reset}`);
    console.error(`${colors.red}Stack trace: ${error.stack}${colors.reset}`);
  }
}

// Ejecutar la función principal
main(); 