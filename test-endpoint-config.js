#!/usr/bin/env node

/**
 * Test rápido para verificar la configuración de endpoints
 */

console.log('🔍 Testing Endpoint Configuration\n');

// Simular las importaciones del frontend
const DYNAMIC_API_ENDPOINTS = {
  http: "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev",
  ws: "wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev",
  stage: "dev"
};

const API_HTTP_ENDPOINT = DYNAMIC_API_ENDPOINTS.http;

function isEndpointsSynced() {
  return API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

// Simular la lógica de api.ts
const API_BASE_URL = isEndpointsSynced()
  ? DYNAMIC_API_ENDPOINTS.http
  : (process.env.NEXT_PUBLIC_API_URL || DYNAMIC_API_ENDPOINTS.http);

console.log('📊 Configuration Results:');
console.log('========================');
console.log(`🔗 API_HTTP_ENDPOINT: ${API_HTTP_ENDPOINT}`);
console.log(`✅ isEndpointsSynced(): ${isEndpointsSynced()}`);
console.log(`🎯 Final API_BASE_URL: ${API_BASE_URL}`);
console.log(`📱 Frontend URL: http://localhost:3000/admin/users`);

console.log('\n🧪 Testing API Connection:');
console.log('==========================');

// Test the actual endpoint
const testEndpoint = `${API_BASE_URL}/admin/users`;
console.log(`📡 Testing: ${testEndpoint}`);

fetch(testEndpoint, {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi1hZG1pbi1pZCIsImVtYWlsIjoiZGV2QGxvY2FsaG9zdCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcyNTQxNzQ1NSwiZXhwIjoxNzI1NTAzODU1fQ.JNbQfqjhfvUCWR7S7lGpKu2vU3fzFRD6rJHm8cQQ_hg'
  }
})
.then(response => response.json())
.then(data => {
  if (data.success && data.data) {
    console.log(`✅ SUCCESS: API responded with ${data.data.length} users`);
    console.log(`📝 Message: ${data.message}`);
    console.log('\n🎉 The frontend should now load users correctly!');
    console.log('🔄 Try refreshing: http://localhost:3000/admin/users');
    console.log('🗝️  Use secret key: admin2025!');
  } else {
    console.log(`❌ API Error: ${data.error || 'Unknown error'}`);
  }
})
.catch(error => {
  console.log(`❌ Network Error: ${error.message}`);
});