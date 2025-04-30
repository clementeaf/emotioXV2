import React, { useState, useEffect, useCallback } from 'react';

// Importar todos los componentes de vista de preguntas
import CSATView from '../smartVoc/CSATView';
import DifficultyScaleView from '../smartVoc/DifficultyScaleView'; // Para CES
import AgreementScaleView from '../smartVoc/AgreementScaleView'; // Para CV
import EmotionSelectionView from '../smartVoc/EmotionSelectionView'; // Para NEV
import NPSView from '../smartVoc/NPSView';
import FeedbackView from '../smartVoc/FeedbackView'; // Para VOC (Texto libre)

// Reutilizar la interfaz temporal (o idealmente importar la real)
interface SmartVOCConfig {
    id?: string;
    researchId: string;
    title?: string;
    instructions?: string;
    finishButtonText?: string;
    // ... otros campos específicos ...
}

// Interfaz para una pregunta individual (¡Esta es una suposición! Debe ajustarse a la API real)
interface SmartVOCQuestion {
    id?: string; // Identificador único de la pregunta si existe
    type: 'CSAT' | 'CES' | 'CV' | 'NEV' | 'NPS' | 'VOC'; // Tipo de pregunta
    questionText: string;
    instructions?: string;
    companyName?: string;
    scaleSize?: number;
    leftLabel?: string;
    rightLabel?: string;
    placeholder?: string;
    // ... otros campos específicos por tipo?
}

// Interfaz para la configuración general (¡Suposición!)
interface SmartVOCConfig {
    id?: string;
    researchId: string;
    title?: string; // Título general del paso SmartVOC (si existe)
    instructions?: string; // Instrucciones generales (si existen)
    questions?: SmartVOCQuestion[]; // Array de preguntas
    // ... otros campos ...
}

// Interfaz para almacenar respuestas (simple key-value por ahora)
interface Answers {
  [questionIdOrIndex: string]: any; // Usar ID de pregunta si está disponible, o índice
}

interface SmartVOCHandlerProps {
    researchId: string;
    token: string;
    onComplete: () => void; // Llamado cuando se completa con éxito (o no existe)
    onError: (message: string) => void; // Llamado si hay un error de carga
}

