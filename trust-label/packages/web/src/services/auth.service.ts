import { api } from '@/lib/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  API_ENDPOINTS 
} from '@trust-label/shared';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data;
      api.setAuthTokens(accessToken, refreshToken);
      return response.data;
    }
    
    throw new Error(response.error || 'Login failed');
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data;
      api.setAuthTokens(accessToken, refreshToken);
      return response.data;
    }
    
    throw new Error(response.error || 'Registration failed');
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(API_ENDPOINTS.AUTH.ME);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to get user');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH);
    
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data;
      api.setAuthTokens(accessToken, refreshToken);
      return response.data;
    }
    
    throw new Error(response.error || 'Token refresh failed');
  }

  logout() {
    api.clearAuth();
    // Clear any other auth-related data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  }
}

export const authService = new AuthService();