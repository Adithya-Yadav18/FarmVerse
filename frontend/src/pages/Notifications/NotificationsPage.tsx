import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdNotifications,
  MdDoneAll,
  MdDelete,
  MdInfo,
  MdWarning,
  MdError,
  MdCheckCircle,
  MdOpenInNew,
  MdRefresh,
  MdFilterList
} from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils';
import type { NotificationSeverity, NotificationCategory } from '../../types';

const TYPE_ICON: Record<NotificationSeverity, React.ReactNode> = {
  error: <MdError />,
  warning: <MdWarning />,
  success: <MdCheckCircle />,
  info: <MdInfo />,
};

type FilterType = 'all' | 'unread' | NotificationCategory;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeNotification(id);
    toast.success('Notification dismissed');
  };

  const handleNotificationClick = async (id: string, link?: string) => {
    await markAsRead(id);
    if (link) {
      navigate(link);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.category === activeFilter;
  });

  const categories: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${notifications.length})` },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'DISEASE', label: 'Disease Alerts' },
    { key: 'SOIL', label: 'Soil & Sensors' },
    { key: 'IRRIGATION', label: 'Irrigation' },
    { key: 'WEATHER', label: 'Weather' },
    { key: 'PRESCRIPTION', label: 'Prescriptions' },
  ];

  return (
    <div>
      <PageHeader
        title="Notification Center"
        subtitle={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''} requiring attention`}
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="outline"
              leftIcon={<MdRefresh className={loading ? 'animate-spin' : ''} />}
              onClick={refreshNotifications}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              leftIcon={<MdDoneAll />}
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, overflowX: 'auto', paddingBottom: 6 }}>
        {categories.map(c => {
          const isActive = activeFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveFilter(c.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--border-radius-full)',
                background: isActive ? 'var(--color-emerald)' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isActive ? '1.5px solid var(--color-emerald)' : '1.5px solid var(--border-color)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {c.key === 'unread' && unreadCount > 0 && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#fff' : 'var(--color-error)' }} />
              )}
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 840 }}>
        {loading && notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <MdNotifications size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: 'var(--bg-card)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <MdNotifications size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>No notifications found</h4>
            <p style={{ fontSize: 14 }}>
              {activeFilter === 'unread'
                ? 'You are all caught up! No unread alerts.'
                : `No notifications recorded for category "${activeFilter}".`}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                onClick={() => handleNotificationClick(n.id, n.link)}
                style={{
                  background: n.read ? 'var(--bg-card)' : 'var(--bg-secondary)',
                  borderLeft: `4px solid ${
                    n.type === 'error'
                      ? 'var(--color-error)'
                      : n.type === 'warning'
                      ? 'var(--color-warning)'
                      : n.type === 'success'
                      ? 'var(--color-success)'
                      : 'var(--color-info)'
                  }`,
                  borderTop: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  cursor: n.link ? 'pointer' : 'default',
                  opacity: n.read ? 0.75 : 1,
                  boxShadow: n.read ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Type Icon */}
                <span
                  style={{
                    fontSize: 24,
                    color: `var(--color-${n.type})`,
                    flexShrink: 0,
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {TYPE_ICON[n.type] || <MdInfo />}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, margin: 0 }}>
                        {n.title}
                      </h4>
                      {n.category && (
                        <Badge variant={n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'neutral'}>
                          {n.category}
                        </Badge>
                      )}
                      {!n.read && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: 'var(--color-emerald)',
                            display: 'inline-block'
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 8px 0' }}>
                    {n.message}
                  </p>

                  {n.link && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-emerald)', fontWeight: 600 }}>
                      <span>View details</span>
                      <MdOpenInNew size={14} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkRead(e, n.id)}
                      title="Mark as read"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: 'var(--color-emerald)',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <MdDoneAll />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleRemove(e, n.id)}
                    title="Dismiss"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: 'var(--color-error)',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <MdDelete />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

