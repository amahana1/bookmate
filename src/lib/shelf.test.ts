import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { BERLIN_ORTSTEILE, BEZIRKE, bezirkOf } from './berlin';
import { districtCounts, groupShelf, spineFor, SPINE_TONES } from './shelf';

function book(p: Partial<Book>): Book {
  return {
    id: p.id ?? 'x', owner_id: 'o', title: p.title ?? 'عنوان', title_latin: null, author: 'a', translator: null, publisher: null,
    language: 'fa', category: 'novel', year: null, condition: 'good', loan_months: 1, handover_methods: ['meetup'],
    cover_path: null, status: 'available', hidden: false, is_sample: false, neighbourhood: 'Kreuzberg', loan_state: 'none',
    loan_due_date: null, created_at: '2026-11-01T10:00:00Z', ...p,
  };
}

describe('bezirkOf', () => {
  it('maps Ortsteile to their Bezirk', () => {
    expect(bezirkOf('Kreuzberg')).toBe('Friedrichshain-Kreuzberg');
    expect(bezirkOf('Prenzlauer Berg')).toBe('Pankow');
    expect(bezirkOf('Wedding')).toBe('Mitte');
    expect(bezirkOf('Steglitz')).toBe('Steglitz-Zehlendorf');
  });
  it('returns null for unknown names', () => {
    expect(bezirkOf('Atlantis')).toBeNull();
    expect(bezirkOf('')).toBeNull();
  });
  it('covers every Ortsteil with one of the 12 Bezirke', () => {
    expect(BEZIRKE).toHaveLength(12);
    for (const o of BERLIN_ORTSTEILE) expect(BEZIRKE, o).toContain(bezirkOf(o));
  });
});

describe('districtCounts', () => {
  it('counts books per Bezirk and ignores unknown neighbourhoods', () => {
    const c = districtCounts([book({ neighbourhood: 'Kreuzberg' }), book({ neighbourhood: 'Friedrichshain' }), book({ neighbourhood: 'Wedding' }), book({ neighbourhood: '' })]);
    expect(c['Friedrichshain-Kreuzberg']).toBe(2);
    expect(c.Mitte).toBe(1);
    expect(c.Spandau).toBe(0);
  });
});

describe('spineFor', () => {
  it('is stable for the same book', () => {
    expect(spineFor(book({ id: 'abc', title: 'بوف کور' }))).toEqual(spineFor(book({ id: 'abc', title: 'بوف کور' })));
  });
  it('stays within the drawn size range and palette', () => {
    for (const id of ['a', 'b', 'c', '5b000000-0000-0000-0000-000000000009', 'zzzz']) {
      const s = spineFor(book({ id, title: 'The Complete Persepolis' }));
      expect(s.height).toBeGreaterThanOrEqual(190);
      expect(s.height).toBeLessThanOrEqual(260);
      expect(s.width).toBeGreaterThanOrEqual(36);
      expect(s.width).toBeLessThanOrEqual(62);
      expect(SPINE_TONES).toContain(s.tone);
    }
  });
  it('gives longer titles a wider (or equal) spine', () => {
    expect(spineFor(book({ id: 'q', title: 'کلیدر' })).width).toBeLessThanOrEqual(spineFor(book({ id: 'q', title: 'چراغ‌ها را من خاموش می‌کنم' })).width);
  });
});

describe('groupShelf', () => {
  it('groups by language with a bookend before each group, Persian first', () => {
    const items = groupShelf([
      book({ id: 'e1', language: 'en' }), book({ id: 'f1', language: 'fa' }), book({ id: 'd1', language: 'de' }), book({ id: 'f2', language: 'fa' }),
    ]);
    expect(items.map((i) => (i.kind === 'end' ? `|${i.lang}` : i.book.id))).toEqual(['|fa', 'f1', 'f2', '|de', 'd1', '|en', 'e1']);
  });
  it('keeps at most `max` books', () => {
    const many = Array.from({ length: 30 }, (_, i) => book({ id: String(i) }));
    expect(groupShelf(many, 18).filter((i) => i.kind === 'book')).toHaveLength(18);
  });
});
