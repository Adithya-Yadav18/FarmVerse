import api from './api';
import type {
  AdminUserSummary,
  PlatformStats,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
  CreateUserByAdminPayload,
} from '../types';

export const adminService = {
  getAllUsers: async (): Promise<AdminUserSummary[]> => {
    const { data } = await api.get<AdminUserSummary[]>('/admin/users');
    return data;
  },

  getUserById: async (id: number | string): Promise<AdminUserSummary> => {
    const { data } = await api.get<AdminUserSummary>(`/admin/users/${id}`);
    return data;
  },

  updateUserRole: async (id: number | string, payload: UpdateUserRolePayload): Promise<AdminUserSummary> => {
    const { data } = await api.put<AdminUserSummary>(`/admin/users/${id}/role`, payload);
    return data;
  },

  updateUserStatus: async (id: number | string, payload: UpdateUserStatusPayload): Promise<AdminUserSummary> => {
    const { data } = await api.put<AdminUserSummary>(`/admin/users/${id}/status`, payload);
    return data;
  },

  createUser: async (payload: CreateUserByAdminPayload): Promise<AdminUserSummary> => {
    const { data } = await api.post<AdminUserSummary>('/admin/users', payload);
    return data;
  },

  getStats: async (): Promise<PlatformStats> => {
    const { data } = await api.get<PlatformStats>('/admin/stats');
    return data;
  },
};

export default adminService;
