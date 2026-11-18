import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useT } from '../i18n';
import type { Locale, Profile } from '../types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, postcode, neighbourhood, telegram, locale, is_admin')
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLocale } = useT();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const appliedLocaleFor = useRef<string | null>(null);

  const load = useCallback(
    async (s: Session | null) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        appliedLocaleFor.current = null;
        setLoading(false);
        return;
      }
      const p = await fetchProfile(s.user.id);
      setProfile(p);
      if (p && appliedLocaleFor.current !== p.id) {
        appliedLocaleFor.current = p.id;
        setLocale(p.locale as Locale);
      }
      setLoading(false);
    },
    [setLocale],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer: calling Supabase inside the callback can deadlock the auth client.
      setTimeout(() => load(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refreshProfile = useCallback(async () => {
    if (session) setProfile(await fetchProfile(session.user.id));
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return <Ctx.Provider value={{ session, profile, loading, refreshProfile, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
