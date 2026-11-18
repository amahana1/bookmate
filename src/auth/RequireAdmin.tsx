import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { RequireAuth } from './RequireAuth';
import { Loading } from '../components/Loading';
import { NotFound } from '../pages/NotFound';

/** Admin-only pages look like a missing page to everyone else. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  return (
    <RequireAuth>
      {loading ? <Loading /> : profile?.is_admin ? <>{children}</> : <NotFound />}
    </RequireAuth>
  );
}
