import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Meetup } from '../types';

export async function nextMeetup(): Promise<Meetup | null> {
  const { data, error } = await supabase
    .from('meetups')
    .select('id, starts_at, ends_at, place, neighbourhood')
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Meetup | null) ?? null;
}

export async function getMeetup(id: string): Promise<Meetup | null> {
  const { data } = await supabase.from('meetups').select('id, starts_at, ends_at, place, neighbourhood').eq('id', id).maybeSingle();
  return (data as Meetup | null) ?? null;
}

export async function listMeetups(): Promise<Meetup[]> {
  const { data, error } = await supabase.from('meetups').select('id, starts_at, ends_at, place, neighbourhood').order('starts_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Meetup[];
}

/** Next upcoming meetup; `undefined` while loading, `null` when none is scheduled. */
export function useNextMeetup(): Meetup | null | undefined {
  const [m, setM] = useState<Meetup | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    nextMeetup().then((x) => alive && setM(x)).catch(() => alive && setM(null));
    return () => {
      alive = false;
    };
  }, []);
  return m;
}
