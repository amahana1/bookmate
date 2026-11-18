import type { Locale } from '../types';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const FA_MONTHS = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
export const TIME_ZONE = 'Europe/Berlin';

/** Converts Persian (۰–۹) and Arabic-Indic (٠–٩) digits to ASCII digits. */
export function toAsciiDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Replaces ASCII digits with Persian digits. */
export function toPersianDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function formatNumber(n: number, locale: Locale): string {
  const s = String(n);
  return locale === 'fa' ? toPersianDigits(s) : s;
}

/** Date-only strings are calendar dates; timestamps are shown as the Berlin calendar day. */
function toDate(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
}

function berlinParts(d: Date): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { day: get('day'), month: get('month'), year: get('year') };
}

export function formatDate(iso: string, locale: Locale): string {
  const d = toDate(iso);
  if (locale === 'fa') {
    const { day, month, year } = berlinParts(d);
    return `${toPersianDigits(String(day))} ${FA_MONTHS[month - 1]} ${toPersianDigits(String(year))}`;
  }
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** Time of day (HH:MM, 24h) in Berlin, with the locale's digits. */
export function formatTime(iso: string, locale: Locale): string {
  const s = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  return locale === 'fa' ? toPersianDigits(s) : s;
}

function berlinWallClock(d: Date): { y: number; mo: number; da: number; h: number; mi: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), mo: get('month'), da: get('day'), h: get('hour'), mi: get('minute') };
}

/** Berlin wall-clock date (YYYY-MM-DD) and time (HH:MM) to a UTC ISO timestamp. */
export function berlinLocalToIso(date: string, time: string): string {
  const [y, mo, da] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const target = Date.UTC(y, mo - 1, da, h, mi);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const w = berlinWallClock(new Date(guess));
    guess += target - Date.UTC(w.y, w.mo - 1, w.da, w.h, w.mi);
  }
  return new Date(guess).toISOString();
}

/** UTC ISO timestamp to Berlin wall-clock date and time. */
export function isoToBerlinLocal(iso: string): { date: string; time: string } {
  const w = berlinWallClock(new Date(iso));
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${w.y}-${p(w.mo)}-${p(w.da)}`, time: `${p(w.h)}:${p(w.mi)}` };
}

/** Today's calendar date in Berlin as YYYY-MM-DD. */
export function berlinToday(now: Date = new Date()): string {
  const { day, month, year } = berlinParts(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
