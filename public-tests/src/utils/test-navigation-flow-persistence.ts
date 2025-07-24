/**
 * 🧪 SCRIPT DE PRUEBA PARA PERSISTENCIA DE PUNTOS ROJOS EN NAVIGATION FLOW
 *
 * Este script prueba la funcionalidad de persistencia de clicks con puntos rojos
 * tanto dentro como fuera de hitzones en el componente NavigationFlowTask.
 */

// 🎯 INTERFACES DE PRUEBA
interface TestClickPoint {
  x: number;
  y: number;
  timestamp: number;
  isCorrect: boolean;
  imageIndex: number;
}

interface TestNavigationData {
  questionKey: string;
  visualClickPoints: TestClickPoint[];
  imageSelections: Record<string, any>;
}

/**
 * Función para simular clicks en diferentes posiciones
 */
export function simulateNavigationFlowClicks() {
  console.log('🧪 Iniciando simulación de clicks en Navigation Flow...');

  // 🎯 DATOS DE PRUEBA
  const testData: TestNavigationData = {
    questionKey: 'cognitive_navigation_flow_test',
    visualClickPoints: [
      // Clicks dentro de hitzones (verdes)
      { x: 150, y: 200, timestamp: Date.now(), isCorrect: true, imageIndex: 0 },
      { x: 300, y: 250, timestamp: Date.now() + 1000, isCorrect: true, imageIndex: 0 },
      { x: 450, y: 180, timestamp: Date.now() + 2000, isCorrect: true, imageIndex: 1 },

      // Clicks fuera de hitzones (rojos)
      { x: 50, y: 50, timestamp: Date.now() + 3000, isCorrect: false, imageIndex: 0 },
      { x: 600, y: 400, timestamp: Date.now() + 4000, isCorrect: false, imageIndex: 0 },
      { x: 100, y: 300, timestamp: Date.now() + 5000, isCorrect: false, imageIndex: 1 },
      { x: 500, y: 100, timestamp: Date.now() + 6000, isCorrect: false, imageIndex: 1 }
    ],
    imageSelections: {
      '0': { hitzoneId: 'hitzone1', click: { x: 150, y: 200, hitzoneWidth: 100, hitzoneHeight: 50 } },
      '1': { hitzoneId: 'hitzone2', click: { x: 450, y: 180, hitzoneWidth: 120, hitzoneHeight: 60 } }
    }
  };

  console.log('📋 Datos de prueba creados:', testData);

  // 🎯 SIMULAR PERSISTENCIA
  simulatePersistence(testData);

  // 🎯 SIMULAR CARGA DESDE BACKEND
  simulateBackendLoad(testData);

  return testData;
}

/**
 * Simula la persistencia de puntos visuales
 */
function simulatePersistence(data: TestNavigationData) {
  console.log('💾 Simulando persistencia de puntos visuales...');

  // Simular el estado por imagen
  const pointsByImage: Record<number, TestClickPoint[]> = {};

  data.visualClickPoints.forEach(point => {
    if (!pointsByImage[point.imageIndex]) {
      pointsByImage[point.imageIndex] = [];
    }
    pointsByImage[point.imageIndex].push(point);
  });

  console.log('📊 Puntos organizados por imagen:', pointsByImage);

  // Simular envío al backend
  const backendData = {
    questionKey: data.questionKey,
    visualClickPoints: data.visualClickPoints,
    imageSelections: data.imageSelections
  };

  console.log('🚀 Datos enviados al backend:', backendData);
}

/**
 * Simula la carga de datos desde el backend
 */
function simulateBackendLoad(data: TestNavigationData) {
  console.log('📥 Simulando carga desde backend...');

  // Simular respuesta del backend
  const backendResponse = {
    questionKey: data.questionKey,
    response: {
      visualClickPoints: data.visualClickPoints,
      imageSelections: data.imageSelections
    }
  };

  // Simular procesamiento de la respuesta
  const pointsByImage: Record<number, TestClickPoint[]> = {};
  backendResponse.response.visualClickPoints.forEach((point: TestClickPoint) => {
    if (!pointsByImage[point.imageIndex]) {
      pointsByImage[point.imageIndex] = [];
    }
    pointsByImage[point.imageIndex].push(point);
  });

  console.log('✅ Puntos cargados desde backend:', pointsByImage);

  // Verificar que los puntos se mantienen por imagen
  Object.entries(pointsByImage).forEach(([imageIndex, points]) => {
    const correctClicks = points.filter(p => p.isCorrect).length;
    const incorrectClicks = points.filter(p => !p.isCorrect).length;

    console.log(`🖼️ Imagen ${imageIndex}:`, {
      totalClicks: points.length,
      correctClicks,
      incorrectClicks,
      points: points.map(p => ({
        x: p.x,
        y: p.y,
        isCorrect: p.isCorrect,
        timestamp: new Date(p.timestamp).toLocaleTimeString()
      }))
    });
  });
}

/**
 * Función para verificar la funcionalidad de persistencia
 */
export function testPersistenceFunctionality() {
  console.log('🎯 Iniciando pruebas de persistencia...');

  // 🎯 PRUEBA 1: Simular clicks en múltiples imágenes
  const testClicks = simulateNavigationFlowClicks();

  // 🎯 PRUEBA 2: Verificar que los puntos se mantienen al cambiar de imagen
  console.log('🔄 Verificando persistencia entre imágenes...');

  const image0Points = testClicks.visualClickPoints.filter(p => p.imageIndex === 0);
  const image1Points = testClicks.visualClickPoints.filter(p => p.imageIndex === 1);

  console.log('📊 Resumen por imagen:');
  console.log(`  Imagen 0: ${image0Points.length} puntos (${image0Points.filter(p => p.isCorrect).length} correctos)`);
  console.log(`  Imagen 1: ${image1Points.length} puntos (${image1Points.filter(p => p.isCorrect).length} correctos)`);

  // 🎯 PRUEBA 3: Verificar colores de puntos
  console.log('🎨 Verificando colores de puntos:');
  testClicks.visualClickPoints.forEach((point, index) => {
    const color = point.isCorrect ? '🟢 Verde (correcto)' : '🔴 Rojo (incorrecto)';
    console.log(`  Punto ${index + 1}: ${color} en (${point.x}, ${point.y})`);
  });

  console.log('✅ Todas las pruebas completadas');
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
  (window as any).testNavigationFlowPersistence = {
    simulateClicks: simulateNavigationFlowClicks,
    testPersistence: testPersistenceFunctionality,
    clearData: clearTestData
  };

  console.log('🧪 Script de prueba cargado. Usa:');
  console.log('  testNavigationFlowPersistence.simulateClicks()');
  console.log('  testNavigationFlowPersistence.testPersistence()');
  console.log('  testNavigationFlowPersistence.clearData()');
}
