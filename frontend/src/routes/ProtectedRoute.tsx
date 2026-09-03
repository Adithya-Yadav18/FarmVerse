import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const normalizeRole = (role?: string): UserRole => {
  if (!role) return 'Normal User';
  const clean = role.replace('ROLE_', '').toUpperCase();
  if (clean.includes('ADMIN')) return 'Admin';
  if (clean.includes('AGRONOMIST')) return 'Agronomist';
  if (clean.includes('NORMAL') || clean === 'USER') return 'Normal User';
  return 'Farmer';
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div
          className="animate-spin"
          style={{
            width: 40,
            height: 40,
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--color-emerald)',
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const userRole = normalizeRole(user.role);
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
