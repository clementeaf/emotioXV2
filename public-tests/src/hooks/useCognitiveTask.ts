import { useState, useEffect, useCallback } from 'react';
// Quitar ParticipantFlowStep si no se usa directamente en el hook para errores
// import { ParticipantFlowStep } from '../types/flow'; 

// <<< MOVER INTERFACES AQUÍ >>>
// Interfaz para una pregunta individual (basada en la que estaba en el handler)
export interface CognitiveQuestion {
    id: string; 
    type: string; 
    title?: string;
    description?: string;
    answerPlaceholder?: string;
    required?: boolean;
    // ... otros campos específicos como 'options' para choice, etc.
}

// Interfaz para las respuestas
export interface CognitiveAnswers {
  [questionId: string]: unknown;
}
// <<< FIN INTERFACES MOVIDAS >>>

// Props que necesita el hook
interface UseCognitiveTaskProps {
    researchId: string;
    token: string | null; // Permitir null para la comprobación inicial
    onComplete: () => void; 
    onError: (message: string) => void; 
}

export const useCognitiveTask = ({ researchId, token, onComplete, onError }: UseCognitiveTaskProps) => {
    // --- Estados --- 
    // const [config, setConfig] = useState<any | null>(null); // Config general, ¿aún necesaria si solo usamos preguntas?
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [parsedQuestions, setParsedQuestions] = useState<CognitiveQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<CognitiveAnswers>({});

    // Derivar la pregunta actual del estado
    const currentQuestion = parsedQuestions.length > 0 ? parsedQuestions[currentQuestionIndex] : null;
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

    // --- Lógica Fetch --- 
    const fetchConfig = useCallback(async () => {
        if (!researchId || !token) {
             onError("Hook: Token o Research ID no disponibles para Cognitive Task.");
             setIsLoading(false);
             return;
        }
        console.log(`[useCognitiveTask] Fetching config. ResearchId: ${researchId}`);
        setIsLoading(true);
        setParsedQuestions([]);
        setCurrentQuestionIndex(0);
        setAnswers({});
        // setConfig(null); // Resetear config si se usara

        try {
            const apiUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
            const url = `${apiUrl}/research/${researchId}/cognitive-task`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const result = await response.json();
                const configData = result.data || result;
                console.log('[useCognitiveTask] Config received:', configData);
                
                if (configData && typeof configData === 'object' && Array.isArray(configData.questions) && configData.questions.length > 0) {
                    const questionsArray = configData.questions;
                    
                    // 1. Añadir tipo explícito a 'q'
                    const validQuestions = questionsArray.filter((q: unknown) => { 
                        if (typeof q !== 'object' || q === null) return false;
                        const question = q as { id?: unknown; type?: unknown };
                        return typeof question.id === 'string' && typeof question.type === 'string';
                    });
                                        
                    if (validQuestions.length > 0) {
                        console.log(`[useCognitiveTask] ${validQuestions.length} valid questions parsed.`);
                        setParsedQuestions(validQuestions as CognitiveQuestion[]); 
                    } else {
                        // 2. Usar comillas dobles en el string para evitar conflicto
                        console.warn("[useCognitiveTask] Array 'questions' had no valid question objects with string id/type."); 
                        onComplete(); 
                    }
                } else {
                   console.warn('[useCognitiveTask] Response OK but unexpected format.', configData);
                   onComplete(); 
                }
            } else if (response.status === 404) {
                 console.log('[useCognitiveTask] Config not found (404).');
                 onComplete();
            } else {
                 const errorText = await response.text();
                 throw new Error(`Error ${response.status}: ${errorText}`);
            }
        } catch (err: unknown) {
             console.error('[useCognitiveTask] Exception fetching config:', err);
             if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
                 onError((err as { message: string }).message);
             } else {
                 onError('Error loading cognitive task configuration.');
             }
        } finally {
            setIsLoading(false);
        }
    }, [researchId, token, onComplete, onError]);

    // Efecto para llamar a fetchConfig cuando cambian las dependencias clave
    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]); // fetchConfig ya incluye sus dependencias

    // --- Lógica de Interacción --- 
    const handleAnswerChange = useCallback((questionId: string, value: unknown) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionId]: value
        }));
    }, []);

    const goToNextQuestion = useCallback(() => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < parsedQuestions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            console.log('[useCognitiveTask] All questions completed. Answers:', answers);
            // Podría hacerse un POST con las respuestas aquí si fuera necesario
            onComplete(); 
        }
    }, [currentQuestionIndex, parsedQuestions, onComplete, answers]);

    // --- Valor de Retorno --- 
    return {
        isLoading,
        parsedQuestions,
        currentQuestionIndex,
        currentQuestion, // Pregunta actual derivada
        answers,
        currentAnswer, // Respuesta actual derivada
        handleAnswerChange,
        goToNextQuestion,
    };
}; 