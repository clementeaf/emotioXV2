import React, { useState, useEffect } from 'react';

interface ShortTextQuestionProps {
    config: any;
    stepName?: string;
    stepId?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}

export const ShortTextQuestion: React.FC<ShortTextQuestionProps> = ({ 
    config, 
    stepName, 
    stepId, 
    stepType, 
    onStepComplete, 
    isMock 
}) => {
    const localStorageKey = `form-${stepType}-${stepId || stepName?.replace(/\s+/g, '_') || 'defaultShortText'}`;
    const title = config.title || stepName || 'Pregunta';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
    const placeholder = config.answerPlaceholder || 'Escribe tu respuesta...';
    
    const [currentResponse, setCurrentResponse] = useState(() => {
        try {
            const saved = localStorage.getItem(localStorageKey);
            if (saved !== null) return JSON.parse(saved);
        } catch (e) { console.error("Error reading from localStorage in ShortTextQuestion", e); }
        return config.savedResponses || '';
    });

    useEffect(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(currentResponse));
        } catch (e) { console.error("Error saving to localStorage in ShortTextQuestion", e); }
    }, [currentResponse, localStorageKey]);

    const handleSubmit = () => {
        onStepComplete(currentResponse);
        // Opcional: localStorage.removeItem(localStorageKey);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <input
                type="text"
                className="border border-neutral-300 p-2 rounded-md w-full mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={placeholder}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
            />
            <button
                onClick={handleSubmit}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
                Siguiente
            </button>
            {/* DEBUG: Mostrar datos de localStorage */}
            <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                    {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || 'null'), null, 2)}
                </pre>
            </details>
        </div>
    );
}; 