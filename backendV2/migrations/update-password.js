// Script para hashear y actualizar contraseñas de usuarios en DynamoDB Local
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');

// Configurar DynamoDB local
const dynamoDB = new AWS.DynamoDB({
  region: 'localhost',
  endpoint: 'http://localhost:8000'
});

// Función para obtener todos los usuarios
async function getUsers() {
  const params = {
    TableName: 'emotioxv2-users-table-dev'
  };
  
  try {
    const result = await dynamoDB.scan(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

// Función para actualizar la contraseña de un usuario
async function updateUserPassword(id, password) {
  // Hashear la contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  console.log(`Actualizando contraseña para usuario ${id} a: ${hashedPassword}`);
  
  const params = {
    TableName: 'emotioxv2-users-table-dev',
    Key: {
      id: { S: id }
    },
    UpdateExpression: 'SET #pw = :pw',
    ExpressionAttributeNames: {
      '#pw': 'password'
    },
    ExpressionAttributeValues: {
      ':pw': { S: hashedPassword }
    }
  };
  
  try {
    await dynamoDB.updateItem(params).promise();
    console.log(`Contraseña actualizada para ${id}`);
    return true;
  } catch (error) {
    console.error(`Error al actualizar contraseña para ${id}:`, error);
    return false;
  }
}

// Ejecutar la actualización para todos los usuarios
async function updateAllPasswords() {
  const users = await getUsers();
  const password = 'password123'; // Contraseña común para todos los usuarios de prueba
  
  console.log(`Actualizando contraseñas para ${users.length} usuarios...`);
  
  for (const user of users) {
    await updateUserPassword(user.id.S, password);
  }
  
  console.log('Todas las contraseñas han sido actualizadas.');
}

// Ejecutar la función principal
updateAllPasswords(); 