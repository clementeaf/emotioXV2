import React, { useMemo, useState } from 'react';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import {
  CognitiveQuestion,
  CognitiveTaskViewProps,
  TaskDefinition
} from '../../types';
import TaskProgressBar from './common/TaskProgressBar';
import { buildTasksFromConfig } from './tasks';
import ThankYouView from './ThankYouView';

const CognitiveTaskView: React.FC<CognitiveTaskViewProps> = ({ researchId, participantId, stepConfig, onComplete, onError }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  const {
    saveOrUpdateResponse,
    isLoading: isSubmittingTask,
    error: apiError,
    setError: setApiError
  } = useResponseAPI({ researchId, participantId });

  // Log temporal para ver el contenido real de las preguntas
  console.log('[CognitiveTaskView] stepConfig.questions:', stepConfig?.questions);
  // Construir tareas dinámicamente desde la configuración
  const dynamicTasks = useMemo(() => {
    if (!stepConfig?.questions || !Array.isArray(stepConfig.questions)) {
      return [];
    }
    return buildTasksFromConfig(stepConfig.questions);
  }, [stepConfig]);

  // Obtener la configuración de la tarea actual
  const totalRealTasks = dynamicTasks.length;
  const currentTaskDefinition = currentTaskIndex < totalRealTasks ? dynamicTasks[currentTaskIndex] : null;

  // Buscar la configuración específica de la pregunta usando el ID directo
  const questionConfig = currentTaskDefinition ? stepConfig.questions.find(
    (q: CognitiveQuestion) => q.id === currentTaskDefinition.id
  ) : null;

  const handleTaskComplete = async (responseData?: unknown, subTaskDefinition?: TaskDefinition) => {
    if (apiError) setApiError(null);
    if (responseData && subTaskDefinition && subTaskDefinition.id) {
      const existingResponseId = questionConfig?.moduleResponseId;
      const subTaskId = subTaskDefinition.id;
      const subTaskType = subTaskDefinition.questionType || subTaskDefinition.id;
      const subTaskName = questionConfig?.title || subTaskDefinition.title;

      console.log(`[CognitiveTaskView] Guardando respuesta para pregunta ${subTaskId}:`, {
        responseData,
        subTaskType,
        subTaskName,
        existingResponseId
      });

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

  // Validaciones con las tareas dinámicas
  if (!stepConfig || !Array.isArray(stepConfig.questions)) {
     onError("Error interno: Configuración inválida o faltan preguntas para CognitiveTask.");
     return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error: Configuración de tarea cognitiva inválida.</div>;
  }

  if (dynamicTasks.length === 0) {
    onError("Error interno: No se pudieron generar tareas desde la configuración.");
    return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error: No hay tareas válidas configuradas.</div>;
  }

  if (currentTaskIndex >= totalRealTasks) {
    onError("Error interno: Índice de tarea cognitiva fuera de rango.");
    return <div className="p-4 text-center">Error interno en Tarea Cognitiva. Por favor, recarga.</div>;
  }

  if (!currentTaskDefinition) {
    onError("Error interno: Definición de tarea no encontrada.");
    return <div className="p-4 text-center">Error interno en Tarea Cognitiva. Por favor, recarga.</div>;
  }

  const CurrentTaskComponent = currentTaskDefinition.component;

  // Si no se encuentra la configuración específica, usar valores de la task definition
  const defaultQuestionConfig = {
    id: currentTaskDefinition.id,
    type: currentTaskDefinition.questionType || 'short_text',
    title: questionConfig?.title || currentTaskDefinition.title,
    description: questionConfig?.description || currentTaskDefinition.description,
    required: questionConfig?.required ?? false,
    showConditionally: questionConfig?.showConditionally ?? false,
    deviceFrame: questionConfig?.deviceFrame ?? false,
    choices: questionConfig?.choices || [],
    scaleConfig: questionConfig?.scaleConfig || { startValue: 1, endValue: 5 },
    files: questionConfig?.files || [],
    answerPlaceholder: questionConfig?.answerPlaceholder || currentTaskDefinition.props?.placeholder
  };

  // Combinar configuración del frontend con props por defecto de la tarea
  const taskProps = {
    ...currentTaskDefinition.props,
    config: defaultQuestionConfig,
    question: defaultQuestionConfig,
    stepConfig: stepConfig,
    questionId: currentTaskDefinition.id,
    questionType: currentTaskDefinition.questionType
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
