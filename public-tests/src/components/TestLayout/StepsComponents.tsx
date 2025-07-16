import React, { useState } from 'react';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';
import { QuestionComponentProps, ScreenStep } from './types';
import { QUESTION_TYPE_MAP } from './utils';

export const QuestionComponent: React.FC<QuestionComponentProps> = ({
  question,
  currentStepKey
}) => {
  const questionType = QUESTION_TYPE_MAP[currentStepKey as keyof typeof QUESTION_TYPE_MAP] || 'pending';
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');

  const QuestionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className='flex flex-col items-center justify-center h-full gap-10'
      data-question-key={currentStepKey}
      data-selected-value={selectedValue}
      data-text-value={textValue}
    >
      <div className='mb-2 text-center'>
        <h3 className='text-lg font-semibold mb-2'>
          {question.title || question.questionKey || 'Pregunta'}
        </h3>
      </div>
      {children}
    </div>
  );

  if (!questionType) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-red-600 mb-2'>Tipo de pregunta no reconocido</h3>
          <p className='text-sm text-gray-600'>No se pudo determinar el tipo de pregunta para: {currentStepKey}</p>
        </div>
      </div>
    );
  }

  switch (questionType) {
    case 'scale':
      return (
        <QuestionWrapper>
          <ScaleRangeQuestion
            min={
              (question.config?.min as number) ||
              ((question.config?.scaleRange as { start?: number })?.start as number) ||
              1
            }
            max={
              (question.config?.max as number) ||
              ((question.config?.scaleRange as { end?: number })?.end as number) ||
              10
            }
            leftLabel={question.config?.startLabel as string}
            rightLabel={question.config?.endLabel as string}
            value={selectedValue ? parseInt(selectedValue, 10) : undefined}
            onChange={(value) => setSelectedValue(String(value))}
          />
        </QuestionWrapper>
      );

    case 'emoji':
      return (
        <QuestionWrapper>
          <EmojiRangeQuestion
            value={selectedValue ? parseInt(selectedValue, 10) : undefined}
            onChange={(value) => setSelectedValue(String(value))}
          />
        </QuestionWrapper>
      );

    case 'text':
      return (
        <QuestionWrapper>
          <VOCTextQuestion
            value={textValue}
            onChange={setTextValue}
            placeholder={question.config?.placeholder as string}
          />
        </QuestionWrapper>
      );

    case 'choice':
      return (
        <QuestionWrapper>
          <SingleAndMultipleChoiceQuestion
            choices={question.choices || []}
            value={selectedValue}
            onChange={(value) => {
              if (typeof value === 'string') {
                setSelectedValue(value);
              } else if (Array.isArray(value) && value.length > 0) {
                setSelectedValue(String(value[0]));
              }
            }}
            multiple={question.config?.multiple as boolean}
          />
        </QuestionWrapper>
      );

    case 'pending':
      return (
        <QuestionWrapper>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-yellow-600 mb-2'>Componente en desarrollo</h3>
            <p className='text-sm text-gray-600'>El componente para {currentStepKey} está pendiente de implementación</p>
          </div>
        </QuestionWrapper>
      );

    default:
      return (
        <QuestionWrapper>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-red-600 mb-2'>Componente no implementado</h3>
            <p className='text-sm text-gray-600'>No existe implementación para el tipo: {questionType}</p>
          </div>
        </QuestionWrapper>
      );
  }
};

export const ScreenComponent: React.FC<{ data: ScreenStep; onContinue?: () => void }> = ({ data, onContinue }) => {
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className='flex flex-col items-center justify-center h-full w-full'>
      <h2 className='text-2xl font-bold mb-2'>{data.title || 'Pantalla'}</h2>
      <p>{data.message || ''}</p>
      {data.startButtonText && (
        <button
          className='mt-8 font-semibold py-2 px-6 rounded transition w-full max-w-lg bg-blue-600 hover:bg-blue-700 text-white'
          style={{ minHeight: 48 }}
          onClick={handleContinue}
        >
          {data.startButtonText}
        </button>
      )}
    </div>
  );
};

export const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full gap-10'>
    <h2 className='text-2xl font-bold'>Componente desconocido</h2>
    <p>No se pudo renderizar este tipo de componente</p>
    <pre className='text-sm text-gray-500'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);
