// Tipos básicos
export * from './types/auth.types';
export * from './types/emotion.types';
export * from './types/websocket.types';
export { isUserBySchema, User, userSchema };

// Tipos de usuario con manejo de conflictos
    import { isUser as isUserBySchema, User, userSchema } from './types/user.types';

// Re-exportar todos los modelos de research
    export * from '../interfaces/research.model';

// Exportar selectivamente de research.interface para evitar conflictos
import {
    DEFAULT_RESEARCH_CONFIG,
    ResearchConfig,
    ResearchCreationResponse,
    ResearchFormData,
    ResearchRecord,
    ResearchUpdate
} from '../interfaces/research.interface';

export {
    DEFAULT_RESEARCH_CONFIG, ResearchConfig, ResearchCreationResponse, ResearchFormData, ResearchRecord, ResearchUpdate
};

// Exportar modelo de pantalla de bienvenida
    export * from '../interfaces/welcome-screen.interface';
    export * from '../utils';

// Exportar explícitamente buildQuestionDictionary y QuestionDictionary
export { QuestionDictionary } from '../interfaces/question-dictionary.interface';
export { buildQuestionDictionary } from '../utils/buildQuestionDictionary';
