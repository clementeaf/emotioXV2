import React, { useMemo, useState } from 'react';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import {
  CognitiveQuestion,
  CognitiveTaskViewProps,
  TaskDefinition
} from '../../types';
import CognitiveQuestionRenderer from './CognitiveQuestionRenderer';
import TaskProgressBar from './common/TaskProgressBar';
import { ShortTextView } from './questions/ShortTextView';
import { buildTasksFromConfig } from './tasks';
import ThankYouView from './ThankYouView';

const CognitiveTaskView: React.FC<CognitiveTaskViewProps> = ({ researchId, participantId, stepConfig, onComplete, onError, questionKey }) => { // NUEVO: Agregar questionKey
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
  console.log('[CognitiveTaskView] questionKey recibido:', questionKey); // NUEVO: Log questionKey
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
    console.log('🔍 [DIAGNÓSTICO] handleTaskComplete llamado con:', {
      responseData,
      subTaskDefinition,
      currentTaskIndex,
      totalRealTasks,
      apiError
    });

    if (apiError) setApiError(null);
    if (responseData && subTaskDefinition && subTaskDefinition.id) {
      const existingResponseId = questionConfig?.moduleResponseId;
      // NUEVO: Usar questionKey del backend como identificador principal
      const subTaskId = questionKey || subTaskDefinition.id;
      const subTaskType = subTaskDefinition.questionType || subTaskDefinition.id;
      const subTaskName = questionConfig?.title || subTaskDefinition.title;

      console.log(`🔍 [DIAGNÓSTICO] Guardando respuesta para pregunta ${subTaskId}:`, {
        responseData,
        subTaskType,
        subTaskName,
        existingResponseId,
        questionKey // NUEVO: Log questionKey
      });

      const result = await saveOrUpdateResponse(
        subTaskId,
        subTaskType,
        responseData,
        existingResponseId
      );

      console.log('🔍 [DIAGNÓSTICO] Resultado de saveOrUpdateResponse:', result);

      if (result && !apiError) {
        console.log(`✅ [DIAGNÓSTICO] Respuesta para subtarea ${subTaskId} enviada/actualizada correctamente:`, result);
      } else if (!result && !apiError) {
        console.error('❌ [DIAGNÓSTICO] Error: saveOrUpdateResponse falló');
        setApiError("Ocurrió un error desconocido al guardar la respuesta de la tarea.");
        onError("Ocurrió un error desconocido al guardar la respuesta de la tarea.");
        return;
      }
      if (apiError) {
        console.error('❌ [DIAGNÓSTICO] Error de API:', apiError);
        onError(apiError);
        return;
      }
    } else {
      console.warn('⚠️ [DIAGNÓSTICO] handleTaskComplete llamado sin datos válidos:', {
        hasResponseData: !!responseData,
        hasSubTaskDefinition: !!subTaskDefinition,
        hasSubTaskId: !!(subTaskDefinition?.id)
      });
    }

    const nextTaskIndex = currentTaskIndex + 1;
    console.log('🔍 [DIAGNÓSTICO] Avanzando de step:', {
      currentTaskIndex,
      nextTaskIndex,
      totalRealTasks,
      willShowThankYou: nextTaskIndex >= totalRealTasks
    });

    if (nextTaskIndex < totalRealTasks) {
      setCurrentTaskIndex(nextTaskIndex);
      console.log('✅ [DIAGNÓSTICO] Step avanzado a:', nextTaskIndex);
    } else {
      setShowThankYou(true);
      console.log('✅ [DIAGNÓSTICO] Mostrando pantalla de agradecimiento');
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

  console.log('🔍 [DIAGNÓSTICO] Componente a crear:', {
    componentName: CurrentTaskComponent?.name || 'Unknown',
    componentType: typeof CurrentTaskComponent,
    isShortTextView: CurrentTaskComponent === ShortTextView,
    isCognitiveQuestionRenderer: CurrentTaskComponent === CognitiveQuestionRenderer,
    currentTaskDefinition: {
      id: currentTaskDefinition.id,
      questionType: currentTaskDefinition.questionType,
      component: CurrentTaskComponent?.name
    }
  });

  // VERIFICAR SI EL COMPONENTE SE ESTÁ CREANDO REALMENTE
  console.log('🔍 [DIAGNÓSTICO] ¿Se está creando el componente dinámicamente?', {
    willCreateComponent: !!CurrentTaskComponent,
    componentExists: typeof CurrentTaskComponent === 'function',
    isReactComponent: CurrentTaskComponent && typeof CurrentTaskComponent === 'function'
  });

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

  console.log('🔍 [DIAGNÓSTICO CognitiveTaskView] defaultQuestionConfig:', {
    id: defaultQuestionConfig.id,
    type: defaultQuestionConfig.type,
    questionType: currentTaskDefinition.questionType,
    currentTaskDefinitionId: currentTaskDefinition.id
  });

  // Combinar configuración del frontend con props por defecto de la tarea
  // Construir key combinada tipo+id para todas las preguntas
  const combinedQuestionKey = defaultQuestionConfig.id && defaultQuestionConfig.type ? `${defaultQuestionConfig.id}_${defaultQuestionConfig.type}` : '';

  console.log('🔍 [DIAGNÓSTICO CognitiveTaskView] Construyendo combinedQuestionKey:', {
    id: defaultQuestionConfig.id,
    type: defaultQuestionConfig.type,
    combinedQuestionKey,
    hasId: !!defaultQuestionConfig.id,
    hasType: !!defaultQuestionConfig.type
  });

  const taskProps = {
    ...currentTaskDefinition.props,
    config: defaultQuestionConfig,
    question: defaultQuestionConfig,
    stepConfig: stepConfig,
    questionId: currentTaskDefinition.id,
    questionType: currentTaskDefinition.questionType,
    questionKey: combinedQuestionKey // Usar key combinada siempre
  };

  console.log('[CognitiveTaskView] Props que se pasan al componente:', {
    ...taskProps,
    onContinue: 'function',
    onStepComplete: 'function',
    isSubmitting: isSubmittingTask,
    config: defaultQuestionConfig,
    stepConfig: defaultQuestionConfig,
    questionKey: combinedQuestionKey
  });

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
        onStepComplete: (responseData?: unknown) => handleTaskComplete(responseData, currentTaskDefinition), // Compatibilidad para ambos nombres
        isSubmitting: isSubmittingTask,
        config: defaultQuestionConfig, // Compatibilidad legacy
        stepConfig: defaultQuestionConfig, // Compatibilidad nueva
        questionKey: combinedQuestionKey // Usar key combinada siempre
      })}
    </div>
  );
};

export default CognitiveTaskView;
