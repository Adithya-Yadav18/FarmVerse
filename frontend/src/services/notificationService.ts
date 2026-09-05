import api from './api';
import type { Notification } from '../types';

export interface UnreadCountResponse {
  unreadCount: number;
}

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get<Notification[]>('/notifications');
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return data.unreadCount;
  },

  markAsRead: async (id: string | number): Promise<Notification> => {
    const { data } = await api.put<Notification>(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (id: string | number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
