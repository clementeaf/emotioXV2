/**
 * Research status types
 */
export type ResearchStatus = 'draft' | 'active' | 'in-progress' | 'completed' | 'cancelled';

/**
 * Research type
 */
export type ResearchType = 'behavioural' | 'neuromarketing' | 'ux-research';

/**
 * Research interface
 */
export interface Research {
  id: string;
  name: string;
  companyId: string;
  type: ResearchType;
  technique: string;
  description: string;
  targetParticipants: number;
  objectives: string[];
  tags: string[];
  status: ResearchStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Research API response interface
 */
export interface ResearchAPIResponse extends Research {
  // Additional fields that might come from API
  participants?: number;
  progress?: number;
  companyName?: string;
}

/**
 * Research list response interface
 */
export interface ResearchListResponse {
  data: ResearchAPIResponse[];
  total: number;
  page: number;
  limit: number;
}
