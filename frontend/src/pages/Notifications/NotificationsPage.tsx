import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdNotifications, MdDoneAll, MdDelete, MdInfo, MdWarning, MdError, MdCheckCircle } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils';
import type { Notification, NotificationSeverity } from '../../types';

const MOCK_NOTIFS: Notification[] = [
  { id: '1', title: 'Soil Moisture Critical', message: 'Block B soil moisture has dropped below 25%. Immediate irrigation recommended.', type: 'error', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '2', title: 'Disease Alert', message: 'Early blight detected in Tomato Sector 3 with 94% confidence. Treatment required.', type: 'warning', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: '3', title: 'Harvest Complete', message: 'Wheat harvest in North Valley Farm Block C completed. Yield: 12.4 tonnes.', type: 'success', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: '4', title: 'Weather Advisory', message: 'Heavy rainfall expected Wednesday-Thursday. Consider rescheduling irrigation.', type: 'info', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: '5', title: 'Irrigation Completed', message: 'Zone A automatic irrigation cycle completed. 2,400 litres applied.', type: 'success', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

const TYPE_ICON: Record<NotificationSeverity, React.ReactNode> = {
  error: <MdError />,
  warning: <MdWarning />,
  success: <MdCheckCircle />,
  info: <MdInfo />,
};

const TYPE_VARIANT = { error: 'error', warning: 'warning', success: 'success', info: 'info' } as const;

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAll = () => { setNotifs(n => n.map(x => ({ ...x, read: true }))); toast.success('All marked as read'); };
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const remove = (id: string) => { setNotifs(n => n.filter(x => x.id !== id)); toast.success('Notification dismissed'); };

  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = notifs.filter(n => filter === 'all' || !n.read);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          <Button variant="outline" leftIcon={<MdDoneAll />} onClick={markAll} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px', borderRadius: 'var(--border-radius-full)',
              background: filter === f ? 'var(--color-emerald)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
              border: filter === f ? 'none' : '1.5px solid var(--border-color)',
            }}
          >
            {f === 'all' ? `All (${notifs.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 760 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <MdNotifications size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No {filter === 'unread' ? 'unread ' : ''}notifications</p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: n.read ? 'var(--bg-card)' : 'var(--bg-primary)',
                borderLeft: `4px solid ${n.read ? 'var(--border-color)' : `var(--color-${n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : n.type === 'success' ? 'success' : 'info'})`}`,
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '16px 18px',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                opacity: n.read ? 0.75 : 1,
              }}
            >
              <span style={{ fontSize: 22, color: `var(--color-${n.type})`, flexShrink: 0, marginTop: 2 }}>
                {TYPE_ICON[n.type]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{n.title}</h4>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--color-emerald)', fontSize: 16, display: 'flex' }}
                  >
                    <MdDoneAll />
                  </button>
                )}
                <button
                  onClick={() => remove(n.id)}
                  title="Dismiss"
                  style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--color-error)', fontSize: 16, display: 'flex' }}
                >
                  <MdDelete />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
