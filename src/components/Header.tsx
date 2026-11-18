import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { LanguageSwitch } from './LanguageSwitch';
import { PrototypeNote } from './PrototypeNote';
import { CloseIcon, MenuIcon, PlusIcon, SearchIcon } from './Icons';

function SearchForm({ idSuffix }: { idSuffix: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/books?q=${encodeURIComponent(q.trim())}` : '/books');
  };
  const id = `header-search-${idSuffix}`;
  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <label htmlFor={id} className="visually-hidden">{t('nav.searchLabel')}</label>
      <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.searchPlaceholder')} dir="auto" />
      <button type="submit" className="btn btn-secondary btn-small" aria-label={t('nav.search')}>
        <SearchIcon />
      </button>
    </form>
  );
}

export function Header({ waiting = 0 }: { waiting?: number }) {
  const { t, num } = useT();
  const { session, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const loc = useLocation();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [loc.pathname, loc.search, loc.hash]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAccountOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const loginNext = `/login?next=${encodeURIComponent(loc.pathname + loc.search)}`;
  const badge = waiting > 0 ? <span className="badge" aria-label={t('nav.waiting', { n: waiting })}>{num(waiting)}</span> : null;

  const accountLinks = (
    <>
      <Link to="/me?tab=loans">{t('nav.myLoans')} {badge}</Link>
      <Link to="/me?tab=books">{t('nav.myBooks')}</Link>
      <Link to="/account">{t('nav.account')}</Link>
      {profile?.is_admin && <Link to="/admin">{t('nav.admin')}</Link>}
      <button type="button" onClick={() => void signOut()}>{t('nav.logout')}</button>
    </>
  );

  return (
    <>
      <a className="skip-link" href="#main">{t('nav.skip')}</a>
      <div className="proto-strip">
        <div className="container">
          <PrototypeNote />
          <LanguageSwitch />
        </div>
      </div>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="brand" aria-label={t('brand.home')}>
            <span className="wordmark" lang="fa">هم‌کتاب</span>
            <span className="latin" lang="en">Book Mate</span>
          </Link>
          <nav className="main-nav" aria-label={t('nav.main')}>
            <NavLink to="/books">{t('nav.shelves')}</NavLink>
            <Link to="/#map">{t('nav.map')}</Link>
            <NavLink to="/how-it-works">{t('nav.how')}</NavLink>
          </nav>
          <SearchForm idSuffix="desktop" />
          <Link to="/books" className="search-link" aria-label={t('nav.searchLabel')}><SearchIcon /></Link>
          <div className="header-actions">
            <Link to="/add" className="btn btn-secondary btn-small"><PlusIcon />{t('nav.add')}</Link>
            {session ? (
              <div className="account-menu" ref={accountRef}>
                <button
                  type="button"
                  className="btn btn-on-teal btn-small"
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                  aria-label={`${t('nav.accountMenu')}: ${profile?.first_name ?? ''}`}
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <span dir="auto">{profile?.first_name ?? '…'}</span> {badge}
                </button>
                {accountOpen && <div className="dropdown">{accountLinks}</div>}
              </div>
            ) : (
              <>
                <Link to={loginNext} className="btn btn-on-teal btn-small">{t('nav.login')}</Link>
                <Link to="/signup" className="btn btn-on-teal btn-small">{t('nav.signup')}</Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn-on-teal btn-small menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-panel"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
            {menuOpen ? t('nav.closeMenu') : t('nav.menu')}
            {!menuOpen && badge}
          </button>
        </div>
        <div id="mobile-panel" className="mobile-panel" data-open={menuOpen}>
          <div className="container">
            <SearchForm idSuffix="mobile" />
            <nav aria-label={t('nav.main')}>
              <Link to="/books">{t('nav.shelves')}</Link>
              <Link to="/#map">{t('nav.map')}</Link>
              <Link to="/how-it-works">{t('nav.how')}</Link>
              <Link to="/add">{t('nav.add')}</Link>
              {session && (
                <>
                  <p className="sub" dir="auto">{profile?.first_name}</p>
                  {accountLinks}
                </>
              )}
            </nav>
            {!session && (
              <div className="btn-row">
                <Link to={loginNext} className="btn btn-on-teal btn-small">{t('nav.login')}</Link>
                <Link to="/signup" className="btn btn-secondary btn-small">{t('nav.signup')}</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
