import React from 'react';
import { QuestionComponent } from '../QuestionComponent';
import { 
  DEFAULT_SMARTVOC_CONFIGS, 
  createScaleConfig, 
  extractMaxSelections, 
  createQuestionConfig 
} from '../../../utils/smartVOCUtils';

interface RendererArgs {
  contentConfiguration?: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: unknown;
  eyeTrackingConfig?: unknown;
  formData?: Record<string, unknown>;
  [key: string]: unknown;
}

export const SmartVOCRenderers: Record<string, (args: RendererArgs) => React.ReactNode> = {
  smartvoc_csat: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const displayType = contentConfiguration?.type || 'stars';
    const scaleConfig = createScaleConfig(DEFAULT_SMARTVOC_CONFIGS.CSAT);
    
    const config = {
      ...scaleConfig,
      type: displayType,
      ...(displayType === 'numbers' && {
        leftLabel: '1',
        rightLabel: '5'
      })
    };

    return (
      <QuestionComponent
        question={createQuestionConfig(
          contentConfiguration || {},
          currentQuestionKey,
          displayType === 'stars' ? 'emoji' : 'scale',
          { ...config, type: displayType === 'stars' ? 'stars' : 'scale' }
        )}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_ces: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 1, end: 5 };
    const customLabels = {
      startLabel: String(contentConfiguration?.startLabel || ''),
      endLabel: String(contentConfiguration?.endLabel || '')
    };
    
    const config = createScaleConfig(DEFAULT_SMARTVOC_CONFIGS.CES, {
      min: scaleRange.start,
      max: scaleRange.end,
      ...customLabels
    });

    return (
      <QuestionComponent
        question={createQuestionConfig(
          contentConfiguration || {},
          currentQuestionKey,
          'scale',
          config as Record<string, unknown>
        )}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_cv: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 1, end: 5 };
    const maxValue = scaleRange.end;
    const customStartLabel = String(contentConfiguration?.startLabel || '');
    const customEndLabel = String(contentConfiguration?.endLabel || '');

    let leftLabel = customStartLabel || 'No en absoluto';
    let rightLabel = customEndLabel || 'Totalmente';
    let startLabel = customStartLabel || 'No en absoluto';
    let endLabel = customEndLabel || 'Totalmente';

    if (!customStartLabel && !customEndLabel) {
      if (maxValue === 5) {
        leftLabel = `1 - No en absoluto`;
        rightLabel = `5 - Totalmente`;
        startLabel = `1 - No en absoluto`;
        endLabel = `5 - Totalmente`;
      } else if (maxValue === 7) {
        leftLabel = `1 - No en absoluto`;
        rightLabel = `7 - Totalmente`;
        startLabel = `1 - No en absoluto`;
        endLabel = `7 - Totalmente`;
      } else {
        leftLabel = `1 - No en absoluto`;
        rightLabel = `10 - Totalmente`;
        startLabel = `1 - No en absoluto`;
        endLabel = `10 - Totalmente`;
      }
    }

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'CV'),
          questionKey: currentQuestionKey,
          type: 'scale',
          config: {
            min: scaleRange.start,
            max: scaleRange.end,
            leftLabel,
            rightLabel,
            startLabel,
            endLabel,
            instructions: contentConfiguration?.instructions as string
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_nps: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 0, end: 10 };
    const maxValue = scaleRange.end;

    let leftLabel = 'No lo recomendaría';
    let rightLabel = 'Lo recomendaría';
    let startLabel = 'No lo recomendaría';
    let endLabel = 'Lo recomendaría';

    if (maxValue === 6) {
      leftLabel = '0 - No lo recomendaría';
      rightLabel = '6 - Lo recomendaría';
      startLabel = '0 - No lo recomendaría';
      endLabel = '6 - Lo recomendaría';
    } else {
      leftLabel = '0 - No lo recomendaría';
      rightLabel = '10 - Lo recomendaría';
      startLabel = '0 - No lo recomendaría';
      endLabel = '10 - Lo recomendaría';
    }

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'NPS'),
          questionKey: currentQuestionKey,
          type: 'scale',
          config: {
            min: scaleRange.start,
            max: scaleRange.end,
            leftLabel,
            rightLabel,
            startLabel,
            endLabel,
            instructions: contentConfiguration?.instructions as string
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_nev: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const instructions = String(contentConfiguration?.instructions || '');
    const maxSelections = extractMaxSelections(instructions);

    return (
      <QuestionComponent
        question={createQuestionConfig(
          contentConfiguration || {},
          currentQuestionKey,
          'emojis',
          {
            maxSelections,
            instructions: contentConfiguration?.instructions as string
          }
        )}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_voc: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => (
    <QuestionComponent
      question={createQuestionConfig(
        contentConfiguration || {},
        currentQuestionKey,
        'text',
        {
          placeholder: String(contentConfiguration?.placeholder || 'Escribe tu opinión aquí...')
        }
      )}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),
};
