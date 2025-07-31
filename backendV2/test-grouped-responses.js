/**
 * Script de prueba para el nuevo endpoint de respuestas agrupadas por pregunta
 * Ejecutar con: node test-grouped-responses.js
 */

const https = require('https');

// Configuración
const API_BASE_URL = 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = '193b949e-9fac-f000-329b-e71bab5a9203';

/**
 * Función para hacer peticiones HTTP
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`Error parsing response: ${error.message}`));
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

/**
 * Función principal de prueba
 */
async function testGroupedResponses() {
  console.log('🧪 Iniciando pruebas del endpoint de respuestas agrupadas...\n');

  try {
    // 1. Probar el endpoint original (para comparar)
    console.log('1️⃣ Probando endpoint original...');
    const originalResponse = await makeRequest(
      `${API_BASE_URL}/module-responses/research/${RESEARCH_ID}`
    );

    console.log(`   ✅ Status: ${originalResponse.statusCode}`);
    console.log(`   📊 Total participantes: ${originalResponse.body.data?.length || 0}`);

    if (originalResponse.body.data?.length > 0) {
      const firstParticipant = originalResponse.body.data[0];
      console.log(`   📝 Respuestas del primer participante: ${firstParticipant.responses?.length || 0}`);
    }

    // 2. Probar el nuevo endpoint agrupado
    console.log('\n2️⃣ Probando nuevo endpoint agrupado...');
    const groupedResponse = await makeRequest(
      `${API_BASE_URL}/module-responses/grouped-by-question/${RESEARCH_ID}`
    );

    console.log(`   ✅ Status: ${groupedResponse.statusCode}`);
    console.log(`   📊 Total preguntas: ${groupedResponse.body.data?.length || 0}`);

    if (groupedResponse.body.data?.length > 0) {
      const firstQuestion = groupedResponse.body.data[0];
      console.log(`   📝 Respuestas de la primera pregunta: ${firstQuestion.responses?.length || 0}`);

      // Mostrar ejemplo de la estructura
      console.log('\n   📋 Ejemplo de estructura:');
      console.log(`   QuestionKey: ${firstQuestion.questionKey}`);
      console.log(`   Responses: ${firstQuestion.responses.length} respuestas`);

      if (firstQuestion.responses.length > 0) {
        const firstResponse = firstQuestion.responses[0];
        console.log(`   - Participante: ${firstResponse.participantId.slice(0, 8)}...`);
        console.log(`   - Valor: ${JSON.stringify(firstResponse.value)}`);
        console.log(`   - Timestamp: ${firstResponse.timestamp}`);
      }
    }

    // 3. Comparar rendimiento
    console.log('\n3️⃣ Comparando rendimiento...');

    const startTime = Date.now();
    await makeRequest(`${API_BASE_URL}/module-responses/research/${RESEARCH_ID}`);
    const originalTime = Date.now() - startTime;

    const startTime2 = Date.now();
    await makeRequest(`${API_BASE_URL}/module-responses/grouped-by-question/${RESEARCH_ID}`);
    const groupedTime = Date.now() - startTime2;

    console.log(`   ⏱️  Tiempo endpoint original: ${originalTime}ms`);
    console.log(`   ⏱️  Tiempo endpoint agrupado: ${groupedTime}ms`);
    console.log(`   📈 Diferencia: ${originalTime - groupedTime}ms`);

    // 4. Análisis de estructura
    console.log('\n4️⃣ Análisis de estructura...');

    if (groupedResponse.body.data) {
      const totalResponses = groupedResponse.body.data.reduce((sum, q) => sum + q.responses.length, 0);
      const uniqueParticipants = new Set(
        groupedResponse.body.data.flatMap(q => q.responses.map(r => r.participantId))
      ).size;

      console.log(`   📊 Total respuestas: ${totalResponses}`);
      console.log(`   👥 Participantes únicos: ${uniqueParticipants}`);
      console.log(`   📝 Promedio respuestas por pregunta: ${(totalResponses / groupedResponse.body.data.length).toFixed(2)}`);

      // Mostrar distribución de tipos de pregunta
      const questionTypes = groupedResponse.body.data.map(q => q.questionKey.split('_')[0]);
      const typeCount = questionTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      console.log('   🏷️  Distribución por tipo:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`      ${type}: ${count} preguntas`);
      });
    }

    console.log('\n✅ Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  testGroupedResponses();
}

module.exports = { testGroupedResponses };
