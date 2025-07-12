// Tipos básicos
export * from './src/types/auth.types';
export * from './src/types/emotion.types';
export * from './src/types/websocket.types';
export { isUserBySchema, userSchema };
export type { User };

// Tipos de usuario con manejo de conflictos
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

// Exportar explícitamente buildQuestionDictionary y QuestionDictionary
export type { QuestionDictionary } from './interfaces/question-dictionary.interface';
export { buildQuestionDictionary } from './utils/buildQuestionDictionary';

// Exportar QuestionType enum
export { QuestionType } from './interfaces/question-types.enum';
