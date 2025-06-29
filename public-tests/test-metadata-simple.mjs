import axios from 'axios';

// Configurar para producción AWS Lambda
const BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = 'test-metadata-simple-' + Date.now();
const PARTICIPANT_ID = 'test-participant-simple-' + Date.now();

async function testMetadataSimple() {
  console.log('🔍 DIAGNÓSTICO SIMPLE DE METADATA');
  console.log('==================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Research ID: ${RESEARCH_ID}`);
  console.log(`Participant ID: ${PARTICIPANT_ID}`);
  console.log('');

  try {
    // TEST 1: Sin metadata (mínimo absoluto)
    console.log('📤 TEST 1: Sin metadata...');
    const payload1 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID,
      stepType: 'test',
      stepTitle: 'Test Sin Metadata',
      response: { test: true }
    };

    try {
      const response1 = await axios.post(`${BASE_URL}/module-responses`, payload1);
      console.log('✅ Sin metadata: FUNCIONA');
      console.log('Response:', response1.data);
    } catch (error) {
      console.log('❌ Sin metadata: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 2: Solo sessionInfo (mínimo metadata)
    console.log('\n📤 TEST 2: Solo sessionInfo...');
    const payload2 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-session',
      stepType: 'test',
      stepTitle: 'Test Solo SessionInfo',
      response: { test: true },
      metadata: {
        sessionInfo: {
          reentryCount: 0,
          sessionStartTime: Date.now(),
          lastVisitTime: Date.now(),
          totalSessionTime: 0,
          isFirstVisit: true
        }
      }
    };

    try {
      const response2 = await axios.post(`${BASE_URL}/module-responses`, payload2);
      console.log('✅ Solo sessionInfo: FUNCIONA');
      console.log('Response:', response2.data);
    } catch (error) {
      console.log('❌ Solo sessionInfo: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 3: Solo deviceInfo
    console.log('\n📤 TEST 3: Solo deviceInfo...');
    const payload3 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-device',
      stepType: 'test',
      stepTitle: 'Test Solo DeviceInfo',
      response: { test: true },
      metadata: {
        deviceInfo: {
          deviceType: 'desktop',
          userAgent: 'Test User Agent',
          screenWidth: 1920,
          screenHeight: 1080,
          platform: 'Test Platform',
          language: 'en-US'
        }
      }
    };

    try {
      const response3 = await axios.post(`${BASE_URL}/module-responses`, payload3);
      console.log('✅ Solo deviceInfo: FUNCIONA');
      console.log('Response:', response3.data);
    } catch (error) {
      console.log('❌ Solo deviceInfo: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 4: Solo locationInfo
    console.log('\n📤 TEST 4: Solo locationInfo...');
    const payload4 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-location',
      stepType: 'test',
      stepTitle: 'Test Solo LocationInfo',
      response: { test: true },
      metadata: {
        locationInfo: {
          latitude: 0.0,
          longitude: 0.0,
          city: 'Test City',
          country: 'Test Country',
          region: 'Test Region',
          ipAddress: '127.0.0.1'
        }
      }
    };

    try {
      const response4 = await axios.post(`${BASE_URL}/module-responses`, payload4);
      console.log('✅ Solo locationInfo: FUNCIONA');
      console.log('Response:', response4.data);
    } catch (error) {
      console.log('❌ Solo locationInfo: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 5: Solo timingInfo
    console.log('\n📤 TEST 5: Solo timingInfo...');
    const payload5 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-timing',
      stepType: 'test',
      stepTitle: 'Test Solo TimingInfo',
      response: { test: true },
      metadata: {
        timingInfo: {
          startTime: Date.now() - 60000,
          endTime: Date.now(),
          duration: 60000,
          sectionTimings: [
            {
              sectionId: 'test_section',
              startTime: Date.now() - 60000,
              endTime: Date.now(),
              duration: 60000
            }
          ]
        }
      }
    };

    try {
      const response5 = await axios.post(`${BASE_URL}/module-responses`, payload5);
      console.log('✅ Solo timingInfo: FUNCIONA');
      console.log('Response:', response5.data);
    } catch (error) {
      console.log('❌ Solo timingInfo: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    // TEST 6: Solo technicalInfo
    console.log('\n📤 TEST 6: Solo technicalInfo...');
    const payload6 = {
      researchId: RESEARCH_ID,
      participantId: PARTICIPANT_ID + '-technical',
      stepType: 'test',
      stepTitle: 'Test Solo TechnicalInfo',
      response: { test: true },
      metadata: {
        technicalInfo: {
          browser: 'Test Browser',
          browserVersion: '1.0.0',
          os: 'Test OS',
          osVersion: '1.0.0',
          connectionType: 'test',
          timezone: 'UTC'
        }
      }
    };

    try {
      const response6 = await axios.post(`${BASE_URL}/module-responses`, payload6);
      console.log('✅ Solo technicalInfo: FUNCIONA');
      console.log('Response:', response6.data);
    } catch (error) {
      console.log('❌ Solo technicalInfo: FALLA');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETADO');

  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar el diagnóstico simple
testMetadataSimple();
