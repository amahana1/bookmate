import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../types';
import { formatDate, formatNumber, formatTime } from '../lib/format';
import { translate, type TKey, type TVars } from './translate';

const STORAGE_KEY = 'bm-locale';

interface I18n {
  t: (key: TKey, vars?: TVars) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: 'rtl' | 'ltr';
  num: (n: number) => string;
  date: (iso: string) => string;
  time: (iso: string) => string;
}

const Ctx = createContext<I18n | null>(null);

function readStored(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'fa' || v === 'de' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStored() ?? 'fa');

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable: choice lasts for this visit */
    }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = locale;
    el.dir = locale === 'fa' ? 'rtl' : 'ltr';
  }, [locale]);

  const value = useMemo<I18n>(
    () => ({
      t: (key, vars) => translate(locale, key, vars),
      locale,
      setLocale,
      dir: locale === 'fa' ? 'rtl' : 'ltr',
      num: (n) => formatNumber(n, locale),
      date: (iso) => formatDate(iso, locale),
      time: (iso) => formatTime(iso, locale),
    }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useT must be used inside I18nProvider');
  return v;
}

export type { TKey };
