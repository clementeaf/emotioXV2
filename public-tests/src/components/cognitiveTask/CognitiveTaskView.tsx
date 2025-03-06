import { useState } from 'react';
import { TASKS, getTaskProgress } from './tasks';
import ThankYouView from './ThankYouView';

// Componente base para tareas cognitivas
const CognitiveTaskView = ({ onComplete }: { onComplete: () => void }) => {
  // Comenzamos directamente con las tareas (isStarted true)
  const [isStarted, setIsStarted] = useState(true);
  const [currentTask, setCurrentTask] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const handleTaskComplete = () => {
    // Avanzar a la siguiente tarea
    const nextTask = currentTask + 1;
    
    // Si hay más tareas, mostrar la siguiente
    if (nextTask < TASKS.length) {
      setCurrentTask(nextTask);
    } else {
      // Si terminamos todas las tareas, mostrar pantalla de agradecimiento
      setShowThankYou(true);
    }
  };
  
  const handleThankYouComplete = () => {
    // Llamar a onComplete cuando el usuario termine con la pantalla de agradecimiento
    onComplete();
  };
  
  // Si estamos mostrando la pantalla de agradecimiento
  if (showThankYou) {
    return (
      <ThankYouView 
        onComplete={handleThankYouComplete}
        title="¡Gracias por completar las tareas!"
        message="Su participación es muy valiosa para nuestra investigación y nos ayudará a mejorar la experiencia de futuros usuarios."
      />
    );
  }
  
  // Calculamos el progreso en porcentaje
  const progress = getTaskProgress(currentTask);
  
  // Componente de la tarea actual y sus props
  const CurrentTaskComponent = TASKS[currentTask].component;
  const currentTaskInfo = TASKS[currentTask];
  const currentTaskProps = TASKS[currentTask].props || {};
  
  // Determinamos si debemos mostrar la barra de progreso (no para instrucciones)
  const shouldShowProgress = currentTask > 0;
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      {/* Barra de progreso (solo para tareas reales, no instrucciones) */}
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
    
      {/* Renderizamos la tarea actual con sus props */}
      <CurrentTaskComponent 
        onContinue={handleTaskComplete}
        {...currentTaskProps}
      />
    </div>
  );
};

export default CognitiveTaskView; 