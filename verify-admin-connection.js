#!/usr/bin/env node

/**
 * Verificación simple de que el frontend puede conectarse a AWS
 * cuando se autentica correctamente
 */

async function verifyAdminConnection() {
  console.log('🔍 Verificando conexión Admin Frontend -> AWS API\n');

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi1hZG1pbi1pZCIsImVtYWlsIjoiZGV2QGxvY2FsaG9zdCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcyNTQxNzQ1NSwiZXhwIjoxNzI1NTAzODU1fQ.JNbQfqjhfvUCWR7S7lGpKu2vU3fzFRD6rJHm8cQQ_hg';
  const awsUrl = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev/admin/users';

  console.log('🎯 Simulando llamada del frontend después de autenticación...');
  console.log(`📡 URL: ${awsUrl}`);
  console.log('🔑 Token: Establecido');

  try {
    const response = await fetch(awsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/admin/users'
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ ÉXITO: API AWS respondió correctamente');
      console.log(`📋 Datos recibidos: ${data.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`👥 Usuarios: ${data.data?.length || 0}`);
      console.log(`💬 Mensaje: ${data.message || 'Sin mensaje'}`);
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('\n🎉 RESULTADO FINAL:');
        console.log('==================');
        console.log('✅ El frontend PUEDE conectarse correctamente al AWS API');
        console.log('✅ La autenticación funciona');
        console.log('✅ Los datos se obtienen correctamente');
        console.log(`✅ Se encontraron ${data.data.length} usuarios en la base de datos`);
        
        console.log('\n🎯 VERIFICACIÓN:');
        console.log('Cuando vayas a http://localhost:3000/admin/users');
        console.log('e ingreses "admin2025!", deberías ver estos mismos usuarios.');
        
        return true;
      }
    } else {
      console.log('❌ ERROR: API AWS falló');
      const errorText = await response.text();
      console.log(`📝 Error: ${errorText}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERROR: No se pudo conectar a AWS API');
    console.log(`📝 Error: ${error.message}`);
    return false;
  }
}

verifyAdminConnection();