import React, { useState } from 'react';
import { 
    CognitiveTaskFormData, 
    Question as CognitiveQuestion // Renombrar si es necesario
} from '../../../../shared/interfaces/cognitive-task.interface';
import { TASKS } from './tasks';
import ThankYouView from './ThankYouView';
import TaskProgressBar from './common/TaskProgressBar';

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
  const [currentTask, setCurrentTask] = useState(0); // Índice de la subtarea interna
  const [showThankYou, setShowThankYou] = useState(false); // Estado interno

  const handleTaskComplete = () => {
    const nextTask = currentTask + 1;
    const totalRealTasks = TASKS.length;
    if (nextTask < totalRealTasks) {
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
  
  const totalRealTasks = TASKS.length;
  if (currentTask >= totalRealTasks) {
    onError("Error interno: Índice de tarea cognitiva fuera de rango.");
    return <div>Error interno en Tarea Cognitiva.</div>;
  }

  const CurrentTaskComponent = TASKS[currentTask].component;
  const currentTaskProps = TASKS[currentTask].props || {};

  if (!stepConfig || !Array.isArray(stepConfig.questions)) {
     onError("Error interno: Configuración inválida o faltan preguntas para CognitiveTask.");
     return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error configuración.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white pt-10">
      <TaskProgressBar
        currentStep={currentTask}
        totalSteps={totalRealTasks}
      />
    
      <CurrentTaskComponent 
        onContinue={handleTaskComplete}
        config={stepConfig}
        {...currentTaskProps}
      />
    </div>
  );
};

export default CognitiveTaskView; 