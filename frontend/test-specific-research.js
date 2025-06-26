// Script específico para probar la investigación que está fallando
const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
const RESEARCH_ID = '162a162c-ade1-88bd-fcdc-47a14a44adc5';

async function testSpecificResearch() {
  console.log('🔍 Probando investigación específica:', RESEARCH_ID);

  // 1. Probar si la investigación existe
  console.log('\n1️⃣ Probando si la investigación existe...');
  try {
    const researchResponse = await fetch(`${API_BASE_URL}/research/${RESEARCH_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    console.log('Research Status:', researchResponse.status);
    if (researchResponse.ok) {
      const researchData = await researchResponse.json();
      console.log('✅ Research existe:', researchData);
    } else {
      const researchError = await researchResponse.text();
      console.log('❌ Research error:', researchError);
    }
  } catch (error) {
    console.log('❌ Error probando research:', error);
  }

  // 2. Probar cognitive-task sin token
  console.log('\n2️⃣ Probando cognitive-task sin token...');
  try {
    const cognitiveResponse = await fetch(`${API_BASE_URL}/research/${RESEARCH_ID}/cognitive-task`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    console.log('Cognitive Task Status:', cognitiveResponse.status);
    const responseText = await cognitiveResponse.text();
    console.log('Response:', responseText);

    if (cognitiveResponse.status === 401) {
      console.log('✅ Endpoint existe, requiere autenticación');
    } else if (cognitiveResponse.status === 404) {
      console.log('❌ Endpoint no encontrado o investigación no existe');
    }
  } catch (error) {
    console.log('❌ Error probando cognitive-task:', error);
  }

  // 3. Probar con token mock
  console.log('\n3️⃣ Probando cognitive-task con token mock...');
  const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  try {
    const cognitiveResponse = await fetch(`${API_BASE_URL}/research/${RESEARCH_ID}/cognitive-task`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MOCK_TOKEN}`
      }
    });

    console.log('Cognitive Task Status (con token):', cognitiveResponse.status);
    const responseText = await cognitiveResponse.text();
    console.log('Response (con token):', responseText);
  } catch (error) {
    console.log('❌ Error probando cognitive-task con token:', error);
  }
}

testSpecificResearch();
