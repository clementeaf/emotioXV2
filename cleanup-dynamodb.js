const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function cleanupModuleResponses() {
  console.log('🔍 Contando elementos en module-responses...');
  
  try {
    const countResult = await dynamodb.scan({
      TableName: 'emotioxv2-backend-module-responses-dev',
      Select: 'COUNT'
    }).promise();
    
    console.log('📊 Elementos en module-responses:', countResult.Count);
    
    if (countResult.Count > 0) {
      console.log('🗑️ Eliminando elementos...');
      
      const scanResult = await dynamodb.scan({
        TableName: 'emotioxv2-backend-module-responses-dev'
      }).promise();
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        const deletePromises = scanResult.Items.map(async (item) => {
          try {
            // Obtener la clave primaria del item
            const key = {};
            if (item.id) key.id = item.id;
            if (item.participantId && !key.id) key.participantId = item.participantId;
            if (item.researchId && Object.keys(key).length === 0) key.researchId = item.researchId;
            
            await dynamodb.delete({
              TableName: 'emotioxv2-backend-module-responses-dev',
              Key: key
            }).promise();
            
            console.log('✅ Eliminado:', key);
          } catch (err) {
            console.log('❌ Error eliminando item:', err.message);
          }
        });
        
        await Promise.all(deletePromises);
      }
    } else {
      console.log('✅ La tabla module-responses ya está vacía');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function inspectTableDev() {
  console.log('\n🔍 Revisando contenido de table-dev...');
  
  try {
    const result = await dynamodb.scan({
      TableName: 'emotioxv2-backend-table-dev',
      Limit: 10
    }).promise();
    
    console.log('📊 Elementos encontrados en table-dev:', result.Count);
    console.log('📊 Total estimado:', result.ScannedCount);
    
    if (result.Items && result.Items.length > 0) {
      console.log('\n📋 Primeros elementos:');
      result.Items.forEach((item, index) => {
        console.log(`\n--- Item ${index + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('✅ La tabla table-dev está vacía');
    }
    
  } catch (err) {
    console.error('❌ Error revisando table-dev:', err.message);
  }
}

async function main() {
  await cleanupModuleResponses();
  await inspectTableDev();
}

main(); 