/**
 * Research model types
 */

export enum ResearchType {
  BEHAVIOURAL = 'behavioural'
}

export enum ResearchStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ResearchBasicData {
  name: string;
  companyId: string;
  type?: ResearchType;
  technique?: string;
  description?: string;
}

export interface Research {
  id: string;
  name: string;
  companyId: string;
  type: ResearchType;
  technique: string;
  description?: string;
  status: ResearchStatus;
  createdAt: string;
  updatedAt: string;
}
