import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getMyLoans } from '../api/loans';
import { waitingForMe } from '../lib/loans';

const EVENT = 'bm-loans-changed';

/** Call after any loan action so the header badge updates without a page change. */
export function notifyLoansChanged(): void {
  window.dispatchEvent(new Event(EVENT));
}

/** Number of loans waiting for the signed-in member; refreshed on navigation and after loan actions. */
export function useWaitingCount(): number {
  const { session } = useAuth();
  const loc = useLocation();
  const [n, setN] = useState(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(EVENT, bump);
    return () => window.removeEventListener(EVENT, bump);
  }, []);
  useEffect(() => {
    if (!session) {
      setN(0);
      return;
    }
    let alive = true;
    getMyLoans()
      .then((l) => alive && setN(waitingForMe(l, session.user.id).length))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [session, loc.pathname, loc.search, tick]);
  return n;
}
