import React from 'react';
import { Question, ScreenStep, StepData } from './types';

export const ParentStepComponent: React.FC<{ parent: StepData; question: Question }> = ({ parent, question }) => (
  <div className='flex flex-col items-center justify-center h-full'>
    <div className='mb-2 font-semibold'>Módulo: {parent.derivedType || parent.originalSk}</div>
    <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
    <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(question, null, 2)}</pre>
  </div>
);

export const QuestionComponent: React.FC<{ question: Question }> = ({ question }) => (
  <div className='flex flex-col items-center justify-center h-full'>
    <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
    <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(question, null, 2)}</pre>
  </div>
);

export const ScreenComponent: React.FC<{ data: ScreenStep }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full'>
    <h2 className='text-2xl font-bold mb-2'>{data.title || 'Pantalla'}</h2>
    <p>{data.message || ''}</p>
    {data.startButtonText && <button className='bg-blue-500 text-white p-2 rounded'>{data.startButtonText}</button>}
  </div>
);

export const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full'>
    <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);
