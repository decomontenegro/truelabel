import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from './authStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('setAuth', () => {
    it('should set user and token', () => {
      const user = { id: '1', name: 'Test User', email: 'test@example.com' };
      const token = 'test-token';

      act(() => {
        useAuthStore.getState().setAuth(user as any, token);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('should clear user and token', () => {
      // Set initial auth state
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'Test User' } as any,
          token: 'test-token',
          isAuthenticated: true,
        });
      });

      // Clear auth
      act(() => {
        useAuthStore.getState().clearAuth();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      act(() => {
        useAuthStore.getState().setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      const initialUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      
      act(() => {
        useAuthStore.setState({ user: initialUser as any });
      });

      const updates = { name: 'Updated User' };
      
      act(() => {
        useAuthStore.getState().updateUser(updates);
      });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated User');
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should not update if no user', () => {
      act(() => {
        useAuthStore.getState().updateUser({ name: 'Test' });
      });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });


  describe('state management', () => {
    it('should manage authentication state correctly', () => {
      const user = { id: '1', name: 'Test User', email: 'test@example.com' };
      const token = 'test-token';

      // Set auth
      act(() => {
        useAuthStore.getState().setAuth(user as any, token);
      });

      let state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
      expect(state.isAuthenticated).toBe(true);

      // Clear auth
      act(() => {
        useAuthStore.getState().clearAuth();
      });

      state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});