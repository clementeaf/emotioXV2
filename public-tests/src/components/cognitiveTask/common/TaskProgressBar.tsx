import React from 'react';
import { TaskProgressBarProps } from '../../../types/cognitive-task.types';

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  currentStep,
  totalSteps,
  showProgressText = true, // Por defecto mostrar el texto
  className = 'w-full fixed top-0 left-0 right-0', // Clases originales
  progressTextClassName = 'flex justify-between px-4 py-1 text-xs text-neutral-500', // Clases originales
  progressBarContainerClassName = 'h-1 bg-neutral-200', // Clases originales
  progressBarClassName = 'h-1 bg-indigo-600 transition-all duration-300', // Clases originales
}) => {
  // Asegurarse de que totalSteps no sea 0 para evitar división por cero
  // currentStep es base 0, pero mostramos como "Tarea 1 de N", por eso +1 para el cálculo y la visualización
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  // Ajustar el número de pasos total a mostrar si es necesario (ej. si hay pantalla de agradecimiento)
  const displayTotalSteps = totalSteps; // O podría ser totalSteps - 1 si la última no cuenta
  const displayCurrentStep = currentStep + 1;

  // No mostrar barra si solo hay 1 paso o menos
  if (totalSteps <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <div className={progressBarContainerClassName}>
        <div
          className={progressBarClassName}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso: ${Math.round(progress)}%`}
        ></div>
      </div>
      {showProgressText && (
        <div className={progressTextClassName}>
          <span>
            {/* Mostrar "Tarea X de Y". Asegurar no mostrar "Tarea 0" */}
            Tarea {Math.max(1, displayCurrentStep)} de {displayTotalSteps}
          </span>
          <span>Progreso: {Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

export default TaskProgressBar; 