const SmartVOCHandler: React.FC<SmartVOCHandlerProps> = ({
    researchId,
    token,
    onComplete,
    onError,
}) => {
    const [config, setConfig] = useState<SmartVOCConfig | null | undefined>(undefined); // undefined: loading, null: not found, object: found
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [questions, setQuestions] = useState<SmartVOCQuestion[]>([]); // <<< NUEVO ESTADO: Lista de preguntas
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0); // <<< NUEVO ESTADO: Índice actual
    const [answers, setAnswers] = useState<Answers>({}); // <<< NUEVO ESTADO: Respuestas acumuladas

    const fetchConfig = useCallback(async () => {
        console.log(`[SmartVOCHandler] Obteniendo config para researchId: ${researchId}`);
        setIsLoading(true);
        setConfig(undefined);
        setQuestions([]); // Resetear preguntas al iniciar carga
        setCurrentQuestionIndex(0); // Resetear índice
        setAnswers({}); // Resetear respuestas

        try {
            const apiUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
            // Asume este endpoint para SmartVOC
            const url = `${apiUrl}/research/${researchId}/smart-voc`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const result = await response.json();
                const configData = result.data || result;
                console.log('[SmartVOCHandler] Config obtenida:', configData);
                if (configData && typeof configData === 'object') {
                    setConfig(configData as SmartVOCConfig);
                    // Extraer las preguntas (asumiendo que están en configData.questions)
                    const fetchedQuestions = configData.questions as SmartVOCQuestion[] | undefined;
                    if (fetchedQuestions && Array.isArray(fetchedQuestions) && fetchedQuestions.length > 0) {
                        console.log(`[SmartVOCHandler] ${fetchedQuestions.length} preguntas encontradas.`);
                        setQuestions(fetchedQuestions);
                        // No llamar a onComplete aquí, esperar a terminar las preguntas
                    } else {
                        console.warn('[SmartVOCHandler] No se encontraron preguntas válidas en la configuración.');
                        setQuestions([]);
                        onComplete(); // Si no hay preguntas, considerar completado el paso
                    }
                } else {
                    console.warn('[SmartVOCHandler] Respuesta OK pero formato inesperado', configData);
                    setConfig(null);
                    setQuestions([]);
                    onComplete(); // Considerar completado
                }
            } else if (response.status === 404) {
                console.log('[SmartVOCHandler] No se encontró config (404).');
                setConfig(null);
                setQuestions([]);
                onComplete(); // No es un error del flujo
            } else {
                const errorText = await response.text();
                console.error(`[SmartVOCHandler] Error ${response.status}: ${errorText}`);
                throw new Error(`Error ${response.status} al cargar SmartVOC.`);
            }
        } catch (err: any) {
            console.error('[SmartVOCHandler] Excepción en fetchConfig:', err);
            setConfig(undefined);
            setQuestions([]);
            onError(err.message || 'Error al cargar la configuración de SmartVOC.');
        } finally {
            setIsLoading(false);
        }
    }, [researchId, token, onComplete, onError]);

    useEffect(() => {
        if (token && researchId) {
            fetchConfig();
        } else {
            onError("Token o Research ID no disponibles para SmartVOC.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchConfig, token, researchId]); // Sacar onError de deps

    // <<< Manejo de Respuestas y Navegación >>>
    const handleNextQuestion = useCallback((answer: any) => { // Recibe la respuesta de la pregunta actual
        const currentQuestion = questions[currentQuestionIndex];
        const questionId = currentQuestion?.id || `question_${currentQuestionIndex}`; // Usar ID si existe, si no índice

        // Guardar respuesta
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionId]: answer
        }));

        // Ir a la siguiente pregunta o finalizar
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            console.log('[SmartVOCHandler] SmartVOC completado. Respuestas:', answers);
            // Aquí podrías enviar las respuestas si es necesario
            onComplete(); // Llamar al onComplete del Handler
        }
    }, [currentQuestionIndex, questions, onComplete, answers]); // Añadir answers a dependencias

    // <<< Renderizado de Pregunta Actual >>>
    const renderCurrentQuestion = () => {
        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
            return <div>No hay más preguntas o hubo un error.</div>;
        }

        const question = questions[currentQuestionIndex];

        // Mapeo de tipos (ajustar según los tipos reales en la API)
        switch (question.type?.toUpperCase()) {
            case 'CSAT':
                return (
                    <CSATView
                        key={question.id || currentQuestionIndex}
                        questionText={question.questionText}
                        instructions={question.instructions}
                        companyName={question.companyName}
                        scaleSize={question.scaleSize}
                        onNext={handleNextQuestion} // Usar el handler común
                    />
                );
            case 'CES': // Mapeado a DifficultyScaleView
                return (
                    <DifficultyScaleView
                        key={question.id || currentQuestionIndex}
                        questionText={question.questionText}
                        instructions={question.instructions}
                        scaleSize={question.scaleSize}
                        leftLabel={question.leftLabel}
                        rightLabel={question.rightLabel}
                        onNext={handleNextQuestion}
                    />
                );
            case 'CV': // Mapeado a AgreementScaleView
                return (
                    <AgreementScaleView
                        key={question.id || currentQuestionIndex}
                        questionText={question.questionText}
                        instructions={question.instructions}
                        scaleSize={question.scaleSize}
                        leftLabel={question.leftLabel}
                        rightLabel={question.rightLabel}
                        onNext={handleNextQuestion}
                    />
                );
            case 'NEV': // Mapeado a EmotionSelectionView
                return (
                    <EmotionSelectionView
                        key={question.id || currentQuestionIndex}
                        questionText={question.questionText}
                        instructions={question.instructions}
                        companyName={question.companyName}
                        onNext={handleNextQuestion}
                    />
                );
            case 'NPS':
                return (
                    <NPSView
                        key={question.id || currentQuestionIndex}
                        questionText={question.questionText}
                        instructions={question.instructions}
                        companyName={question.companyName}
                        leftLabel={question.leftLabel}
                        rightLabel={question.rightLabel}
                        onNext={handleNextQuestion}
                    />
                );
            case 'VOC': // Mapeado a FeedbackView
                return (
                    <FeedbackView
                        key={question.id || currentQuestionIndex}
                        questionText={question.questionText}
                        instructions={question.instructions}
                        placeholder={question.placeholder}
                        onNext={handleNextQuestion}
                    />
                );
            default:
                console.warn(`[SmartVOCHandler] Tipo de pregunta SmartVOC no soportado: ${question.type}`);
                // Renderizar algo o saltar? Por ahora, un mensaje.
                // Llamar a handleNextQuestion({}) podría saltarla automáticamente.
                return <div>Tipo "{question.type}" no implementado.</div>;
        }
    };

    // --- Renderizado del Handler ---
    if (isLoading) {
        return <div className="p-6 text-center">Cargando SmartVOC...</div>;
    }

    // Si no está cargando pero no hay preguntas (posible error o flujo completado antes)
    if (questions.length === 0) {
        // onComplete o onError ya deberían haberse llamado
        console.log("[SmartVOCHandler] Renderizando sin preguntas (posiblemente completado o error previo).");
        return null;
    }

    // Renderizar la pregunta actual
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
            <div className="max-w-xl w-full flex flex-col items-center">
                {/* Renderiza la pregunta actual. El botón "Siguiente" está DENTRO de cada componente de vista */}
                {renderCurrentQuestion()}
            </div>
        </div>
    );
};

export default SmartVOCHandler; 