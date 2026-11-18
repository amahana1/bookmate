import { describe, expect, it } from 'vitest';
import { berlinLocalToIso, formatDate, formatNumber, isoToBerlinLocal, toAsciiDigits } from './format';

describe('Berlin local time', () => {
  it('converts a winter Berlin time to UTC (CET, UTC+1)', () => {
    expect(berlinLocalToIso('2026-12-12', '15:00')).toBe('2026-12-12T14:00:00.000Z');
  });
  it('converts a summer Berlin time to UTC (CEST, UTC+2)', () => {
    expect(berlinLocalToIso('2026-07-04', '15:00')).toBe('2026-07-04T13:00:00.000Z');
  });
  it('turns a UTC timestamp back into Berlin date and time', () => {
    expect(isoToBerlinLocal('2026-12-12T14:00:00.000Z')).toEqual({ date: '2026-12-12', time: '15:00' });
  });
});

describe('toAsciiDigits', () => {
  it('converts Persian digits', () => {
    expect(toAsciiDigits('۱۰۹۹۹')).toBe('10999');
  });
  it('converts Arabic-Indic digits', () => {
    expect(toAsciiDigits('١٠٩٩٩')).toBe('10999');
  });
  it('leaves other characters alone', () => {
    expect(toAsciiDigits('abc 12')).toBe('abc 12');
  });
});

describe('formatNumber', () => {
  it('uses Persian digits in fa', () => {
    expect(formatNumber(24, 'fa')).toBe('۲۴');
  });
  it('uses Western digits in de and en', () => {
    expect(formatNumber(24, 'de')).toBe('24');
    expect(formatNumber(24, 'en')).toBe('24');
  });
});

describe('formatDate', () => {
  it('formats a Gregorian date in Persian with Persian digits and month name', () => {
    const s = formatDate('2026-11-17', 'fa');
    expect(s).toContain('۱۷');
    expect(s).toContain('نوامبر');
    expect(s).toContain('۲۰۲۶');
  });
  it('formats German dates', () => {
    expect(formatDate('2026-11-17', 'de')).toBe('17. November 2026');
  });
  it('formats English dates', () => {
    expect(formatDate('2026-11-17', 'en')).toBe('17 November 2026');
  });
  it('uses the Berlin calendar day for timestamps', () => {
    expect(formatDate('2026-11-17T23:30:00Z', 'en')).toBe('18 November 2026');
  });
});
