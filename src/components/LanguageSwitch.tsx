import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import type { Locale } from '../types';

const OPTIONS: { value: Locale; label: string; lang: string }[] = [
  { value: 'fa', label: 'فارسی', lang: 'fa' },
  { value: 'de', label: 'Deutsch', lang: 'de' },
  { value: 'en', label: 'English', lang: 'en' },
];

export function LanguageSwitch() {
  const { locale, setLocale, t } = useT();
  const { session } = useAuth();
  const choose = (l: Locale) => {
    setLocale(l);
    if (session) void supabase.from('profiles').update({ locale: l }).eq('id', session.user.id);
  };
  return (
    <div className="lang-switch" role="group" aria-label={t('nav.language')}>
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" lang={o.lang} aria-pressed={locale === o.value} onClick={() => choose(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
