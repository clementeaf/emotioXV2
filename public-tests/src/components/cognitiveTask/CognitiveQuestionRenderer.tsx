import React from 'react';
import { CognitiveQuestion } from '../../hooks/useCognitiveTask'; 
import { ShortTextView } from './questions/ShortTextView';
import { LongTextView } from './questions/LongTextView';
import { SingleChoiceView } from './questions/SingleChoiceView';
import { MultiChoiceView } from './questions/MultiChoiceView';
import { LinearScaleView } from './questions/LinearScaleView';

interface CognitiveQuestionRendererProps {
    question: CognitiveQuestion;
    answer: any;
    onChange: (questionId: string, value: any) => void;
}

const CognitiveQuestionRenderer: React.FC<CognitiveQuestionRendererProps> = ({
    question,
    answer,
    onChange,
}) => {

    switch (question.type.toUpperCase()) {
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