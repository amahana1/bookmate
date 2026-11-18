import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { groupShelf, spineFor } from '../lib/shelf';
import type { Book } from '../types';
import { BookCover, StatusChips } from './BookBits';

/** Books as spines on a shelf, grouped by language with bookends; tapping a spine pulls the book out. */
export function Shelf({ books, max = 18 }: { books: Book[]; max?: number }) {
  const { t } = useT();
  const items = useMemo(() => groupShelf(books, max), [books, max]);
  const shelved = items.flatMap((i) => (i.kind === 'book' ? [i.book] : []));
  const [pickedId, setPickedId] = useState<string | null>(null);
  const current = pickedId ?? shelved[0]?.id ?? null;
  const picked = shelved.find((b) => b.id === current) ?? null;
  const total = shelved.length;

  if (total === 0) return <p className="muted">{t('shelf.empty')}</p>;

  return (
    <div className="shelf-wrap">
      <div className="shelf" role="group" aria-label={t('shelf.label')}>
        {items.map((i) =>
          i.kind === 'end' ? (
            <span key={`end-${i.lang}`} className="bookend">{t(`lang.${i.lang}`)}</span>
          ) : (
            (() => {
              const s = spineFor(i.book);
              return (
                <button
                  key={i.book.id}
                  type="button"
                  className={`spine tone-${s.tone}`}
                  style={{ ['--w' as string]: `${s.width}px`, ['--h' as string]: `${s.height}px` }}
                  aria-pressed={i.book.id === current}
                  aria-label={i.book.title}
                  onClick={() => setPickedId(i.book.id)}
                >
                  <span dir="auto">{i.book.title}</span>
                </button>
              );
            })()
          ),
        )}
      </div>
      <div className="shelf-plank" aria-hidden="true" />
      <div className="shelf-meta">
        <span>{t('shelf.hint')}</span>
        <span>{t('shelf.count', { n: total })}</span>
      </div>
      {picked && (
        <div className="shelf-card" aria-live="polite">
          <BookCover book={picked} small />
          <div className="body">
            <p className="title" dir="auto">{picked.title}</p>
            <p className="meta" dir="auto">{picked.author}</p>
            <StatusChips book={picked} />
            <p className="meta" style={{ marginTop: 6 }}>{t('book.inNeighbourhood', { n: picked.neighbourhood })}</p>
          </div>
          <Link to={`/books/${picked.id}`} className="btn btn-primary">{t('shelf.open')}</Link>
        </div>
      )}
    </div>
  );
}
