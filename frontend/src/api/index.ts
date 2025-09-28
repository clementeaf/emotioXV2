/**
 * Main API Barrel Export
 * Central point for all API domain exports
 */

// Auth domain
export { authApi, useLogin, useRegister, useLogout, useProfile, useAuth, useRequireAuth } from './domains/auth';
export type { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './domains/auth';

// Research domain
export {
  researchApi,
  useResearchList,
  useResearchById,
  useUserResearch,
  useCreateResearch,
  useUpdateResearch,
  useDeleteResearch,
  useUpdateResearchStatus,
  researchKeys
} from './domains/research';
export type {
  Research,
  CreateResearchRequest,
  UpdateResearchRequest,
  ResearchAPIResponse,
  ResearchListParams,
  ResearchFilters
} from './domains/research';

// Eye-Tracking domain
export {
  eyeTrackingApi,
  useEyeTrackingData,
  useEyeTrackingBuild,
  useEyeTrackingRecruit,
  useEyeTrackingResults,
  eyeTrackingKeys
} from './domains/eye-tracking';
export type {
  EyeTrackingData,
  EyeTrackingBuildConfig,
  EyeTrackingResults,
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitParticipant,
  EyeTrackingRecruitStats,
  RecruitmentLink,
  EyeTrackingStage,
  UseEyeTrackingDataReturn
} from './domains/eye-tracking';

// Clients domain
export {
  clientsApi,
  useClients,
  useClientsFromResearch,
  useClientById,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useActiveClients,
  useClientStats,
  clientsKeys
} from './domains/clients';
export type {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  ClientsListParams,
  ClientResearchData
} from './domains/clients';

// Welcome Screen domain
export {
  welcomeScreenApi,
  useWelcomeScreenData,
  useWelcomeScreenValidation,
  useCreateWelcomeScreen,
  useUpdateWelcomeScreen,
  useDeleteWelcomeScreen,
  welcomeScreenKeys
} from './domains/welcome-screen';
export type {
  WelcomeScreenData,
  WelcomeScreenResponse,
  WelcomeScreenRecord,
  WelcomeScreenFormData,
  CreateWelcomeScreenRequest,
  UpdateWelcomeScreenRequest
} from './domains/welcome-screen';

// Thank You Screen domain
export {
  thankYouScreenApi,
  useThankYouScreenData,
  useThankYouScreenValidation,
  useCreateThankYouScreen,
  useUpdateThankYouScreen,
  useDeleteThankYouScreen,
  thankYouScreenKeys
} from './domains/thank-you-screen';
export type {
  ThankYouScreenModel,
  ThankYouScreenFormData,
  ThankYouScreenConfig,
  CreateThankYouScreenRequest,
  UpdateThankYouScreenRequest
} from './domains/thank-you-screen';

// Smart VOC domain
export {
  smartVocApi,
  useSmartVOCData,
  useSmartVOCValidation,
  useCreateSmartVOC,
  useUpdateSmartVOC,
  useDeleteSmartVOC,
  smartVocKeys
} from './domains/smart-voc';
export type {
  SmartVOCFormData,
  SmartVOCFormResponse,
  SmartVOCQuestion,
  QuestionConfig,
  CreateSmartVOCRequest,
  UpdateSmartVOCRequest
} from './domains/smart-voc';

// Cognitive Task domain
export {
  cognitiveTaskApi,
  useCognitiveTaskData,
  useCognitiveTaskValidation,
  useCreateCognitiveTask,
  useUpdateCognitiveTask,
  useDeleteCognitiveTask,
  cognitiveTaskKeys
} from './domains/cognitive-task';
export type {
  CognitiveTaskFormData,
  CognitiveTaskModel,
  CognitiveTaskFormResponse,
  Question,
  QuestionType,
  CreateCognitiveTaskRequest,
  UpdateCognitiveTaskRequest
} from './domains/cognitive-task';

// Companies domain
export {
  companiesApi,
  useCompanies,
  useCompanyById,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  companiesKeys
} from './domains/companies';
export type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest
} from './domains/companies';

// Future domains will be added here:
// export { participantsApi } from './domains/participants';
// etc.