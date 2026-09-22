import api from './api';
import type { LoginCredentials, RegisterData, User, AuthTokens } from '../types';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  mfaRequired?: boolean;
  email?: string;
  otpCode?: string;
  message?: string;
}
interface RegisterResponse { user: User; tokens: AuthTokens; }

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  verifyMfa: async (payload: { email: string; otp: string }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/verify-mfa', payload);
    return data;
  },

  resendMfa: async (payload: { email: string }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/resend-mfa', payload);
    return data;
  },

  register: async (payload: RegisterData): Promise<RegisterResponse> => {
    const { data } = await api.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    // Graceful client-side session cleanup
    return Promise.resolve();
  },

  refreshToken: async (_refreshToken: string): Promise<AuthTokens> => {
    // Return empty tokens if invoked
    return { accessToken: '', refreshToken: '' };
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<{ data: User }>('/auth/me');
    return data.data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await api.put<{ data: User }>('/auth/profile', payload);
    return data.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; email?: string }): Promise<void> => {
    let email = payload.email;
    if (!email) {
      try {
        const raw = localStorage.getItem('farmverse_user');
        if (raw) email = JSON.parse(raw).email;
      } catch {}
    }
    await api.put('/auth/change-password', { ...payload, email });
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; email: string; resetToken?: string; message: string }> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (payload: { email: string; token: string; password: string }): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },
};
