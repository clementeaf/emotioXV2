import React from 'react';
import { QuestionComponent } from '../QuestionComponent';

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

    const baseConfig = {
      min: 1,
      max: 5,
      leftLabel: 'Muy insatisfecho',
      rightLabel: 'Muy satisfecho',
      startLabel: 'Muy insatisfecho',
      endLabel: 'Muy satisfecho'
    };

    const config = {
      ...baseConfig,
      type: displayType,
      ...(displayType === 'stars' && {
        startLabel: '1 - Muy insatisfecho',
        endLabel: '5 - Muy satisfecho'
      }),
      ...(displayType === 'numbers' && {
        leftLabel: '1',
        rightLabel: '5',
        startLabel: '1 - Muy insatisfecho',
        endLabel: '5 - Muy satisfecho'
      })
    };

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'CSAT'),
          questionKey: currentQuestionKey,
          type: displayType === 'stars' ? 'emoji' : 'scale',
          config: {
            ...config,
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_ces: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => {
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 1, end: 5 };
    const startLabel = String(contentConfiguration?.startLabel || 'Muy fácil');
    const endLabel = String(contentConfiguration?.endLabel || 'Muy difícil');

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'CES'),
          questionKey: currentQuestionKey,
          type: 'scale',
          config: {
            min: scaleRange.start,
            max: scaleRange.end,
            leftLabel: startLabel,
            rightLabel: endLabel,
            startLabel: startLabel,
            endLabel: endLabel,
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
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
            instructions: contentConfiguration?.instructions
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
            instructions: contentConfiguration?.instructions
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
    const extractMaxSelections = (text: string): number => {
      const patterns = [
        /hasta\s+(\d+)/i,
        /máximo\s+(\d+)/i,
        /máx\s+(\d+)/i,
        /max\s+(\d+)/i,
        /selecciona\s+hasta\s+(\d+)/i,
        /selecciona\s+máximo\s+(\d+)/i,
        /selecciona\s+(\d+)\s+emociones/i,
        /(\d+)\s+emociones/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > 0 && number <= 10) { // Límite razonable
            return number;
          }
        }
      }
      
      return 3; // Fallback por defecto
    };
    
    const maxSelections = extractMaxSelections(instructions);

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'NEV'),
          questionKey: currentQuestionKey,
          type: 'emojis', // 🎯 TIPO CORRECTO PARA ACTIVAR AUTO-AVANCE
          config: {
            maxSelections: maxSelections,
            emotions: ['feliz', 'satisfecho', 'confiado', 'valorado', 'cuidado', 'seguro', 'enfocado', 'indulgente', 'estimulado', 'exploratorio', 'interesado', 'energico', 'descontento', 'frustrado', 'irritado', 'decepcion', 'estresado', 'infeliz', 'desatendido', 'apresurado'],
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: ''
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_voc: ({ contentConfiguration, currentQuestionKey, formData }: RendererArgs) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'VOC'),
        questionKey: currentQuestionKey,
        type: 'text',
        config: {
          placeholder: String(contentConfiguration?.placeholder || 'Escribe tu opinión aquí...'),
          instructions: contentConfiguration?.instructions
        },
        choices: [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),
};
