/**
 * Main API Barrel Export
 * Central point for all API domain exports
 */

// Auth domain
export { authApi, useLogin, useRegister, useLogout, useProfile, useAuth, useRequireAuth } from './domains/auth';
export type { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './domains/auth';

// Future domains will be added here:
// export { researchApi } from './domains/research';
// export { companiesApi } from './domains/companies';
// export { participantsApi } from './domains/participants';
// etc.