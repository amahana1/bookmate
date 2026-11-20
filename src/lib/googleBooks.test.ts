import { describe, expect, it } from 'vitest';
import { buildSearchUrl, mapCategory, mapLanguage, parseVolumes } from './googleBooks';

describe('mapLanguage', () => {
  it('keeps the book languages the site knows', () => {
    expect(mapLanguage('fa')).toBe('fa');
    expect(mapLanguage('de')).toBe('de');
    expect(mapLanguage('uk')).toBe('uk');
  });
  it('reads a regional code by its language part', () => {
    expect(mapLanguage('en-GB')).toBe('en');
  });
  it('turns any other language into "other"', () => {
    expect(mapLanguage('fr')).toBe('other');
  });
  it('leaves the language empty when Google gives none', () => {
    expect(mapLanguage(undefined)).toBe('');
  });
});

describe('mapCategory', () => {
  it('maps fiction to novels and stories', () => {
    expect(mapCategory(['Fiction'])).toBe('novel');
  });
  it('maps juvenile fiction to children, not novels', () => {
    expect(mapCategory(['Juvenile Fiction'])).toBe('children');
  });
  it('maps poetry, biography, psychology', () => {
    expect(mapCategory(['Poetry'])).toBe('poetry');
    expect(mapCategory(['Biography & Autobiography'])).toBe('history_biography');
    expect(mapCategory(['Psychology'])).toBe('psychology');
  });
  it('maps social science to philosophy and sociology, not science', () => {
    expect(mapCategory(['Social Science'])).toBe('philosophy_society');
  });
  it('maps science and education', () => {
    expect(mapCategory(['Science'])).toBe('science_education');
    expect(mapCategory(['Education'])).toBe('science_education');
  });
  it('leaves the category empty when nothing matches', () => {
    expect(mapCategory(['Cooking'])).toBe('');
    expect(mapCategory(undefined)).toBe('');
  });
});

describe('buildSearchUrl', () => {
  it('searches books only, asks for a few fields, and adds the key', () => {
    const u = new URL(buildSearchUrl('بوف کور', 'KEY1'));
    expect(u.origin + u.pathname).toBe('https://www.googleapis.com/books/v1/volumes');
    expect(u.searchParams.get('q')).toBe('بوف کور');
    expect(u.searchParams.get('printType')).toBe('books');
    expect(u.searchParams.get('maxResults')).toBe('6');
    expect(u.searchParams.get('key')).toBe('KEY1');
    expect(u.searchParams.get('fields')).toContain('imageLinks');
  });
});

describe('parseVolumes', () => {
  const json = {
    items: [
      {
        id: 'abcDEF123_-x',
        volumeInfo: {
          title: 'بوف کور',
          subtitle: 'رمان',
          authors: ['صادق هدایت', 'دیگری'],
          publisher: 'امیرکبیر',
          publishedDate: '1951-05',
          language: 'fa',
          categories: ['Fiction'],
          imageLinks: { thumbnail: 'http://books.google.com/books/content?id=abcDEF123_-x&printsec=frontcover&img=1&zoom=1&edge=curl' },
        },
      },
      { id: 'noTitle', volumeInfo: { authors: ['X'] } },
      { id: 'bare', volumeInfo: { title: 'Kafka on the Shore', authors: ['Haruki Murakami', 'Philip Gabriel'] } },
    ],
  };

  it('turns a volume into a form suggestion', () => {
    expect(parseVolumes(json)[0]).toEqual({
      id: 'abcDEF123_-x',
      title: 'بوف کور',
      subtitle: 'رمان',
      author: 'صادق هدایت، دیگری',
      publisher: 'امیرکبیر',
      year: '1951',
      language: 'fa',
      category: 'novel',
      thumbnail: 'https://books.google.com/books/content?id=abcDEF123_-x&printsec=frontcover&img=1&zoom=1',
    });
  });
  it('skips volumes without a title', () => {
    expect(parseVolumes(json).map((s) => s.id)).toEqual(['abcDEF123_-x', 'bare']);
  });
  it('joins Latin-script authors with a Latin comma and leaves missing fields empty', () => {
    expect(parseVolumes(json)[1]).toEqual({
      id: 'bare', title: 'Kafka on the Shore', subtitle: '', author: 'Haruki Murakami, Philip Gabriel',
      publisher: '', year: '', language: '', category: '', thumbnail: null,
    });
  });
  it('cuts every text to the 200 characters the form allows', () => {
    const long = 'ا'.repeat(250);
    const [s] = parseVolumes({ items: [{ id: 'l', volumeInfo: { title: long, authors: [long], publisher: long } }] });
    expect(s.title).toHaveLength(200);
    expect(s.author).toHaveLength(200);
    expect(s.publisher).toHaveLength(200);
  });
  it('ignores a cover that is not on books.google.com', () => {
    const [s] = parseVolumes({ items: [{ id: 'e', volumeInfo: { title: 'T', imageLinks: { thumbnail: 'https://evil.example/x.jpg' } } }] });
    expect(s.thumbnail).toBeNull();
  });
  it('returns nothing for an empty or broken response', () => {
    expect(parseVolumes({})).toEqual([]);
    expect(parseVolumes(null)).toEqual([]);
    expect(parseVolumes({ items: 'x' })).toEqual([]);
  });
});
