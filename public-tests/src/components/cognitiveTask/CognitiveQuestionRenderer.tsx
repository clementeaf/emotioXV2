import React from 'react';
// Importar la interfaz de pregunta desde el hook ahora
import { CognitiveQuestion } from '../../hooks/useCognitiveTask'; 

// Importar todas las vistas de preguntas específicas
import { ShortTextView } from './questions/ShortTextView';
import { LongTextView } from './questions/LongTextView';
import { SingleChoiceView } from './questions/SingleChoiceView';
import { MultiChoiceView } from './questions/MultiChoiceView';
import { LinearScaleView } from './questions/LinearScaleView';

interface CognitiveQuestionRendererProps {
    question: CognitiveQuestion; // La pregunta actual a renderizar
    answer: any; // La respuesta actual para esta pregunta
    onChange: (questionId: string, value: any) => void; // Callback para cambios
}

const CognitiveQuestionRenderer: React.FC<CognitiveQuestionRendererProps> = ({
    question,
    answer,
    onChange,
}) => {
    console.log('[CognitiveQuestionRenderer] Renderizando pregunta:', question.id, 'Tipo:', question.type);

    // El switch que estaba en CognitiveTaskHandler
    switch (question.type.toUpperCase()) { // Normalizar a mayúsculas
        case 'SHORT_TEXT':
        case 'TEXTO_CORTO': 
            return (
                <ShortTextView
                    key={question.id}
                    config={question}
                    value={answer || ''} 
                    onChange={onChange}
                />
            );
        case 'LONG_TEXT':
        case 'TEXTO_LARGO': 
            return (
                <LongTextView
                    key={question.id}
                    config={question}
                    value={answer || ''}
                    onChange={onChange}
                />
            );
        case 'SINGLE_CHOICE':
        case 'OPCION_UNICA': 
            return (
                <SingleChoiceView
                    key={question.id}
                    config={question}
                    value={answer}
                    onChange={onChange}
                />
            );
        case 'MULTI_CHOICE':
        case 'OPCION_MULTIPLE':
            return (
                <MultiChoiceView
                    key={question.id}
                    config={question}
                    value={answer || []} 
                    onChange={onChange}
                />
            );
        case 'LINEAR_SCALE':
        case 'ESCALA_LINEAL':
            return (
                <LinearScaleView
                    key={question.id}
                    config={question}
                    value={answer}
                    onChange={onChange}
                />
            );
        default:
            console.warn(`[CognitiveQuestionRenderer] Tipo no soportado: ${question.type}`);
            return <div>Tipo de pregunta "{question.type}" no soportado.</div>;
    }
};

export default CognitiveQuestionRenderer; 