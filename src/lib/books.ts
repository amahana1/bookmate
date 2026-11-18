import type { Book, BookLang, Category, Locale } from '../types';
import { matchesQuery } from './normalize';

export interface BookFilter {
  q: string;
  language: BookLang | 'all';
  category: Category | 'all';
  availableOnly: boolean;
}

export type DisplayStatus = 'available' | 'reserved' | 'on_loan' | 'paused';

export function displayStatus(b: Book): DisplayStatus {
  if (b.loan_state === 'on_loan') return 'on_loan';
  if (b.loan_state === 'reserved') return 'reserved';
  if (b.status === 'paused') return 'paused';
  return 'available';
}

export function filterBooks(books: Book[], f: BookFilter): Book[] {
  return books.filter(
    (b) =>
      (f.language === 'all' || b.language === f.language) &&
      (f.category === 'all' || b.category === f.category) &&
      (!f.availableOnly || displayStatus(b) === 'available') &&
      matchesQuery(b, f.q),
  );
}

const COLLATORS: Record<Locale, Intl.Collator> = {
  fa: new Intl.Collator('fa'),
  de: new Intl.Collator('de'),
  en: new Intl.Collator('en'),
};

export function sortBooks(books: Book[], by: 'newest' | 'title', locale: Locale): Book[] {
  const copy = [...books];
  if (by === 'title') return copy.sort((a, b) => COLLATORS[locale].compare(a.title, b.title));
  return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function paginate<T>(items: T[], page: number, size = 12): { items: T[]; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((p - 1) * size, p * size), pages };
}

export const BOOK_LANGS: BookLang[] = ['fa', 'de', 'en', 'ar', 'tr', 'uk', 'ru', 'ku', 'bilingual', 'other'];
export const CATEGORIES: Category[] = ['novel', 'poetry', 'children', 'history_society', 'biography_graphic', 'other'];

/** Stable 0–3 index choosing one of the four doc 3 cover colour combinations. */
export function coverVariant(id: string): 0 | 1 | 2 | 3 {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 4) as 0 | 1 | 2 | 3;
}
