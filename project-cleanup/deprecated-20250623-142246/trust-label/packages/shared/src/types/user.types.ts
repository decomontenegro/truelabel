export enum UserRole {
  ADMIN = 'ADMIN',
  BRAND = 'BRAND',
  LABORATORY = 'LABORATORY',
  PRESCRIBER = 'PRESCRIBER',
  CONSUMER = 'CONSUMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}