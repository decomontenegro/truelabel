import api from './api';
import { AuthResponse, LoginForm, RegisterForm, User } from '@/types';
import { mockAuthService, shouldUseMockAuth } from './mockAuthService';

export const authService = {
  // Login with API fallback
  async login(data: LoginForm): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      console.warn('API login failed, using mock service:', error.message);

      // Fallback to mock service if API is not available
      if (shouldUseMockAuth() || error.response?.status >= 500) {
        return await mockAuthService.login(data);
      }

      throw error;
    }
  },

  // Register with API fallback
  async register(data: RegisterForm): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      console.warn('API register failed, using mock service:', error.message);

      // Fallback to mock service if API is not available
      if (shouldUseMockAuth() || error.response?.status >= 500) {
        return await mockAuthService.register(data);
      }

      throw error;
    }
  },

  // Get profile with API fallback
  async getProfile(): Promise<{ user: User }> {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      console.warn('API profile failed, using mock service:', error.message);

      // Fallback to mock service if API is not available
      if (shouldUseMockAuth() || error.response?.status >= 500) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          return await mockAuthService.getProfile(token);
        }
      }

      throw error;
    }
  },

  // Update profile (API only for now)
  async updateProfile(data: Partial<User>): Promise<{ user: User; message: string }> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Verify token with API fallback
  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error: any) {
      console.warn('API verify failed, using mock service:', error.message);

      // Fallback to mock service if API is not available
      if (shouldUseMockAuth() || error.response?.status >= 500) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          return await mockAuthService.verifyToken(token);
        }
      }

      return { valid: false, user: null as any };
    }
  },

  // Logout (clear token on client)
  logout(): void {
    // Logout is done only on client by removing token
    // No logout endpoint on server since we use stateless JWT
  },

  // Get demo credentials for testing
  getDemoCredentials() {
    return mockAuthService.getDemoCredentials();
  }
};
