import React, { useState } from 'react';
import { useModuleResponsesQuery, useSaveModuleResponseMutation, useUpdateModuleResponseMutation } from '../../hooks/useApiQueries';
import { useFlowNavigationAndState } from '../../hooks/useFlowNavigationAndState';
import { CreateModuleResponseDto, UpdateModuleResponseDto } from '../../lib/types';
import { useTestStore } from '../../stores/useTestStore';
import { ButtonStepsProps } from './types';

export const ButtonSteps: React.FC<ButtonStepsProps> = ({
  currentQuestionKey,
  formData = {},
  isWelcomeScreen = false
}) => {
  const { researchId, participantId } = useTestStore();
  const { goToNextStep } = useFlowNavigationAndState();
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  const saveMutation = useSaveModuleResponseMutation({
    onSuccess: () => {
      setIsSaving(false);
      setIsNavigating(true);
      setTimeout(() => {
        setIsNavigating(false);
        goToNextStep();
      }, 1000);
    },
    onError: (error) => {
      console.error('Error al guardar:', error);
      setIsSaving(false);
    }
  });

  const updateMutation = useUpdateModuleResponseMutation({
    onSuccess: () => {
      setIsSaving(false);
      setIsNavigating(true);
      setTimeout(() => {
        setIsNavigating(false);
        goToNextStep();
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
        setIsNavigating(false);
        goToNextStep();
      }, 1000);
      return;
    }

    setIsSaving(true);

    try {
      const timestamp = new Date().toISOString();

            if (existingResponse) {
        // UPDATE: Reemplazar solo la response del questionKey específico
        // Obtener todas las responses de todos los ModuleResponse
        const allExistingResponses = moduleResponses?.responses?.flatMap(mr => mr.responses) || [];
        const updatedResponses = allExistingResponses.map(response =>
          response.questionKey === currentQuestionKey
            ? { questionKey: currentQuestionKey, response: formData, timestamp }
            : response
        );

        const updateData: UpdateModuleResponseDto = {
          questionKey: currentQuestionKey,
          responses: updatedResponses,
          metadata: {}
        };

        await updateMutation.mutateAsync({
          responseId: existingResponse.id,
          data: updateData
        });
      } else {
        // CREATE: Agregar la nueva response al array existente
        // Obtener todas las responses de todos los ModuleResponse
        const allExistingResponses = moduleResponses?.responses?.flatMap(mr => mr.responses) || [];
        const newResponses = [
          ...allExistingResponses,
          { questionKey: currentQuestionKey, response: formData, timestamp }
        ];

        const createData: CreateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: newResponses,
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
