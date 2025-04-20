/**
 * Utilidad para diagnosticar problemas con imágenes en tareas cognitivas
 * Este archivo contiene una función para probar el guardado y recuperación de tareas cognitivas con imágenes
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Estructura simplificada de una tarea cognitiva para pruebas
interface TestTask {
  id: string;
  sk: string;
  researchId: string;
  questions: string; // JSON string de preguntas
  randomizeQuestions: boolean;
  metadata: string; // JSON string de metadata
  createdAt: string;
  updatedAt: string;
}

// Estructura para un archivo subido
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  s3Key: string;
  time?: number;
}

// Estructura para una pregunta con archivos
interface Question {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  showConditionally: boolean;
  deviceFrame: boolean;
  files?: UploadedFile[];
}

/**
 * Prueba el proceso de guardar y recuperar una tarea cognitiva con imágenes
 */
async function testCognitiveTaskWithImages() {
  // Configuración para DynamoDB
  const options = {
    region: process.env.APP_REGION || 'us-east-1'
  };
  
  // Crea el cliente de DynamoDB
  const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient(options));
  
  // Nombre de la tabla
  const tableName = process.env.DYNAMODB_TABLE || 'emotioxv2-backend-table-dev';
  
  console.log('=== INICIANDO PRUEBA DE DIAGNÓSTICO DE IMÁGENES EN TAREAS COGNITIVAS ===');
  console.log('Tabla DynamoDB:', tableName);
  
  // Crear un ID único para la prueba
  const testId = uuidv4();
  const researchId = `test-research-${testId}`;
  const taskId = `test-task-${testId}`;
  
  console.log('ID de prueba:', testId);
  console.log('ID de investigación:', researchId);
  console.log('ID de tarea:', taskId);
  
  try {
    // 1. Crear una tarea de prueba con imágenes
    console.log('\n1. Creando tarea cognitiva de prueba con imágenes...');
    
    // Crear una pregunta con una imagen
    const testFiles: UploadedFile[] = [
      {
        id: `file-${uuidv4()}`,
        name: 'test-image.png',
        size: 552370, // Tamaño real de la imagen en S3
        type: 'image/png',
        url: `https://emotioxv2.s3.amazonaws.com/482bc39b-072b-7e63-578b-322fffe40b5b/cognitive-task-files/07acdee9-7926-2307-525a-066bf0770e88.png`,
        s3Key: `482bc39b-072b-7e63-578b-322fffe40b5b/cognitive-task-files/07acdee9-7926-2307-525a-066bf0770e88.png`
      }
    ];
    
    const testQuestions: Question[] = [
      {
        id: '1',
        type: 'navigation_flow',
        title: 'Pregunta de prueba con imagen',
        description: 'Esta es una pregunta de prueba para diagnosticar el guardado de imágenes',
        required: true,
        showConditionally: false,
        deviceFrame: false,
        files: testFiles
      }
    ];
    
    // Fecha actual para created/updated
    const now = new Date().toISOString();
    
    // Metadata estándar
    const standardMetadata = {
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: 'diagnostic-test',
      estimatedCompletionTime: '5-10 minutes'
    };
    
    // Crear el objeto a guardar en DynamoDB
    const taskItem: TestTask = {
      id: taskId,
      sk: `COGNITIVE_TASK#${taskId}`,
      researchId,
      questions: JSON.stringify(testQuestions),
      randomizeQuestions: false,
      metadata: JSON.stringify(standardMetadata),
      createdAt: now,
      updatedAt: now
    };
    
    // Verificar que la referencia a la imagen esté presente en el JSON
    const questionsJson = taskItem.questions;
    console.log('JSON de preguntas a guardar:');
    console.log(questionsJson);
    
    if (questionsJson.includes(testFiles[0].url) && questionsJson.includes(testFiles[0].s3Key)) {
      console.log('✅ Referencia a imagen verificada en el JSON');
    } else {
      console.log('❌ Referencia a imagen NO encontrada en el JSON');
    }
    
    // Guardar en DynamoDB
    const putCommand = new PutCommand({
      TableName: tableName,
      Item: taskItem
    });
    
    await dynamoClient.send(putCommand);
    console.log('✅ Tarea cognitiva guardada exitosamente en DynamoDB');
    
    // 2. Recuperar la tarea para verificar que las imágenes estén presentes
    console.log('\n2. Recuperando tarea cognitiva para verificar imágenes...');
    
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        id: taskId,
        sk: `COGNITIVE_TASK#${taskId}`
      }
    });
    
    const result = await dynamoClient.send(getCommand);
    
    if (!result.Item) {
      console.log('❌ No se encontró la tarea cognitiva en DynamoDB');
      return;
    }
    
    console.log('✅ Tarea cognitiva recuperada exitosamente');
    
    // Verificar el JSON de preguntas
    const retrievedTaskItem = result.Item as TestTask;
    const retrievedQuestionsJson = retrievedTaskItem.questions;
    console.log('JSON de preguntas recuperado:');
    console.log(retrievedQuestionsJson);
    
    // Verificar si las referencias a la imagen están presentes
    if (retrievedQuestionsJson.includes(testFiles[0].url) && retrievedQuestionsJson.includes(testFiles[0].s3Key)) {
      console.log('✅ Referencias a imagen encontradas en el JSON recuperado');
    } else {
      console.log('❌ Referencias a imagen NO encontradas en el JSON recuperado');
    }
    
    // Analizar el JSON para obtener las preguntas
    const retrievedQuestions = JSON.parse(retrievedQuestionsJson) as Question[];
    console.log('Preguntas recuperadas (parseadas):');
    console.log(JSON.stringify(retrievedQuestions, null, 2));
    
    // Verificar si hay preguntas con archivos
    const questionsWithFiles = retrievedQuestions.filter(q => q.files && q.files.length > 0);
    
    if (questionsWithFiles.length > 0) {
      console.log(`✅ ${questionsWithFiles.length} preguntas con archivos encontradas`);
      
      // Mostrar detalles de los archivos
      questionsWithFiles.forEach((q, i) => {
        console.log(`\nPregunta ${i + 1} (ID: ${q.id}, Tipo: ${q.type}):`);
        console.log(`Archivos: ${q.files?.length || 0}`);
        
        q.files?.forEach((f, j) => {
          console.log(`\nArchivo ${j + 1}:`);
          console.log(`- ID: ${f.id}`);
          console.log(`- Nombre: ${f.name}`);
          console.log(`- Tamaño: ${f.size} bytes`);
          console.log(`- Tipo: ${f.type}`);
          console.log(`- URL: ${f.url}`);
          console.log(`- S3 Key: ${f.s3Key}`);
        });
      });
    } else {
      console.log('❌ No se encontraron preguntas con archivos');
    }
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error durante la prueba de diagnóstico:', error);
  }
}

// Ejecutar la prueba si este archivo se ejecuta directamente
if (require.main === module) {
  testCognitiveTaskWithImages()
    .then(() => console.log('Prueba de diagnóstico finalizada'))
    .catch(err => console.error('Error en prueba de diagnóstico:', err));
}

export default testCognitiveTaskWithImages; 