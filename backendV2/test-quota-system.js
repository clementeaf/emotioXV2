/**
 * Script de prueba para el sistema de cuotas
 * Verifica que la conversión de porcentajes y validación funciona correctamente
 */

// Simular la función calculateAbsoluteQuota
function calculateAbsoluteQuota(quota, quotaType, totalParticipants) {
  if (quotaType === 'percentage') {
    return Math.ceil((quota / 100) * totalParticipants);
  }
  return quota;
}

// Casos de prueba
const testCases = [
  {
    name: 'Cuota absoluta básica',
    quota: 50,
    quotaType: 'absolute',
    totalParticipants: 100,
    expected: 50
  },
  {
    name: 'Cuota de 50% con 100 participantes',
    quota: 50,
    quotaType: 'percentage',
    totalParticipants: 100,
    expected: 50
  },
  {
    name: 'Cuota de 25% con 100 participantes',
    quota: 25,
    quotaType: 'percentage',
    totalParticipants: 100,
    expected: 25
  },
  {
    name: 'Cuota de 33% con 100 participantes (redondeo)',
    quota: 33,
    quotaType: 'percentage',
    totalParticipants: 100,
    expected: 33
  },
  {
    name: 'Cuota de 10% con 150 participantes',
    quota: 10,
    quotaType: 'percentage',
    totalParticipants: 150,
    expected: 15
  },
  {
    name: 'Cuota de 5% con 200 participantes',
    quota: 5,
    quotaType: 'percentage',
    totalParticipants: 200,
    expected: 10
  },
  {
    name: 'Cuota de 33.33% con 300 participantes (redondeo hacia arriba)',
    quota: 33.33,
    quotaType: 'percentage',
    totalParticipants: 300,
    expected: 100
  },
  {
    name: 'Cuota absoluta de 75 participantes',
    quota: 75,
    quotaType: 'absolute',
    totalParticipants: 200,
    expected: 75
  },
  {
    name: 'Fallback a absolute cuando quotaType es undefined',
    quota: 30,
    quotaType: undefined,
    totalParticipants: 100,
    expected: 30
  }
];

console.log('🧪 EJECUTANDO PRUEBAS DEL SISTEMA DE CUOTAS\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = calculateAbsoluteQuota(
    test.quota,
    test.quotaType || 'absolute',
    test.totalParticipants
  );

  const success = result === test.expected;

  if (success) {
    passed++;
    console.log(`\n✅ Test ${index + 1}: ${test.name}`);
  } else {
    failed++;
    console.log(`\n❌ Test ${index + 1}: ${test.name}`);
  }

  console.log(`   Input: ${test.quota}${test.quotaType === 'percentage' ? '%' : ''} (tipo: ${test.quotaType || 'absolute'}, total: ${test.totalParticipants})`);
  console.log(`   Esperado: ${test.expected}`);
  console.log(`   Obtenido: ${result}`);
  console.log(`   Estado: ${success ? 'PASS' : 'FAIL'}`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADOS:`);
console.log(`   ✅ Pruebas exitosas: ${passed}/${testCases.length}`);
console.log(`   ❌ Pruebas fallidas: ${failed}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.\n');
  process.exit(1);
}
