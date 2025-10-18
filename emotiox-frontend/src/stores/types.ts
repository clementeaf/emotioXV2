/**
 * User interface for authentication
 */
export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  _hasHydrated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}
