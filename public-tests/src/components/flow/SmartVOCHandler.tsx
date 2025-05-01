import React, { useState, useEffect, useCallback } from 'react';

// Importar todos los componentes de vista de preguntas
import CSATView from '../smartVoc/CSATView';
import DifficultyScaleView from '../smartVoc/DifficultyScaleView'; // Para CES
import AgreementScaleView from '../smartVoc/AgreementScaleView'; // Para CV
import EmotionSelectionView from '../smartVoc/EmotionSelectionView'; // Para NEV
import NPSView from '../smartVoc/NPSView';
import FeedbackView from '../smartVoc/FeedbackView'; // Para VOC (Texto libre)
import { Answers, SmartVOCHandlerProps } from './types';
import { useSmartVOCData } from '../../hooks/useSmartVOCData'; // <<< Importar el hook

// --- Mapeo de Componentes de Pregunta ---
const questionComponentsMap: { [key: string]: React.FC<any> } = {
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
    const handleNextQuestion = useCallback((answer: any) => {
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

        const question = questions[currentQuestionIndex];
        const QuestionComponent = questionComponentsMap[question.type?.toUpperCase()];

        if (!QuestionComponent) {
            console.warn(`[SmartVOCHandler] Tipo de pregunta SmartVOC no soportado: ${question.type}`);
            // Podríamos decidir saltar esta pregunta llamando a handleNextQuestion({})
            // o mostrar un mensaje como antes. Por ahora, mostramos mensaje y bloqueamos.
            return <div className="text-red-500 p-4">Tipo de pregunta "{question.type}" no implementado. Contacte al administrador.</div>;
        }

        // Preparar props comunes
        const commonProps = {
            key: question.id || currentQuestionIndex,
            questionText: question.questionText,
            instructions: question.instructions,
            onNext: handleNextQuestion,
        };

        // Props específicas (basado en el switch original)
        // Extraer solo las props relevantes para evitar pasar props no deseadas
        const specificProps: any = {};
        if (question.companyName) specificProps.companyName = question.companyName;
        if (question.scaleSize) specificProps.scaleSize = question.scaleSize;
        if (question.leftLabel) specificProps.leftLabel = question.leftLabel;
        if (question.rightLabel) specificProps.rightLabel = question.rightLabel;
        if (question.placeholder) specificProps.placeholder = question.placeholder;


        // Renderizar el componente mapeado con sus props
        return <QuestionComponent {...commonProps} {...specificProps} />;
    };

    // --- Renderizado del Handler (Simplificado) ---
    if (isLoading) {
        return <div className="p-6 text-center">Cargando SmartVOC...</div>;
    }

    if (error) {
         // onError ya fue llamado por el useEffect
        return <div className="p-6 text-center text-red-600">Error al cargar SmartVOC.</div>;
    }

    if (questions.length === 0) {
         // No hay preguntas que mostrar. El useEffect ya llamó a onComplete.
         // console.log("[SmartVOCHandler] Renderizando null porque no hay preguntas (onComplete ya fue llamado).");
        return null; // No mostrar nada si no hay preguntas que hacer
    }

    // Si llegamos aquí, !isLoading, !error, y questions.length > 0
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-2xl w-full bg-white shadow-md rounded-lg p-6 sm:p-8 flex flex-col items-center">
                {renderCurrentQuestion()}
            </div>
        </div>
    );
};

export default SmartVOCHandler; 