import { describe, it, expect, vi } from 'vitest';
import type { User, AuthState } from '../types';

describe('Store Types', () => {
  describe('User interface', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        initials: 'JD',
        avatar: 'avatar-url'
      };

      expect(user.id).toBe('1');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.initials).toBe('JD');
      expect(user.avatar).toBe('avatar-url');
    });

    it('should allow optional avatar', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        initials: 'JD'
      };

      expect(user.avatar).toBeUndefined();
    });
  });

  describe('AuthState interface', () => {
    it('should have correct structure when authenticated', () => {
      const authState: AuthState = {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          initials: 'JD'
        },
        token: 'jwt-token',
        isAuthenticated: true,
        _hasHydrated: true,
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
        clearAuth: vi.fn()
      };

      expect(authState.user).toBeDefined();
      expect(authState.token).toBe('jwt-token');
      expect(authState.isAuthenticated).toBe(true);
    });

    it('should have correct structure when not authenticated', () => {
      const authState: AuthState = {
        user: null,
        token: null,
        isAuthenticated: false,
        _hasHydrated: true,
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
        clearAuth: vi.fn()
      };

      expect(authState.user).toBeNull();
      expect(authState.token).toBeNull();
      expect(authState.isAuthenticated).toBe(false);
    });
  });

  describe('Type compatibility', () => {
    it('should allow User to be assigned to AuthState user', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        initials: 'JD'
      };

      const authState: AuthState = {
        user,
        token: 'token',
        isAuthenticated: true,
        _hasHydrated: true,
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
        clearAuth: vi.fn()
      };

      expect(authState.user).toEqual(user);
    });

    it('should allow null user in AuthState', () => {
      const authState: AuthState = {
        user: null,
        token: null,
        isAuthenticated: false,
        _hasHydrated: true,
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
        clearAuth: vi.fn()
      };

      expect(authState.user).toBeNull();
    });
  });
});
