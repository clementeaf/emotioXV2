import { useEffect } from 'react';
import { useFormDataStore } from '../stores/useFormDataStore';
import { useStepStore } from '../stores/useStepStore';

export const useDebugSteps = () => {
  const { backendResponses, currentQuestionKey, steps, hasBackendResponse, getStepState } = useStepStore();
  const { formData } = useFormDataStore();

  useEffect(() => {
    console.log('🔍 DEBUG STEPS STATE:');
    console.log('📊 Backend Responses:', backendResponses);
    console.log('🎯 Current Question Key:', currentQuestionKey);
    console.log('📋 Steps:', steps);
    console.log('📝 Form Data:', formData);

    // Verificar localStorage
    try {
      const localData = localStorage.getItem('form-data-storage');
      if (localData) {
        const parsedData = JSON.parse(localData);
        console.log('📦 Local Storage Data:', parsedData);
      }
    } catch (error) {
      console.error('❌ Error reading localStorage:', error);
    }

    // Verificar cada step
    if (steps) {
      console.log('🔍 Step States:');
      steps.forEach((step, index) => {
        const hasResponse = hasBackendResponse(step.questionKey);
        const stepState = getStepState(index);
        console.log(`  ${step.questionKey}:`, {
          hasResponse,
          stepState: stepState.state,
          canAccess: stepState.canAccess,
          isCurrentStep: stepState.isCurrentStep
        });
      });
    }
  }, [backendResponses, currentQuestionKey, steps, formData, hasBackendResponse, getStepState]);
};
