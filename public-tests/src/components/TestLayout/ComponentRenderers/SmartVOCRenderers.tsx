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
    
    // 🎯 Para CES, usar "Muy difícil" (1) y "Muy fácil" (5) como etiquetas extremas por defecto
    // Solo usar labels personalizados si están definidos y no están vacíos
    const customStartLabel = String(contentConfiguration?.startLabel || '').trim();
    const customEndLabel = String(contentConfiguration?.endLabel || '').trim();
    
    const config = createScaleConfig(DEFAULT_SMARTVOC_CONFIGS.CES, {
      min: scaleRange.start,
      max: scaleRange.end,
      // Solo usar labels personalizados si están definidos, sino usar los valores por defecto
      ...(customStartLabel && { startLabel: customStartLabel }),
      ...(customEndLabel && { endLabel: customEndLabel }),
      ...(customStartLabel && { leftLabel: customStartLabel }),
      ...(customEndLabel && { rightLabel: customEndLabel })
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

    // Si no se encontró número en las instrucciones, no se pasa maxSelections
    // Esto permite que el usuario presione "Guardar y continuar" manualmente
    const config: Record<string, unknown> = {
      instructions: contentConfiguration?.instructions as string
    };
    
    if (maxSelections !== undefined) {
      config.maxSelections = maxSelections;
    }

    return (
      <QuestionComponent
        question={createQuestionConfig(
          contentConfiguration || {},
          currentQuestionKey,
          'detailed',
          config
        )}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_voc: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const rawPlaceholder = String(contentConfiguration?.placeholder || '').trim();
    const placeholder = rawPlaceholder && rawPlaceholder.length > 0 
      ? rawPlaceholder 
      : 'Escribe tu opinión aquí...';
    
    return (
      <QuestionComponent
        question={createQuestionConfig(
          contentConfiguration || {},
          currentQuestionKey,
          'text',
          {
            placeholder
          }
        )}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },
};
