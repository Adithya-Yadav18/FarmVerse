import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdMenu, MdNotifications, MdDarkMode, MdLightMode,
  MdPerson, MdSettings, MdLogout, MdKeyboardArrowDown,
  MdDoneAll, MdCheckCircle, MdWarning, MdError, MdInfo, MdArrowForward
} from 'react-icons/md';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { initials, cn, timeAgo } from '../../utils';

interface NavbarProps {
  collapsed: boolean;
  onMenuClick: () => void;
}

const NOTIF_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  error: { icon: <MdError />, bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' },
  warning: { icon: <MdWarning />, bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' },
  success: { icon: <MdCheckCircle />, bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981' },
  info: { icon: <MdInfo />, bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' },
};

export function Navbar({ collapsed, onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null!);
  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null!);
  useClickOutside(notifRef, () => setNotifOpen(false));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={cn(styles.navbar, collapsed ? styles.collapsed : '')}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Toggle menu">
          <MdMenu />
        </button>
      </div>

      <div className={styles.right}>
        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <MdLightMode /> : <MdDarkMode />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className={styles.iconBtn}
            onClick={() => setNotifOpen(o => !o)}
            aria-label={`${unreadCount} unread notifications`}
            aria-expanded={notifOpen}
          >
            <MdNotifications />
            {unreadCount > 0 && (
              <span className={styles.badgeCount}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className={styles.notifDropdown}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.notifHeader}>
                  <div className={styles.notifHeaderTitle}>
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className={styles.notifPill}>{unreadCount} new</span>}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className={styles.notifMarkAllBtn}
                      onClick={() => markAllAsRead()}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                      <MdDoneAll size={32} style={{ color: 'var(--color-emerald)', opacity: 0.5, marginBottom: 8 }} />
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>All caught up!</p>
                      <p style={{ fontSize: 12, margin: '4px 0 0 0' }}>No notifications to show.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(n => {
                      const iconConfig = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
                      return (
                        <div
                          key={n.id}
                          className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.link) {
                              navigate(n.link);
                              setNotifOpen(false);
                            }
                          }}
                        >
                          <div
                            className={styles.notifIconWrap}
                            style={{ background: iconConfig.bg, color: iconConfig.color }}
                          >
                            {iconConfig.icon}
                          </div>
                          <div className={styles.notifContent}>
                            <h5 className={styles.notifTitle}>{n.title}</h5>
                            <p className={styles.notifMsg}>{n.message}</p>
                            <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                          </div>
                          {!n.read && <div className={styles.notifDot} />}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className={styles.notifFooter}>
                  <Link
                    to="/notifications"
                    className={styles.notifFooterLink}
                    onClick={() => setNotifOpen(false)}
                  >
                    View All in Notification Center <MdArrowForward size={14} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.divider} />

        {/* Profile dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className={styles.profileBtn}
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.avatar}>{user ? initials(user.name) : 'U'}</div>
            <span className={styles.profileName}>{user?.name ?? 'User'}</span>
            <MdKeyboardArrowDown className={styles.chevron} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className={styles.dropdown}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownName}>{user?.name}</p>
                  <p className={styles.dropdownEmail}>{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <MdPerson size={18} /> My Profile
                </Link>
                <Link
                  to="/settings"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <MdSettings size={18} /> Settings
                </Link>
                <div className={styles.dropdownDivider} />
                <button
                  className={cn(styles.dropdownItem, styles.danger)}
                  onClick={handleLogout}
                >
                  <MdLogout size={18} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
