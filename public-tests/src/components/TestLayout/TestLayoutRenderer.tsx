import React from 'react';
import { useModuleResponse } from '../../hooks/useModuleResponse';
import { useStepStore } from '../../stores/useStepStore';
import { ErrorState, LoadingState, NoStepData, NoStepSelected } from './CommonStates';
import { DemographicForm } from './DemographicForm';
import { QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestion, Question, ScreenStep, TestLayoutRendererProps } from './types';
import { findStepByQuestionKey, getStepType } from './utils';

const TestLayoutRenderer: React.FC<TestLayoutRendererProps> = ({ data, isLoading, error }) => {

  const currentStepKey = useStepStore(state => state.currentStepKey);
  const { sendResponse, getResponse, updateResponse, deleteAllResponses, researchId, participantId } = useModuleResponse();
  const hasPreviousResponse = false;

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState />;
  }

  const currentStepData = findStepByQuestionKey(data, currentStepKey);

  if (!currentStepKey) {
    return <NoStepSelected />;
  }
  if (!currentStepData) {
    return <NoStepData />;
  }

  const stepType = getStepType(currentStepData);
  let renderedForm: React.ReactNode = null;

  // Función para manejar el envío de respuestas
  const handleSubmitResponse = async (response: unknown) => {
    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para guardar respuesta');
      return;
    }

    // 1. ENVIAR RESPUESTA
    const sentResponse = await sendResponse(currentStepKey, response);

    if (sentResponse) {
      console.log('[TestLayoutRenderer] ✅ Respuesta enviada exitosamente:', sentResponse);

      // 2. RECIBIR DE VUELTA LO ENVIADO (opcional, para verificar)
      const receivedResponse = await getResponse(currentStepKey);
      if (receivedResponse) {
        console.log('[TestLayoutRenderer] ✅ Respuesta recibida de vuelta:', receivedResponse);
      }
    } else {
      console.error('[TestLayoutRenderer] ❌ Error enviando respuesta');
    }
  };

  // Función para actualizar respuesta existente
  const handleUpdateResponse = async (newResponse: unknown) => {
    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para actualizar respuesta');
      return;
    }

    // 3. ACTUALIZAR RESPUESTA
    const updatedResponse = await updateResponse(currentStepKey, newResponse);

    if (updatedResponse) {
      console.log('[TestLayoutRenderer] ✅ Respuesta actualizada exitosamente:', updatedResponse);
    } else {
      console.error('[TestLayoutRenderer] ❌ Error actualizando respuesta');
    }
  };

  // Función para eliminar todas las respuestas
  const handleDeleteAllResponses = async () => {
    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para eliminar respuestas');
      return;
    }

    // 4. ELIMINAR TODAS LAS RESPUESTAS
    const deleted = await deleteAllResponses();

    if (deleted) {
      console.log('[TestLayoutRenderer] ✅ Todas las respuestas eliminadas exitosamente');
    } else {
      console.error('[TestLayoutRenderer] ❌ Error eliminando respuestas');
    }
  };

  switch (stepType) {
    case 'demographics': {
      const { demographicQuestions } = currentStepData as { demographicQuestions: DemographicQuestion[] };
      renderedForm = <DemographicForm questions={demographicQuestions} />;
      break;
    }
    case 'screen': {
      renderedForm = <ScreenComponent data={currentStepData as ScreenStep} />;
      break;
    }
    case 'question': {
      renderedForm = <QuestionComponent question={currentStepData as Question} currentStepKey={currentStepKey} />;
      break;
    }
    default:
      renderedForm = <UnknownStepComponent data={currentStepData} />;
  }

  const showGlobalButton = stepType !== 'screen';

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      {renderedForm}
      {showGlobalButton && (
        <button
          type="button"
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition w-full max-w-lg"
          onClick={() => {
            // Aquí puedes disparar el submit del formulario activo
            // Por ahora, enviamos un objeto vacío como respuesta de ejemplo
            handleSubmitResponse({ submitted: true, timestamp: new Date().toISOString() });
          }}
        >
          {hasPreviousResponse ? 'Actualizar y continuar' : 'Guardar y continuar'}
        </button>
      )}
    </div>
  );
};

export default TestLayoutRenderer;
