// Tipos básicos
export * from './src/types/auth.types';
export * from './src/types/emotion.types';
export * from './src/types/websocket.types';

// Tipos centralizados del backend
export * from './types/backend-core.types';
export { isUserBySchema, userSchema };
export type { User };

// Tipos de usuario
    import { isUser as isUserBySchema, User, userSchema } from './src/types/user.types';

// Re-exportar todos los modelos de research
    export * from './interfaces/research.model';

// Exportar selectivamente de research.interface para evitar conflictos
import {
    DEFAULT_RESEARCH_CONFIG,
    ResearchConfig,
    ResearchCreationResponse,
    ResearchFormData,
    ResearchRecord,
    ResearchUpdate
} from './interfaces/research.interface';

export { DEFAULT_RESEARCH_CONFIG };
export type {
    ResearchConfig,
    ResearchCreationResponse,
    ResearchFormData,
    ResearchRecord,
    ResearchUpdate
};

// Exportar modelo de pantalla de bienvenida
    export * from './interfaces/welcome-screen.interface';
    export * from './utils';

// Exportar explícitamente QuestionDictionary
export type { QuestionDictionary } from './interfaces/question-dictionary.interface';
// TODO: Rehabilitar buildQuestionDictionary cuando se resuelva el problema de Vite/Rollup
// export { buildQuestionDictionary } from './utils/buildQuestionDictionary';

// Exportar QuestionType enum
export { QuestionType } from './interfaces/question-types.enum';

// Exportar todas las interfaces
export * from './interfaces/eye-tracking.interface';
export * from './interfaces/newResearch.interface';
export * from './interfaces/smart-voc.interface';
export * from './interfaces/thank-you-screen.interface';
