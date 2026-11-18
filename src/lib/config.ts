/** Unknown facts stay as bracketed placeholders (doc 3 §2). Replace here once known. */
export const CONTACT_EMAIL = '[ایمیل تماس]';
export const ADMIN_TELEGRAM = '[تلگرام ادمین]';
export const TELEGRAM_GROUP_URL = '#';
export const INSTAGRAM_URL = '#';
export const MEETUP_PLACE_PLACEHOLDER = '[محل برگزاری]';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const EMAIL_ENABLED = import.meta.env.VITE_EMAIL_ENABLED === 'true';
export const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://bookmate.onrender.com';
