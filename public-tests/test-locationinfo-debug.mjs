import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-locationinfo-debug-' + Date.now();
const PARTICIPANT_ID = 'test-participant-location-' + Date.now();

async function testLocationInfoDebug() {
  console.log('🔍 DEBUG ESPECÍFICO DE LOCATIONINFO');
  console.log('===================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Research ID: ${RESEARCH_ID}`);
  console.log(`Participant ID: ${PARTICIPANT_ID}`);
  console.log('');

  try {
    // TEST 1: locationInfo con solo strings
    console.log('📤 TEST 1: locationInfo solo strings...');
    const payload1 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-strings',
      stepType: 'test',
      stepTitle: 'Test LocationInfo Solo Strings',
      response: { test: true },
      metadata: {
        locationInfo: {
          city: 'Test City',
          country: 'Test Country',
          region: 'Test Region',
          ipAddress: '127.0.0.1'
        }
      }
    };

    try {
      const response1 = await axios.post(`${BASE_URL}/module-responses`, payload1);
      console.log('✅ Solo strings: FUNCIONA');
      console.log('Response:', response1.data);
    } catch (error) {
      console.log('❌ Solo strings: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 2: locationInfo con solo números
    console.log('\n📤 TEST 2: locationInfo solo números...');
    const payload2 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-numbers',
      stepType: 'test',
      stepTitle: 'Test LocationInfo Solo Números',
      response: { test: true },
      metadata: {
        locationInfo: {
          latitude: 40.4168,
          longitude: -3.7038
        }
      }
    };

    try {
      const response2 = await axios.post(`${BASE_URL}/module-responses`, payload2);
      console.log('✅ Solo números: FUNCIONA');
      console.log('Response:', response2.data);
    } catch (error) {
      console.log('❌ Solo números: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 3: locationInfo con números como strings
    console.log('\n📤 TEST 3: locationInfo números como strings...');
    const payload3 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-string-numbers',
      stepType: 'test',
      stepTitle: 'Test LocationInfo Números como Strings',
      response: { test: true },
      metadata: {
        locationInfo: {
          latitude: '40.4168',
          longitude: '-3.7038',
          city: 'Madrid',
          country: 'Spain'
        }
      }
    };

    try {
      const response3 = await axios.post(`${BASE_URL}/module-responses`, payload3);
      console.log('✅ Números como strings: FUNCIONA');
      console.log('Response:', response3.data);
    } catch (error) {
      console.log('❌ Números como strings: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 4: locationInfo con valores nulos
    console.log('\n📤 TEST 4: locationInfo con valores nulos...');
    const payload4 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-nulls',
      stepType: 'test',
      stepTitle: 'Test LocationInfo con Nulos',
      response: { test: true },
      metadata: {
        locationInfo: {
          latitude: null,
          longitude: null,
          city: null,
          country: null,
          region: null,
          ipAddress: null
        }
      }
    };

    try {
      const response4 = await axios.post(`${BASE_URL}/module-responses`, payload4);
      console.log('✅ Con nulos: FUNCIONA');
      console.log('Response:', response4.data);
    } catch (error) {
      console.log('❌ Con nulos: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 5: locationInfo con valores undefined
    console.log('\n📤 TEST 5: locationInfo con valores undefined...');
    const payload5 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-undefined',
      stepType: 'test',
      stepTitle: 'Test LocationInfo con Undefined',
      response: { test: true },
      metadata: {
        locationInfo: {
          latitude: undefined,
          longitude: undefined,
          city: undefined,
          country: undefined,
          region: undefined,
          ipAddress: undefined
        }
      }
    };

    try {
      const response5 = await axios.post(`${BASE_URL}/module-responses`, payload5);
      console.log('✅ Con undefined: FUNCIONA');
      console.log('Response:', response5.data);
    } catch (error) {
      console.log('❌ Con undefined: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 6: locationInfo vacío
    console.log('\n📤 TEST 6: locationInfo vacío...');
    const payload6 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-empty',
      stepType: 'test',
      stepTitle: 'Test LocationInfo Vacío',
      response: { test: true },
      metadata: {
        locationInfo: {}
      }
    };

    try {
      const response6 = await axios.post(`${BASE_URL}/module-responses`, payload6);
      console.log('✅ Vacío: FUNCIONA');
      console.log('Response:', response6.data);
    } catch (error) {
      console.log('❌ Vacío: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 7: locationInfo con valores extremos
    console.log('\n📤 TEST 7: locationInfo con valores extremos...');
    const payload7 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-extreme',
      stepType: 'test',
      stepTitle: 'Test LocationInfo Valores Extremos',
      response: { test: true },
      metadata: {
        locationInfo: {
          latitude: 90.0,
          longitude: 180.0,
          city: 'A'.repeat(1000), // String muy largo
          country: 'B'.repeat(1000),
          region: 'C'.repeat(1000),
          ipAddress: '255.255.255.255'
        }
      }
    };

    try {
      const response7 = await axios.post(`${BASE_URL}/module-responses`, payload7);
      console.log('✅ Valores extremos: FUNCIONA');
      console.log('Response:', response7.data);
    } catch (error) {
      console.log('❌ Valores extremos: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n🎯 DIAGNÓSTICO DE LOCATIONINFO COMPLETADO');

  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar el diagnóstico de locationInfo
testLocationInfoDebug();
