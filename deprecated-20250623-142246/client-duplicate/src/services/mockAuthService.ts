/**
 * Mock Authentication Service
 * 
 * Purpose: Provide fallback authentication when API is not available
 * This is a temporary solution for development/demo purposes
 */

import { AuthResponse, LoginForm, RegisterForm, User } from '@/types';

// Mock users for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@cpgvalidation.com',
    name: 'Administrador',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'marca@exemplo.com',
    name: 'Marca Teste',
    role: 'BRAND',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'analista@labexemplo.com',
    name: 'Laboratório Teste',
    role: 'LAB',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock JWT token generator
const generateMockToken = (user: User): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  // Simple base64 encoding for demo (not secure for production)
  return btoa(JSON.stringify(payload));
};

// Mock password validation (accepts demo passwords)
const validatePassword = (password: string): boolean => {
  return password === 'admin123' || password === 'brand123' || password === 'lab123' || password === 'password' || password === '123456' || password.length >= 6;
};

export const mockAuthService = {
  // Mock login
  async login(data: LoginForm): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    const user = mockUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    
    if (!user || !validatePassword(data.password)) {
      throw new Error('Credenciais inválidas');
    }
    
    const token = generateMockToken(user);
    
    return {
      success: true,
      token,
      user,
      message: 'Login realizado com sucesso'
    };
  },

  // Mock register
  async register(data: RegisterForm): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existingUser) {
      throw new Error('Email já está em uso');
    }
    
    // Create new user
    const newUser: User = {
      id: String(mockUsers.length + 1),
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role || 'BRAND',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    
    const token = generateMockToken(newUser);
    
    return {
      success: true,
      token,
      user: newUser,
      message: 'Conta criada com sucesso'
    };
  },

  // Mock profile
  async getProfile(token: string): Promise<{ user: User }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const payload = JSON.parse(atob(token));
      const user = mockUsers.find(u => u.id === payload.userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      return { user };
    } catch {
      throw new Error('Token inválido');
    }
  },

  // Mock token verification
  async verifyToken(token: string): Promise<{ valid: boolean; user: User }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const payload = JSON.parse(atob(token));
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, user: null as any };
      }
      
      const user = mockUsers.find(u => u.id === payload.userId);
      
      if (!user) {
        return { valid: false, user: null as any };
      }
      
      return { valid: true, user };
    } catch {
      return { valid: false, user: null as any };
    }
  },

  // Get demo credentials
  getDemoCredentials() {
    return {
      admin: { email: 'admin@cpgvalidation.com', password: 'admin123' },
      brand: { email: 'marca@exemplo.com', password: 'brand123' },
      lab: { email: 'analista@labexemplo.com', password: 'lab123' }
    };
  }
};

// Check if we should use mock service
export const shouldUseMockAuth = (): boolean => {
  // Use mock auth in development or when API is not available
  return import.meta.env.MODE === 'development' || 
         import.meta.env.VITE_USE_MOCK_AUTH === 'true';
};
