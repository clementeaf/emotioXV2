import React, { useState, useCallback } from 'react';
import { QuestionComponent } from '../QuestionComponent';
import { useFormDataStore } from '../../../stores/useFormDataStore';

interface ScreenerQuestion {
  id: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'short_text' | 'long_text' | 'linear_scale';
  required: boolean;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  order: number;
}

interface ScreenerComponentProps {
  contentConfiguration?: {
    title?: string;
    description?: string;
    questions?: ScreenerQuestion[];
    isEnabled?: boolean;
  };
  currentQuestionKey: string;
  formData?: Record<string, unknown>;
}

/**
 * Componente para renderizar el Screener
 * Muestra las preguntas del screener una por una
 */
export const ScreenerComponent: React.FC<ScreenerComponentProps> = ({
  contentConfiguration,
  currentQuestionKey,
  formData
}) => {
  const { getFormData } = useFormDataStore();
  
  const questions = contentConfiguration?.questions || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Ordenar preguntas por order
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < sortedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, sortedQuestions.length]);
  
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);
  
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  
  if (!currentQuestion || sortedQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {contentConfiguration?.title || 'Screener'}
        </h2>
        <p className="text-gray-600 text-center">
          {contentConfiguration?.description || 'No hay preguntas disponibles'}
        </p>
        {sortedQuestions.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">
            No se han configurado preguntas para este screener.
          </p>
        )}
      </div>
    );
  }
  
  // Mapear tipos de pregunta del screener a tipos de QuestionComponent
  const mapQuestionType = (type: ScreenerQuestion['questionType']): string => {
    switch (type) {
      case 'single_choice':
        return 'cognitive_single_choice';
      case 'multiple_choice':
        return 'cognitive_multiple_choice';
      case 'short_text':
        return 'cognitive_short_text';
      case 'long_text':
        return 'cognitive_long_text';
      case 'linear_scale':
        return 'cognitive_linear_scale';
      default:
        return 'cognitive_short_text';
    }
  };
  
  // Preparar choices para QuestionComponent (debe tener value y label)
  const choices = currentQuestion.options?.map(option => ({
    value: option.value || option.id,
    label: option.label,
    description: undefined
  })) || [];
  
  // Preparar scaleConfig si es linear_scale
  const scaleConfig = currentQuestion.questionType === 'linear_scale' ? {
    startValue: currentQuestion.minValue || 1,
    endValue: currentQuestion.maxValue || 10,
    startLabel: currentQuestion.minLabel,
    endLabel: currentQuestion.maxLabel
  } : undefined;
  
  const questionKey = `${currentQuestionKey}_${currentQuestion.id}`;
  
  // Preparar la pregunta para QuestionComponent
  const questionForComponent = {
    title: currentQuestion.questionText,
    questionKey: questionKey,
    type: mapQuestionType(currentQuestion.questionType),
    config: {
      ...(currentQuestion.questionType === 'linear_scale' && {
        min: currentQuestion.minValue,
        max: currentQuestion.maxValue,
        startLabel: currentQuestion.minLabel,
        endLabel: currentQuestion.maxLabel
      })
    },
    choices: choices,
    description: ''
  };
  
  // Obtener respuesta guardada para esta pregunta
  const savedData = getFormData(questionKey);
  const currentAnswer = savedData?.[questionKey] || formData?.[questionKey];
  
  // Verificar si puede proceder (si es requerida, debe tener respuesta)
  const canProceed = currentQuestion.required 
    ? currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== ''
    : true;
  
  const isLastQuestion = currentQuestionIndex === sortedQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header con título y descripción */}
      {(contentConfiguration?.title || contentConfiguration?.description) && (
        <div className="bg-white border-b border-gray-200 p-6">
          {contentConfiguration.title && (
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {contentConfiguration.title}
            </h2>
          )}
          {contentConfiguration.description && (
            <p className="text-gray-600">
              {contentConfiguration.description}
            </p>
          )}
        </div>
      )}
      
      {/* Indicador de progreso */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Pregunta {currentQuestionIndex + 1} de {sortedQuestions.length}
          </span>
          <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / sortedQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Pregunta actual */}
      <div className="flex-1 overflow-y-auto p-6">
        <QuestionComponent
          question={questionForComponent}
          currentStepKey={questionKey}
          initialFormData={currentAnswer ? { [questionKey]: currentAnswer } : undefined}
        />
      </div>
      
      {/* Navegación */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isFirstQuestion
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Anterior
          </button>
          
          <div className="flex-1" />
          
          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canProceed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Siguiente
            </button>
          ) : (
            <button
              disabled={!canProceed}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canProceed
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

