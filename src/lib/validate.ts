import type { TKey } from '../i18n/translate';
import { isBerlinPostcode } from './berlin';
import { toAsciiDigits } from './format';
import type { Handover } from '../types';

export type Errors<T> = Partial<Record<keyof T, TKey>>;

export interface SignupValues {
  firstName: string;
  email: string;
  password: string;
  postcode: string;
  neighbourhood: string;
  telegram: string;
  acceptedRules: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_RE = /^[A-Za-z0-9_]{5,32}$/;

/** Telegram username without "@" or spaces; empty becomes null. */
export function normalizeTelegram(s: string): string | null {
  const v = s.trim().replace(/^@/, '');
  return v === '' ? null : v;
}

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

export function postcodeError(raw: string): TKey | undefined {
  const v = toAsciiDigits(raw.trim());
  if (!/^\d{5}$/.test(v)) return 'signup.error.postcode';
  if (!isBerlinPostcode(v)) return 'signup.error.notBerlin';
  return undefined;
}

export function telegramError(raw: string): TKey | undefined {
  const tg = normalizeTelegram(raw);
  return tg !== null && !TELEGRAM_RE.test(tg) ? 'signup.error.telegram' : undefined;
}

export interface BookFormValues {
  title: string;
  title_latin: string;
  author: string;
  translator: string;
  publisher: string;
  language: string;
  category: string;
  year: string;
  condition: string;
  loan_months: '1' | '2' | '3';
  handover_methods: Handover[];
}

/** Year is optional; when given it must be a Gregorian year from 1800 to the current year. */
export function validateBook(v: BookFormValues, currentYear = new Date().getFullYear()): Errors<BookFormValues> {
  const e: Errors<BookFormValues> = {};
  if (!v.title.trim()) e.title = 'book.error.required';
  if (!v.author.trim()) e.author = 'book.error.required';
  if (!v.language) e.language = 'book.error.required';
  if (!v.category) e.category = 'book.error.required';
  if (!v.condition) e.condition = 'book.error.required';
  if (v.handover_methods.length === 0) e.handover_methods = 'book.error.handover';
  const y = toAsciiDigits(v.year.trim());
  if (y && (!/^\d{4}$/.test(y) || Number(y) < 1800 || Number(y) > currentYear)) e.year = 'book.error.year';
  return e;
}

export function validateSignup(v: SignupValues): Errors<SignupValues> {
  const e: Errors<SignupValues> = {};
  if (!v.firstName.trim()) e.firstName = 'signup.error.firstName';
  if (!isValidEmail(v.email)) e.email = 'signup.error.email';
  if (v.password.length < 8) e.password = 'signup.error.password';
  const pc = postcodeError(v.postcode);
  if (pc) e.postcode = pc;
  if (!v.neighbourhood) e.neighbourhood = 'signup.error.neighbourhood';
  const tg = telegramError(v.telegram);
  if (tg) e.telegram = tg;
  if (!v.acceptedRules) e.acceptedRules = 'signup.error.rules';
  return e;
}
