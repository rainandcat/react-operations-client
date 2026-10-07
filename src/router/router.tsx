import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { SignInPage } from '@/features/auth/SignInPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

const OverviewPage = lazy(() => import('@/features/account/OverviewPage'));
const ActivityPage = lazy(() => import('@/features/activities/ActivityPage'));
const ActivityDetailPage = lazy(() => import('@/features/activities/ActivityDetailPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const PreferencesPage = lazy(() => import('@/features/preferences/PreferencesPage'));

export const router = createBrowserRouter([
  { path: '/sign-in', element: <SignInPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ClientLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'activity/:activityId', element: <ActivityDetailPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'preferences', element: <PreferencesPage /> }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
]);
