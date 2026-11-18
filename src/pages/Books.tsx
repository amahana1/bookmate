import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';
import { listBooks } from '../api/books';
import { BOOK_LANGS, CATEGORIES, filterBooks, paginate, sortBooks } from '../lib/books';
import { TELEGRAM_GROUP_URL } from '../lib/config';
import type { Book, BookLang, Category } from '../types';
import { BookGrid } from '../components/BookBits';
import { ErrorBox, Loading, StatusBox } from '../components/Feedback';
import { SearchIcon } from '../components/Icons';

export function Books() {
  const { t, locale, num } = useT();
  const [params, setParams] = useSearchParams();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [failed, setFailed] = useState(false);

  const q = params.get('q') ?? '';
  const language = (params.get('lang') ?? 'all') as BookLang | 'all';
  const category = (params.get('cat') ?? 'all') as Category | 'all';
  const availableOnly = params.get('avail') === '1';
  const sort = params.get('sort') === 'title' ? 'title' : 'newest';
  const page = Number(params.get('page') ?? '1');
  const [draft, setDraft] = useState(q);

  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    listBooks().then(setBooks).catch(() => setFailed(true));
  }, []);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const filtered = useMemo(
    () => (books ? sortBooks(filterBooks(books, { q, language, category, availableOnly }), sort, locale) : []),
    [books, q, language, category, availableOnly, sort, locale],
  );
  const { items, pages } = paginate(filtered, page);
  const current = Math.min(Math.max(1, page || 1), pages);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    update({ q: draft.trim() });
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="breadcrumb">
        <ol><li><Link to="/">{t('common.home')}</Link></li><li aria-current="page">{t('books.title')}</li></ol>
      </nav>
      <div className="section-head">
        <h1 style={{ margin: 0 }}>{t('books.title')}</h1>
        {books && <span className="muted">{q ? t('books.resultsFor', { n: filtered.length, q }) : t('books.count', { n: filtered.length })}</span>}
      </div>

      <form role="search" onSubmit={submit} className="btn-row" style={{ alignItems: 'stretch', marginTop: 12 }}>
        <label htmlFor="books-search" className="visually-hidden">{t('nav.searchLabel')}</label>
        <input id="books-search" className="input" style={{ flex: '1 1 240px', width: 'auto' }} type="search" dir="auto"
          placeholder={t('nav.searchPlaceholder')} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="btn btn-secondary"><SearchIcon />{t('nav.search')}</button>
      </form>

      <div className="filters">
        <div className="field">
          <label htmlFor="f-lang">{t('books.language')}</label>
          <select id="f-lang" value={language} onChange={(e) => update({ lang: e.target.value })}>
            <option value="all">{t('books.all')}</option>
            {BOOK_LANGS.map((l) => <option key={l} value={l}>{t(`lang.${l}`)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-cat">{t('books.category')}</label>
          <select id="f-cat" value={category} onChange={(e) => update({ cat: e.target.value })}>
            <option value="all">{t('books.all')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-sort">{t('books.sort')}</label>
          <select id="f-sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })}>
            <option value="newest">{t('books.sortNewest')}</option>
            <option value="title">{t('books.sortTitle')}</option>
          </select>
        </div>
        <label className="option">
          <input type="checkbox" checked={availableOnly} onChange={(e) => update({ avail: e.target.checked ? '1' : null })} />
          {t('books.availableOnly')}
        </label>
      </div>

      {failed && <ErrorBox>{t('common.error')}</ErrorBox>}
      {!books && !failed && <Loading />}
      {books && filtered.length === 0 && (
        <StatusBox>
          <p>{q ? t('books.empty', { q }) : t('books.emptyFilters')}</p>
          <div className="btn-row">
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setParams(new URLSearchParams())}>{t('books.clear')}</button>
            <a className="btn btn-secondary btn-small" href={TELEGRAM_GROUP_URL}>{t('books.askTelegram')}</a>
          </div>
        </StatusBox>
      )}
      {items.length > 0 && <BookGrid books={items} />}
      {pages > 1 && (
        <nav className="pagination" aria-label={t('books.pagination')}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
            p === current ? (
              <span key={p} aria-current="page">{num(p)}</span>
            ) : (
              <Link key={p} aria-label={t('books.pageN', { n: p })} to={`?${(() => { const n = new URLSearchParams(params); n.set('page', String(p)); return n.toString(); })()}`}>{num(p)}</Link>
            ),
          )}
        </nav>
      )}
    </>
  );
}
