import { describe, expect, it } from 'vitest';
import { fa } from './fa';
import { de } from './de';
import { en } from './en';
import { translate } from './translate';

describe('dictionaries', () => {
  const faKeys = Object.keys(fa).sort();
  it('German has exactly the Persian keys', () => {
    expect(Object.keys(de).sort()).toEqual(faKeys);
  });
  it('English has exactly the Persian keys', () => {
    expect(Object.keys(en).sort()).toEqual(faKeys);
  });
  it('has no empty values', () => {
    for (const d of [fa, de, en] as Record<string, string>[]) {
      for (const [k, v] of Object.entries(d)) expect(v.trim(), k).not.toBe('');
    }
  });
  it('never writes the name with a plain space', () => {
    for (const [k, v] of Object.entries(fa)) expect(v.includes('هم کتاب'), k).toBe(false);
  });
});

describe('translate', () => {
  it('fills variables with Persian digits in fa', () => {
    expect(translate('fa', 'books.count', { n: 3 })).toBe('۳ کتاب');
  });
  it('fills variables with Western digits in de', () => {
    expect(translate('de', 'books.count', { n: 3 })).toBe('3 Bücher');
  });
  it('returns the key for an unknown key', () => {
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });
});
