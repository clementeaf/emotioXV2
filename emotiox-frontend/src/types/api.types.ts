export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Research {
  id: string;
  name: string;
  companyId: string;
  technique: string;
  status: 'draft' | 'in-progress' | 'completed' | 'cancelled';
  stage: string;
  createdAt: string;
  updatedAt: string;
}

export interface WelcomeScreen {
  id: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThankYouScreen {
  id: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  buttonText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartVOCQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  instructions?: string;
  config: Record<string, any>;
}

export interface SmartVOCForm {
  id: string;
  researchId: string;
  questions: SmartVOCQuestion[];
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EyeTrackingConfig {
  id: string;
  researchId: string;
  isEnabled: boolean;
  settings: Record<string, any>;
  calibrationRequired?: boolean;
  recordingDuration?: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CognitiveTask {
  id: string;
  researchId: string;
  isEnabled: boolean;
  questions: any[];
  createdAt: string;
  updatedAt: string;
}

export interface S3UploadResponse {
  url: string;
  key: string;
  bucket: string;
  size?: number;
}

export interface EyeTrackingRecruitConfig {
  id: string;
  researchId: string;
  isEnabled: boolean;
  settings: Record<string, any>;
  maxParticipants?: number;
  requirements?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  researchId: string;
  status: 'active' | 'completed' | 'cancelled';
  name?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleResponse {
  id: string;
  researchId: string;
  participantId: string;
  questionKey: string;
  response: any;
  questionId?: string;
  moduleType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchInProgress {
  researchId: string;
  participants: Participant[];
  metrics: {
    totalParticipants: number;
    completedParticipants: number;
    activeParticipants: number;
  };
}

export interface AdminStats {
  totalResearch: number;
  totalParticipants: number;
  totalCompanies: number;
  activeResearch: number;
}
