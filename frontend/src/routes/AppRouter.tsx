import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout';
import { Skeleton } from '../components/ui/Skeleton/Skeleton';

// Lazy-loaded pages
const HomePage        = lazy(() => import('../pages/Home/HomePage'));
const LoginPage       = lazy(() => import('../pages/Login/LoginPage'));
const RegisterPage    = lazy(() => import('../pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPassword/ForgotPasswordPage'));
const DashboardPage   = lazy(() => import('../pages/Dashboard/DashboardPage'));
const FarmsPage       = lazy(() => import('../pages/Farms/FarmsPage'));
const CropsPage       = lazy(() => import('../pages/Crops/CropsPage'));
const SoilPage        = lazy(() => import('../pages/Soil/SoilPage'));
const WeatherPage     = lazy(() => import('../pages/Weather/WeatherPage'));
const IrrigationPage  = lazy(() => import('../pages/Irrigation/IrrigationPage'));
const DiseasePage     = lazy(() => import('../pages/Disease/DiseasePage'));
const AIPage          = lazy(() => import('../pages/AI/AIPage'));
const SatellitePage   = lazy(() => import('../pages/Satellite/SatellitePage'));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));
const ReportsPage     = lazy(() => import('../pages/Reports/ReportsPage'));
const ProfilePage     = lazy(() => import('../pages/Profile/ProfilePage'));
const SettingsPage    = lazy(() => import('../pages/Settings/SettingsPage'));
const NotFoundPage    = lazy(() => import('../pages/NotFound/NotFoundPage'));

const PageLoader = () => (
  <div style={{ padding: 40 }}>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ marginBottom: 16 }}>
        <Skeleton height={24} width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height={16} width="90%" />
      </div>
    ))}
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected - Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Universal Access (All Roles) */}
              <Route path="/dashboard"          element={<DashboardPage />} />
              <Route path="/weather"            element={<WeatherPage />} />
              <Route path="/satellite"          element={<SatellitePage />} />
              <Route path="/ai-recommendations" element={<AIPage />} />
              <Route path="/notifications"      element={<NotificationsPage />} />
              <Route path="/profile"            element={<ProfilePage />} />
              <Route path="/settings"           element={<SettingsPage />} />

              {/* Agriculture & Field Operations Access (Farmer, Agronomist, Admin) */}
              <Route element={<ProtectedRoute allowedRoles={['Farmer', 'Agronomist', 'Admin']} />}>
                <Route path="/farms"    element={<FarmsPage />} />
                <Route path="/crops"    element={<CropsPage />} />
                <Route path="/soil"     element={<SoilPage />} />
                <Route path="/disease"  element={<DiseasePage />} />
                <Route path="/reports"  element={<ReportsPage />} />
              </Route>

              {/* Farm Operator Access (Farmer, Admin) */}
              <Route element={<ProtectedRoute allowedRoles={['Farmer', 'Admin']} />}>
                <Route path="/irrigation" element={<IrrigationPage />} />
              </Route>
            </Route>
          </Route>

          {/* Redirect /index to dashboard for logged-in users */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
