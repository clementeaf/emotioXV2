import React, { useState } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery, useSaveModuleResponseMutation, useUpdateModuleResponseMutation } from '../../hooks/useApiQueries';
import { CreateModuleResponseDto, UpdateModuleResponseDto } from '../../lib/types';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { ButtonStepsProps } from './types';

export const ButtonSteps: React.FC<ButtonStepsProps> = ({
  currentQuestionKey,
  formData,
  isWelcomeScreen
}) => {
  const { researchId, participantId } = useTestStore();
  const { setCurrentQuestionKey, goToNextStep } = useStepStore();
  const { clearFormData } = useFormDataStore();
  const { getNextStep } = useStepStore();
  const nextStep = getNextStep();
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // Obtener los steps del backend
  const { data: formsData } = useAvailableFormsQuery(researchId || '');

  // Construir los steps usando el orden del backend
  const steps = React.useMemo(() => {
    if (formsData?.steps && formsData.stepsConfiguration && formsData.stepsConfiguration.length > 0) {
      const configMap = new Map();

      formsData.stepsConfiguration.forEach((stepConfig: any) => {
        configMap.set(stepConfig.questionKey, stepConfig);
      });

      // Usar el orden que viene del backend
      return formsData.steps
        .map(questionKey => {
          const stepConfig = configMap.get(questionKey);
          if (!stepConfig) {
            console.warn('[ButtonSteps] ⚠️ Step no encontrado en configuración:', questionKey);
            return null;
          }

          let title = '';
          switch (questionKey) {
            case 'demographics':
              title = 'Preguntas demográficas';
              break;
            case 'welcome_screen':
              title = 'Bienvenido';
              break;
            case 'thank_you_screen':
              title = 'Gracias por participar';
              break;
            case 'smartvoc_csat':
              title = 'Pregunta CSAT';
              break;
            case 'cognitive_navigation_flow':
              title = 'Navegación Cognitiva';
              break;
            default:
              title = String(stepConfig.contentConfiguration?.title || questionKey);
          }

          return {
            title: title,
            questionKey: stepConfig.questionKey
          };
        })
        .filter(step => step !== null);
    }
    return [];
  }, [formsData?.steps, formsData?.stepsConfiguration]);

  // Obtener el estado de los steps para navegación
  const { getNextStep: getStoreNextStep } = useStepStore();
  const storeNextStep = getStoreNextStep();

  // Log para depuración
  console.log('[ButtonSteps] Estado actual:', {
    currentQuestionKey,
    nextStep,
    formData,
    isWelcomeScreen
  });

  const saveMutation = useSaveModuleResponseMutation({
    onSuccess: (data) => {
      // 🚨 ACTUALIZAR EL STORE INMEDIATAMENTE PARA AVANZAR EL STEP
      const store = useStepStore.getState();
      store.updateBackendResponses([
        ...store.backendResponses,
        { questionKey: currentQuestionKey, response: formData || {} }
      ]);
      setIsSaving(false);
      setTimeout(() => {
        goToNextStep();
      }, 100);
    },
    onError: () => {
      setIsSaving(false);
      // Manejo de error
    }
  });

  const updateMutation = useUpdateModuleResponseMutation({
    onSuccess: () => {
      setIsSaving(false);
      setIsNavigating(true);

      // Navegar automáticamente al siguiente step después de actualizar
      setTimeout(() => {
        console.log('[ButtonSteps] Navegando después de actualizar, nextStep:', nextStep);
        goToNextStep(); // Usar el método del store
        setIsNavigating(false);
      }, 1000);
    },
    onError: (error) => {
      console.error('Error al actualizar:', error);
      setIsSaving(false);
    }
  });

  const existingResponse = moduleResponses?.responses?.find(
    response => response.questionKey === currentQuestionKey
  );

  // Obtener el ID del documento principal para actualizaciones
  const documentId = moduleResponses?.id;

  const getButtonText = (): string => {
    if (isWelcomeScreen) {
      return 'Comenzar';
    }

    if (isSaving) {
      return 'Guardando...';
    }

    if (isNavigating) {
      return 'Pasando a la siguiente pregunta';
    }

    if (existingResponse) {
      return 'Actualizar y continuar';
    } else {
      return 'Guardar y continuar';
    }
  };

  const isDisabled = isSaving || isNavigating;

  const handleClick = async () => {
    if (isWelcomeScreen) {
      setIsNavigating(true);
      setTimeout(() => {
        if (nextStep) {
          setCurrentQuestionKey(nextStep);
        }
        setIsNavigating(false);
      }, 1000);
      return;
    }

    setIsSaving(true);

    try {
      const timestamp = new Date().toISOString();
      const now = new Date().toISOString();

      if (existingResponse) {
        // UPDATE: Actualizar la respuesta existente
        const updateData: UpdateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formData || {},
            timestamp,
            createdAt: existingResponse.createdAt || now,
            updatedAt: now
          }],
          metadata: {}
        };

        await updateMutation.mutateAsync({
          responseId: documentId || '',
          data: updateData
        });
      } else {
        // CREATE: Crear nueva respuesta
        const createData: CreateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formData || {},
            timestamp,
            createdAt: now,
            updatedAt: undefined
          }],
          metadata: {}
        };

        await saveMutation.mutateAsync(createData);
      }
    } catch (error) {
      console.error('Error en la operación:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          px-6 py-3 rounded-lg font-semibold transition-all duration-200
          ${isDisabled
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
          }
          ${isSaving || isNavigating ? 'animate-pulse' : ''}
        `}
      >
        {getButtonText()}
      </button>
    </div>
  );
};
