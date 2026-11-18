import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Public URL of a cover image stored in the `covers` bucket. */
export function coverUrl(path: string): string {
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
}
