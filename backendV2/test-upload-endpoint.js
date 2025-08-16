#!/usr/bin/env node

/**
 * Script de prueba para el endpoint de generación de URL de upload
 * Uso: node test-upload-endpoint.js [TOKEN]
 */

const https = require('https');

// Configuración
const API_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = '43e990f2-c475-4fd2-e66d-b1e3094d5e15';
const TOKEN = process.argv[2] || 'YOUR_TOKEN_HERE';

// Diferentes tipos de archivos para probar
const testFiles = [
  {
    name: 'Imagen JPG',
    fileName: 'test-image.jpg',
    fileSize: 1024000,
    fileType: 'image/jpeg',
    mimeType: 'image/jpeg',
    contentType: 'image/jpeg'
  },
  {
    name: 'Imagen PNG', 
    fileName: 'test-image.png',
    fileSize: 512000,
    fileType: 'image/png',
    mimeType: 'image/png',
    contentType: 'image/png'
  },
  {
    name: 'Documento PDF',
    fileName: 'test-document.pdf',
    fileSize: 256000,
    fileType: 'application/pdf',
    mimeType: 'application/pdf',
    contentType: 'application/pdf'
  },
  {
    name: 'Archivo genérico',
    fileName: 'test-file.txt',
    fileSize: 1024,
    fileType: 'application/octet-stream',
    mimeType: 'application/octet-stream',
    contentType: 'application/octet-stream'
  }
];

console.log('🧪 Test del endpoint de generación de URL de upload');
console.log(`🔗 API: ${API_URL}`);
console.log(`🔑 Research ID: ${RESEARCH_ID}`);
console.log(`🎫 Token: ${TOKEN.substring(0, 20)}...`);
console.log('');

if (TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ Por favor proporciona un token válido como argumento:');
  console.log('   node test-upload-endpoint.js YOUR_ACTUAL_TOKEN');
  process.exit(1);
}

async function testFile(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`📝 Probando: ${testFile.name}`);
    console.log(`   Archivo: ${testFile.fileName}`);
    console.log(`   Tipo: ${testFile.fileType}`);
    console.log(`   Tamaño: ${testFile.fileSize} bytes`);

    const postData = JSON.stringify({
      fileName: testFile.fileName,
      fileSize: testFile.fileSize,
      fileType: testFile.fileType,
      mimeType: testFile.mimeType,
      contentType: testFile.contentType,
      questionId: 'test-question-id'
    });

    const options = {
      hostname: 'h68qs1et9j.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: `/dev/research/${RESEARCH_ID}/cognitive-task/upload-url`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsedResponse = JSON.parse(responseBody);
            console.log(`   ✅ Éxito: URL generada`);
            console.log(`      S3 Key: ${parsedResponse.file?.s3Key || 'N/A'}`);
            console.log(`      File URL: ${parsedResponse.file?.fileUrl || 'N/A'}`);
            resolve({ success: true, data: parsedResponse });
          } catch (e) {
            console.log(`   ❌ Error: Respuesta no es JSON válido`);
            console.log(`      Respuesta: ${responseBody}`);
            resolve({ success: false, error: 'Invalid JSON response', response: responseBody });
          }
        } else {
          try {
            const errorData = JSON.parse(responseBody);
            console.log(`   ❌ Error ${res.statusCode}: ${errorData.message || 'Sin mensaje'}`);
            resolve({ success: false, error: errorData.message, statusCode: res.statusCode });
          } catch (e) {
            console.log(`   ❌ Error ${res.statusCode}: ${responseBody}`);
            resolve({ success: false, error: responseBody, statusCode: res.statusCode });
          }
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Error de conexión: ${e.message}`);
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Iniciando pruebas...\n');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const testFile of testFiles) {
    const result = await testFile(testFile);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    console.log(''); // Línea en blanco entre tests
    
    // Esperar un poco entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 Resumen de pruebas:');
  console.log(`   ✅ Éxitos: ${successCount}`);
  console.log(`   ❌ Fallos: ${failureCount}`);
  console.log(`   📈 Total: ${testFiles.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El endpoint funciona correctamente.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
  }
}

runTests().catch(console.error);