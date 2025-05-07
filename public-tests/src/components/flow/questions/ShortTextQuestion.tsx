import React, { useState } from 'react';

interface ShortTextQuestionProps {
    config: any;
    stepName?: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}

export const ShortTextQuestion: React.FC<ShortTextQuestionProps> = ({ config, stepName, onStepComplete, isMock }) => {
    const title = config.title || stepName || 'Pregunta';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
    const placeholder = config.answerPlaceholder || 'Escribe tu respuesta...';
    const savedResponse = config.savedResponses || '';
    const [currentResponse, setCurrentResponse] = useState(savedResponse);

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <input
                type="text"
                className="border border-neutral-300 p-2 rounded-md w-full mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={placeholder}
                defaultValue={savedResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
            />
            <button
                onClick={() => onStepComplete(currentResponse || savedResponse || "Respuesta placeholder...")}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
                Siguiente
            </button>
        </div>
    );
}; 