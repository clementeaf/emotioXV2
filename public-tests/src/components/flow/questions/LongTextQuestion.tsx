import React, { useState, useEffect } from 'react';
import { getStandardButtonText } from '../../../utils/formHelpers';

interface LongTextQuestionProps {
    config: unknown;
    stepName?: string;
    stepId?: string;
    stepType: string;
    onStepComplete: (answer: unknown) => void;
    isMock: boolean;
}

export const LongTextQuestion: React.FC<LongTextQuestionProps> = ({ 
    config, 
    stepName,
    onStepComplete, 
    isMock 
}) => {
    // Unificar todas las props de config en un solo objeto seguro
    const cfg = (typeof config === 'object' && config !== null)
      ? config as {
          prompt?: string;
          placeholder?: string;
          minLength?: number;
          maxLength?: number;
          required?: boolean;
          title?: string;
          description?: string;
          questionText?: string;
          answerPlaceholder?: string;
          savedResponses?: string;
        }
      : {};

    const title = cfg.title || stepName || 'Pregunta';
    const description = cfg.description;
    const questionText = cfg.questionText || (isMock ? 'Pregunta de prueba' : '');
    const answerPlaceholder = cfg.answerPlaceholder || 'Escribe tu respuesta detallada aquí...';
    const savedResponses = cfg.savedResponses;

    // Inicializar con respuestas guardadas o string vacío
    const [currentResponse, setCurrentResponse] = useState(() => {
        return savedResponses || '';
    });

    // Si cambian las respuestas guardadas en config, actualizar el estado
    useEffect(() => {
        if (savedResponses !== undefined) {
            setCurrentResponse(savedResponses);
        }
    }, [savedResponses]);

    const handleSubmit = () => {
        console.log('[LongTextQuestion] Guardando respuesta:', currentResponse);
        onStepComplete(currentResponse);
    };

    const buttonText = getStandardButtonText({
        isSaving: false,
        isLoading: false,
        hasExistingData: !!savedResponses && currentResponse !== ''
    });

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <textarea
                className="border border-neutral-300 p-2 rounded-md w-full mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={answerPlaceholder}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                rows={5}
            />
            <button
                onClick={handleSubmit}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
                {buttonText}
            </button>
        </div>
    );
}; 