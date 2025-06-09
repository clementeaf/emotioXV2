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

        const question = questions[currentQuestionIndex];
        const QuestionComponent = questionComponentsMap[question.type?.toUpperCase()];

        if (!QuestionComponent) {
            console.warn(`[SmartVOCHandler] Tipo de pregunta SmartVOC no soportado: ${question.type}`);
            // Podríamos decidir saltar esta pregunta llamando a handleNextQuestion({})
            // o mostrar un mensaje como antes. Por ahora, mostramos mensaje y bloqueamos.
            return <div className="text-red-500 p-4">Tipo de pregunta "{question.type}" no implementado. Contacte al administrador.</div>;
        }

        // Log para debugging
        console.log(`[SmartVOCHandler] Rendering question:`, question);

        // Preparar props comunes
        const commonProps = {
            key: `smartvoc-${question.type?.toLowerCase()}`, // 🚨 Key estática por tipo de pregunta
            questionText: (question as any).questionText || (question as any).title || `Pregunta ${question.type}`,
            instructions: (question as any).instructions || (question as any).description || '',
            onNext: handleNextQuestion,
        };

        // Props específicas (basado en el switch original)
        // Extraer solo las props relevantes para evitar pasar props no deseadas
        const specificProps: Record<string, unknown> = {};
        const questionData = question as any; // Type assertion para acceso flexible
        
        if (questionData.companyName) specificProps.companyName = questionData.companyName;
        if (questionData.scaleSize) specificProps.scaleSize = questionData.scaleSize;
        if (questionData.leftLabel) specificProps.leftLabel = questionData.leftLabel;
        if (questionData.rightLabel) specificProps.rightLabel = questionData.rightLabel;
        if (questionData.placeholder) specificProps.placeholder = questionData.placeholder;

        // Añadir props estándar para useStandardizedForm
        const standardProps = {
            stepId: question.id,
            stepType: question.type,
            stepName: (question as any).title || question.type,
            researchId: researchId,
            participantId: undefined, // Se obtendrá del store
            required: question.required || false,
            config: question.config
        };

        // Renderizar el componente mapeado con sus props
        return <QuestionComponent {...commonProps} {...specificProps} {...standardProps} />;
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