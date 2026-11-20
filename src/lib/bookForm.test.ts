import { describe, expect, it } from 'vitest';
import { applySuggestion, EMPTY_BOOK } from './bookForm';
import { CATEGORIES } from './books';
import type { BookSuggestion } from './googleBooks';

const s: BookSuggestion = {
  id: 'g1', title: 'بوف کور', subtitle: '', author: 'صادق هدایت', publisher: 'امیرکبیر', year: '1951',
  language: 'fa', category: 'novel', thumbnail: null,
};

describe('EMPTY_BOOK', () => {
  it('starts with the condition "like new"', () => {
    expect(EMPTY_BOOK.condition).toBe('like_new');
  });
});

describe('CATEGORIES', () => {
  it('lists the seven categories in the agreed order', () => {
    expect(CATEGORIES).toEqual(['novel', 'poetry', 'history_biography', 'psychology', 'philosophy_society', 'science_education', 'children']);
  });
});

describe('applySuggestion', () => {
  it('fills the book fields from a Google Books result', () => {
    const v = applySuggestion({ ...EMPTY_BOOK, title: 'بوف' }, s);
    expect(v).toMatchObject({ title: 'بوف کور', author: 'صادق هدایت', publisher: 'امیرکبیر', year: '1951', language: 'fa', category: 'novel' });
  });
  it('keeps what the member typed where Google has nothing', () => {
    const typed = { ...EMPTY_BOOK, author: 'نوشته‌ی من', publisher: 'ناشر من', year: '2001', language: 'de', category: 'poetry' };
    const v = applySuggestion(typed, { ...s, author: '', publisher: '', year: '', language: '', category: '' });
    expect(v).toMatchObject({ title: 'بوف کور', author: 'نوشته‌ی من', publisher: 'ناشر من', year: '2001', language: 'de', category: 'poetry' });
  });
  it('clears what an earlier pick filled in when the new pick has nothing for it', () => {
    const afterFirst = applySuggestion(EMPTY_BOOK, s);
    const second = { ...s, id: 'g2', title: 'The Blind Owl', publisher: '', year: '' };
    expect(applySuggestion(afterFirst, second, s)).toMatchObject({ title: 'The Blind Owl', publisher: '', year: '' });
  });
  it('keeps a field the member changed after the earlier pick', () => {
    const edited = { ...applySuggestion(EMPTY_BOOK, s), publisher: 'نشر چشمه' };
    expect(applySuggestion(edited, { ...s, id: 'g2', publisher: '' }, s).publisher).toBe('نشر چشمه');
  });
  it('leaves the translator and the copy details alone', () => {
    const before = { ...EMPTY_BOOK, translator: 'مترجم', condition: 'good', loan_months: '3' as const, handover_methods: ['meetup' as const] };
    const v = applySuggestion(before, s);
    expect(v).toMatchObject({ translator: 'مترجم', condition: 'good', loan_months: '3', handover_methods: ['meetup'] });
  });
});
