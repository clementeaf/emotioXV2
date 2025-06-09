import React from 'react'; 
import { ShortTextView } from './questions/ShortTextView';
import { LongTextView } from './questions/LongTextView';
import { SingleChoiceView } from './questions/SingleChoiceView';
import { MultiChoiceView } from './questions/MultiChoiceView';
import { LinearScaleView } from './questions/LinearScaleView';
import { CognitiveQuestionRendererProps, CognitiveQuestion } from '../../types/cognitive-task.types';

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
                    value={typeof answer === 'string' ? answer : ''}
                    onChange={onChange as (questionId: string, value: string) => void}
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
                    value={typeof answer === 'string' ? answer : undefined}
                    onChange={onChange as (questionId: string, selectedOptionId: string) => void}
                />
            );
        case 'MULTI_CHOICE':
        case 'OPCION_MULTIPLE':
            return (
                <MultiChoiceView
                    key={question.id}
                    config={question}
                    value={Array.isArray(answer) ? answer as string[] : []}
                    onChange={onChange as (questionId: string, selectedOptionIds: string[]) => void}
                />
            );
        case 'LINEAR_SCALE':
        case 'ESCALA_LINEAL':
            return (
                <LinearScaleView
                    key={question.id}
                    config={question}
                    value={typeof answer === 'number' ? answer : undefined}
                    onChange={onChange as (questionId: string, selectedValue: number) => void}
                />
            );
        default:
            console.warn(`[CognitiveQuestionRenderer] Tipo no soportado: ${question.type}`);
            return <div>Tipo de pregunta "{question.type}" no soportado.</div>;
    }
};

export default CognitiveQuestionRenderer; 