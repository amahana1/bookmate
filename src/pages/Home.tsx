import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { listBooks } from '../api/books';
import type { Book } from '../types';
import { BookGrid } from '../components/BookBits';
import { MeetupBox } from '../components/MeetupBox';
import { Steps } from '../components/Steps';
import { ErrorBox, Loading } from '../components/Feedback';
import { PlusIcon, SearchIcon } from '../components/Icons';

export function Home() {
  const { t } = useT();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    listBooks().then((b) => setBooks(b.slice(0, 8))).catch(() => setFailed(true));
  }, []);

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/books?q=${encodeURIComponent(q.trim())}` : '/books');
  };

  return (
    <>
      <section className="section stack" style={{ maxWidth: 760 }}>
        <h1>{t('home.title')}</h1>
        <p className="lead">{t('home.lead')}</p>
        <form role="search" onSubmit={search} className="btn-row" style={{ alignItems: 'stretch' }}>
          <label htmlFor="home-search" className="visually-hidden">{t('nav.searchLabel')}</label>
          <input id="home-search" className="input" style={{ flex: '1 1 240px', width: 'auto' }} type="search" dir="auto"
            placeholder={t('nav.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn btn-secondary"><SearchIcon />{t('nav.search')}</button>
        </form>
        <div className="btn-row">
          <Link to="/books" className="btn btn-primary">{t('common.browse')}</Link>
          <Link to="/add" className="btn btn-secondary"><PlusIcon />{t('nav.add')}</Link>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title">{t('nav.how')}</h2>
        <Steps items={[t('home.step1'), t('home.step2'), t('home.step3')]} />
        <p className="muted" style={{ marginTop: 14 }}>{t('home.stepsNote')} <Link to="/how-it-works">{t('nav.how')}</Link></p>
      </section>

      <section className="section" aria-labelledby="newest-title">
        <div className="section-head">
          <h2 id="newest-title">{t('home.newest')}</h2>
          <Link to="/books">{t('home.allBooks')}</Link>
        </div>
        {failed ? <ErrorBox>{t('common.error')}</ErrorBox> : books ? <BookGrid books={books} /> : <Loading />}
      </section>

      <div className="section cols-2">
        <MeetupBox />
        <section className="card stack" aria-labelledby="invite-title">
          <h2 id="invite-title" style={{ fontSize: 28 }}>{t('home.inviteTitle')}</h2>
          <p>{t('home.inviteText')}</p>
          <div><Link to="/add" className="btn btn-primary"><PlusIcon />{t('nav.add')}</Link></div>
        </section>
      </div>
    </>
  );
}
