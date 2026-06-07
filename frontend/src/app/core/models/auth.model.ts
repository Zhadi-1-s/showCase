export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  branch?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  branch?: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface ProfileResponse {
  user: AuthUser;
}
