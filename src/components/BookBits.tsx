import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { coverUrl } from '../lib/supabase';
import { coverVariant, displayStatus } from '../lib/books';
import type { Book } from '../types';

/** Real cover photo, or the doc 3 placeholder: 2:3, spine on the inline-start edge, one of four palettes. */
export function BookCover({ book, small = false }: { book: Pick<Book, 'id' | 'title' | 'cover_path'>; small?: boolean }) {
  return (
    <div className={`cover cover-${coverVariant(book.id)}${small ? ' cover-small' : ''}`} aria-hidden="true">
      <span className="cover-title" dir="auto">{book.title}</span>
      {book.cover_path && <img src={coverUrl(book.cover_path)} alt="" loading="lazy" />}
    </div>
  );
}

/** Status in words (never colour alone), plus a "sample" chip for sample books. */
export function StatusChips({ book }: { book: Book }) {
  const { t, date } = useT();
  const s = displayStatus(book);
  return (
    <div className="chips">
      {s === 'available' && <span className="chip chip-available">{t('status.available')}</span>}
      {s === 'on_loan' && <span className="chip">{book.loan_due_date ? t('status.onLoanUntil', { date: date(book.loan_due_date) }) : t('status.onLoan')}</span>}
      {s === 'reserved' && <span className="chip">{t('status.reserved')}</span>}
      {s === 'paused' && <span className="chip">{t('status.paused')}</span>}
      {book.hidden && <span className="chip">{t('status.hidden')}</span>}
      {book.is_sample && <span className="chip chip-sample">{t('status.sample')}</span>}
    </div>
  );
}

export function BookCard({ book }: { book: Book }) {
  return (
    <li className="book-card">
      <Link to={`/books/${book.id}`}>
        <BookCover book={book} />
        <span className="book-title" dir="auto">{book.title}</span>
        <span className="book-author" dir="auto">{book.author}</span>
      </Link>
      <div style={{ marginTop: 6 }}><StatusChips book={book} /></div>
    </li>
  );
}

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <ul className="book-grid">
      {books.map((b) => <BookCard key={b.id} book={b} />)}
    </ul>
  );
}
