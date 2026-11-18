import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { getBook, listBooks } from '../api/books';
import { canRequest, LoanError, requestLoan } from '../api/loans';
import { useNextMeetup } from '../api/meetups';
import { blockMessage } from '../lib/loans';
import { displayStatus } from '../lib/books';
import type { BlockReason, Book, Handover } from '../types';
import { BookCover, BookGrid, StatusChips } from '../components/BookBits';
import { ErrorBox, Loading, StatusBox, useToast } from '../components/Feedback';
import { Steps } from '../components/Steps';
import { Field } from '../components/Field';
import { NotFound } from './NotFound';

function BlockBox({ reason, bookId }: { reason: BlockReason; bookId: string }) {
  const { t } = useT();
  const m = blockMessage(reason, bookId);
  const title = reason === 'sample_book' ? t('bookpage.sampleTitle') : t('bookpage.cantYet');
  return (
    <StatusBox title={title}>
      <p style={{ margin: m.action ? undefined : 0 }}>{t(m.textKey)}</p>
      {m.action && <Link to={m.action.to} className="btn btn-primary btn-small">{t(m.action.labelKey)}</Link>}
    </StatusBox>
  );
}

function RequestForm({ book, onSent }: { book: Book; onSent: (loanId: string) => void }) {
  const { t, date } = useT();
  const meetup = useNextMeetup();
  const [handover, setHandover] = useState<Handover>(book.handover_methods[0]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BlockReason | 'other' | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id = await requestLoan(book.id, handover, handover === 'meetup' ? meetup?.id ?? null : null, message);
      onSent(id);
    } catch (x) {
      const code = x instanceof LoanError ? x.code : 'unknown';
      setError(code === 'not_allowed' || code === 'bad_state' || code === 'unknown' ? 'other' : code);
      setBusy(false);
    }
  };

  return (
    <form className="card form-grid" onSubmit={submit} id="request-form">
      <h2 style={{ fontSize: 28, margin: 0 }}>{t('bookpage.request')}</h2>
      {error === 'other' && <ErrorBox>{t('common.error')}</ErrorBox>}
      {error && error !== 'other' && <ErrorBox>{t(blockMessage(error, book.id).textKey)}</ErrorBox>}
      <fieldset className="options" style={{ background: 'var(--white)' }}>
        <legend>{t('bookpage.chooseHandover')}</legend>
        {book.handover_methods.includes('meetup') && (
          <label className="option">
            <input type="radio" name="handover" checked={handover === 'meetup'} onChange={() => setHandover('meetup')} />
            {meetup ? t('bookpage.meetupOption', { date: date(meetup.starts_at) }) : t('bookpage.meetupTba')}
          </label>
        )}
        {book.handover_methods.includes('in_person') && (
          <label className="option">
            <input type="radio" name="handover" checked={handover === 'in_person'} onChange={() => setHandover('in_person')} />
            {t('bookpage.inPersonOption')}
          </label>
        )}
      </fieldset>
      <Field label={t('bookpage.message')} optional={t('common.optional')} hint={t('bookpage.messageHint')}>
        {(p) => <textarea {...p} dir="auto" maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />}
      </Field>
      <p className="small" style={{ margin: 0 }}>{t('bookpage.note')}</p>
      <div><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('bookpage.sending') : t('bookpage.send')}</button></div>
    </form>
  );
}

export function BookPage() {
  const { id = '' } = useParams();
  const { t } = useT();
  const { session, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [more, setMore] = useState<Book[]>([]);
  const [block, setBlock] = useState<BlockReason | null | undefined>(undefined);
  const [open, setOpen] = useState(params.get('request') === '1');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setBook(undefined);
    getBook(id).then(setBook).catch(() => setFailed(true));
    listBooks()
      .then((all) => setMore(all.filter((b) => b.id !== id)))
      .catch(() => setMore([]));
  }, [id]);

  useEffect(() => {
    if (!book || authLoading) return;
    if (book.is_sample) return setBlock('sample_book');
    if (!session) return setBlock('not_logged_in');
    setBlock(undefined);
    canRequest(book.id).then(setBlock).catch(() => setBlock('book_unavailable'));
  }, [book, session, authLoading]);

  useEffect(() => {
    if (open && block === null) document.getElementById('request-form')?.scrollIntoView({ block: 'start' });
  }, [open, block]);

  if (failed) return <ErrorBox>{t('common.error')}</ErrorBox>;
  if (book === undefined) return <Loading />;
  if (book === null) return <NotFound variant="book" />;

  const status = displayStatus(book);
  const similar = more.filter((b) => b.language === book.language || b.category === book.category).slice(0, 4);
  const sent = (loanId: string) => {
    toast.show(t('bookpage.sent'));
    navigate(`/loans/${loanId}`);
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="breadcrumb">
        <ol>
          <li><Link to="/">{t('common.home')}</Link></li>
          <li><Link to="/books">{t('books.title')}</Link></li>
          <li aria-current="page" dir="auto">{book.title}</li>
        </ol>
      </nav>
      <div className="two-col section">
        <div style={{ maxWidth: 280 }}><BookCover book={book} /></div>
        <div className="stack">
          <h1 dir="auto" style={{ margin: 0 }}>{book.title}</h1>
          {book.title_latin && <p className="lead" dir="ltr" lang="en" style={{ margin: 0, textAlign: 'start' }}>{book.title_latin}</p>}
          <p style={{ margin: 0 }} dir="auto">
            {book.author}{book.translator ? ` · ${t('add.translator')}: ${book.translator}` : ''}
          </p>
          <StatusChips book={book} />
          {status === 'available' && <p style={{ margin: 0 }}>{t('bookpage.loanLength', { n: book.loan_months })}</p>}
          <p style={{ margin: 0 }}>
            <strong>{t('bookpage.handover')}:</strong>{' '}
            {book.handover_methods.map((h) => (h === 'meetup' ? t('add.handoverMeetup') : t('add.handoverInPerson'))).join(' · ')}
          </p>
          <p className="muted" style={{ margin: 0 }}>{t('book.inNeighbourhood', { n: book.neighbourhood })}</p>

          {block === undefined && <Loading />}
          {block && <BlockBox reason={block} bookId={book.id} />}
          {block === null && !open && (
            <div><button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{t('bookpage.request')}</button></div>
          )}
          {block === null && open && <RequestForm book={book} onSent={sent} />}
        </div>
      </div>

      <section className="section">
        <h2>{t('bookpage.details')}</h2>
        <dl className="details">
          <dt>{t('add.author')}</dt><dd dir="auto">{book.author}</dd>
          {book.translator && (<><dt>{t('add.translator')}</dt><dd dir="auto">{book.translator}</dd></>)}
          {book.publisher && (<><dt>{t('add.publisher')}</dt><dd dir="auto">{book.publisher}</dd></>)}
          {book.year && (<><dt>{t('add.year')}</dt><dd>{book.year}</dd></>)}
          <dt>{t('add.language')}</dt><dd>{t(`lang.${book.language}`)}</dd>
          <dt>{t('add.category')}</dt><dd>{t(`cat.${book.category}`)}</dd>
          <dt>{t('add.condition')}</dt><dd>{t(`cond.${book.condition}`)}</dd>
        </dl>
      </section>

      <section className="section">
        <h2>{t('bookpage.howTitle')}</h2>
        <Steps items={[t('home.step1'), t('home.step2'), t('home.step3')]} />
      </section>

      {similar.length > 0 && (
        <section className="section">
          <h2>{t('bookpage.more')}</h2>
          <BookGrid books={similar} />
        </section>
      )}
    </>
  );
}
