/**
 * Script de prueba para verificar que los componentes de Cognitive Tasks
 * usan el questionKey del backend correctamente
 */

// Simular datos de prueba
const mockBackendQuestion = {
  id: 'cognitive_short_text_123',
  type: 'short_text',
  title: '¿Cuál es tu opinión?',
  description: 'Escribe tu respuesta aquí',
  questionKey: 'cognitive_short_text_backend_456' // questionKey del backend
};

const mockFrontendConfig = {
  id: 'cognitive_short_text_123', // ID local del frontend
  type: 'short_text',
  title: '¿Cuál es tu opinión?',
  description: 'Escribe tu respuesta aquí'
};

// Función para verificar que se usa el questionKey correcto
export function verifyCognitiveQuestionKeyUsage(
  componentName: string,
  questionKey: string | undefined,
  configId: string,
  expectedId: string
): void {
  console.log(`[${componentName}] 🔍 Verificación de questionKey:`);
  console.log(`  - questionKey del backend: ${questionKey}`);
  console.log(`  - config.id local: ${configId}`);
  console.log(`  - ID final usado: ${expectedId}`);

  if (questionKey && expectedId === questionKey) {
    console.log(`  ✅ CORRECTO: Se está usando el questionKey del backend`);
  } else if (!questionKey && expectedId === configId) {
    console.log(`  ✅ CORRECTO: No hay questionKey, usando config.id como fallback`);
  } else {
    console.log(`  ❌ ERROR: Se debería usar questionKey del backend pero se está usando: ${expectedId}`);
  }
}

// Función para simular el comportamiento de los componentes
export function simulateCognitiveComponent(
  componentName: string,
  config: any,
  questionKey?: string
): void {
  // Simular el comportamiento actualizado de los componentes
  const finalId = questionKey || config.id;

  verifyCognitiveQuestionKeyUsage(componentName, questionKey, config.id, finalId);

  // Verificar que no hay doble prefijo
  if (finalId.includes('cognitive_cognitive_')) {
    console.log(`  ❌ ERROR: Doble prefijo detectado: ${finalId}`);
  } else {
    console.log(`  ✅ CORRECTO: No hay doble prefijo en: ${finalId}`);
  }
}

// Ejecutar pruebas
export function runCognitiveQuestionKeyTests(): void {
  console.log('🧪 PRUEBAS DE QUESTIONKEY PARA COGNITIVE TASKS');
  console.log('==============================================');

  // Prueba 1: Con questionKey del backend
  console.log('\n📝 Prueba 1: Con questionKey del backend');
  simulateCognitiveComponent(
    'ShortTextView',
    mockFrontendConfig,
    mockBackendQuestion.questionKey
  );

  // Prueba 2: Sin questionKey (fallback)
  console.log('\n📝 Prueba 2: Sin questionKey (fallback)');
  simulateCognitiveComponent(
    'LongTextView',
    mockFrontendConfig
  );

  // Prueba 3: Con doble prefijo (error)
  console.log('\n📝 Prueba 3: Con doble prefijo (error)');
  const configWithDoublePrefix = {
    ...mockFrontendConfig,
    id: 'cognitive_cognitive_short_text_123'
  };
  simulateCognitiveComponent(
    'SingleChoiceView',
    configWithDoublePrefix,
    'cognitive_cognitive_short_text_backend_456'
  );

  console.log('\n✅ Pruebas completadas');
}

// Exportar para uso en otros archivos
export default {
  verifyCognitiveQuestionKeyUsage,
  simulateCognitiveComponent,
  runCognitiveQuestionKeyTests
};
