import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { createBook, DuplicateBookError, getBook, updateBook } from '../api/books';
import { validateBook, type BookFormValues, type Errors } from '../lib/validate';
import { BOOK_LANGS, CATEGORIES } from '../lib/books';
import { isAcceptedImage, resizeImage } from '../lib/covers';
import { buildLoginUrl } from '../lib/auth-url';
import { SITE_URL } from '../lib/config';
import type { Book, Handover } from '../types';
import { Field } from '../components/Field';
import { ErrorBox, Loading, StatusBox, useToast } from '../components/Feedback';
import { BookCover } from '../components/BookBits';
import { NotFound } from './NotFound';

const EMPTY: BookFormValues = {
  title: '', title_latin: '', author: '', translator: '', publisher: '', language: '', category: '',
  year: '', condition: '', loan_months: '1', handover_methods: ['meetup', 'in_person'],
};

function fromBook(b: Book): BookFormValues {
  return {
    title: b.title, title_latin: b.title_latin ?? '', author: b.author, translator: b.translator ?? '', publisher: b.publisher ?? '',
    language: b.language, category: b.category, year: b.year ? String(b.year) : '', condition: b.condition,
    loan_months: String(b.loan_months) as '1' | '2' | '3', handover_methods: b.handover_methods,
  };
}

