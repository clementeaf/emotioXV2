import React, { useCallback, useEffect, useState } from 'react';

// Importar todos los componentes de vista de preguntas
import { useSmartVOCData } from '../../hooks/useSmartVOCData'; // <<< Importar el hook
import AgreementScaleView from '../smartVoc/AgreementScaleView'; // Para CV
import CSATView from '../smartVoc/CSATView';
import DifficultyScaleView from '../smartVoc/DifficultyScaleView'; // Para CES
import EmotionSelectionView from '../smartVoc/EmotionSelectionView'; // Para NEV
import FeedbackView from '../smartVoc/FeedbackView'; // Para VOC (Texto libre)
import NPSView from '../smartVoc/NPSView';
import { QuestionKeyValidator } from './QuestionKeyValidator'; // NUEVO: Importar validador
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
    stepConfig,
    onComplete,
    onError
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});

    const {
        questions,
        isLoading,
        error
    } = useSmartVOCData({ researchId });

    useEffect(() => {
        if (researchId && token) {
            // El hook maneja automáticamente el fetch cuando researchId cambia
        }
    }, [researchId, token]);

    const handleNextQuestion = useCallback((answer: unknown) => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) {
            console.error('[SmartVOCHandler] No hay pregunta actual');
            return;
        }

        // NUEVO: Usar questionKey del backend en lugar de generarlo localmente
        const questionKey = currentQuestion.questionKey || currentQuestion.id || `smartvoc_${currentQuestionIndex}`;

        console.log(`[SmartVOCHandler] 🔑 Guardando respuesta con questionKey: ${questionKey}`, {
            questionId: currentQuestion.id,
            questionType: currentQuestion.type,
            questionIndex: currentQuestionIndex,
            questionKey,
            hasAnswer: answer !== undefined && answer !== null,
            backendQuestionKey: currentQuestion.questionKey // NUEVO: Log para debugging
        });

        // Guardar respuesta con questionKey del backend
        setAnswers(prev => ({
            ...prev,
            [questionKey]: answer
        }));

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Completar el módulo
            console.log('[SmartVOCHandler] ✅ Módulo SmartVOC completado');
            onComplete(answers);
        }
    }, [currentQuestionIndex, questions, onComplete]);

    const renderContent = () => {
        if (isLoading) return <p>Cargando...</p>;
        if (error) return <p>Error: {error}</p>;
        if (!questions || questions.length === 0 || currentQuestionIndex >= questions.length) {
            // Si no hay preguntas después de cargar, completar
            if (!isLoading) onComplete({});
            return null;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const CurrentQuestionComponent = questionComponentsMap[currentQuestion.type];

        if (!CurrentQuestionComponent) {
            handleNextQuestion(null);
            return <p>Tipo de pregunta no soportado...</p>;
        }

        // NUEVO: Usar questionKey del backend en lugar de generarlo localmente
        const questionKey = currentQuestion.questionKey || currentQuestion.id || `smartvoc_${currentQuestionIndex}`;

        const questionProps = {
            key: questionKey, // NUEVO: Usar questionKey del backend como key
            researchId,
            token,
            questionId: currentQuestion.id,
            moduleId: stepConfig?.moduleId,
            onNext: handleNextQuestion,
            questionKey, // NUEVO: Pasar questionKey del backend al componente
            questionText: currentQuestion.title,
            instructions: currentQuestion.instructions,
            companyName: currentQuestion.config?.companyName,
            config: currentQuestion.config,
        };

        return (
            <QuestionKeyValidator
                questionKey={questionKey}
                expectedStepId={currentQuestion.id}
                expectedStepType="smartvoc"
                onValidationError={(error) => {
                    console.error(`[SmartVOCHandler] Error de validación: ${error}`);
                    onError?.(error);
                }}
            >
                <CurrentQuestionComponent {...questionProps} />
            </QuestionKeyValidator>
        );
    };

    return <div className="h-full w-full">{renderContent()}</div>;
};

export default SmartVOCHandler;
