import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdMenu, MdNotifications, MdDarkMode, MdLightMode,
  MdPerson, MdSettings, MdLogout, MdKeyboardArrowDown,
} from 'react-icons/md';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { initials, cn } from '../../utils';

interface NavbarProps {
  collapsed: boolean;
  onMenuClick: () => void;
}

export function Navbar({ collapsed, onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null!);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));

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

        {/* Notifications */}
        <Link to="/notifications" className={styles.iconBtn} aria-label={`${unreadCount} unread notifications`}>
          <MdNotifications />
          {unreadCount > 0 && <span className={styles.badge} aria-hidden="true" />}
        </Link>

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
