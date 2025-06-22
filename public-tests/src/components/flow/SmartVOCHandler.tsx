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
    stepConfig,
}) => {
    const { isLoading, questions, error } = useSmartVOCData({ researchId });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Answers>({});

    useEffect(() => {
        if (!isLoading) {
            if (error) {
                onError(error);
            } else if (questions.length === 0) {
                onComplete({});
            }
        }
    }, [isLoading, questions, error, onComplete, onError]);

    const handleNextQuestion = useCallback((answer: unknown) => {
        const currentQuestion = questions[currentQuestionIndex];
        const questionId = currentQuestion.id;

        const updatedAnswers = { ...answers, [questionId]: answer };
        setAnswers(updatedAnswers);

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            onComplete(updatedAnswers);
        }
    }, [currentQuestionIndex, questions, onComplete, answers]);

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

        const questionProps = {
            key: currentQuestion.id,
            researchId,
            token,
            questionId: currentQuestion.id,
            moduleId: stepConfig?.moduleId,
            onNext: handleNextQuestion,

            questionText: currentQuestion.title,
            instructions: currentQuestion.instructions,
            companyName: currentQuestion.config?.companyName,
            config: currentQuestion.config,
        };

        return <CurrentQuestionComponent {...questionProps} />;
    };

    return <div className="h-full w-full">{renderContent()}</div>;
};

export default SmartVOCHandler;
