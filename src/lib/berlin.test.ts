import { describe, expect, it } from 'vitest';
import { BERLIN_ORTSTEILE, isBerlinPostcode } from './berlin';

describe('isBerlinPostcode', () => {
  it('accepts Berlin postcodes', () => {
    expect(isBerlinPostcode('10999')).toBe(true);
    expect(isBerlinPostcode('14199')).toBe(true);
    expect(isBerlinPostcode('10115')).toBe(true);
  });
  it('accepts Persian digits', () => {
    expect(isBerlinPostcode('۱۰۱۱۵')).toBe(true);
  });
  it('rejects Potsdam, Schönefeld and out-of-range codes', () => {
    expect(isBerlinPostcode('14467')).toBe(false);
    expect(isBerlinPostcode('12529')).toBe(false);
    expect(isBerlinPostcode('10114')).toBe(false);
  });
  it('rejects malformed input', () => {
    expect(isBerlinPostcode('1099')).toBe(false);
    expect(isBerlinPostcode('abcde')).toBe(false);
    expect(isBerlinPostcode('')).toBe(false);
  });
});

describe('BERLIN_ORTSTEILE', () => {
  it('contains well-known Ortsteile', () => {
    for (const n of ['Kreuzberg', 'Neukölln', 'Prenzlauer Berg', 'Wedding', 'Moabit', 'Steglitz']) {
      expect(BERLIN_ORTSTEILE).toContain(n);
    }
  });
  it('has at least 90 entries without duplicates', () => {
    expect(BERLIN_ORTSTEILE.length).toBeGreaterThanOrEqual(90);
    expect(new Set(BERLIN_ORTSTEILE).size).toBe(BERLIN_ORTSTEILE.length);
  });
});
