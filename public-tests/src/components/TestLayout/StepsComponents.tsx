import React from 'react';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';
import { Question, ScreenStep } from './types';

export const QuestionComponent: React.FC<{ question: Question; currentStepKey: string }> = ({ question, currentStepKey }) => {
  console.log('question', question);
  if (
    currentStepKey === 'smartvoc_csat' ||
    currentStepKey === 'smartvoc_ces' ||
    currentStepKey === 'smartvoc_cv' ||
    currentStepKey === 'smartvoc_nps' ||
    currentStepKey === 'smartvoc_nc' ||
    currentStepKey === 'cognitive_linear_scale'
  ) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-10'>
        <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
        <ScaleRangeQuestion
          min={
            (question.config?.min as number) ||
            ((question.config?.scaleRange as { start?: number })?.start as number)
          }
          max={
            (question.config?.max as number) ||
            ((question.config?.scaleRange as { end?: number })?.end as number)
          }
          leftLabel={question.config?.startLabel as string}
          rightLabel={question.config?.endLabel as string}
        />
      </div>
    );
  }
  if (currentStepKey === 'smartvoc_nev') {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-10'>
        <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
        <EmojiRangeQuestion />
      </div>
    );
  }
  if (
    currentStepKey === 'smartvoc_voc' ||
    currentStepKey === 'cognitive_short_text' ||
    currentStepKey === 'cognitive_long_text'
  ) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-10'>
        <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
        <VOCTextQuestion />
      </div>
    );
  }
  if (currentStepKey === 'cognitive_single_choice' && Array.isArray(question.choices) || currentStepKey === 'cognitive_multiple_choice' && Array.isArray(question.choices)) {
    const [selected, setSelected] = React.useState<string>('');
    const handleChange = (value: string | string[]) => {
      if (typeof value === 'string') setSelected(value);
    };
    return (
      <div className='flex flex-col items-center justify-center h-full gap-10'>
        <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
        <SingleAndMultipleChoiceQuestion
          choices={question.choices}
          value={selected}
          onChange={handleChange}
        />
      </div>
    );
  }
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
      <div className='mb-2 text-xs text-gray-500'>StepKey actual: {currentStepKey}</div>
      <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(question, null, 2)}</pre>
    </div>
  );
};

export const ScreenComponent: React.FC<{ data: ScreenStep }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full w-full'>
    <h2 className='text-2xl font-bold mb-2'>{data.title || 'Pantalla'}</h2>
    <p>{data.message || ''}</p>
    {data.startButtonText && (
      <button
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition w-full max-w-lg"
        style={{ minHeight: 48 }}
      >
        {data.startButtonText}
      </button>
    )}
  </div>
);

export const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full'>
    <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);
