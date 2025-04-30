import { ParticipantFlowStep } from "../types/flow";

export const flowSequence = [
    ParticipantFlowStep.WELCOME,
    ParticipantFlowStep.SMART_VOC,
    ParticipantFlowStep.COGNITIVE_TASK,
    ParticipantFlowStep.DONE // DONE marca el final
];