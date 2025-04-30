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