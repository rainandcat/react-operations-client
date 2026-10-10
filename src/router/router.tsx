import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { ProtectedRoute } from './ProtectedRoute';

const WalletOverviewPage = lazy(() => import('@/features/account/WalletOverviewPage'));
const HomePage = lazy(() => import('@/features/markets/HomePage'));
const MarketDetailPage = lazy(() => import('@/features/markets/MarketDetailPage'));
const ActivityPage = lazy(() => import('@/features/activities/ActivityPage'));
const ActivityDetailPage = lazy(() => import('@/features/activities/ActivityDetailPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const PreferencesPage = lazy(() => import('@/features/preferences/PreferencesPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: <ClientLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'markets/:symbol', element: <MarketDetailPage /> },
      {
        path: 'wallet/overview',
        element: (
          <ProtectedRoute>
            <WalletOverviewPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'activity',
        element: (
          <ProtectedRoute>
            <ActivityPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'activity/:activityId',
        element: (
          <ProtectedRoute>
            <ActivityDetailPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'preferences',
        element: (
          <ProtectedRoute>
            <PreferencesPage />
          </ProtectedRoute>
        )
      }
    ]
  },
  { path: '*', element: <NotFoundPage />, errorElement: <RouteErrorPage /> }
]);
