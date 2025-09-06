/**
 * Public Tests Types
 * Re-export common types for public tests
 */

// Re-export shared types
export * from '../../../shared/types/backend-core.types';
export * from '../../../shared/interfaces/research.interface';

// Local types for public tests
export interface TestLayoutProps {
  researchId: string;
  participantId?: string;
}

export interface NavigationStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}