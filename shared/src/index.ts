// Tipos básicos
export * from './types/emotion.types';
export * from './types/websocket.types';
export * from './types/auth.types';

// Tipos de usuario con manejo de conflictos
import { User, userSchema } from './types/user.types';
import { isUser as isUserBySchema } from './types/user.types';
export { User, userSchema, isUserBySchema };

// Re-exportar todos los modelos de research
export * from '../interfaces/research.model';

// Exportar selectivamente de research.interface para evitar conflictos
import {
  ResearchConfig,
  ResearchRecord,
  ResearchFormData,
  ResearchCreationResponse,
  ResearchUpdate,
  DEFAULT_RESEARCH_CONFIG
} from '../interfaces/research.interface';

export {
  ResearchConfig,
  ResearchRecord,
  ResearchFormData,
  ResearchCreationResponse,
  ResearchUpdate,
  DEFAULT_RESEARCH_CONFIG
};

// Exportar modelo de pantalla de bienvenida
export * from '../interfaces/welcome-screen.interface'; 