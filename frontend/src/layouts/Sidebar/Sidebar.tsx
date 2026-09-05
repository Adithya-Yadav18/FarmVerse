import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard, MdAgriculture, MdGrass, MdWaterDrop, MdCloud,
  MdBugReport, MdAutoAwesome, MdNotifications, MdAssessment,
  MdSettings, MdPerson, MdLogout, MdChevronLeft, MdChevronRight,
  MdScience, MdSatelliteAlt,
} from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { initials } from '../../utils';
import { cn } from '../../utils';
import type { UserRole } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: boolean;
  roles?: UserRole[];
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const ALL_ROLES: UserRole[] = ['Admin', 'Farmer', 'Agronomist', 'Normal User'];
const AGRI_ROLES: UserRole[] = ['Admin', 'Farmer', 'Agronomist'];
const FARM_OPERATORS: UserRole[] = ['Admin', 'Farmer'];

const NAV_CONFIG: NavSection[] = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard', roles: ALL_ROLES },
    ],
  },
  {
    section: 'Farm Management',
    items: [
      { to: '/farms', icon: <MdAgriculture />, label: 'Farms', roles: AGRI_ROLES },
      { to: '/crops', icon: <MdGrass />, label: 'Crops', roles: AGRI_ROLES },
      { to: '/soil', icon: <MdScience />, label: 'Soil Analysis', roles: AGRI_ROLES },
      { to: '/irrigation', icon: <MdWaterDrop />, label: 'Irrigation', roles: FARM_OPERATORS },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { to: '/weather', icon: <MdCloud />, label: 'Weather', roles: ALL_ROLES },
      { to: '/satellite', icon: <MdSatelliteAlt />, label: 'Satellite NDVI', roles: ALL_ROLES },
      { to: '/disease', icon: <MdBugReport />, label: 'Disease Detection', roles: AGRI_ROLES },
      { to: '/ai-recommendations', icon: <MdAutoAwesome />, label: 'AI Advisory', roles: ALL_ROLES },
    ],
  },
  {
    section: 'Reports & Settings',
    items: [
      { to: '/notifications', icon: <MdNotifications />, label: 'Notifications', badge: true, roles: ALL_ROLES },
      { to: '/reports', icon: <MdAssessment />, label: 'Reports', roles: AGRI_ROLES },
      { to: '/profile', icon: <MdPerson />, label: 'Profile', roles: ALL_ROLES },
      { to: '/settings', icon: <MdSettings />, label: 'Settings', roles: ALL_ROLES },
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

  // Resolve clean role string
  const rawRole = (user?.role || 'Farmer').replace('ROLE_', '').replace('_', ' ');
  const normalizedRole: UserRole =
    rawRole.toLowerCase().includes('normal') || rawRole.toLowerCase() === 'user'
      ? 'Normal User'
      : rawRole.toLowerCase().includes('admin')
      ? 'Admin'
      : rawRole.toLowerCase().includes('agronomist')
      ? 'Agronomist'
      : 'Farmer';

  // Dynamically filter sections based on active user role
  const dynamicSections = NAV_CONFIG.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.includes(normalizedRole)),
  })).filter(section => section.items.length > 0);

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

        {/* Navigation - Dynamically filtered by RBAC */}
        <nav className={styles.nav}>
          {dynamicSections.map(section => (
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
                <p className={styles.userRole}>{normalizedRole}</p>
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
