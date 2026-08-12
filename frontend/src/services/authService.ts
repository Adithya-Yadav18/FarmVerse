import api from './api';
import type { LoginCredentials, RegisterData, User, AuthTokens } from '../types';

interface LoginResponse { user: User; tokens: AuthTokens; }
interface RegisterResponse { user: User; tokens: AuthTokens; }

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  register: async (payload: RegisterData): Promise<RegisterResponse> => {
    const { data } = await api.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<{ data: User }>('/auth/me');
    return data.data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<{ data: User }>('/auth/profile', payload);
    return data.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/auth/change-password', payload);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },
};
