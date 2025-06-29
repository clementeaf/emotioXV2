#!/usr/bin/env node

/**
 * Test específico para validar que el backend reciba y almacene correctamente los tiempos
 *
 * Este test se enfoca ÚNICAMENTE en timingInfo para aislar el problema
 */

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Test data específico para timing
const testTimingInfo = {
  startTime: Date.now() - 5000, // 5 segundos atrás
  endTime: Date.now(),
  duration: 5000, // 5 segundos
  sectionTimings: [
    {
      sectionId: 'welcome',
      startTime: Date.now() - 10000,
      endTime: Date.now() - 8000,
      duration: 2000
    },
    {
      sectionId: 'demographics',
      startTime: Date.now() - 8000,
      endTime: Date.now() - 5000,
      duration: 3000
    }
  ]
};

// Metadata mínima solo con timingInfo
const minimalMetadata = {
  timingInfo: testTimingInfo
};

async function testTimingStorage() {
  console.log('🎯 TEST ESPECÍFICO: Validación de tiempos');
  console.log('==================================================');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const timestamp = Date.now();
  const researchId = `test-timing-${timestamp}`;
  const participantId = `test-participant-timing-${timestamp}`;

  try {
    // PASO 1: Enviar respuesta con metadata de timing
    console.log('📤 PASO 1: Enviando respuesta con metadata de timing...');
    console.log('📋 Metadata enviada:', JSON.stringify(minimalMetadata, null, 2));

    const createResponse = await fetch(`${API_BASE_URL}/module-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        researchId,
        participantId,
        stepType: 'test_timing',
        stepTitle: 'Test de Tiempos',
        response: {
          testAnswer: 'Respuesta de prueba para tiempos',
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

    // PASO 3: Análisis específico de los tiempos
    console.log('\n🔍 PASO 3: Análisis específico de los tiempos...');

    // El backend devuelve un array de documentos, tomamos el primero
    const firstDocument = getData.data[0];
    const firstResponse = firstDocument.responses[0];
    console.log('📋 Primera respuesta recuperada:', JSON.stringify(firstResponse, null, 2));

    // Análisis de metadata en respuesta individual
    console.log('\n📊 Análisis de metadata en respuesta individual:');
    console.log(`   - Tiene metadata: ${firstResponse.metadata ? '✅' : '❌'}`);
    console.log(`   - Tiene timingInfo: ${firstResponse.metadata?.timingInfo ? '✅' : '❌'}`);
    console.log(`   - Tiene startTime: ${firstResponse.metadata?.timingInfo?.startTime ? '✅' : '❌'}`);
    console.log(`   - Tiene endTime: ${firstResponse.metadata?.timingInfo?.endTime ? '✅' : '❌'}`);
    console.log(`   - Tiene duration: ${firstResponse.metadata?.timingInfo?.duration ? '✅' : '❌'}`);
    console.log(`   - Tiene sectionTimings: ${firstResponse.metadata?.timingInfo?.sectionTimings ? '✅' : '❌'}`);

    if (firstResponse.metadata?.timingInfo) {
      console.log(`   - StartTime almacenado: ${firstResponse.metadata.timingInfo.startTime}`);
      console.log(`   - EndTime almacenado: ${firstResponse.metadata.timingInfo.endTime}`);
      console.log(`   - Duration almacenado: ${firstResponse.metadata.timingInfo.duration}`);
      console.log(`   - StartTime esperado: ${testTimingInfo.startTime}`);
      console.log(`   - EndTime esperado: ${testTimingInfo.endTime}`);
      console.log(`   - Duration esperado: ${testTimingInfo.duration}`);
      console.log(`   - Coincide startTime: ${firstResponse.metadata.timingInfo.startTime === testTimingInfo.startTime ? '✅' : '❌'}`);
      console.log(`   - Coincide endTime: ${firstResponse.metadata.timingInfo.endTime === testTimingInfo.endTime ? '✅' : '❌'}`);
      console.log(`   - Coincide duration: ${firstResponse.metadata.timingInfo.duration === testTimingInfo.duration ? '✅' : '❌'}`);

      // Verificar sectionTimings
      if (firstResponse.metadata.timingInfo.sectionTimings && testTimingInfo.sectionTimings) {
        console.log(`   - Número de sectionTimings almacenados: ${firstResponse.metadata.timingInfo.sectionTimings.length}`);
        console.log(`   - Número de sectionTimings esperados: ${testTimingInfo.sectionTimings.length}`);
        console.log(`   - Coincide número de sections: ${firstResponse.metadata.timingInfo.sectionTimings.length === testTimingInfo.sectionTimings.length ? '✅' : '❌'}`);
      }
    }

    // Análisis de metadata en documento principal
    console.log('\n📊 Análisis de metadata en documento principal:');
    console.log(`   - Tiene metadata: ${firstDocument.metadata ? '✅' : '❌'}`);
    console.log(`   - Tiene timingInfo: ${firstDocument.metadata?.timingInfo ? '✅' : '❌'}`);
    console.log(`   - Tiene startTime: ${firstDocument.metadata?.timingInfo?.startTime ? '✅' : '❌'}`);
    console.log(`   - Tiene endTime: ${firstDocument.metadata?.timingInfo?.endTime ? '✅' : '❌'}`);
    console.log(`   - Tiene duration: ${firstDocument.metadata?.timingInfo?.duration ? '✅' : '❌'}`);

    if (firstDocument.metadata?.timingInfo) {
      console.log(`   - StartTime almacenado: ${firstDocument.metadata.timingInfo.startTime}`);
      console.log(`   - EndTime almacenado: ${firstDocument.metadata.timingInfo.endTime}`);
      console.log(`   - Duration almacenado: ${firstDocument.metadata.timingInfo.duration}`);
      console.log(`   - StartTime esperado: ${testTimingInfo.startTime}`);
      console.log(`   - EndTime esperado: ${testTimingInfo.endTime}`);
      console.log(`   - Duration esperado: ${testTimingInfo.duration}`);
      console.log(`   - Coincide startTime: ${firstDocument.metadata.timingInfo.startTime === testTimingInfo.startTime ? '✅' : '❌'}`);
      console.log(`   - Coincide endTime: ${firstDocument.metadata.timingInfo.endTime === testTimingInfo.endTime ? '✅' : '❌'}`);
      console.log(`   - Coincide duration: ${firstDocument.metadata.timingInfo.duration === testTimingInfo.duration ? '✅' : '❌'}`);
    }

    // RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL');
    console.log('==================');

    const timingStored = firstResponse.metadata?.timingInfo?.startTime &&
                        firstResponse.metadata?.timingInfo?.endTime &&
                        firstResponse.metadata?.timingInfo?.duration;
    const timingMatches = timingStored &&
                         firstResponse.metadata.timingInfo.startTime === testTimingInfo.startTime &&
                         firstResponse.metadata.timingInfo.endTime === testTimingInfo.endTime &&
                         firstResponse.metadata.timingInfo.duration === testTimingInfo.duration;

    if (timingMatches) {
      console.log('✅ ÉXITO: Los tiempos se están almacenando correctamente');
      console.log(`   - StartTime enviado: ${testTimingInfo.startTime}`);
      console.log(`   - EndTime enviado: ${testTimingInfo.endTime}`);
      console.log(`   - Duration enviado: ${testTimingInfo.duration}`);
      console.log(`   - StartTime almacenado: ${firstResponse.metadata.timingInfo.startTime}`);
      console.log(`   - EndTime almacenado: ${firstResponse.metadata.timingInfo.endTime}`);
      console.log(`   - Duration almacenado: ${firstResponse.metadata.timingInfo.duration}`);
    } else {
      console.log('❌ FALLO: Los tiempos NO se están almacenando correctamente');
      console.log(`   - StartTime enviado: ${testTimingInfo.startTime}`);
      console.log(`   - EndTime enviado: ${testTimingInfo.endTime}`);
      console.log(`   - Duration enviado: ${testTimingInfo.duration}`);
      console.log(`   - StartTime almacenado: ${firstResponse.metadata?.timingInfo?.startTime || 'undefined'}`);
      console.log(`   - EndTime almacenado: ${firstResponse.metadata?.timingInfo?.endTime || 'undefined'}`);
      console.log(`   - Duration almacenado: ${firstResponse.metadata?.timingInfo?.duration || 'undefined'}`);
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
    console.log(`Resultado: ${timingMatches ? '✅ ÉXITO' : '❌ FALLO'}`);

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
    console.log('\n🏁 FINALIZADO');
    console.log('=============');
    console.log('Resultado: ❌ FALLO');
  }
}

// Ejecutar el test
testTimingStorage();
