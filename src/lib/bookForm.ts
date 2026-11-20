import type { BookFormValues } from './validate';
import type { BookSuggestion } from './googleBooks';

export const EMPTY_BOOK: BookFormValues = {
  title: '', author: '', translator: '', publisher: '', language: '', category: '',
  year: '', condition: 'like_new', loan_months: '1', handover_methods: ['meetup', 'in_person'],
};

const FILLED = ['author', 'publisher', 'year', 'language', 'category'] as const;

/**
 * Fills the book's own fields from a Google Books result. Where Google has nothing, the member's own input stays;
 * a value left over from the previous pick (`prev`, unchanged since) is cleared instead.
 */
export function applySuggestion(v: BookFormValues, s: BookSuggestion, prev?: BookSuggestion | null): BookFormValues {
  const next: BookFormValues = { ...v, title: s.title };
  for (const k of FILLED) {
    if (s[k]) next[k] = s[k];
    else if (prev && prev[k] && v[k] === prev[k]) next[k] = '';
  }
  return next;
}
