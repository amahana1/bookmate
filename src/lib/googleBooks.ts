import type { BookLang, Category } from '../types';

/** One Google Books result, already shaped for the add-book form. Empty strings mean "Google didn't say". */
export interface BookSuggestion {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  year: string;
  language: BookLang | '';
  category: Category | '';
  /** https cover thumbnail on books.google.com, or null. */
  thumbnail: string | null;
}

const KNOWN_LANGS: BookLang[] = ['fa', 'de', 'en', 'ar', 'tr', 'uk', 'ru', 'ku'];
const MAX = 200; // the form's and database's limit for every text field

export function mapLanguage(code: string | undefined): BookLang | '' {
  if (!code) return '';
  const base = code.toLowerCase().split('-')[0] as BookLang;
  return KNOWN_LANGS.includes(base) ? base : 'other';
}

// Checked in order: "Juvenile Fiction" is children's, "Social Science" is not science.
const CATEGORY_RULES: [RegExp, Category][] = [
  [/juvenile|young adult|children/i, 'children'],
  [/poetry/i, 'poetry'],
  [/history|biography|autobiography|memoir/i, 'history_biography'],
  [/psychology|self-help/i, 'psychology'],
  [/philosophy|social science|sociology|political|religion/i, 'philosophy_society'],
  [/science|education|mathematics|technology|medical|computers|study aids|nature/i, 'science_education'],
  [/fiction|stories|literary collections|comics|graphic novels/i, 'novel'],
];

export function mapCategory(categories: string[] | undefined): Category | '' {
  const text = (categories ?? []).join(' | ');
  if (!text) return '';
  return CATEGORY_RULES.find(([re]) => re.test(text))?.[1] ?? '';
}

const FIELDS = 'items(id,volumeInfo(title,subtitle,authors,publisher,publishedDate,language,categories,imageLinks/thumbnail))';

export function buildSearchUrl(q: string, key: string): string {
  const p = new URLSearchParams({ q, printType: 'books', maxResults: '6', fields: FIELDS, key });
  return `https://www.googleapis.com/books/v1/volumes?${p}`;
}

const cut = (s: unknown) => (typeof s === 'string' ? s.trim().slice(0, MAX) : '');
const ARABIC_SCRIPT = /[؀-ۿ]/;

function coverUrl(thumb: unknown): string | null {
  if (typeof thumb !== 'string') return null;
  const https = thumb.replace(/^http:\/\//, 'https://').replace('&edge=curl', '');
  return https.startsWith('https://books.google.com/') ? https : null;
}

/** Google's volumes response → suggestions. Tolerates any shape; skips volumes without a title. */
export function parseVolumes(json: unknown): BookSuggestion[] {
  const items = (json as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return [];
  const out: BookSuggestion[] = [];
  for (const item of items) {
    const id = typeof item?.id === 'string' ? item.id : '';
    const v = item?.volumeInfo ?? {};
    const title = cut(v.title);
    if (!id || !title) continue;
    const authors: string[] = Array.isArray(v.authors) ? v.authors.filter((a: unknown) => typeof a === 'string') : [];
    const sep = authors.some((a) => ARABIC_SCRIPT.test(a)) ? '، ' : ', ';
    const date = typeof v.publishedDate === 'string' ? v.publishedDate : '';
    out.push({
      id,
      title,
      subtitle: cut(v.subtitle),
      author: cut(authors.join(sep)),
      publisher: cut(v.publisher),
      year: /^\d{4}/.test(date) ? date.slice(0, 4) : '',
      language: mapLanguage(typeof v.language === 'string' ? v.language : undefined),
      category: mapCategory(Array.isArray(v.categories) ? v.categories : undefined),
      thumbnail: coverUrl(v.imageLinks?.thumbnail),
    });
  }
  return out;
}

/** Searches Google Books. Throws on a network error or a non-OK answer (e.g. quota). */
export async function searchBooks(q: string, key: string, signal?: AbortSignal): Promise<BookSuggestion[]> {
  const res = await fetch(buildSearchUrl(q, key), { signal });
  if (!res.ok) throw new Error(`google books ${res.status}`);
  return parseVolumes(await res.json());
}
