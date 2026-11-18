import { toAsciiDigits } from './format';

/** Normalises text for search: Persian/Arabic letter variants, diacritics, ZWNJ, spaces, case and digits. */
export function normalizeForSearch(s: string): string {
  return toAsciiDigits(
    s
      .normalize('NFC')
      .toLowerCase()
      .replace(/ي/g, 'ی')
      .replace(/ى/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/ة/g, 'ه')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[‌‍]/g, '')
      .replace(/\s+/g, ''),
  );
}

type Searchable = { title: string; title_latin: string | null; author: string; translator: string | null };

/** True when every whitespace-separated word of the query appears in one of the book's searchable fields. */
export function matchesQuery(book: Searchable, query: string): boolean {
  const words = query.trim().split(/\s+/).filter(Boolean).map(normalizeForSearch).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [book.title, book.title_latin, book.author, book.translator].filter(Boolean).map((f) => normalizeForSearch(f as string)).join('|');
  return words.every((w) => haystack.includes(w));
}
