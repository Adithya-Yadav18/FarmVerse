import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string | number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        notificationService.getNotifications().catch(() => []),
        notificationService.getUnreadCount().catch(() => 0)
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to sync notifications', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch and 45-second background sync
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
      const interval = setInterval(() => {
        notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
      }, 45000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshNotifications]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotif: Notification = {
      ...n,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (!newNotif.read) {
      setUnreadCount(c => c + 1);
    }
  }, []);

  const markAsRead = useCallback(async (id: string | number) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => String(n.id) === String(id) ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  }, []);

  const removeNotification = useCallback(async (id: string | number) => {
    // Optimistic UI update
    const target = notifications.find(n => String(n.id) === String(id));
    setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
    if (target && !target.read) {
      setUnreadCount(c => Math.max(0, c - 1));
    }
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
