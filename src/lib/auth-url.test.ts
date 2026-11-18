import { describe, expect, it } from 'vitest';
import { buildLoginUrl, safeNext } from './auth-url';

describe('buildLoginUrl', () => {
  it('encodes the return path', () => {
    expect(buildLoginUrl('/books/abc?request=1')).toBe('/login?next=%2Fbooks%2Fabc%3Frequest%3D1');
  });
});

describe('safeNext', () => {
  it('rejects protocol-relative URLs', () => {
    expect(safeNext('//evil.com')).toBe('/');
  });
  it('rejects absolute URLs', () => {
    expect(safeNext('https://evil.com')).toBe('/');
  });
  it('rejects backslash tricks', () => {
    expect(safeNext('/\\evil.com')).toBe('/');
  });
  it('keeps local paths with query strings', () => {
    expect(safeNext('/me?tab=loans')).toBe('/me?tab=loans');
  });
  it('falls back to home for null', () => {
    expect(safeNext(null)).toBe('/');
  });
});
