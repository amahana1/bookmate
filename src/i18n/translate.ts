import type { Locale } from '../types';
import { formatNumber } from '../lib/format';
import { fa } from './fa';
import { de } from './de';
import { en } from './en';

export type TKey = keyof typeof fa;
export type TVars = Record<string, string | number>;

const DICTS: Record<Locale, Record<string, string>> = { fa, de, en };

/** Looks up `key` and fills `{name}` placeholders; numbers use the locale's digits. */
export function translate(locale: Locale, key: string, vars?: TVars): string {
  const template = DICTS[locale][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = vars[name];
    if (v === undefined) return m;
    return typeof v === 'number' ? formatNumber(v, locale) : v;
  });
}
