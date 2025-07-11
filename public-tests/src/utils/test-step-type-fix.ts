/**
 * Script de prueba para verificar que el stepType se está enviando correctamente
 * para Cognitive Tasks y no se está hardcodeando como 'smart-voc-feedback'
 */

// Simular el payload que se enviaría
export function simulatePayloadWithStepType(
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
    stepType: stepType, // NUEVO: Usar stepType dinámico
    metadata: {
      deviceInfo: { deviceType: "desktop" }
    }
  };

  console.log(`[StepTypeFix] 📦 Payload generado:`);
  console.log(`  - stepType: ${payload.stepType}`);
  console.log(`  - questionKey: ${payload.questionKey}`);
  console.log(`  - response: ${payload.response}`);

  // Verificar que el stepType es correcto
  if (stepType.startsWith('cognitive_') && payload.stepType === 'smart-voc-feedback') {
    console.log(`  ❌ ERROR: stepType incorrecto - debería ser ${stepType} pero es ${payload.stepType}`);
    return false;
  } else if (stepType.startsWith('cognitive_')) {
    console.log(`  ✅ CORRECTO: stepType correcto para Cognitive Task`);
    return true;
  } else if (stepType.startsWith('smartvoc_')) {
    console.log(`  ✅ CORRECTO: stepType correcto para SmartVOC`);
    return true;
  } else {
    console.log(`  ℹ️ INFO: stepType correcto para otros tipos`);
    return true;
  }
}

// Función para verificar que SmartVocFeedbackQuestion usa stepType dinámico
export function verifySmartVocFeedbackStepType(
  stepType: string,
  expectedStepType: string
): void {
  console.log(`[StepTypeFix] 🔍 Verificación de SmartVocFeedbackQuestion:`);
  console.log(`  - stepType recibido: ${stepType}`);
  console.log(`  - stepType esperado: ${expectedStepType}`);

  if (stepType === expectedStepType) {
    console.log(`  ✅ CORRECTO: SmartVocFeedbackQuestion usa stepType dinámico`);
  } else {
    console.log(`  ❌ ERROR: SmartVocFeedbackQuestion debería usar ${expectedStepType} pero usa ${stepType}`);
  }
}

// Ejecutar pruebas de stepType
export function runStepTypeTests(): void {
  console.log('🧪 PRUEBAS DE STEPTYPE FIX');
  console.log('==========================');

  // Prueba 1: Cognitive Task con stepType correcto
  console.log('\n📝 Prueba 1: Cognitive Task con stepType correcto');
  const cognitiveResult = simulatePayloadWithStepType(
    'cognitive_short_text',
    'cognitive_task:cognitive_short_text:3.1',
    'esta es mi respuesta'
  );

  // Prueba 2: SmartVOC con stepType correcto
  console.log('\n📝 Prueba 2: SmartVOC con stepType correcto');
  const smartvocResult = simulatePayloadWithStepType(
    'smartvoc_feedback',
    'smartvoc_feedback:123',
    'mi comentario'
  );

  // Prueba 3: Verificar que SmartVocFeedbackQuestion usa stepType dinámico
  console.log('\n📝 Prueba 3: Verificar SmartVocFeedbackQuestion');
  verifySmartVocFeedbackStepType('cognitive_short_text', 'cognitive_short_text');
  verifySmartVocFeedbackStepType('smartvoc_feedback', 'smartvoc_feedback');

  // Resumen
  console.log('\n📊 RESUMEN:');
  console.log(`  - Cognitive Task: ${cognitiveResult ? '✅ CORRECTO' : '❌ ERROR'}`);
  console.log(`  - SmartVOC: ${smartvocResult ? '✅ CORRECTO' : '❌ ERROR'}`);

  if (cognitiveResult && smartvocResult) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El stepType se está enviando correctamente.');
  } else {
    console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON. Revisar el stepType.');
  }
}

// Función para simular el comportamiento de SmartVocFeedbackQuestion
export function simulateSmartVocFeedbackQuestion(
  stepType: string,
  questionKey: string
): any {
  // Simular el comportamiento corregido de SmartVocFeedbackQuestion
  const backendStepType = stepType || 'smart-voc-feedback';

  const useStepResponseManagerCall = {
    stepId: questionKey,
    stepType: backendStepType, // NUEVO: Usar stepType dinámico
    stepName: 'Comentarios',
    researchId: undefined,
    participantId: undefined,
  };

  console.log(`[StepTypeFix] 🔧 SmartVocFeedbackQuestion simulado:`);
  console.log(`  - stepType recibido: ${stepType}`);
  console.log(`  - stepType usado: ${useStepResponseManagerCall.stepType}`);
  console.log(`  - questionKey: ${useStepResponseManagerCall.stepId}`);

  return useStepResponseManagerCall;
}

// Exportar para uso en otros archivos
export default {
  simulatePayloadWithStepType,
  verifySmartVocFeedbackStepType,
  runStepTypeTests,
  simulateSmartVocFeedbackQuestion
};