export function BookForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { t } = useT();
  const { session, profile, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [v, setV] = useState<BookFormValues>(EMPTY);
  const [original, setOriginal] = useState<Book | null | undefined>(editing ? undefined : null);
  const [errors, setErrors] = useState<Errors<BookFormValues>>({});
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState<Book | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (!id) return;
    getBook(id).then((b) => {
      setOriginal(b);
      if (b) setV(fromBook(b));
    }).catch(() => setOriginal(null));
  }, [id]);

  if (loading) return <Loading />;
  if (!session) {
    return (
      <div className="form-narrow stack">
        <h1>{t('add.title')}</h1>
        <p className="lead">{t('add.lead')}</p>
        <StatusBox>
          <p>{t('add.loggedOut')}</p>
          <div className="btn-row">
            <Link className="btn btn-primary btn-small" to={buildLoginUrl('/add')}>{t('nav.login')}</Link>
            <Link className="btn btn-secondary btn-small" to={`/signup?next=${encodeURIComponent('/add')}`}>{t('nav.signup')}</Link>
          </div>
        </StatusBox>
      </div>
    );
  }
  if (editing && original === undefined) return <Loading />;
  if (editing && (!original || original.owner_id !== session.user.id)) return <NotFound />;

  const set = <K extends keyof BookFormValues>(k: K, value: BookFormValues[K]) => setV((o) => ({ ...o, [k]: value }));
  const toggleHandover = (h: Handover, on: boolean) =>
    set('handover_methods', on ? [...new Set([...v.handover_methods, h])] : v.handover_methods.filter((x) => x !== h));
  const err = (k: keyof BookFormValues) => (errors[k] ? t(errors[k]!) : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateBook(v);
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length || coverError) return setFailedAttempts((n) => n + 1);
    setBusy(true);
    try {
      const blob = cover ? await resizeImage(cover) : removeCover ? null : undefined;
      if (editing && original) {
        await updateBook(original.id, v, blob, original.cover_path);
        toast.show(t('add.savedText'));
        navigate('/me?tab=books');
      } else {
        const created = await createBook(v, blob ?? null);
        setDone(created);
      }
    } catch (x) {
      if (x instanceof DuplicateBookError) setErrors({ title: 'book.error.duplicate' });
      else setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/books/${done.id}`);
      toast.show(t('common.copied'));
    } catch {
      /* clipboard blocked: the link is still on the page */
    }
  };

  if (done) {
    return (
      <div className="form-narrow stack">
        <h1>{t('add.doneTitle')}</h1>
        <StatusBox>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <BookCover book={done} small />
            <div>
              <p dir="auto"><strong>{done.title}</strong></p>
              <p>{t('add.doneText')}</p>
            </div>
          </div>
          <div className="btn-row">
            <Link className="btn btn-primary btn-small" to={`/books/${done.id}`}>{t('add.view')}</Link>
            <button type="button" className="btn btn-secondary btn-small" onClick={share}>{t('add.share')}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => { setDone(null); setV(EMPTY); setCover(null); }}>{t('add.another')}</button>
          </div>
        </StatusBox>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <h1>{editing ? t('add.editTitle') : t('add.title')}</h1>
      <p className="lead">{t('add.lead')}</p>
      {params.get('first') === '1' && !editing && <StatusBox><p style={{ margin: 0 }}>{t('add.firstBook')}</p></StatusBox>}
      {!editing && (
        <div className="card">
          <h3>{t('add.fitsTitle')}</h3>
          <ul className="teal-bullets" style={{ margin: 0 }}>
            <li>{t('add.fits1')}</li>
            <li>{t('add.fits2')}</li>
            <li>{t('add.fits3')}</li>
          </ul>
        </div>
      )}
      {failed && <ErrorBox>{t('common.error')}</ErrorBox>}
      {Object.keys(errors).length > 0 && <ErrorBox focusKey={failedAttempts}>{t('signup.fixErrors')}</ErrorBox>}

      <form className="form-grid" onSubmit={submit} noValidate>
        <h2 style={{ margin: '12px 0 0' }}>{t('add.aboutBook')}</h2>
        <Field label={t('add.titleField')} error={err('title')}>
          {(p) => <input {...p} dir="auto" maxLength={200} value={v.title} onChange={(e) => set('title', e.target.value)} />}
        </Field>
        <Field label={t('add.titleLatin')} optional={t('common.optional')} hint={t('add.titleLatinHint')}>
          {(p) => <input {...p} dir="ltr" lang="en" maxLength={200} value={v.title_latin} onChange={(e) => set('title_latin', e.target.value)} />}
        </Field>
        <div className="form-grid two">
          <Field label={t('add.author')} error={err('author')}>
            {(p) => <input {...p} dir="auto" maxLength={200} value={v.author} onChange={(e) => set('author', e.target.value)} />}
          </Field>
          <Field label={t('add.translator')} optional={t('common.optional')} hint={t('add.translatorHint')}>
            {(p) => <input {...p} dir="auto" maxLength={200} value={v.translator} onChange={(e) => set('translator', e.target.value)} />}
          </Field>
        </div>
        <div className="form-grid two">
          <Field label={t('add.language')} error={err('language')}>
            {(p) => (
              <select {...p} value={v.language} onChange={(e) => set('language', e.target.value)}>
                <option value="">{t('add.choose')}</option>
                {BOOK_LANGS.map((l) => <option key={l} value={l}>{t(`lang.${l}`)}</option>)}
              </select>
            )}
          </Field>
          <Field label={t('add.category')} error={err('category')}>
            {(p) => (
              <select {...p} value={v.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">{t('add.choose')}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
              </select>
            )}
          </Field>
        </div>
        <div className="form-grid two">
          <Field label={t('add.publisher')} optional={t('common.optional')}>
            {(p) => <input {...p} dir="auto" maxLength={200} value={v.publisher} onChange={(e) => set('publisher', e.target.value)} />}
          </Field>
          <Field label={t('add.year')} optional={t('common.optional')} error={err('year')}>
            {(p) => <input {...p} dir="ltr" inputMode="numeric" maxLength={4} value={v.year} onChange={(e) => set('year', e.target.value)} />}
          </Field>
        </div>
        <Field label={t('add.cover')} optional={t('common.optional')} hint={t('add.coverHint')} error={coverError ? t('book.error.cover') : undefined}>
          {(p) => (
            <input {...p} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setCoverError(Boolean(f && !isAcceptedImage(f)));
              setCover(f && isAcceptedImage(f) ? f : null);
              setRemoveCover(false);
            }} />
          )}
        </Field>
        {editing && original?.cover_path && !cover && (
          <label className="option"><input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />{t('add.removeCover')}</label>
        )}

        <h2 style={{ margin: '12px 0 0' }}>{t('add.aboutCopy')}</h2>
        <fieldset className="options">
          <legend>{t('add.condition')}</legend>
          {(['like_new', 'good', 'worn'] as const).map((c) => (
            <label key={c} className="option"><input type="radio" name="condition" checked={v.condition === c} onChange={() => set('condition', c)} />{t(`cond.${c}`)}</label>
          ))}
          {errors.condition && <span className="field-error">{t(errors.condition)}</span>}
        </fieldset>
        <fieldset className="options">
          <legend>{t('add.loanMonths')}</legend>
          {(['1', '2', '3'] as const).map((m) => (
            <label key={m} className="option"><input type="radio" name="months" checked={v.loan_months === m} onChange={() => set('loan_months', m)} />{t('add.months', { n: Number(m) })}</label>
          ))}
        </fieldset>
        <fieldset className="options" aria-invalid={errors.handover_methods ? true : undefined}>
          <legend>{t('add.handover')}</legend>
          <label className="option"><input type="checkbox" checked={v.handover_methods.includes('meetup')} onChange={(e) => toggleHandover('meetup', e.target.checked)} />{t('add.handoverMeetup')}</label>
          <label className="option"><input type="checkbox" checked={v.handover_methods.includes('in_person')} onChange={(e) => toggleHandover('in_person', e.target.checked)} />{t('add.handoverInPerson')}</label>
          {errors.handover_methods && <span className="field-error">{t(errors.handover_methods)}</span>}
        </fieldset>
        {profile?.neighbourhood && <p className="small muted" style={{ margin: 0 }}>{t('add.neighbourhoodNote', { n: profile.neighbourhood })}</p>}
        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('common.saving') : editing ? t('add.saveEdit') : t('add.submit')}</button>
          {editing && <Link to="/me?tab=books" className="btn btn-secondary">{t('common.cancel')}</Link>}
        </div>
      </form>
    </div>
  );
}
