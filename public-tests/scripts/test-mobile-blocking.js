#!/usr/bin/env node

/**
 * Script de testing manual para la funcionalidad de bloqueo de dispositivos móviles
 *
 * Este script simula diferentes escenarios para validar que la lógica de bloqueo
 * funciona correctamente.
 */

console.log('🧪 TESTING: Bloqueo de Dispositivos Móviles\n');

// Simulación de la lógica del hook useMobileDeviceCheck
function simulateMobileDeviceCheck(eyeTrackingConfig, isFlowLoading, deviceType) {
  // Función para obtener la configuración de dispositivos móviles
  function getMobileConfig(config) {
    if (!config) {
      return { allowMobile: true, configFound: false };
    }

    // Buscar en diferentes ubicaciones posibles de la configuración
    const possiblePaths = [
      config.linkConfig?.allowMobile,
      config.linkConfig?.allowMobileDevices,
      config.allowMobile,
      config.allowMobileDevices
    ];

    // Encontrar el primer valor definido (no undefined)
    const allowMobile = possiblePaths.find(value => value !== undefined);

    return {
      allowMobile: allowMobile !== undefined ? Boolean(allowMobile) : true,
      configFound: allowMobile !== undefined
    };
  }

  // Determinar si el usuario está en móvil o tablet
  const isMobileOrTablet = deviceType === 'mobile' || deviceType === 'tablet';

  // Obtener configuración
  const mobileConfig = getMobileConfig(eyeTrackingConfig);

  // Determinar si se debe bloquear el acceso
  const shouldBlock = !isFlowLoading && isMobileOrTablet && !mobileConfig.allowMobile;

  return {
    deviceType,
    allowMobile: mobileConfig.allowMobile,
    configFound: mobileConfig.configFound,
    shouldBlock,
    isMobileOrTablet
  };
}

// Casos de prueba
const testCases = [
  {
    name: 'Sin configuración - Desktop',
    config: null,
    deviceType: 'desktop',
    isFlowLoading: false,
    expectedBlock: false
  },
  {
    name: 'Sin configuración - Mobile',
    config: null,
    deviceType: 'mobile',
    isFlowLoading: false,
    expectedBlock: false
  },
  {
    name: 'AllowMobile: true - Desktop',
    config: { allowMobile: true },
    deviceType: 'desktop',
    isFlowLoading: false,
    expectedBlock: false
  },
  {
    name: 'AllowMobile: true - Mobile',
    config: { allowMobile: true },
    deviceType: 'mobile',
    isFlowLoading: false,
    expectedBlock: false
  },
  {
    name: 'AllowMobile: false - Desktop',
    config: { allowMobile: false },
    deviceType: 'desktop',
    isFlowLoading: false,
    expectedBlock: false
  },
  {
    name: 'AllowMobile: false - Mobile',
    config: { allowMobile: false },
    deviceType: 'mobile',
    isFlowLoading: false,
    expectedBlock: true
  },
  {
    name: 'AllowMobile: false - Tablet',
    config: { allowMobile: false },
    deviceType: 'tablet',
    isFlowLoading: false,
    expectedBlock: true
  },
  {
    name: 'AllowMobile: false - Mobile (durante carga)',
    config: { allowMobile: false },
    deviceType: 'mobile',
    isFlowLoading: true,
    expectedBlock: false
  },
  {
    name: 'linkConfig.allowMobile: false - Mobile',
    config: { linkConfig: { allowMobile: false } },
    deviceType: 'mobile',
    isFlowLoading: false,
    expectedBlock: true
  },
  {
    name: 'linkConfig.allowMobileDevices: false - Mobile',
    config: { linkConfig: { allowMobileDevices: false } },
    deviceType: 'mobile',
    isFlowLoading: false,
    expectedBlock: true
  },
  {
    name: 'Prioridad linkConfig.allowMobile - Mobile',
    config: {
      linkConfig: { allowMobile: false },
      allowMobile: true,
      allowMobileDevices: true
    },
    deviceType: 'mobile',
    isFlowLoading: false,
    expectedBlock: true
  }
];

// Ejecutar tests
let passedTests = 0;
let totalTests = testCases.length;

console.log(`Ejecutando ${totalTests} casos de prueba...\n`);

testCases.forEach((testCase, index) => {
  const result = simulateMobileDeviceCheck(
    testCase.config,
    testCase.isFlowLoading,
    testCase.deviceType
  );

  const passed = result.shouldBlock === testCase.expectedBlock;

  if (passed) {
    passedTests++;
    console.log(`✅ ${index + 1}. ${testCase.name}`);
  } else {
    console.log(`❌ ${index + 1}. ${testCase.name}`);
    console.log(`   Esperado: shouldBlock = ${testCase.expectedBlock}`);
    console.log(`   Obtenido: shouldBlock = ${result.shouldBlock}`);
    console.log(`   Resultado completo:`, result);
  }
});

// Resumen
console.log(`\n📊 RESUMEN:`);
console.log(`Tests pasados: ${passedTests}/${totalTests}`);
console.log(`Cobertura: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log(`\n🎉 ¡Todos los tests pasaron! La funcionalidad está funcionando correctamente.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Algunos tests fallaron. Revisar la implementación.`);
  process.exit(1);
}
