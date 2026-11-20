import { describe, expect, it } from 'vitest';
import { normalizeTelegram, validateBook, validateSignup, type BookFormValues } from './validate';

const ok = {
  firstName: 'لیلا',
  email: 'leila@example.com',
  password: 'lange-passphrase',
  postcode: '12043',
  neighbourhood: 'Neukölln',
  telegram: '',
  acceptedRules: true,
};

describe('validateSignup', () => {
  it('accepts a complete form', () => {
    expect(validateSignup(ok)).toEqual({});
  });
  it('flags every required field on an empty form', () => {
    const e = validateSignup({ firstName: '', email: '', password: '', postcode: '', neighbourhood: '', telegram: '', acceptedRules: false });
    expect(Object.keys(e).sort()).toEqual(['acceptedRules', 'email', 'firstName', 'neighbourhood', 'password', 'postcode']);
  });
  it('rejects a Potsdam postcode typed in Persian digits as not Berlin', () => {
    expect(validateSignup({ ...ok, postcode: '۱۴۴۶۷' }).postcode).toBe('signup.error.notBerlin');
  });
  it('accepts a Berlin postcode typed in Persian digits', () => {
    expect(validateSignup({ ...ok, postcode: '۱۰۹۹۹' }).postcode).toBeUndefined();
  });
  it('accepts a Telegram username with a leading @', () => {
    expect(validateSignup({ ...ok, telegram: '@leila_k' }).telegram).toBeUndefined();
  });
  it('rejects a Telegram username with a space', () => {
    expect(validateSignup({ ...ok, telegram: 'a b' }).telegram).toBe('signup.error.telegram');
  });
  it('rejects a password shorter than 8 characters', () => {
    expect(validateSignup({ ...ok, password: '1234567' }).password).toBe('signup.error.password');
  });
  it('rejects a malformed email', () => {
    expect(validateSignup({ ...ok, email: 'leila@' }).email).toBe('signup.error.email');
  });
});

const bookOk: BookFormValues = {
  title: 'بوف کور',
  author: 'صادق هدایت',
  translator: '',
  publisher: '',
  language: 'fa',
  category: 'novel',
  year: '',
  condition: 'good',
  loan_months: '1',
  handover_methods: ['meetup'],
};

describe('validateBook', () => {
  it('accepts a complete book', () => {
    expect(validateBook(bookOk)).toEqual({});
  });
  it('requires a title', () => {
    expect(validateBook({ ...bookOk, title: '  ' }).title).toBe('book.error.required');
  });
  it('requires the book language', () => {
    expect(validateBook({ ...bookOk, language: '' }).language).toBe('book.error.required');
  });
  it('requires at least one handover method', () => {
    expect(validateBook({ ...bookOk, handover_methods: [] }).handover_methods).toBe('book.error.handover');
  });
  it('rejects a Solar Hijri year typed in Persian digits (out of range)', () => {
    expect(validateBook({ ...bookOk, year: '۱۳۸۵' }).year).toBe('book.error.year');
  });
  it('accepts a Gregorian year typed in Persian digits', () => {
    expect(validateBook({ ...bookOk, year: '۲۰۰۱' }).year).toBeUndefined();
  });
  it('rejects a non-numeric year', () => {
    expect(validateBook({ ...bookOk, year: 'abcd' }).year).toBe('book.error.year');
  });
});

describe('normalizeTelegram', () => {
  it('strips @ and spaces, and turns empty into null', () => {
    expect(normalizeTelegram(' @leila_k ')).toBe('leila_k');
    expect(normalizeTelegram('  ')).toBeNull();
  });
});
