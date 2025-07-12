import type { SmartVOCScaleConfig } from '../types/smart-voc.types';

export const smartVOCTypeMap: { [key: string]: string } = {
  CSAT: 'smartvoc_csat',
  CES: 'smartvoc_ces',
  CV: 'smartvoc_cv',
  NPS: 'smartvoc_nps',
  NEV: 'smartvoc_nev',
  VOC: 'smartvoc_feedback',
};

export function mapSmartVOCType(type: string): string {
  return smartVOCTypeMap[type] || 'smartvoc_csat';
}

// Utilidad para generar los niveles de satisfacción a partir de la configuración
export function generateSatisfactionLevels(config: SmartVOCScaleConfig) {
  if (!config || !config.scaleRange || !config.startLabel || !config.endLabel) {
    return [];
  }
  const { start, end } = config.scaleRange;
  const { startLabel, endLabel } = config;
  const levels = [];
  for (let i = start; i <= end; i++) {
    if (i === start) {
      levels.push({ value: i, label: startLabel });
    } else if (i === end) {
      levels.push({ value: i, label: endLabel });
    } else {
      levels.push({ value: i, label: '' });
    }
  }
  return levels;
}
