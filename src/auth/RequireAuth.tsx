import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { buildLoginUrl } from '../lib/auth-url';
import { Loading } from '../components/Loading';

/** Sends logged-out visitors to log in and back to this exact page afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!session) return <Navigate to={buildLoginUrl(loc.pathname + loc.search)} replace />;
  return <>{children}</>;
}
