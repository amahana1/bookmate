import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export type ProfilePatch = Partial<Pick<Profile, 'first_name' | 'postcode' | 'neighbourhood' | 'telegram' | 'locale'>>;

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}
