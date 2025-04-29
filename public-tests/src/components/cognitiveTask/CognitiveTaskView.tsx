import React, { useState, useCallback } from 'react';
import { 
    CognitiveTaskFormData, 
    Question as CognitiveQuestion // Renombrar si es necesario
} from '../../../../shared/interfaces/cognitive-task.interface';
import { TASKS, getTaskProgress } from './tasks';
import ThankYouView from './ThankYouView';

// Interfaz para la configuración específica recibida como prop
interface CognitiveTaskConfig {
  id: string;
  sk: string;
  taskType: string;
  title?: string;
  instructions?: string;
  durationSeconds?: number;
  // Otros parámetros específicos de la tarea...
}

// Interfaz para las props esperadas (AHORA recibe stepConfig)
interface CognitiveTaskViewProps {
  researchId: string;
  stepId: string; // ID del paso general
  title?: string; // Título del paso general
  instructions?: string; // Instrucciones del paso general
  stepConfig: CognitiveTaskFormData; // Config específica parseada (contiene questions)
  onComplete: () => void;
  onError: (error: string) => void;
}

// Componente base para tareas cognitivas
const CognitiveTaskView: React.FC<CognitiveTaskViewProps> = ({ researchId, stepId, title, instructions, stepConfig, onComplete, onError }) => {

  // *** Añadir Console Log aquí para ver la configuración recibida ***
  console.log('[CognitiveTaskView] Received Props:', { researchId, stepId, title, instructions, stepConfig });

  // Estados para manejar la lógica INTERNA de las subtareas cognitivas (esto se mantiene)
  // const [isStarted, setIsStarted] = useState(true); // ¿Quizás se controla con la config?
  const [currentTask, setCurrentTask] = useState(0); // Índice de la subtarea interna
  const [showThankYou, setShowThankYou] = useState(false); // Estado interno

  const handleTaskComplete = () => {
    const nextTask = currentTask + 1;
    if (nextTask < TASKS.length) {
      setCurrentTask(nextTask);
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
  
  if (currentTask >= TASKS.length) {
    onError("Error interno: Índice de tarea cognitiva fuera de rango.");
    return <div>Error interno en Tarea Cognitiva.</div>;
  }
  const progress = getTaskProgress(currentTask);
  const CurrentTaskComponent = TASKS[currentTask].component;
  const currentTaskProps = TASKS[currentTask].props || {};
  const shouldShowProgress = currentTask > 0;

  // Validar que stepConfig y questions existen
  if (!stepConfig || !Array.isArray(stepConfig.questions)) {
     onError("Error interno: Configuración inválida o faltan preguntas para CognitiveTask.");
     return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error configuración.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      {shouldShowProgress && (
        <div className="w-full fixed top-0 left-0 right-0">
          <div className="h-1 bg-neutral-200">
            <div 
              className="h-1 bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between px-4 py-1 text-xs text-neutral-500">
            <span>Tarea {currentTask} de {TASKS.length - 1}</span>
            <span>Progreso: {progress}%</span>
          </div>
        </div>
      )}
    
      <CurrentTaskComponent 
        onContinue={handleTaskComplete}
        config={stepConfig}
        {...currentTaskProps}
      />
    </div>
  );
};

export default CognitiveTaskView; 