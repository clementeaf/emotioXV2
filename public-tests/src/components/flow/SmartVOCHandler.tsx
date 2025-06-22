import React, { useCallback, useEffect, useState } from 'react';

// Importar todos los componentes de vista de preguntas
import { useSmartVOCData } from '../../hooks/useSmartVOCData'; // <<< Importar el hook
import AgreementScaleView from '../smartVoc/AgreementScaleView'; // Para CV
import CSATView from '../smartVoc/CSATView';
import DifficultyScaleView from '../smartVoc/DifficultyScaleView'; // Para CES
import EmotionSelectionView from '../smartVoc/EmotionSelectionView'; // Para NEV
import FeedbackView from '../smartVoc/FeedbackView'; // Para VOC (Texto libre)
import NPSView from '../smartVoc/NPSView';
import { Answers, SmartVOCHandlerProps } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const questionComponentsMap: { [key: string]: React.ComponentType<any> } = {
    'CSAT': CSATView,
    'CES': DifficultyScaleView,
    'CV': AgreementScaleView,
    'NEV': EmotionSelectionView,
    'NPS': NPSView,
    'VOC': FeedbackView,
};

const SmartVOCHandler: React.FC<SmartVOCHandlerProps> = ({
    researchId,
    token,
    onComplete,
    onError,
}) => {
    // <<< Usar el hook para obtener datos >>>
    const { isLoading, questions, error } = useSmartVOCData(researchId, token);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Answers>({});

    // <<< Efecto para manejar el estado de carga, errores y finalización >>>
    useEffect(() => {
        if (!isLoading) {
            if (error) {
                console.error("[SmartVOCHandler] Error desde useSmartVOCData:", error);
                onError(error);
            } else if (questions.length === 0) {
                // Carga completa, sin errores, pero sin preguntas
                console.log("[SmartVOCHandler] Carga completa, no se encontraron preguntas SmartVOC. Completando.");
                onComplete();
            }
            // Si hay preguntas, el flujo continúa normalmente
        }
    }, [isLoading, questions, error, onComplete, onError]);


    // <<< Manejo de Respuestas y Navegación (Sin cambios) >>>
    const handleNextQuestion = useCallback((answer: unknown) => {
        const currentQuestion = questions[currentQuestionIndex];
        // Usar un identificador único si está disponible (ej: question.id), sino el índice
        const questionId = currentQuestion?.id || `question_${currentQuestion.type}_${currentQuestionIndex}`;

        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionId]: answer
        }));

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            // Asegurarse de que 'answers' tenga el último valor antes de completar
            const finalAnswers = {
                ...answers,
                [questionId]: answer
            };
            console.log('[SmartVOCHandler] SmartVOC completado. Respuestas:', finalAnswers);
            // Aquí podrías enviar las 'finalAnswers' si es necesario
            onComplete();
        }
    }, [currentQuestionIndex, questions, onComplete, answers]); // 'answers' es dependencia


    // <<< Renderizado de Pregunta Actual usando Mapeo >>>
    const renderCurrentQuestion = () => {
        // Estas comprobaciones ya no son necesarias aquí porque se manejan antes de llamar a esta función

        // Salvaguarda: Asegurarse de que el índice esté dentro de los límites (aunque no debería ocurrir)
        if (currentQuestionIndex >= questions.length) {
            console.warn("[SmartVOCHandler] renderCurrentQuestion llamado con índice fuera de límites.");
            return null;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const CurrentQuestionComponent = questionComponentsMap[currentQuestion.type];

        // Si no se encuentra un componente, mostrar un error o un fallback
        if (!CurrentQuestionComponent) {
            console.warn(`No se encontró un componente para el tipo de pregunta: ${currentQuestion.type}`);
            return (
                <div className="p-4 text-center text-red-500">
                    Error: Tipo de pregunta no soportado ({currentQuestion.type})
                </div>
            );
        }

        // Preparamos las props para el componente de la pregunta actual
        const questionProps = {
            key: currentQuestion.id,
            question: currentQuestion, // <<< Pasamos el objeto 'question' completo
            onStepComplete: (answer: any) => handleNextQuestion(answer?.value),
        };

        return (
            <div className="h-full">
                {isLoading && <p>Cargando preguntas de SmartVOC...</p>}
                {error && <p>Error: {error}</p>}

                {currentQuestion && !isLoading && (
                    <CurrentQuestionComponent {...questionProps} />
                )}

                {!currentQuestion && !isLoading && (
                    <div>
                        {renderCurrentQuestion()}
                    </div>
                )}
            </div>
        );
    };

    // Lógica de renderizado simplificada y robusta
    const renderContent = () => {
        // 1. Estado de carga
        if (isLoading) {
            return <p className="text-center p-8">Cargando configuración de SmartVOC...</p>;
        }

        // 2. Estado de error
        if (error) {
            return <p className="text-center p-8 text-red-500">Error al cargar la configuración: {error}</p>;
        }

        // 3. No hay preguntas configuradas
        if (!questions || questions.length === 0) {
            // Si no hay preguntas, consideramos el paso completado.
            console.log('[SmartVOCHandler] No hay preguntas SmartVOC, completando el paso.');
            onComplete();
            return <p className="text-center p-8">No hay preguntas SmartVOC configuradas. Continuando...</p>;
        }

        // 4. Se terminaron las preguntas
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) {
            console.log('[SmartVOCHandler] Todas las preguntas completadas.');
            onComplete();
            return <p className="text-center p-8">Gracias por tus respuestas. Continuando...</p>;
        }

        // 5. Renderizar la pregunta actual
        const CurrentQuestionComponent = questionComponentsMap[currentQuestion.type];
        if (!CurrentQuestionComponent) {
            console.warn(`No se encontró un componente para el tipo de pregunta: ${currentQuestion.type}`);
            // Saltar a la siguiente pregunta si el componente no existe
            handleNextQuestion(null);
            return (
                <p className="p-4 text-center text-red-500">
                    Error: Tipo de pregunta no soportado ({currentQuestion.type}). Saltando a la siguiente.
                </p>
            );
        }

        const questionProps = {
            key: currentQuestion.id,
            question: currentQuestion,
            onStepComplete: (answer: any) => handleNextQuestion(answer?.value),
        };

        return <CurrentQuestionComponent {...questionProps} />;
    };

    return (
        <div className="h-full w-full">
            {renderContent()}
        </div>
    );
};

export default SmartVOCHandler;
