#!/usr/bin/env node

/**
 * Test específico para validar que el backend reciba y almacene correctamente la ubicación
 *
 * Este test se enfoca ÚNICAMENTE en la ubicación para aislar el problema
 */

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Test data específico para ubicación
const testLocationInfo = {
  latitude: 40.4168,
  longitude: -3.7038,
  city: 'Madrid',
  country: 'Spain',
  region: 'Comunidad de Madrid',
  ipAddress: '1.2.3.4'
};

// Metadata mínima solo con locationInfo
const minimalMetadata = {
  locationInfo: testLocationInfo
};

async function testLocationStorage() {
  console.log('🎯 TEST ESPECÍFICO: Validación de ubicación');
  console.log('==================================================');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const timestamp = Date.now();
  const researchId = `test-location-${timestamp}`;
  const participantId = `test-participant-location-${timestamp}`;

  try {
    // PASO 1: Enviar respuesta con metadata de ubicación
    console.log('📤 PASO 1: Enviando respuesta con metadata de ubicación...');
    console.log('📋 Metadata enviada:', JSON.stringify(minimalMetadata, null, 2));

    const createResponse = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        researchId,
        participantId,
        stepType: 'test_location',
        stepTitle: 'Test de Ubicación',
        response: {
          testAnswer: 'Respuesta de prueba para ubicación',
          timestamp: new Date().toISOString()
        },
        metadata: minimalMetadata
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Error al crear respuesta: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Respuesta creada exitosamente');
    console.log('📋 ID de respuesta:', createData.data.id);
    console.log('📋 Respuesta del backend:', JSON.stringify(createData, null, 2));

    // PASO 2: Recuperar respuesta para verificar almacenamiento
    console.log('\n📥 PASO 2: Recuperando respuesta para verificar almacenamiento...');

    const getResponse = await fetch(`${API_BASE_URL}/module-responses/research/${researchId}?participantId=${participantId}`);

    if (!getResponse.ok) {
      throw new Error(`Error al recuperar respuesta: ${getResponse.status} ${getResponse.statusText}`);
    }

    const getData = await getResponse.json();
    console.log('✅ Respuesta recuperada exitosamente');
    console.log('📋 Respuesta completa del GET:', JSON.stringify(getData, null, 2));

    // PASO 3: Análisis específico de la ubicación
    console.log('\n🔍 PASO 3: Análisis específico de la ubicación...');

    // El backend devuelve un array de documentos, tomamos el primero
    const firstDocument = getData.data[0];
    const firstResponse = firstDocument.responses[0];
    console.log('📋 Primera respuesta recuperada:', JSON.stringify(firstResponse, null, 2));

    // Análisis de metadata en respuesta individual
    console.log('\n📊 Análisis de metadata en respuesta individual:');
    console.log(`   - Tiene metadata: ${firstResponse.metadata ? '✅' : '❌'}`);
    console.log(`   - Tiene locationInfo: ${firstResponse.metadata?.locationInfo ? '✅' : '❌'}`);
    console.log(`   - Tiene latitude: ${firstResponse.metadata?.locationInfo?.latitude ? '✅' : '❌'}`);
    console.log(`   - Tiene longitude: ${firstResponse.metadata?.locationInfo?.longitude ? '✅' : '❌'}`);

    if (firstResponse.metadata?.locationInfo) {
      console.log(`   - Latitud almacenada: ${firstResponse.metadata.locationInfo.latitude}`);
      console.log(`   - Longitud almacenada: ${firstResponse.metadata.locationInfo.longitude}`);
      console.log(`   - Latitud esperada: ${testLocationInfo.latitude}`);
      console.log(`   - Longitud esperada: ${testLocationInfo.longitude}`);
      console.log(`   - Coincide latitud: ${firstResponse.metadata.locationInfo.latitude === testLocationInfo.latitude ? '✅' : '❌'}`);
      console.log(`   - Coincide longitud: ${firstResponse.metadata.locationInfo.longitude === testLocationInfo.longitude ? '✅' : '❌'}`);
    }

    // Análisis de metadata en documento principal
    console.log('\n📊 Análisis de metadata en documento principal:');
    console.log(`   - Tiene metadata: ${firstDocument.metadata ? '✅' : '❌'}`);
    console.log(`   - Tiene locationInfo: ${firstDocument.metadata?.locationInfo ? '✅' : '❌'}`);
    console.log(`   - Tiene latitude: ${firstDocument.metadata?.locationInfo?.latitude ? '✅' : '❌'}`);
    console.log(`   - Tiene longitude: ${firstDocument.metadata?.locationInfo?.longitude ? '✅' : '❌'}`);

    if (firstDocument.metadata?.locationInfo) {
      console.log(`   - Latitud almacenada: ${firstDocument.metadata.locationInfo.latitude}`);
      console.log(`   - Longitud almacenada: ${firstDocument.metadata.locationInfo.longitude}`);
      console.log(`   - Latitud esperada: ${testLocationInfo.latitude}`);
      console.log(`   - Longitud esperada: ${testLocationInfo.longitude}`);
      console.log(`   - Coincide latitud: ${firstDocument.metadata.locationInfo.latitude === testLocationInfo.latitude ? '✅' : '❌'}`);
      console.log(`   - Coincide longitud: ${firstDocument.metadata.locationInfo.longitude === testLocationInfo.longitude ? '✅' : '❌'}`);
    }

    // RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL');
    console.log('==================');

    const locationStored = firstResponse.metadata?.locationInfo?.latitude &&
                          firstResponse.metadata?.locationInfo?.longitude;
    const locationMatches = locationStored &&
                           firstResponse.metadata.locationInfo.latitude === testLocationInfo.latitude &&
                           firstResponse.metadata.locationInfo.longitude === testLocationInfo.longitude;

    if (locationMatches) {
      console.log('✅ ÉXITO: La ubicación se está almacenando correctamente');
      console.log(`   - Latitud enviada: ${testLocationInfo.latitude}`);
      console.log(`   - Longitud enviada: ${testLocationInfo.longitude}`);
      console.log(`   - Latitud almacenada: ${firstResponse.metadata.locationInfo.latitude}`);
      console.log(`   - Longitud almacenada: ${firstResponse.metadata.locationInfo.longitude}`);
    } else {
      console.log('❌ FALLO: La ubicación NO se está almacenando correctamente');
      console.log(`   - Latitud enviada: ${testLocationInfo.latitude}`);
      console.log(`   - Longitud enviada: ${testLocationInfo.longitude}`);
      console.log(`   - Latitud almacenada: ${firstResponse.metadata?.locationInfo?.latitude || 'undefined'}`);
      console.log(`   - Longitud almacenada: ${firstResponse.metadata?.locationInfo?.longitude || 'undefined'}`);
    }

    // Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    const deleteResponse = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        researchId,
        participantId
      })
    });

    if (deleteResponse.ok) {
      console.log('✅ Datos de prueba eliminados');
    } else {
      console.log('⚠️ No se pudieron eliminar los datos de prueba');
    }

    console.log('\n🏁 FINALIZADO');
    console.log('=============');
    console.log(`Resultado: ${locationMatches ? '✅ ÉXITO' : '❌ FALLO'}`);

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
    console.log('\n🏁 FINALIZADO');
    console.log('=============');
    console.log('Resultado: ❌ FALLO');
  }
}

// Ejecutar el test
testLocationStorage();
