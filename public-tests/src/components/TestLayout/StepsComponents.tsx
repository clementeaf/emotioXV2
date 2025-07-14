import React from 'react';
import { RankingList } from '../flow/questions/components/RankingList';
import { NavigationFlowTask } from './NavigationFlowTask';
import PreferenceTestTask from './PreferenceTestTask';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';
import { Question as OriginalQuestion, ScreenStep } from './types';

// Extiendo la interfaz Question para incluir 'files' opcional
export interface Question extends OriginalQuestion {
  files?: unknown[];
}

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
  if (
    (currentStepKey === 'cognitive_single_choice' && Array.isArray(question.choices)) ||
    (currentStepKey === 'cognitive_multiple_choice' && Array.isArray(question.choices))
  ) {
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
  if (currentStepKey === 'cognitive_ranking' && Array.isArray(question.choices)) {
    const [ranking, setRanking] = React.useState<string[]>(
      (question.choices ?? []).map((c) => c.id)
    );
    const handleMoveUp = (index: number) => {
      if (index === 0) return;
      const newRanking = [...ranking];
      [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];
      setRanking(newRanking);
    };
    const handleMoveDown = (index: number) => {
      if (index === ranking.length - 1) return;
      const newRanking = [...ranking];
      [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
      setRanking(newRanking);
    };
    const orderedItems = ranking
      .map(id => (question.choices ?? []).find(c => c.id === id)?.text || '');
    return (
      <div className='flex flex-col items-center justify-center h-full gap-10'>
        <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
        <RankingList
          items={orderedItems}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          isSaving={false}
          isApiLoading={false}
          dataLoading={false}
        />
      </div>
    );
  }
  if (currentStepKey === 'cognitive_navigation_flow' && question.files) {
    return <NavigationFlowTask stepConfig={question} />;
  }
  if (currentStepKey === 'cognitive_preference_test' && question.files) {
    const [selectedImageId, setSelectedImageId] = React.useState<string | null>(null);
    const handleImageSelect = (imageId: string) => {
      setSelectedImageId(imageId);
    };
    return (
      <PreferenceTestTask
        stepConfig={question}
        selectedImageId={selectedImageId}
        onImageSelect={handleImageSelect}
      />
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
