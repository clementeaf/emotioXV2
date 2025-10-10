/**
 * Utilidades para SmartVOC renderers
 */

export interface ScaleConfig extends Record<string, unknown> {
  min: number;
  max: number;
  leftLabel: string;
  rightLabel: string;
  startLabel: string;
  endLabel: string;
}

/**
 * Configuraciones por defecto para diferentes tipos de SmartVOC
 */
export const DEFAULT_SMARTVOC_CONFIGS = {
  CSAT: {
    min: 1,
    max: 5,
    leftLabel: 'Muy insatisfecho',
    rightLabel: 'Muy satisfecho',
    startLabel: 'Muy insatisfecho',
    endLabel: 'Muy satisfecho'
  },
  CES: {
    min: 1,
    max: 5,
    leftLabel: 'Muy fácil',
    rightLabel: 'Muy difícil',
    startLabel: 'Muy fácil',
    endLabel: 'Muy difícil'
  },
  CV: {
    min: 1,
    max: 5,
    leftLabel: 'No en absoluto',
    rightLabel: 'Totalmente',
    startLabel: 'No en absoluto',
    endLabel: 'Totalmente'
  },
  NPS: {
    min: 0,
    max: 10,
    leftLabel: 'No lo recomendaría',
    rightLabel: 'Lo recomendaría',
    startLabel: 'No lo recomendaría',
    endLabel: 'Lo recomendaría'
  }
} as const;

/**
 * Crea configuración de escala con valores personalizados
 */
export const createScaleConfig = (
  baseConfig: ScaleConfig,
  customConfig?: Partial<ScaleConfig>
): ScaleConfig => {
  const config = { ...baseConfig, ...customConfig };
  
  // Generar labels con valores si no están personalizados
  if (!customConfig?.leftLabel && !customConfig?.rightLabel) {
    config.leftLabel = `${config.min} - ${config.leftLabel}`;
    config.rightLabel = `${config.max} - ${config.rightLabel}`;
    config.startLabel = `${config.min} - ${config.startLabel}`;
    config.endLabel = `${config.max} - ${config.endLabel}`;
  }
  
  return config;
};

/**
 * Extrae el número máximo de selecciones de las instrucciones
 */
export const extractMaxSelections = (instructions: string): number => {
  const patterns = [
    /selecciona\s+maximo\s+(\d+)\s+emociones/i,
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
    const match = instructions.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number > 0 && number <= 10) {
        return number;
      }
    }
  }
  
  return 4; // Fallback por defecto
};

/**
 * Crea configuración base para QuestionComponent
 */
export const createQuestionConfig = (
  contentConfiguration: Record<string, unknown>,
  currentQuestionKey: string,
  type: string,
  config: Record<string, unknown>
) => ({
  title: String(contentConfiguration?.title || ''),
  questionKey: currentQuestionKey,
  type,
  config: {
    ...config,
    instructions: contentConfiguration?.instructions as string
  },
  choices: [],
  description: String(contentConfiguration?.description || '')
});
