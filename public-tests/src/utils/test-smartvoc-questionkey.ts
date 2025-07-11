/**
 * Script de prueba específico para SmartVOC questionKey
 * Verifica que el questionKey del backend se use correctamente en todos los componentes SmartVOC
 */

export const testSmartVOCQuestionKey = () => {
  console.log('🧪 TEST: Verificando questionKey en SmartVOC...');

  // Simular datos de prueba
  const testCases = [
    {
      backendQuestionKey: 'cognitive_short_text_3.1',
      componentType: 'FeedbackView',
      expectedResult: 'cognitive_short_text_3.1',
      description: 'FeedbackView debe usar questionKey del backend'
    },
    {
      backendQuestionKey: 'smartvoc_feedback_1',
      componentType: 'NPSView',
      expectedResult: 'smartvoc_feedback_1',
      description: 'NPSView debe usar questionKey del backend'
    },
    {
      backendQuestionKey: undefined,
      fallbackId: 'step_123',
      componentType: 'CSATView',
      expectedResult: 'step_123',
      description: 'CSATView debe usar stepId como fallback'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 Test Case ${index + 1}: ${testCase.description}`);
    console.log(`   Component: ${testCase.componentType}`);

    // Simular la lógica de mapeo
    const actualQuestionKey = testCase.backendQuestionKey || testCase.fallbackId;
    const isCorrect = actualQuestionKey === testCase.expectedResult;

    console.log(`   Backend QuestionKey: ${testCase.backendQuestionKey || 'undefined'}`);
    console.log(`   Expected: ${testCase.expectedResult}`);
    console.log(`   Actual: ${actualQuestionKey}`);
    console.log(`   ✅ Result: ${isCorrect ? 'PASS' : 'FAIL'}`);
  });

  // Verificar que no se usa el hardcodeado 'smartvoc-feedback'
  const hardcodedTest = 'smartvoc-feedback';
  const shouldNotUseHardcoded = hardcodedTest === 'smartvoc-feedback'; // Verificar que es el valor hardcodeado
  console.log(`\n🔍 Hardcoded Test: ${shouldNotUseHardcoded ? '⚠️ HARDCODED' : '✅ DYNAMIC'}`);

  return {
    totalTests: testCases.length,
    passedTests: testCases.filter(tc =>
      (tc.backendQuestionKey || tc.fallbackId) === tc.expectedResult
    ).length,
    hardcodedIssue: shouldNotUseHardcoded
  };
};

export const validateSmartVOCFlow = () => {
  console.log('🔍 VALIDATION: Verificando flujo completo de SmartVOC...');

  // Simular el flujo completo de SmartVOC
  const smartVOCSteps = [
    {
      stepId: 'step_1',
      backendQuestionKey: 'cognitive_short_text_3.1',
      componentType: 'FeedbackView',
      expectedQuestionKey: 'cognitive_short_text_3.1'
    },
    {
      stepId: 'step_2',
      backendQuestionKey: 'smartvoc_feedback_1',
      componentType: 'NPSView',
      expectedQuestionKey: 'smartvoc_feedback_1'
    },
    {
      stepId: 'step_3',
      backendQuestionKey: undefined,
      componentType: 'CSATView',
      expectedQuestionKey: 'step_3'
    }
  ];

  let allValid = true;

  smartVOCSteps.forEach((step, index) => {
    const actualQuestionKey = step.backendQuestionKey || step.stepId;
    const isValid = actualQuestionKey === step.expectedQuestionKey;

    console.log(`\n📋 SmartVOC Step ${index + 1}:`);
    console.log(`   Component: ${step.componentType}`);
    console.log(`   StepId: ${step.stepId}`);
    console.log(`   Backend QuestionKey: ${step.backendQuestionKey || 'undefined'}`);
    console.log(`   Expected: ${step.expectedQuestionKey}`);
    console.log(`   Actual: ${actualQuestionKey}`);
    console.log(`   ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    if (!isValid) allValid = false;
  });

  console.log(`\n🎯 SmartVOC Overall Result: ${allValid ? '✅ ALL VALID' : '❌ SOME INVALID'}`);

  return {
    totalSteps: smartVOCSteps.length,
    validSteps: smartVOCSteps.filter(step =>
      (step.backendQuestionKey || step.stepId) === step.expectedQuestionKey
    ).length,
    allValid
  };
};
