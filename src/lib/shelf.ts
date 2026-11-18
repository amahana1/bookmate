import type { Book, BookLang } from '../types';
import { BEZIRKE, bezirkOf } from './berlin';
import { BOOK_LANGS } from './books';

export const SPINE_TONES = ['teal', 'turquoise', 'saffron', 'tint', 'ink', 'mist'] as const;
export type SpineTone = (typeof SPINE_TONES)[number];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** Stable spine look for a book: height 190–260px, width 36–62px growing with the title, one doc 3 tone. */
export function spineFor(b: Pick<Book, 'id' | 'title'>): { height: number; width: number; tone: SpineTone } {
  const h = hash(b.id);
  const width = Math.min(62, Math.max(36, 34 + Math.round(b.title.length * 0.9)));
  return { height: 190 + (h % 71), width, tone: SPINE_TONES[(h >>> 8) % SPINE_TONES.length] };
}

export type ShelfItem = { kind: 'end'; lang: BookLang } | { kind: 'book'; book: Book };

/** The first `max` books (input order = priority), grouped by language, Persian first, with a bookend before each group. */
export function groupShelf(books: Book[], max = 18): ShelfItem[] {
  const chosen = books.slice(0, max);
  const out: ShelfItem[] = [];
  for (const lang of BOOK_LANGS) {
    const group = chosen.filter((b) => b.language === lang);
    if (group.length === 0) continue;
    out.push({ kind: 'end', lang });
    for (const b of group) out.push({ kind: 'book', book: b });
  }
  return out;
}

/** Number of listed books per Bezirk (all 12 keys present). */
export function districtCounts(books: Pick<Book, 'neighbourhood'>[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(BEZIRKE.map((b) => [b, 0]));
  for (const b of books) {
    const d = bezirkOf(b.neighbourhood);
    if (d) counts[d] += 1;
  }
  return counts;
}

/** Tile position on a 5×4 geographic grid (column 1 = west). */
export const DISTRICT_TILES: Record<string, { col: number; row: number }> = {
  Reinickendorf: { col: 2, row: 1 },
  Pankow: { col: 3, row: 1 },
  Spandau: { col: 1, row: 2 },
  'Charlottenburg-Wilmersdorf': { col: 2, row: 2 },
  Mitte: { col: 3, row: 2 },
  Lichtenberg: { col: 4, row: 2 },
  'Marzahn-Hellersdorf': { col: 5, row: 2 },
  'Steglitz-Zehlendorf': { col: 2, row: 3 },
  'Tempelhof-Schöneberg': { col: 3, row: 3 },
  'Friedrichshain-Kreuzberg': { col: 4, row: 3 },
  Neukölln: { col: 4, row: 4 },
  'Treptow-Köpenick': { col: 5, row: 4 },
};
