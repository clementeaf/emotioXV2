 
import React from 'react';
import { QuestionComponent } from './QuestionComponent';
import { SmartVOCRenderers } from './ComponentRenderers/SmartVOCRenderers';
import { screenRenderers } from './ComponentRenderers/ScreenRenderers';
import { cognitiveRenderers } from './ComponentRenderers/CognitiveRenderers';
import { demographicRenderers } from './demographic';

import { QuotaResult, EyeTrackingConfig } from './components/ThankYouScreenTypes';

interface RendererArgs {
  contentConfiguration?: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: QuotaResult;
  eyeTrackingConfig?: EyeTrackingConfig;
  formData?: Record<string, unknown>;
  [key: string]: unknown;
}

const RENDERERS: Record<string, (args: RendererArgs) => React.ReactNode> = {
  // 🎯 SCREEN RENDERERS
  ...screenRenderers,

  // 🎯 DEMOGRAPHIC RENDERERS  
  ...demographicRenderers,

  // 🎯 SMARTVOC RENDERERS
  smartvoc: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta SmartVOC'),
        questionKey: currentQuestionKey,
        type: currentQuestionKey,
        config: contentConfiguration,
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),
  ...SmartVOCRenderers,

  // 🎯 COGNITIVE RENDERERS
  ...cognitiveRenderers
};

export const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full gap-10'>
    <h2 className='text-2xl font-bold'>Componente desconocido</h2>
    <p>No se pudo renderizar este tipo de componente</p>
    <pre className='text-sm text-gray-500'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);


export { RENDERERS };
