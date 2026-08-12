import api from './api';
import type { Notification, PaginatedResponse } from '../types';

export const notificationService = {
  getAll: async (filters: Record<string, unknown> = {}): Promise<PaginatedResponse<Notification>> => {
    const { data } = await api.get<PaginatedResponse<Notification>>('/notifications', { params: filters });
    return data;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
