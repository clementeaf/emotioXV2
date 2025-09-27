/**
 * Research Domain Types
 */

// Re-export types from existing research types
export type {
  Research,
  CreateResearchRequest,
  UpdateResearchRequest,
  ResearchAPIResponse,
  ResearchListResponse,
  ResearchType,
  ResearchStatus,
  ResearchRecord,
  ResearchConfig,
  ResearchFormData,
  ResearchCreationResponse,
  ResearchBasicData
} from '@/types/research';

// Additional research-specific types for the domain
export interface ResearchFilters {
  status?: string;
  type?: string;
  search?: string;
}

export interface ResearchListParams {
  page?: number;
  limit?: number;
  filters?: ResearchFilters;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}