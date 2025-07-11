// src/types/flow.ts

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

// Definición local de SidebarStep para evitar importación problemática
export interface SidebarStep {
  id: string;
  name: string;
  completed?: boolean;
  current?: boolean;
  instructions?: string;
}

// <<< AÑADIR Y EXPORTAR ExpandedStep >>>
export type ExpandedStep = SidebarStep & {
  type: string;       // Tipo específico del paso/pregunta (e.g., 'welcome', 'cognitive_short_text', 'smartvoc_csat')
  config?: unknown;   // Configuración específica del paso (datos de la pregunta, textos, etc.)
  responseKey?: string; // Identificador único del módulo para vincular respuestas
  questionKey?: string; // NUEVO: Clave única de pregunta proveniente del backend
  // Podríamos añadir más campos si son necesarios para la lógica
};
