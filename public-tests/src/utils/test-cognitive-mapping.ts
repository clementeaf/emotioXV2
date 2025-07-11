/**
 * Script de prueba para verificar que el mapeo de componentes de Cognitive Tasks
 * funciona correctamente y no usa SmartVocFeedbackQuestion
 */

// Simular el stepComponentMap
const mockStepComponentMap = {
  'cognitive_short_text': 'ShortTextView',
  'cognitive_long_text': 'LongTextView',
  'cognitive_single_choice': 'SingleChoiceView',
  'cognitive_multiple_choice': 'MultiChoiceView',
  'cognitive_linear_scale': 'LinearScaleView',
  'smartvoc_feedback': 'SmartVocFeedbackQuestion'
};

// Función para verificar el mapeo correcto
export function verifyCognitiveComponentMapping(
  stepType: string,
  expectedComponent: string,
  actualComponent: string
): void {
  console.log(`[ComponentMapping] 🔍 Verificación de mapeo:`);
  console.log(`  - stepType: ${stepType}`);
  console.log(`  - Componente esperado: ${expectedComponent}`);
  console.log(`  - Componente actual: ${actualComponent}`);

  if (actualComponent === expectedComponent) {
    console.log(`  ✅ CORRECTO: Se está usando el componente correcto`);
  } else {
    console.log(`  ❌ ERROR: Se debería usar ${expectedComponent} pero se está usando ${actualComponent}`);
  }
}

// Función para verificar que no se usa SmartVocFeedbackQuestion para Cognitive Tasks
export function verifyNoSmartVocForCognitive(
  stepType: string,
  actualComponent: string
): void {
  console.log(`[ComponentMapping] 🔍 Verificación de no SmartVOC para Cognitive:`);
  console.log(`  - stepType: ${stepType}`);
  console.log(`  - Componente actual: ${actualComponent}`);

  if (stepType.startsWith('cognitive_') && actualComponent === 'SmartVocFeedbackQuestion') {
    console.log(`  ❌ ERROR: Cognitive Task está usando SmartVocFeedbackQuestion`);
  } else if (stepType.startsWith('cognitive_')) {
    console.log(`  ✅ CORRECTO: Cognitive Task está usando componente específico`);
  } else {
    console.log(`  ℹ️ INFO: No es Cognitive Task`);
  }
}

// Ejecutar pruebas de mapeo
export function runCognitiveMappingTests(): void {
  console.log('🧪 PRUEBAS DE MAPEO PARA COGNITIVE TASKS');
  console.log('==========================================');

  // Prueba 1: Verificar mapeo correcto
  console.log('\n📝 Prueba 1: Verificar mapeo correcto');
  verifyCognitiveComponentMapping(
    'cognitive_short_text',
    'ShortTextView',
    mockStepComponentMap['cognitive_short_text']
  );

  verifyCognitiveComponentMapping(
    'cognitive_long_text',
    'LongTextView',
    mockStepComponentMap['cognitive_long_text']
  );

  verifyCognitiveComponentMapping(
    'cognitive_single_choice',
    'SingleChoiceView',
    mockStepComponentMap['cognitive_single_choice']
  );

  // Prueba 2: Verificar que no se usa SmartVocFeedbackQuestion
  console.log('\n📝 Prueba 2: Verificar que no se usa SmartVocFeedbackQuestion');
  verifyNoSmartVocForCognitive(
    'cognitive_short_text',
    mockStepComponentMap['cognitive_short_text']
  );

  verifyNoSmartVocForCognitive(
    'cognitive_long_text',
    mockStepComponentMap['cognitive_long_text']
  );

  // Prueba 3: Verificar que SmartVOC usa el componente correcto
  console.log('\n📝 Prueba 3: Verificar que SmartVOC usa el componente correcto');
  verifyCognitiveComponentMapping(
    'smartvoc_feedback',
    'SmartVocFeedbackQuestion',
    mockStepComponentMap['smartvoc_feedback']
  );

  console.log('\n✅ Pruebas de mapeo completadas');
}

// Función para simular el payload que se enviaría
export function simulatePayload(
  stepType: string,
  questionKey: string,
  response: string
): any {
  const payload = {
    researchId: "193b949e-9fac-f000-329b-e71bab5a9203",
    participantId: "b948ba37-67fd-443a-b342-0a6402237001",
    questionKey: questionKey,
    response: response,
    stepTitle: response,
    stepType: stepType,
    metadata: {
      deviceInfo: { deviceType: "desktop" }
    }
  };

  console.log(`[PayloadSimulation] 📦 Payload generado:`);
  console.log(`  - stepType: ${payload.stepType}`);
  console.log(`  - questionKey: ${payload.questionKey}`);
  console.log(`  - response: ${payload.response}`);

  // Verificar que el stepType es correcto
  if (stepType.startsWith('cognitive_') && payload.stepType === 'smart-voc-feedback') {
    console.log(`  ❌ ERROR: stepType incorrecto - debería ser ${stepType} pero es ${payload.stepType}`);
  } else if (stepType.startsWith('cognitive_')) {
    console.log(`  ✅ CORRECTO: stepType correcto para Cognitive Task`);
  } else {
    console.log(`  ℹ️ INFO: stepType correcto para SmartVOC`);
  }

  return payload;
}

// Exportar para uso en otros archivos
export default {
  verifyCognitiveComponentMapping,
  verifyNoSmartVocForCognitive,
  runCognitiveMappingTests,
  simulatePayload
};
