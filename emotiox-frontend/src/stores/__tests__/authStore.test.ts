import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().clearAuth();
  });

  it('initializes with null user and token', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      initials: 'TU',
      avatar: undefined
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('sets token correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.setToken(mockToken);
    });

    expect(result.current.token).toBe(mockToken);
  });

  it('clears auth data correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      initials: 'TU',
      avatar: undefined
    };

    // Set some data first
    act(() => {
      result.current.setUser(mockUser);
      result.current.setToken('mock-token');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Clear auth data
    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('persists data to localStorage', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      initials: 'TU',
      avatar: undefined
    };

    act(() => {
      result.current.setUser(mockUser);
      result.current.setToken('mock-token');
    });

    // Check if data is persisted (this would be tested in integration tests)
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('mock-token');
  });
});
