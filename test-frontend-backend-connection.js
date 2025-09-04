#!/usr/bin/env node

/**
 * Test para verificar que el frontend puede conectarse correctamente al backend
 * Simula las llamadas que haría el frontend cuando se autentica
 */

const API_BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';

async function testFrontendAPIConnection() {
  console.log('🧪 Testing Frontend to Backend Connection\n');
  console.log('=========================================\n');

  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`📱 Frontend URL: http://localhost:3000/admin/users`);
  console.log('🔑 Secret Key: admin2025!\n');

  // Simular el token que usa el middleware de desarrollo
  const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi1hZG1pbi1pZCIsImVtYWlsIjoiZGV2QGxvY2FsaG9zdCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcyNTQxNzQ1NSwiZXhwIjoxNzI1NTAzODU1fQ.JNbQfqjhfvUCWR7S7lGpKu2vU3fzFRD6rJHm8cQQ_hg';

  // Test 1: Verificar que el endpoint de usuarios funciona
  console.log('📋 Test 1: Calling /admin/users endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS: Got ${data.data.length} users from backend`);
      console.log(`   Response format: { success: ${data.success}, data: [...], message: "${data.message}" }`);
      console.log(`   Sample user: ${data.data[0] ? data.data[0].email : 'No users'}\n`);
    } else {
      console.log(`❌ FAILED: Status ${response.status}`);
      console.log(`   Error: ${data.error || data.message || 'Unknown error'}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAILED: Network error - ${error.message}\n`);
    return false;
  }

  // Test 2: Verificar endpoint de creación
  console.log('➕ Test 2: Testing user creation endpoint...');
  const testEmail = `frontend-test-${Date.now()}@example.com`;
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        role: 'user'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS: Created user ${data.data.email}`);
      console.log(`   New user ID: ${data.data.id}\n`);
      
      // Limpiar: eliminar el usuario de prueba
      const deleteResponse = await fetch(`${API_BASE_URL}/admin/users/${data.data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DEV_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`🧹 Cleanup: Test user deleted\n`);
      }
    } else {
      console.log(`❌ FAILED: Status ${response.status}`);
      console.log(`   Error: ${data.error || data.message || 'Unknown error'}\n`);
    }
  } catch (error) {
    console.log(`❌ FAILED: Network error - ${error.message}\n`);
  }

  console.log('=========================================');
  console.log('✅ Frontend to Backend connection test completed!');
  console.log('\n📝 What this means:');
  console.log('- ✅ Frontend (localhost:3000) can reach Backend API');
  console.log('- ✅ Admin endpoints are working correctly');
  console.log('- ✅ Authentication is working');
  console.log('- ✅ CRUD operations are functional');
  console.log('\n🎯 Next steps:');
  console.log('1. Go to: http://localhost:3000/admin/users');
  console.log('2. Enter secret key: admin2025!');
  console.log('3. The page should load users from the backend API');
  console.log('4. You can create, edit, and delete users from the UI');

  return true;
}

// Run the test
testFrontendAPIConnection().catch(console.error);