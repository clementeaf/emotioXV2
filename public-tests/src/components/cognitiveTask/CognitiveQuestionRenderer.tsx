import React from 'react';
import { CognitiveQuestionRendererProps } from '../../types/cognitive-task.types';
import { LinearScaleView } from './questions/LinearScaleView';
import { LongTextView } from './questions/LongTextView';
import { MultiChoiceView } from './questions/MultiChoiceView';
import { ShortTextView } from './questions/ShortTextView';
import { SingleChoiceView } from './questions/SingleChoiceView';

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
                    stepType={question.type}
                    stepId={question.id}
                    stepName={question.title}
                    stepConfig={question}
                    researchId=""
                    participantId=""
                    onStepComplete={(data) => {
                        // Adapter para convertir desde MappedStepComponentProps a las props esperadas
                        if (onChange && question.id) {
                            onChange(question.id, data);
                        }
                    }}
                    savedResponse={answer}
                    savedResponseId={undefined}
                    questionKey={question.id} // NUEVO: Usar question.id como questionKey
                />
            );
        case 'SINGLE_CHOICE':
        case 'OPCION_UNICA':
            return (
                <SingleChoiceView
                    key={question.id}
                    stepConfig={question}
                    onStepComplete={(data) => {
                        // Adapter para convertir desde MappedStepComponentProps a las props esperadas
                        if (onChange && question.id) {
                            onChange(question.id, data as string);
                        }
                    }}
                    savedResponse={answer}
                    questionKey={question.id} // NUEVO: Usar question.id como questionKey
                    stepType={question.type}
                    researchId=""
                    participantId=""
                />
            );
        case 'MULTI_CHOICE':
        case 'OPCION_MULTIPLE':
            return (
                <MultiChoiceView
                    key={question.id}
                    stepConfig={question}
                    onStepComplete={(data) => {
                        // Adapter para convertir desde MappedStepComponentProps a las props esperadas
                        if (onChange && question.id) {
                            onChange(question.id, data as string[]);
                        }
                    }}
                    savedResponse={answer}
                    questionKey={question.id} // NUEVO: Usar question.id como questionKey
                    stepType={question.type}
                    researchId=""
                    participantId=""
                />
            );
        case 'LINEAR_SCALE':
        case 'ESCALA_LINEAL':
            return (
                <LinearScaleView
                    key={question.id}
                    stepConfig={question}
                    onStepComplete={(data) => {
                        // Adapter para convertir desde MappedStepComponentProps a las props esperadas
                        if (onChange && question.id) {
                            onChange(question.id, data as number);
                        }
                    }}
                    savedResponse={answer}
                    questionKey={question.id} // NUEVO: Usar question.id como questionKey
                    stepType={question.type}
                    researchId=""
                    participantId=""
                />
            );
        default:
            console.warn(`[CognitiveQuestionRenderer] Tipo no soportado: ${question.type}`);
            return <div>Tipo de pregunta "{question.type}" no soportado.</div>;
    }
};

export default CognitiveQuestionRenderer;
