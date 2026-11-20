import { supabase } from '../lib/supabase';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/config';

/** A Google Books front cover as a file, through our `book-cover` function. Null when there is none or it fails. */
export async function fetchGoogleCover(volumeId: string): Promise<File | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/book-cover?id=${encodeURIComponent(volumeId)}`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], 'cover', { type: blob.type });
  } catch {
    return null;
  }
}
