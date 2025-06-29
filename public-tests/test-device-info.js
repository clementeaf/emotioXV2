/**
 * Script de prueba para validar que el backend reciba y almacene correctamente
 * la información del dispositivo y metadata
 */

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Simular información del dispositivo
const mockDeviceInfo = {
  deviceType: 'desktop',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  screenWidth: 1920,
  screenHeight: 1080,
  platform: 'MacIntel',
  language: 'es-ES'
};

const mockTechnicalInfo = {
  browser: 'Chrome',
  browserVersion: '120',
  os: 'macOS',
  osVersion: '10.15.7',
  connectionType: 'wifi',
  timezone: 'America/New_York'
};

const mockSessionInfo = {
  reentryCount: 1,
  sessionStartTime: Date.now() - 300000, // 5 minutos atrás
  totalSessionTime: 300000
};

const mockTimingInfo = {
  startTime: Date.now() - 300000,
  endTime: Date.now(),
  duration: 300000,
  sectionTimings: [
    {
      sectionId: 'welcome',
      startTime: Date.now() - 300000,
      endTime: Date.now() - 240000,
      duration: 60000
    }
  ]
};

const mockLocationInfo = {
  latitude: 40.7128,
  longitude: -74.0060,
  city: 'New York',
  country: 'US',
  region: 'NY'
};

// Metadata completa
const mockMetadata = {
  deviceInfo: mockDeviceInfo,
  technicalInfo: mockTechnicalInfo,
  sessionInfo: mockSessionInfo,
  timingInfo: mockTimingInfo,
  locationInfo: mockLocationInfo
};

async function testDeviceInfoStorage() {
  console.log('🧪 Iniciando prueba de almacenamiento de información del dispositivo...\n');

  const testResearchId = 'test-research-device-info';
  const testParticipantId = 'test-participant-device-info';
  const testStepId = 'test-step-device-info';

  try {
    // 1. Crear una respuesta con metadata completa
    console.log('📤 Enviando respuesta con metadata completa...');

    const responsePayload = {
      researchId: testResearchId,
      participantId: testParticipantId,
      stepType: 'test_device_info',
      stepTitle: 'Prueba de Información del Dispositivo',
      response: {
        testAnswer: 'Respuesta de prueba',
        timestamp: new Date().toISOString()
      },
      metadata: mockMetadata
    };

    const createResponse = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responsePayload)
    });

    if (!createResponse.ok) {
      throw new Error(`Error al crear respuesta: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Respuesta creada exitosamente');
    console.log('📋 ID de respuesta:', createResult.data?.id || 'No disponible');

    // 2. Recuperar la respuesta para verificar que se almacenó correctamente
    console.log('\n📥 Recuperando respuesta para verificar almacenamiento...');

    const getResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${testResearchId}&participantId=${testParticipantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Error al recuperar respuesta: ${getResponse.status} ${getResponse.statusText}`);
    }

    const getResult = await getResponse.json();
    console.log('✅ Respuesta recuperada exitosamente');
    console.log('📋 Respuesta completa del backend:', JSON.stringify(getResult, null, 2));

    // 3. Verificar que la metadata se almacenó correctamente
    console.log('\n🔍 Verificando metadata almacenada...');

    if (getResult.data && getResult.data.responses && getResult.data.responses.length > 0) {
      const storedResponse = getResult.data.responses[0];
      console.log('📋 Respuesta individual almacenada:', JSON.stringify(storedResponse, null, 2));

      console.log('📱 Información del dispositivo almacenada:');
      console.log('   - Tipo de dispositivo:', storedResponse.metadata?.deviceInfo?.deviceType);
      console.log('   - User Agent:', storedResponse.metadata?.deviceInfo?.userAgent?.substring(0, 50) + '...');
      console.log('   - Resolución:', `${storedResponse.metadata?.deviceInfo?.screenWidth}x${storedResponse.metadata?.deviceInfo?.screenHeight}`);

      console.log('\n💻 Información técnica almacenada:');
      console.log('   - Navegador:', storedResponse.metadata?.technicalInfo?.browser);
      console.log('   - Versión:', storedResponse.metadata?.technicalInfo?.browserVersion);
      console.log('   - Sistema operativo:', storedResponse.metadata?.technicalInfo?.os);

      console.log('\n📍 Información de ubicación almacenada:');
      console.log('   - Latitud:', storedResponse.metadata?.locationInfo?.latitude);
      console.log('   - Longitud:', storedResponse.metadata?.locationInfo?.longitude);
      console.log('   - Ciudad:', storedResponse.metadata?.locationInfo?.city);

      console.log('\n⏱️ Información de tiempos almacenada:');
      console.log('   - Tiempo de inicio:', storedResponse.metadata?.timingInfo?.startTime);
      console.log('   - Duración:', storedResponse.metadata?.timingInfo?.duration);

      console.log('\n🔄 Información de sesión almacenada:');
      console.log('   - Conteo de reingresos:', storedResponse.metadata?.sessionInfo?.reentryCount);
      console.log('   - Tiempo total de sesión:', storedResponse.metadata?.sessionInfo?.totalSessionTime);

      // Verificar que los datos coinciden con lo enviado
      const deviceTypeMatches = storedResponse.metadata?.deviceInfo?.deviceType === mockDeviceInfo.deviceType;
      const browserMatches = storedResponse.metadata?.technicalInfo?.browser === mockTechnicalInfo.browser;
      const locationMatches = storedResponse.metadata?.locationInfo?.latitude === mockLocationInfo.latitude;

      console.log('\n✅ Resultados de validación:');
      console.log('   - Tipo de dispositivo coincide:', deviceTypeMatches ? '✅' : '❌');
      console.log('   - Navegador coincide:', browserMatches ? '✅' : '❌');
      console.log('   - Ubicación coincide:', locationMatches ? '✅' : '❌');

      if (deviceTypeMatches && browserMatches && locationMatches) {
        console.log('\n🎉 ¡PRUEBA EXITOSA! El backend está recibiendo y almacenando correctamente la información del dispositivo.');
      } else {
        console.log('\n⚠️ Algunos datos no coinciden. Revisar implementación.');
      }
    } else {
      console.log('❌ No se encontraron respuestas almacenadas');
    }

    // 4. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');

    const deleteResponse = await fetch(`${API_BASE_URL}/module-responses?researchId=${testResearchId}&participantId=${testParticipantId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Datos de prueba eliminados');
    } else {
      console.log('⚠️ No se pudieron eliminar los datos de prueba');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar la prueba
testDeviceInfoStorage();
