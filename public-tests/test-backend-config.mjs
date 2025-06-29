import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

async function testBackendConfig() {
  console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL BACKEND');
  console.log('========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // Test simple: enviar datos mínimos para ver el error específico
    console.log('📤 Enviando datos mínimos...');

    const payload = {
      researchId: 'test-config-' + Date.now(),
      participantId: 'test-participant-config-' + Date.now(),
      stepType: 'test',
      stepTitle: 'Test Configuración',
      response: { test: true },
      metadata: {
        sessionInfo: {
          reentryCount: 1,
          sessionStartTime: Date.now(),
          totalSessionTime: 1000
        }
      }
    };

    console.log('📋 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const response = await axios.post(`${BASE_URL}/module-responses`, payload);

    console.log('✅ RESPUESTA EXITOSA:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ ERROR DETECTADO:');
    console.error('Message:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));

      // Analizar el error específico
      const errorData = error.response.data;
      if (errorData.error && errorData.error.includes('Database Query Failed')) {
        console.error('');
        console.error('🔍 ANÁLISIS DEL ERROR:');
        console.error('El error indica un problema con la consulta a la base de datos.');
        console.error('Posibles causas:');
        console.error('1. La tabla no existe');
        console.error('2. El índice no existe');
        console.error('3. Los permisos IAM son incorrectos');
        console.error('4. La variable de entorno MODULE_RESPONSES_TABLE está mal configurada');
      }
    }
  }
}

// Ejecutar test
testBackendConfig();
