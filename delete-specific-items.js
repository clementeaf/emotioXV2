const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteSpecificItems() {
  console.log('🗑️ Eliminando elementos específicos...');
  
  const itemsToDelete = [
    {
      name: 'COGNITIVE_TASK',
      id: '386dd91f-2045-45b8-abdb-a60b5c7b9b77',
      sk: 'COGNITIVE_TASK'
    },
    {
      name: 'SMART_VOC_FORM', 
      id: '7c2abd94-a4ba-4b12-b378-de6a08611f8a',
      sk: 'SMART_VOC_FORM'
    }
  ];
  
  for (const item of itemsToDelete) {
    try {
      console.log(`🔍 Eliminando ${item.name} (ID: ${item.id})...`);
      
      await dynamodb.delete({
        TableName: 'emotioxv2-backend-table-dev',
        Key: {
          id: item.id,
          sk: item.sk
        }
      }).promise();
      
      console.log(`✅ ${item.name} eliminado exitosamente`);
      
    } catch (err) {
      console.error(`❌ Error eliminando ${item.name}:`, err.message);
    }
  }
}

async function verifyDeletion() {
  console.log('\n🔍 Verificando eliminación...');
  
  try {
    const result = await dynamodb.scan({
      TableName: 'emotioxv2-backend-table-dev',
      FilterExpression: '#sk IN (:cognitive, :smartvoc)',
      ExpressionAttributeNames: {
        '#sk': 'sk'
      },
      ExpressionAttributeValues: {
        ':cognitive': 'COGNITIVE_TASK',
        ':smartvoc': 'SMART_VOC_FORM'
      }
    }).promise();
    
    if (result.Items && result.Items.length > 0) {
      console.log('⚠️ Aún quedan elementos:');
      result.Items.forEach(item => {
        console.log(`- ${item.sk}: ${item.id}`);
      });
    } else {
      console.log('✅ Elementos eliminados correctamente. No se encontraron COGNITIVE_TASK ni SMART_VOC_FORM');
    }
    
  } catch (err) {
    console.error('❌ Error verificando eliminación:', err.message);
  }
}

async function showRemainingItems() {
  console.log('\n📋 Elementos restantes en table-dev:');
  
  try {
    const result = await dynamodb.scan({
      TableName: 'emotioxv2-backend-table-dev',
      ProjectionExpression: 'id, sk'
    }).promise();
    
    if (result.Items && result.Items.length > 0) {
      console.log(`📊 Total de elementos restantes: ${result.Items.length}`);
      result.Items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.sk} (ID: ${item.id})`);
      });
    } else {
      console.log('✅ La tabla está completamente vacía');
    }
    
  } catch (err) {
    console.error('❌ Error listando elementos restantes:', err.message);
  }
}

async function main() {
  await deleteSpecificItems();
  await verifyDeletion();
  await showRemainingItems();
}

main(); 