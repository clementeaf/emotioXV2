import React, { useState } from 'react';
import { 
    CognitiveTaskFormData,
    Question as CognitiveQuestion,
} from '../../../../shared/interfaces/cognitive-task.interface';
import { TASKS, TaskDefinition } from './tasks';
import ThankYouView from './ThankYouView';
import TaskProgressBar from './common/TaskProgressBar';
import { useResponseAPI } from '../../hooks/useResponseAPI';

interface CognitiveTaskViewProps {
  researchId: string;
  participantId: string;
  stepConfig: CognitiveTaskFormData;
  onComplete: () => void;
  onError: (error: string) => void;
}

const CognitiveTaskView: React.FC<CognitiveTaskViewProps> = ({ researchId, participantId, stepConfig, onComplete, onError }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  const {
    saveOrUpdateResponse,
    isLoading: isSubmittingTask,
    error: apiError,
    setError: setApiError
  } = useResponseAPI({ researchId, participantId });

  const handleTaskComplete = async (responseData?: unknown, subTaskDefinition?: TaskDefinition) => {
    if (apiError) setApiError(null);
    if (responseData && subTaskDefinition && subTaskDefinition.id) {
      const questionConfig = stepConfig.questions.find(
        (q: CognitiveQuestion) => q.id === subTaskDefinition.id || q.key === subTaskDefinition.id
      );
      const existingResponseId = questionConfig?.moduleResponseId;
      const subTaskId = subTaskDefinition.id;
      const subTaskType = typeof subTaskDefinition.props?.stepType === 'string'
        ? subTaskDefinition.props.stepType
        : subTaskDefinition.id;
      const subTaskName = subTaskDefinition.title;
      const result = await saveOrUpdateResponse(
        subTaskId,
        subTaskType,
        subTaskName,
        responseData,
        existingResponseId
      );
      if (result && !apiError) {
        console.log(`[CognitiveTaskView] Respuesta para subtarea ${subTaskId} enviada/actualizada correctamente:`, result);
      } else if (!result && !apiError) {
        setApiError("Ocurrió un error desconocido al guardar la respuesta de la tarea.");
        onError("Ocurrió un error desconocido al guardar la respuesta de la tarea.");
        return;
      }
      if (apiError) {
        onError(apiError);
        return;
      }
    }
    const nextTaskIndex = currentTaskIndex + 1;
    const totalRealTasks = TASKS.length;
    if (nextTaskIndex < totalRealTasks) {
      setCurrentTaskIndex(nextTaskIndex);
    } else {
      setShowThankYou(true);
    }
  };
  
  const handleThankYouComplete = () => {
    onComplete();
  };
  
  if (showThankYou) {
    return (
      <ThankYouView 
        onComplete={handleThankYouComplete}
        title="¡Gracias por completar las tareas!"
        message="Su participación es muy valiosa para nuestra investigación y nos ayudará a mejorar la experiencia de futuros usuarios."
      />
    );
  }
  
  const totalRealTasks = TASKS.length;
  if (currentTaskIndex >= totalRealTasks) {
    onError("Error interno: Índice de tarea cognitiva fuera de rango.");
    return <div className="p-4 text-center">Error interno en Tarea Cognitiva. Por favor, recarga.</div>;
  }

  if (!stepConfig || !Array.isArray(stepConfig.questions)) {
     onError("Error interno: Configuración inválida o faltan preguntas para CognitiveTask.");
     return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error: Configuración de tarea cognitiva inválida.</div>;
  }

  const currentTaskDefinition = TASKS[currentTaskIndex];
  const CurrentTaskComponent = currentTaskDefinition.component;
  
  const currentTaskSpecificConfig = stepConfig.questions.find(
    (q: CognitiveQuestion) => q.id === currentTaskDefinition.id || q.key === currentTaskDefinition.id
  ) || {};

  const taskProps = { 
    ...(currentTaskDefinition.props || {}), 
    ...currentTaskSpecificConfig,
    config: stepConfig,
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white pt-10 pb-10">
      <TaskProgressBar
        currentStep={currentTaskIndex}
        totalSteps={totalRealTasks}
      />
      {apiError && (
        <div className="my-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md max-w-md text-center">
          Error: {apiError}
        </div>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {React.createElement(CurrentTaskComponent as React.ComponentType<any>, {
        ...taskProps,
        onContinue: (responseData?: unknown) => handleTaskComplete(responseData, currentTaskDefinition),
        isSubmitting: isSubmittingTask,
        config: stepConfig,
      })}
    </div>
  );
};

export default CognitiveTaskView; 