import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard, MdAgriculture, MdGrass, MdWaterDrop, MdCloud,
  MdBugReport, MdAutoAwesome, MdNotifications, MdAssessment,
  MdSettings, MdPerson, MdLogout, MdChevronLeft, MdChevronRight,
  MdScience,
} from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { initials } from '../../utils';
import { cn } from '../../utils';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
    ],
  },
  {
    section: 'Farm Management',
    items: [
      { to: '/farms', icon: <MdAgriculture />, label: 'Farms' },
      { to: '/crops', icon: <MdGrass />, label: 'Crops' },
      { to: '/soil', icon: <MdScience />, label: 'Soil Analysis' },
      { to: '/irrigation', icon: <MdWaterDrop />, label: 'Irrigation' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { to: '/weather', icon: <MdCloud />, label: 'Weather' },
      { to: '/disease', icon: <MdBugReport />, label: 'Disease Detection' },
      { to: '/ai-recommendations', icon: <MdAutoAwesome />, label: 'AI Recommendations' },
    ],
  },
  {
    section: 'Reports & Settings',
    items: [
      { to: '/notifications', icon: <MdNotifications />, label: 'Notifications', badge: true },
      { to: '/reports', icon: <MdAssessment />, label: 'Reports' },
      { to: '/profile', icon: <MdPerson />, label: 'Profile' },
      { to: '/settings', icon: <MdSettings />, label: 'Settings' },
    ],
  },
];

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={styles.mobileOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          styles.sidebar,
          collapsed ? styles.collapsed : '',
          mobileOpen ? styles.mobileOpen : ''
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <GiWheat color="#1B4332" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className={styles.logoText}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.logoName}>FarmVerse</span>
                <span className={styles.logoTagline}>Smart Agriculture</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(section => (
            <div key={section.section} className={styles.navSection}>
              {!collapsed && (
                <p className={styles.sectionLabel}>{section.section}</p>
              )}
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(styles.navLink, isActive ? styles.active : '')}
                  onClick={mobileOpen ? onMobileClose : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}
                  {item.badge && unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className={styles.footer}>
          <NavLink
            to="/profile"
            className={styles.userCard}
            onClick={mobileOpen ? onMobileClose : undefined}
          >
            <div className={styles.avatar}>{user ? initials(user.name) : 'U'}</div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user?.name ?? 'User'}</p>
                <p className={styles.userRole}>{user?.role ?? 'Farmer'}</p>
              </div>
            )}
          </NavLink>

          <button
            className={cn(styles.navLink, '')}
            onClick={handleLogout}
            style={{ marginTop: 4 }}
            title={collapsed ? 'Logout' : undefined}
          >
            <span className={styles.navIcon}><MdLogout /></span>
            {!collapsed && <span className={styles.navLabel}>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ display: 'flex' }}
        >
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </aside>
    </>
  );
}
