// Script para eliminar todos los registros (excepto usuarios) de la tabla DynamoDB
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");

// Configurar cliente DynamoDB
const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Nombre de la tabla principal
const TABLE_NAME = "emotioxv2-backend-table-dev";

// Patrones de SK a eliminar
const PATTERNS_TO_DELETE = [
  "RESEARCH#",
  "WELCOME_SCREEN#",
  "THANK_YOU_SCREEN#",
  "EYETRACKING#",
  "SMART_VOC#"
];

async function scanTable() {
  console.log(`Escaneando tabla ${TABLE_NAME} para identificar registros a eliminar...`);
  
  const params = {
    TableName: TABLE_NAME,
    ProjectionExpression: "id, sk"
  };
  
  let totalItems = 0;
  let itemsToDelete = [];
  let lastEvaluatedKey = null;
  
  try {
    do {
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
      
      const data = await docClient.send(new ScanCommand(params));
      totalItems += data.Items.length;
      
      // Filtrar elementos a eliminar
      const filteredItems = data.Items.filter(item => {
        if (!item.sk) return false;
        
        // Verificar si el SK coincide con alguno de los patrones a eliminar
        return PATTERNS_TO_DELETE.some(pattern => item.sk.includes(pattern));
      });
      
      itemsToDelete = [...itemsToDelete, ...filteredItems];
      lastEvaluatedKey = data.LastEvaluatedKey;
      
      console.log(`Escaneados ${data.Items.length} elementos. Encontrados ${filteredItems.length} para eliminar.`);
      
    } while (lastEvaluatedKey);
    
    console.log(`Total de elementos en la tabla: ${totalItems}`);
    console.log(`Total de elementos a eliminar: ${itemsToDelete.length}`);
    
    return itemsToDelete;
    
  } catch (err) {
    console.error("Error al escanear la tabla:", err);
    throw err;
  }
}

async function deleteItems(items) {
  console.log(`Iniciando eliminación de ${items.length} elementos...`);
  let deleted = 0;
  let failed = 0;
  
  for (const item of items) {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: {
          id: item.id,
          sk: item.sk
        }
      };
      
      await docClient.send(new DeleteCommand(params));
      deleted++;
      
      if (deleted % 5 === 0 || deleted === items.length) {
        console.log(`Progreso: ${deleted}/${items.length} elementos eliminados`);
      }
      
    } catch (err) {
      console.error(`Error al eliminar elemento {id: ${item.id}, sk: ${item.sk}}:`, err);
      failed++;
    }
  }
  
  console.log(`
Proceso completado:
- Elementos eliminados con éxito: ${deleted}
- Elementos con error: ${failed}
- Total procesados: ${items.length}
  `);
}

async function main() {
  try {
    console.log("=== LIMPIEZA DE TABLA DYNAMODB ===");
    console.log(`Fecha: ${new Date().toISOString()}`);
    console.log(`Tabla: ${TABLE_NAME}`);
    
    // Obtener los elementos a eliminar
    const itemsToDelete = await scanTable();
    
    if (itemsToDelete.length === 0) {
      console.log("No hay elementos para eliminar. La operación ha finalizado.");
      return;
    }
    
    // Confirmar antes de eliminar
    console.log("\nSe eliminarán los siguientes tipos de registros:");
    PATTERNS_TO_DELETE.forEach(pattern => console.log(`- ${pattern}`));
    
    console.log("\nProcediendo con la eliminación...");
    
    // Eliminar los elementos
    await deleteItems(itemsToDelete);
    
  } catch (err) {
    console.error("Error durante la ejecución del script:", err);
  }
}

// Ejecutar el script
main(); 