import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { listBooks } from '../api/books';
import type { Book } from '../types';
import { Shelf } from '../components/Shelf';
import { DistrictMap } from '../components/DistrictMap';
import { Stamps } from '../components/Stamps';
import { MeetupBox } from '../components/MeetupBox';
import { ErrorBox, Loading } from '../components/Feedback';
import { PlusIcon } from '../components/Icons';

export function Home() {
  const { t } = useT();
  const navigate = useNavigate();
  const loc = useLocation();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    listBooks().then(setBooks).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (books && loc.hash === '#map') document.getElementById('map')?.scrollIntoView({ block: 'start' });
  }, [books, loc.hash]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/books?q=${encodeURIComponent(q.trim())}` : '/books');
  };

  return (
    <>
      <section className="hero-grid">
        <div className="stack" style={{ minWidth: 0 }}>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1 className="hero-title" style={{ margin: 0 }}>{t('home.title')}</h1>
          <p className="lead" style={{ margin: 0 }}>{t('home.lead')}</p>
          <form role="search" onSubmit={search} className="btn-row" style={{ alignItems: 'stretch' }}>
            <label htmlFor="home-search" className="visually-hidden">{t('nav.searchLabel')}</label>
            <input id="home-search" className="input" style={{ flex: '1 1 220px', width: 'auto' }} type="search" dir="auto"
              placeholder={t('nav.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="submit" className="btn btn-primary">{t('home.searchShelf')}</button>
          </form>
        </div>
        <div style={{ minWidth: 0 }}>
          {failed ? <ErrorBox>{t('common.error')}</ErrorBox> : books ? <Shelf books={books} /> : <Loading />}
        </div>
      </section>

      <section className="section" id="map" aria-labelledby="map-title" style={{ scrollMarginTop: 16 }}>
        <div className="section-head">
          <h2 id="map-title">{t('map.title')}</h2>
          <p className="muted" style={{ margin: 0 }}>{t('map.note')}</p>
        </div>
        {books ? <DistrictMap books={books} /> : <Loading />}
        <p className="small muted" style={{ marginTop: 10 }}>{t('map.legend')}</p>
      </section>

      <section className="section" aria-labelledby="stamps-title">
        <div className="section-head">
          <h2 id="stamps-title">{t('stamps.title')}</h2>
          <Link to="/how-it-works">{t('nav.how')}</Link>
        </div>
        <Stamps />
      </section>

      <div className="section cols-2">
        <MeetupBox />
        <section className="invite-box" aria-labelledby="invite-title">
          <h2 id="invite-title" style={{ fontSize: 28, margin: 0 }}>{t('home.inviteTitle')}</h2>
          <p style={{ margin: 0 }}>{t('home.inviteText')}</p>
          <Link to="/add" className="btn btn-ink"><PlusIcon />{t('home.inviteCta')}</Link>
        </section>
      </div>
    </>
  );
}
