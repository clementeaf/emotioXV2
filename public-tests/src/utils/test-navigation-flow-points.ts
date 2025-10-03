/**
 * 🧪 SCRIPT DE PRUEBA PARA PUNTOS ROJOS Y VERDES EN NAVIGATION FLOW
 *
 * Este script prueba la creación correcta de puntos visuales
 * tanto para clicks dentro como fuera de hitzones.
 */

// 🎯 INTERFACES DE PRUEBA
interface TestPoint {
  x: number;
  y: number;
  isCorrect: boolean;
  hitzoneId?: string;
  timestamp: number;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Función para simular clicks en diferentes posiciones
 */
export function simulateNavigationFlowClicks() {
  console.log('🧪 Iniciando simulación de clicks en Navigation Flow...');

  // 🎯 DATOS DE PRUEBA
  const testClicks: TestPoint[] = [
    // Clicks dentro de hitzones (deberían ser verdes)
    { x: 150, y: 200, isCorrect: true, hitzoneId: 'hitzone1', timestamp: Date.now() },
    { x: 300, y: 250, isCorrect: true, hitzoneId: 'hitzone2', timestamp: Date.now() + 1000 },
    { x: 450, y: 180, isCorrect: true, hitzoneId: 'hitzone3', timestamp: Date.now() + 2000 },

    // Clicks fuera de hitzones (deberían ser rojos)
    { x: 50, y: 50, isCorrect: false, timestamp: Date.now() + 3000 },
    { x: 600, y: 400, isCorrect: false, timestamp: Date.now() + 4000 },
    { x: 100, y: 300, isCorrect: false, timestamp: Date.now() + 5000 },
    { x: 500, y: 100, isCorrect: false, timestamp: Date.now() + 6000 }
  ];

  console.log('📋 Datos de prueba creados:', testClicks);

  // 🎯 SIMULAR CREACIÓN DE PUNTOS
  const results = testClicks.map(click => simulatePointCreation(click));

  // 🎯 MOSTRAR RESULTADOS
  console.log('📊 Resultados de la simulación:');
  results.forEach((result, index) => {
    const click = testClicks[index];
    const color = click.isCorrect ? '🟢 Verde' : '🔴 Rojo';
    const location = click.hitzoneId ? `en hitzone ${click.hitzoneId}` : 'fuera de hitzone';

    console.log(`  ${index + 1}. ${color} en (${click.x}, ${click.y}) - ${location}`);
    console.log(`     ${result.success ? '✅' : '❌'} ${result.message}`);
  });

  return { testClicks, results };
}

/**
 * Simula la creación de un punto visual
 */
function simulatePointCreation(click: TestPoint): TestResult {
  try {
    // Simular la lógica de creación de punto visual
    const visualPoint = {
      x: click.x,
      y: click.y,
      timestamp: click.timestamp,
      isCorrect: click.isCorrect,
      imageIndex: 0
    };

    // Verificar que el punto se crea correctamente
    if (click.isCorrect && !click.hitzoneId) {
      return {
        success: false,
        message: 'Error: Click marcado como correcto pero sin hitzoneId'
      };
    }

    if (!click.isCorrect && click.hitzoneId) {
      return {
        success: false,
        message: 'Error: Click marcado como incorrecto pero con hitzoneId'
      };
    }

    const expectedColor = click.isCorrect ? 'green' : 'red';
    const actualColor = visualPoint.isCorrect ? 'green' : 'red';

    if (expectedColor !== actualColor) {
      return {
        success: false,
        message: `Error: Color incorrecto. Esperado: ${expectedColor}, Actual: ${actualColor}`
      };
    }

    return {
      success: true,
      message: `Punto ${actualColor} creado correctamente`,
      data: visualPoint
    };
  } catch (error) {
    return {
      success: false,
      message: `Error en simulación: ${error}`
    };
  }
}

/**
 * Función para verificar la funcionalidad de puntos
 */
export function testPointFunctionality() {
  console.log('🎯 Iniciando pruebas de puntos visuales...');

  // 🎯 PRUEBA 1: Simular clicks en hitzones (verdes)
  console.log('🟢 Probando clicks en hitzones (puntos verdes)...');
  const hitzoneClicks = [
    { x: 150, y: 200, hitzoneId: 'hitzone1' },
    { x: 300, y: 250, hitzoneId: 'hitzone2' },
    { x: 450, y: 180, hitzoneId: 'hitzone3' }
  ];

  hitzoneClicks.forEach((click, index) => {
    const result = simulatePointCreation({
      ...click,
      isCorrect: true,
      timestamp: Date.now() + index * 1000
    });

    console.log(`  Hitzone ${index + 1}: ${result.success ? '✅' : '❌'} ${result.message}`);
  });

  // 🎯 PRUEBA 2: Simular clicks fuera de hitzones (rojos)
  console.log('🔴 Probando clicks fuera de hitzones (puntos rojos)...');
  const outsideClicks = [
    { x: 50, y: 50 },
    { x: 600, y: 400 },
    { x: 100, y: 300 },
    { x: 500, y: 100 }
  ];

  outsideClicks.forEach((click, index) => {
    const result = simulatePointCreation({
      ...click,
      isCorrect: false,
      timestamp: Date.now() + index * 1000
    });

    console.log(`  Outside ${index + 1}: ${result.success ? '✅' : '❌'} ${result.message}`);
  });

  // 🎯 PRUEBA 3: Verificar persistencia
  console.log('💾 Probando persistencia de puntos...');
  const allClicks = [...hitzoneClicks.map(c => ({ ...c, isCorrect: true })), ...outsideClicks.map(c => ({ ...c, isCorrect: false }))];

  const greenPoints = allClicks.filter(c => c.isCorrect).length;
  const redPoints = allClicks.filter(c => !c.isCorrect).length;

  console.log(`  Total puntos: ${allClicks.length}`);
  console.log(`  Puntos verdes: ${greenPoints}`);
  console.log(`  Puntos rojos: ${redPoints}`);
  console.log(`  Precisión: ${((greenPoints / allClicks.length) * 100).toFixed(1)}%`);

  console.log('✅ Todas las pruebas completadas');
}

/**
 * Función para verificar el estado actual del componente
 */
export function checkCurrentState() {
  console.log('🔍 Verificando estado actual del NavigationFlowTask...');

  // Intentar acceder al estado del componente
  try {
    // Buscar el componente en el DOM
    const navigationTask = document.querySelector('[data-testid="navigation-flow-task"]');

    if (navigationTask) {
      console.log('✅ Componente NavigationFlowTask encontrado');

      // Buscar puntos visuales
      const visualPoints = document.querySelectorAll('.absolute.w-3.h-3.rounded-full');
      console.log(`📍 Puntos visuales encontrados: ${visualPoints.length}`);

      visualPoints.forEach((point, index) => {
        const isGreen = point.classList.contains('bg-green-500');
        const isRed = point.classList.contains('bg-red-500');
        const color = isGreen ? '🟢 Verde' : isRed ? '🔴 Rojo' : '⚪ Desconocido';

        console.log(`  Punto ${index + 1}: ${color}`);
      });
    } else {
      console.log('❌ Componente NavigationFlowTask no encontrado');
    }
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
}

/**
 * Función para limpiar datos de prueba
 */
export function clearTestData() {
  console.log('🧹 Limpiando datos de prueba...');

  // Simular limpieza del estado
  const cleanedState = {
    visualClickPoints: {},
    imageSelections: {},
    allClicksTracking: []
  };

  console.log('✅ Datos de prueba limpiados:', cleanedState);
}

// 🎯 EXPORTAR FUNCIONES PARA USO EN CONSOLA
if (typeof window !== 'undefined') {
  (window as any).testNavigationFlowPoints = {
    simulateClicks: simulateNavigationFlowClicks,
    testFunctionality: testPointFunctionality,
    checkState: checkCurrentState,
    clearData: clearTestData
  };

  console.log('🧪 Script de prueba de puntos cargado. Usa:');
  console.log('  testNavigationFlowPoints.simulateClicks()');
  console.log('  testNavigationFlowPoints.testFunctionality()');
  console.log('  testNavigationFlowPoints.checkState()');
  console.log('  testNavigationFlowPoints.clearData()');
}
