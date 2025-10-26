const https = require('https');

const BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = '87724daf-f1ae-14db-ab0c-1bc694fc884e'; // Research ID que usamos antes

// Función para hacer requests HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testGranularSystem() {
  console.log('🧪 PROBANDO SISTEMA GRANULAR...\n');

  try {
    // 1. Obtener Cognitive Task actual
    console.log('1️⃣ Obteniendo Cognitive Task actual...');
    const cognitiveResponse = await makeRequest('GET', `/research/${RESEARCH_ID}/cognitive-task`);
    
    if (cognitiveResponse.statusCode !== 200) {
      console.log('❌ Error obteniendo Cognitive Task:', cognitiveResponse.data);
      return;
    }

    const cognitiveTask = cognitiveResponse.data;
    console.log('✅ Cognitive Task obtenido:', cognitiveTask.id);
    console.log(`📊 Preguntas encontradas: ${cognitiveTask.questions.length}`);

    // 2. Probar actualización granular de una pregunta
    const firstQuestion = cognitiveTask.questions[0];
    if (!firstQuestion) {
      console.log('❌ No hay preguntas para probar');
      return;
    }

    console.log(`\n2️⃣ Probando actualización granular de pregunta: ${firstQuestion.id}`);
    
    const updatedQuestion = {
      ...firstQuestion,
      title: `[GRANULAR TEST] ${firstQuestion.title}`,
      description: `Descripción actualizada via granular update - ${new Date().toISOString()}`
    };

    const granularResponse = await makeRequest(
      'PUT', 
      `/research/${RESEARCH_ID}/cognitive-task/${firstQuestion.id}`,
      updatedQuestion
    );

    if (granularResponse.statusCode === 200) {
      console.log('✅ Actualización granular exitosa!');
      console.log('📝 Título actualizado:', updatedQuestion.title);
    } else {
      console.log('❌ Error en actualización granular:', granularResponse.data);
    }

    // 3. Verificar que la actualización se aplicó
    console.log('\n3️⃣ Verificando que la actualización se aplicó...');
    const verifyResponse = await makeRequest('GET', `/research/${RESEARCH_ID}/cognitive-task`);
    
    if (verifyResponse.statusCode === 200) {
      const updatedTask = verifyResponse.data;
      const updatedQuestion = updatedTask.questions.find(q => q.id === firstQuestion.id);
      
      if (updatedQuestion && updatedQuestion.title.includes('[GRANULAR TEST]')) {
        console.log('✅ Verificación exitosa - La pregunta fue actualizada correctamente');
        console.log('📝 Nuevo título:', updatedQuestion.title);
      } else {
        console.log('❌ La actualización no se aplicó correctamente');
      }
    }

    // 4. Probar SmartVOC granular
    console.log('\n4️⃣ Probando SmartVOC granular...');
    const smartVocResponse = await makeRequest('GET', `/research/${RESEARCH_ID}/smart-voc`);
    
    if (smartVocResponse.statusCode === 200) {
      const smartVoc = smartVocResponse.data;
      console.log('✅ SmartVOC obtenido:', smartVoc.id);
      console.log(`📊 Preguntas SmartVOC: ${smartVoc.questions.length}`);

      if (smartVoc.questions.length > 0) {
        const firstSmartVocQuestion = smartVoc.questions[0];
        console.log(`\n🔄 Actualizando pregunta SmartVOC: ${firstSmartVocQuestion.id}`);
        
        const updatedSmartVocQuestion = {
          ...firstSmartVocQuestion,
          title: `[SMARTVOC GRANULAR] ${firstSmartVocQuestion.title}`,
          description: `SmartVOC actualizado via granular - ${new Date().toISOString()}`
        };

        const smartVocGranularResponse = await makeRequest(
          'PUT',
          `/research/${RESEARCH_ID}/smart-voc/${firstSmartVocQuestion.id}`,
          updatedSmartVocQuestion
        );

        if (smartVocGranularResponse.statusCode === 200) {
          console.log('✅ SmartVOC granular actualizado exitosamente!');
        } else {
          console.log('❌ Error en SmartVOC granular:', smartVocGranularResponse.data);
        }
      }
    } else {
      console.log('⚠️ No hay SmartVOC configurado para este research');
    }

    console.log('\n🎉 PRUEBA COMPLETADA!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testGranularSystem();
