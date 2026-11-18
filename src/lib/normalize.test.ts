import { describe, expect, it } from 'vitest';
import { matchesQuery, normalizeForSearch } from './normalize';

const hundredYears = {
  title: 'صد سال تنهایی',
  title_latin: null,
  author: 'گابریل گارسیا مارکز',
  translator: 'بهمن فرزانه (Bahman Farzaneh)',
};

describe('normalizeForSearch', () => {
  it('treats ZWNJ and no-space spellings as equal', () => {
    expect(normalizeForSearch('چراغ‌ها')).toBe(normalizeForSearch('چراغها'));
  });
  it('maps Arabic kaf and yeh to Persian letters', () => {
    expect(normalizeForSearch('كليدر')).toBe(normalizeForSearch('کلیدر'));
  });
  it('ignores Latin case', () => {
    expect(normalizeForSearch('Persepolis')).toBe(normalizeForSearch('persepolis'));
  });
  it('ignores spaces', () => {
    expect(normalizeForSearch('هشت کتاب')).toBe(normalizeForSearch('هشتکتاب'));
  });
});

describe('matchesQuery', () => {
  it('finds a book by translator in Latin script', () => {
    expect(matchesQuery(hundredYears, 'Farzaneh')).toBe(true);
  });
  it('finds a book by translator in Persian script', () => {
    expect(matchesQuery(hundredYears, 'فرزانه')).toBe(true);
  });
  it('does not match an unrelated author', () => {
    expect(matchesQuery(hundredYears, 'دولت‌آبادی')).toBe(false);
  });
  it('needs every word of a multi-word query to match some field', () => {
    expect(matchesQuery(hundredYears, 'تنهایی مارکز')).toBe(true);
    expect(matchesQuery(hundredYears, 'تنهایی هدایت')).toBe(false);
  });
  it('matches everything for an empty query', () => {
    expect(matchesQuery(hundredYears, '  ')).toBe(true);
  });
});
