import React from 'react';
import { useCognitiveTask } from '../../hooks/useCognitiveTask';
import CognitiveQuestionRenderer from '../cognitiveTask/CognitiveQuestionRenderer'; 
import { CognitiveTaskHandlerProps } from './types';

const CognitiveTaskHandler: React.FC<CognitiveTaskHandlerProps> = ({
    researchId,
    token,
    onComplete,
    onError,
}) => {
    // Usar el hook para obtener el estado y los manejadores
    const {
        isLoading,
        parsedQuestions,     // Para saber si hay preguntas
        currentQuestionIndex,// Para el texto del botón
        currentQuestion,     // La pregunta actual para el renderer
        currentAnswer,       // La respuesta actual para el renderer
        handleAnswerChange,  // Para el renderer
        goToNextQuestion,    // Para el botón
    } = useCognitiveTask({ researchId, token, onComplete, onError });

    // 1. Estado de Carga
    if (isLoading) {
        // Podríamos usar el LoadingIndicator aquí si quisiéramos ser consistentes
        // return <LoadingIndicator message="Cargando Tarea Cognitiva..." />;
        return <div className="p-6 text-center">Cargando Tarea Cognitiva...</div>;
    }

    // 2. No hay preguntas / Error manejado por el hook (llama a onComplete/onError)
    // Si currentQuestion es null después de cargar, significa que no hay preguntas válidas
    // o el hook ya llamó a onComplete/onError. Devolver null aquí es seguro.
    if (!currentQuestion) {
        console.log("[CognitiveTaskHandler] No hay pregunta actual para renderizar (posiblemente completado o error previo manejado por hook).");
        return null; 
    }

    // 3. Renderizar la pregunta actual usando CognitiveQuestionRenderer
    return (
        // Contenedor principal (similar al anterior)
        <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
            {/* Ajustar ancho máximo si se desea consistencia con SmartVOC */}
            <div className="max-w-xl w-full flex flex-col items-center"> 
                {/* Renderiza la pregunta actual usando el nuevo componente */}
                <div className="w-full mb-8"> 
                   <CognitiveQuestionRenderer 
                       question={currentQuestion} 
                       answer={currentAnswer}
                       onChange={handleAnswerChange}
                   />
                </div>

                {/* Botón de navegación (usa goToNextQuestion del hook) */}
                <button
                    onClick={goToNextQuestion}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                    // TODO: Lógica de deshabilitación si es requerida (necesitaría `required` en currentQuestion y `currentAnswer`)
                    // disabled={currentQuestion.required && currentAnswer === undefined}
                >
                    {/* Determinar texto del botón basado en el índice */}
                    {currentQuestionIndex < parsedQuestions.length - 1 ? 'Siguiente' : 'Finalizar Tarea'} 
                </button>
            </div>
        </div>
    );
};

export default CognitiveTaskHandler; 