import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { displayStatus, filterBooks, paginate, sortBooks } from './books';

function book(p: Partial<Book>): Book {
  return {
    id: p.id ?? Math.random().toString(36).slice(2),
    owner_id: 'o',
    title: 'x',
    title_latin: null,
    author: 'a',
    translator: null,
    publisher: null,
    language: 'fa',
    category: 'novel',
    year: null,
    condition: 'good',
    loan_months: 1,
    handover_methods: ['meetup'],
    cover_path: null,
    status: 'available',
    hidden: false,
    is_sample: false,
    neighbourhood: 'Kreuzberg',
    loan_state: 'none',
    loan_due_date: null,
    created_at: '2026-11-01T10:00:00Z',
    ...p,
  };
}

const all = 'all' as const;
const kelidar = book({ id: 'k', title: 'کلیدر (جلد ۱ و ۲)', author: 'محمود دولت‌آبادی' });
const onLoan = book({ id: 'l', title: 'سمفونی مردگان', loan_state: 'on_loan', loan_due_date: '2026-12-01' });
const reserved = book({ id: 'r', title: 'شازده احتجاب', loan_state: 'reserved' });
const paused = book({ id: 'p', title: 'Persepolis', status: 'paused', language: 'en' });
const german = book({ id: 'g', title: 'Nachts ist es leise in Teheran', language: 'de' });
const books = [kelidar, onLoan, reserved, paused, german];

describe('filterBooks', () => {
  it('finds Kelidar when typed with Arabic letters', () => {
    expect(filterBooks(books, { q: 'كليدر', language: all, category: all, availableOnly: false }).map((b) => b.id)).toEqual(['k']);
  });
  it('excludes on-loan, reserved and paused books when only available ones are wanted', () => {
    expect(filterBooks(books, { q: '', language: all, category: all, availableOnly: true }).map((b) => b.id).sort()).toEqual(['g', 'k']);
  });
  it('filters by language', () => {
    expect(filterBooks(books, { q: '', language: 'de', category: all, availableOnly: false }).map((b) => b.id)).toEqual(['g']);
  });
});

describe('paginate', () => {
  it('returns the last partial page and the page count', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 3)).toEqual({ items: [24], pages: 3 });
  });
  it('clamps an out-of-range page to the last page', () => {
    expect(paginate([1, 2, 3], 9)).toEqual({ items: [1, 2, 3], pages: 1 });
  });
});

describe('displayStatus', () => {
  it('shows paused for a paused book with no loan', () => {
    expect(displayStatus(paused)).toBe('paused');
  });
  it('shows on_loan and reserved from the loan state', () => {
    expect(displayStatus(onLoan)).toBe('on_loan');
    expect(displayStatus(reserved)).toBe('reserved');
  });
  it('shows available otherwise', () => {
    expect(displayStatus(kelidar)).toBe('available');
  });
});

describe('sortBooks', () => {
  it('orders Persian titles alphabetically in fa', () => {
    const a = book({ id: 'b', title: 'بوف کور' });
    const b = book({ id: 'a', title: 'الف' });
    expect(sortBooks([a, b], 'title', 'fa').map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('orders newest first', () => {
    const older = book({ id: 'old', created_at: '2026-10-01T00:00:00Z' });
    const newer = book({ id: 'new', created_at: '2026-11-10T00:00:00Z' });
    expect(sortBooks([older, newer], 'newest', 'fa').map((x) => x.id)).toEqual(['new', 'old']);
  });
});
