import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useT } from '../i18n';
import { searchBooks, type BookSuggestion } from '../lib/googleBooks';
import type { FieldControlProps } from './Field';

const KEY = (import.meta.env.VITE_GOOGLE_BOOKS_KEY as string | undefined)?.trim() || '';
const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

type State = 'idle' | 'loading' | 'done' | 'failed';

interface Props {
  control: FieldControlProps;
  value: string;
  onChange: (title: string) => void;
  onPick: (s: BookSuggestion) => void;
}

/**
 * The book-title input. While the member types, it suggests matching books from Google Books
 * (ARIA combobox: arrow keys, Enter, Escape). Without an API key it is a plain text input.
 */
export function TitleSearch({ control, value, onChange, onPick }: Props) {
  const { t, num } = useT();
  const [items, setItems] = useState<BookSuggestion[]>([]);
  const [state, setState] = useState<State>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useRef(false); // search only after the member types, not after a pick or when an edit loads
  const listId = `${control.id}-list`;

  useEffect(() => {
    if (!KEY || !typed.current) return;
    const q = value.trim();
    if (q.length < MIN_CHARS) {
      setItems([]);
      setState('idle');
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setState('loading');
      setOpen(true);
      searchBooks(q, KEY, ctrl.signal)
        .then((found) => {
          setItems(found);
          setActive(-1);
          setState('done');
        })
        .catch((e: unknown) => {
          if ((e as Error)?.name === 'AbortError') return;
          setItems([]);
          setState('failed');
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  const pick = (s: BookSuggestion) => {
    typed.current = false;
    setOpen(false);
    setItems([]);
    setActive(-1);
    setState('idle');
    onPick(s);
  };

  const showList = open && items.length > 0;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + items.length) % items.length);
    } else if (e.key === 'Enter' && showList && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setActive(-1);
    }
  };

  const live =
    !open ? '' :
    state === 'loading' ? t('add.searching') :
    state === 'failed' ? t('add.searchFailed') :
    state === 'done' && items.length === 0 ? t('add.noResults') :
    state === 'done' ? t('add.resultsCount', { n: items.length }) : '';

  if (!KEY) {
    return <input {...control} dir="auto" maxLength={200} value={value} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div className="combo">
      <input
        {...control}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        dir="auto"
        maxLength={200}
        value={value}
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      <div className="combo-pop" hidden={!open || state === 'idle'}>
        <ul role="listbox" id={listId} aria-label={t('add.fromGoogle')} hidden={!showList}>
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault() /* keep focus in the input */}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
            >
              {s.thumbnail ? <img src={s.thumbnail} alt="" loading="lazy" width={36} height={54} /> : <span className="combo-noimg" aria-hidden="true" />}
              <span className="combo-text">
                <bdi className="combo-title">{s.title}</bdi>
                {(s.author || s.year) && (
                  <span className="combo-meta">
                    {s.author && <bdi>{s.author}</bdi>}
                    {s.author && s.year && ' · '}
                    {s.year && num(Number(s.year))}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {!showList && live && <p className="combo-status">{live}</p>}
        {showList && <p className="combo-foot" aria-hidden="true">{t('add.fromGoogle')}</p>}
      </div>
      <span className="visually-hidden" aria-live="polite">{live}</span>
    </div>
  );
}
