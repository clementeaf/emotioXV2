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

// Future domains will be added here:
// export { companiesApi } from './domains/companies';
// export { participantsApi } from './domains/participants';
// etc.