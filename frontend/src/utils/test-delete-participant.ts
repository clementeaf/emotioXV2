/**
 * 🧪 SCRIPT DE PRUEBA PARA ELIMINACIÓN DE PARTICIPANTES
 *
 * Este script prueba la funcionalidad de eliminación de participantes
 * para verificar que el endpoint funciona correctamente.
 */

import { researchInProgressAPI } from '../lib/api';

/**
 * Función para probar la eliminación de un participante
 */
export async function testDeleteParticipant(researchId: string, participantId: string): Promise<void> {
  console.log('🧪 Iniciando prueba de eliminación de participante...');
  console.log('📋 Parámetros:', { researchId, participantId });

  try {
    // 🎯 PROBAR ELIMINACIÓN
    const response = await researchInProgressAPI.deleteParticipant(researchId, participantId);

    if (response.success) {
      console.log('✅ Participante eliminado exitosamente');
      console.log('📊 Respuesta:', response.data);
    } else {
      console.error('❌ Error al eliminar participante:', response);
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

/**
 * Función para verificar que el endpoint está disponible
 */
export async function testEndpointAvailability(): Promise<void> {
  console.log('🔍 Verificando disponibilidad del endpoint...');

  try {
    // 🎯 PROBAR CON DATOS DE PRUEBA
    const testResearchId = 'test-research-id';
    const testParticipantId = 'test-participant-id';

    const response = await researchInProgressAPI.deleteParticipant(testResearchId, testParticipantId);

    console.log('📊 Respuesta del endpoint:', response);

    if (response.success) {
      console.log('✅ Endpoint disponible y funcionando');
    } else {
      console.log('⚠️ Endpoint disponible pero con error:', response.error);
    }
  } catch (error) {
    console.error('❌ Endpoint no disponible:', error);
  }
}

/**
 * Función para probar con datos reales
 */
export async function testWithRealData(): Promise<void> {
  console.log('🔍 Probando con datos reales...');

  try {
    // 🎯 USAR DATOS DEL ERROR ANTERIOR
    const realResearchId = '193b949e-9fac-f000-329b-e71bab5a9203';
    const realParticipantId = 'a2c7494e-fe9c-4f8f-9333-b168fdc9a4ba';

    console.log('📋 Datos reales:', { realResearchId, realParticipantId });

    const response = await researchInProgressAPI.deleteParticipant(realResearchId, realParticipantId);

    console.log('📊 Respuesta con datos reales:', response);

    if (response.success) {
      console.log('✅ Eliminación con datos reales exitosa');
    } else {
      console.log('❌ Error con datos reales:', response.error);
    }
  } catch (error) {
    console.error('❌ Error con datos reales:', error);
  }
}

/**
 * Función para ejecutar todas las pruebas
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Ejecutando todas las pruebas de eliminación de participantes...');

  // 🎯 PRUEBA 1: Verificar disponibilidad
  await testEndpointAvailability();

  // 🎯 PRUEBA 2: Probar con datos reales
  await testWithRealData();

  console.log('✅ Pruebas completadas');
}

// 🎯 EXPORTAR PARA USO EN CONSOLA DEL NAVEGADOR
if (typeof window !== 'undefined') {
  (window as any).testDeleteParticipant = testDeleteParticipant;
  (window as any).testEndpointAvailability = testEndpointAvailability;
  (window as any).testWithRealData = testWithRealData;
  (window as any).runAllTests = runAllTests;

  console.log('🧪 Script de prueba cargado. Usa:');
  console.log('- testEndpointAvailability() para verificar el endpoint');
  console.log('- testDeleteParticipant(researchId, participantId) para probar eliminación');
  console.log('- testWithRealData() para probar con datos reales');
  console.log('- runAllTests() para ejecutar todas las pruebas');
}
