import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { deleteBook, listMyBooks, setBookPaused } from '../api/books';
import type { Book } from '../types';
import { BookCover, StatusChips } from '../components/BookBits';
import { ErrorBox, Loading, StatusBox, useToast } from '../components/Feedback';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlusIcon } from '../components/Icons';
import { MyLoansTab } from './MyLoansTab';

function MyBooksTab() {
  const { t } = useT();
  const { session } = useAuth();
  const toast = useToast();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [toDelete, setToDelete] = useState<Book | null>(null);
  const [blocked, setBlocked] = useState(false);

  const load = useCallback(() => {
    if (session) listMyBooks(session.user.id).then(setBooks).catch(() => setFailed(true));
  }, [session]);
  useEffect(load, [load]);

  const togglePause = async (b: Book) => {
    try {
      await setBookPaused(b.id, b.status !== 'paused');
      toast.show(t(b.status === 'paused' ? 'mybooks.resumed' : 'mybooks.paused'));
      load();
    } catch {
      setFailed(true);
    }
  };

  const confirmDelete = async () => {
    const b = toDelete;
    setToDelete(null);
    if (!b) return;
    try {
      const r = await deleteBook(b.id);
      if (r === 'on_loan') setBlocked(true);
      else {
        toast.show(t('mybooks.deleted'));
        load();
      }
    } catch {
      setFailed(true);
    }
  };

  if (failed) return <ErrorBox>{t('common.error')}</ErrorBox>;
  if (!books) return <Loading />;
  return (
    <div className="stack">
      <div><Link to="/add" className="btn btn-primary btn-small"><PlusIcon />{t('nav.add')}</Link></div>
      {blocked && <StatusBox><p style={{ margin: 0 }}>{t('mybooks.deleteOnLoan')}</p></StatusBox>}
      {books.length === 0 ? (
        <StatusBox><p style={{ margin: 0 }}>{t('mybooks.empty')}</p></StatusBox>
      ) : (
        <ul className="loan-list">
          {books.map((b) => (
            <li key={b.id} className="loan-row">
              <BookCover book={b} small />
              <div className="body stack" style={{ gap: 6 }}>
                <Link to={`/books/${b.id}`} className="title" dir="auto">{b.title}</Link>
                <span className="meta">{t('mybooks.loanLength', { n: b.loan_months })}</span>
                <StatusChips book={b} />
                <div className="btn-row" style={{ gap: 8 }}>
                  <Link to={`/books/${b.id}/edit`} className="btn btn-secondary btn-small">{t('mybooks.edit')}</Link>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => togglePause(b)}>
                    {b.status === 'paused' ? t('mybooks.resume') : t('mybooks.pause')}
                  </button>
                  <button type="button" className="btn-link" onClick={() => { setBlocked(false); setToDelete(b); }}>{t('mybooks.delete')}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={toDelete !== null} text={t('mybooks.deleteConfirm')} confirmLabel={t('mybooks.delete')} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

export function MyLoans() {
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'books' ? 'books' : 'loans';
  return (
    <div className="stack">
      <h1>{tab === 'books' ? t('nav.myBooks') : t('nav.myLoans')}</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'loans'} onClick={() => setParams({ tab: 'loans' })}>{t('nav.myLoans')}</button>
        <button role="tab" aria-selected={tab === 'books'} onClick={() => setParams({ tab: 'books' })}>{t('nav.myBooks')}</button>
      </div>
      <div role="tabpanel">{tab === 'books' ? <MyBooksTab /> : <MyLoansTab />}</div>
    </div>
  );
}
