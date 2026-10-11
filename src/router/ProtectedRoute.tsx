import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClientSession } from '@/features/auth/sessionStore';
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useClientSession((state) => state.session);
  const location = useLocation();
  if (!session)
    return (
      <Navigate
        to={`/?${new URLSearchParams({ login: '1', returnTo: location.pathname + location.search + location.hash })}`}
        replace
      />
    );
  return children;
}
