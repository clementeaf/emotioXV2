// src/types/flow.ts

import { Step as SidebarStep } from '../components/layout/types';

// Definición centralizada de los pasos del flujo de participantes
export enum ParticipantFlowStep {
    LOGIN,
    WELCOME,
    SMART_VOC,
    COGNITIVE_TASK,
    DONE,
    LOADING_SESSION,
    ERROR
}

// <<< AÑADIR Y EXPORTAR ExpandedStep >>>
export type ExpandedStep = SidebarStep & {
  type: string;       // Tipo específico del paso/pregunta (e.g., 'welcome', 'cognitive_short_text', 'smartvoc_csat')
  config?: any;       // Configuración específica del paso (datos de la pregunta, textos, etc.)
  responseKey?: string; // Identificador único del módulo para vincular respuestas
  // Podríamos añadir más campos si son necesarios para la lógica
}; 