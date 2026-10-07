import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClientSession } from '@/features/auth/sessionStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useClientSession((state) => state.session);
  const location = useLocation();
  if (!session)
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
