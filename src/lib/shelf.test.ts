import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { BERLIN_ORTSTEILE, BEZIRKE, bezirkOf } from './berlin';
import { districtCounts, districtLevel, groupShelf, rankDistricts, spineFor, SPINE_TONES } from './shelf';
import { BERLIN_MAP_HEIGHT, BERLIN_MAP_WIDTH, DISTRICT_SHAPES } from './berlin-map';

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

describe('districtLevel', () => {
  it('is 0 for an empty district and 1–3 by share of the busiest one', () => {
    expect(districtLevel(0, 9)).toBe(0);
    expect(districtLevel(2, 9)).toBe(1);
    expect(districtLevel(3, 9)).toBe(2);
    expect(districtLevel(6, 9)).toBe(3);
    expect(districtLevel(9, 9)).toBe(3);
  });
  it('never divides by zero when no district has books', () => {
    expect(districtLevel(0, 0)).toBe(0);
  });
});

describe('rankDistricts', () => {
  it('lists all 12 Bezirke, most books first, ties in German alphabetical order', () => {
    const counts = districtCounts([book({ neighbourhood: 'Wedding' }), book({ neighbourhood: 'Wedding' }), book({ neighbourhood: 'Britz' })]);
    const ranked = rankDistricts(counts);
    expect(ranked).toHaveLength(12);
    expect(ranked.slice(0, 3)).toEqual([{ name: 'Mitte', count: 2 }, { name: 'Neukölln', count: 1 }, { name: 'Charlottenburg-Wilmersdorf', count: 0 }]);
  });
});

describe('DISTRICT_SHAPES', () => {
  it('has a drawn shape for exactly the 12 Bezirke the app uses', () => {
    expect(Object.keys(DISTRICT_SHAPES).sort()).toEqual([...BEZIRKE].sort());
  });
  it('places every label inside the map', () => {
    for (const [name, s] of Object.entries(DISTRICT_SHAPES)) {
      expect(s.x, name).toBeGreaterThan(0);
      expect(s.x, name).toBeLessThan(BERLIN_MAP_WIDTH);
      expect(s.y, name).toBeGreaterThan(0);
      expect(s.y, name).toBeLessThan(BERLIN_MAP_HEIGHT);
    }
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
