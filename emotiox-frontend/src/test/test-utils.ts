import { vi } from 'vitest';
import type { User } from '../stores/types';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  initials: 'TU',
  avatar: undefined,
  ...overrides,
});

export const createMockAuthStore = () => ({
  user: createMockUser(),
  token: 'mock-token',
  isAuthenticated: true,
  setUser: vi.fn(),
  setToken: vi.fn(),
  clearAuth: vi.fn(),
  login: vi.fn(),
});

export const mockApiResponse = <T,>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString()
});

export const expectToBeInTheDocument = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
};

export const expectToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

export const expectToHaveTextContent = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};
