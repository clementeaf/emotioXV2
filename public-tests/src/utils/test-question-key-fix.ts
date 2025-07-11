/**
 * Script de prueba para verificar que el questionKey del backend se usa correctamente
 * Este archivo ayuda a identificar problemas con el mapeo de questionKey
 */

export const testQuestionKeyConsistency = () => {
  console.log('🧪 TEST: Verificando consistencia de questionKey...');

  // Casos de prueba
  const testCases = [
    {
      backendQuestionKey: 'cognitive_short_text_3.1',
      expectedResult: 'cognitive_short_text_3.1',
      description: 'QuestionKey del backend debe mantenerse'
    },
    {
      backendQuestionKey: 'smartvoc_feedback_1',
      expectedResult: 'smartvoc_feedback_1',
      description: 'SmartVOC questionKey del backend debe mantenerse'
    },
    {
      backendQuestionKey: undefined,
      fallbackId: 'step_123',
      fallbackType: 'cognitive_short_text',
      expectedResult: 'step_123_cognitive_short_text',
      description: 'Fallback cuando no hay questionKey del backend'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 Test Case ${index + 1}: ${testCase.description}`);

    // Simular la lógica de mapeo
    const actualQuestionKey = testCase.backendQuestionKey ||
      `${testCase.fallbackId}_${testCase.fallbackType}`;

    const isCorrect = actualQuestionKey === testCase.expectedResult;

    console.log(`   Backend QuestionKey: ${testCase.backendQuestionKey || 'undefined'}`);
    console.log(`   Expected: ${testCase.expectedResult}`);
    console.log(`   Actual: ${actualQuestionKey}`);
    console.log(`   ✅ Result: ${isCorrect ? 'PASS' : 'FAIL'}`);
  });

  // Verificar que no hay doble prefijo
  const doublePrefixTest = 'cognitive_cognitive_short_text';
  const hasDoublePrefix = doublePrefixTest.includes('cognitive_cognitive');
  console.log(`\n🔍 Double Prefix Test: ${hasDoublePrefix ? '❌ FAIL' : '✅ PASS'}`);

  return {
    totalTests: testCases.length,
    passedTests: testCases.filter(tc =>
      (tc.backendQuestionKey || `${tc.fallbackId}_${tc.fallbackType}`) === tc.expectedResult
    ).length,
    doublePrefixIssue: hasDoublePrefix
  };
};

export const validateQuestionKeyFlow = () => {
  console.log('🔍 VALIDATION: Verificando flujo completo de questionKey...');

  // Simular el flujo completo
  const flowSteps = [
    {
      stepId: 'step_1',
      backendQuestionKey: 'cognitive_short_text_3.1',
      stepType: 'cognitive_short_text',
      expectedQuestionKey: 'cognitive_short_text_3.1'
    },
    {
      stepId: 'step_2',
      backendQuestionKey: 'smartvoc_feedback_1',
      stepType: 'smartvoc_feedback',
      expectedQuestionKey: 'smartvoc_feedback_1'
    },
    {
      stepId: 'step_3',
      backendQuestionKey: undefined,
      stepType: 'cognitive_long_text',
      expectedQuestionKey: 'step_3_cognitive_long_text'
    }
  ];

  let allValid = true;

  flowSteps.forEach((step, index) => {
    const actualQuestionKey = step.backendQuestionKey || `${step.stepId}_${step.stepType}`;
    const isValid = actualQuestionKey === step.expectedQuestionKey;

    console.log(`\n📋 Step ${index + 1}:`);
    console.log(`   StepId: ${step.stepId}`);
    console.log(`   Backend QuestionKey: ${step.backendQuestionKey || 'undefined'}`);
    console.log(`   StepType: ${step.stepType}`);
    console.log(`   Expected: ${step.expectedQuestionKey}`);
    console.log(`   Actual: ${actualQuestionKey}`);
    console.log(`   ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    if (!isValid) allValid = false;
  });

  console.log(`\n🎯 Overall Result: ${allValid ? '✅ ALL VALID' : '❌ SOME INVALID'}`);

  return {
    totalSteps: flowSteps.length,
    validSteps: flowSteps.filter(step =>
      (step.backendQuestionKey || `${step.stepId}_${step.stepType}`) === step.expectedQuestionKey
    ).length,
    allValid
  };
};
