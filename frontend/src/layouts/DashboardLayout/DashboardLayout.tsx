import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Navbar } from '../Navbar/Navbar';
import { ErrorBoundary } from '../../components/common/ErrorBoundary/ErrorBoundary';
import styles from './DashboardLayout.module.css';
import { cn } from '../../utils';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={cn(styles.main, collapsed ? styles.collapsed : '')}>
        <Navbar
          collapsed={collapsed}
          onMenuClick={() => setMobileOpen(o => !o)}
        />

        <main className={styles.content}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
