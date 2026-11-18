import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { safeNext } from '../lib/auth-url';
import { Field } from '../components/Field';
import { ErrorBox } from '../components/Feedback';

export function Login() {
  const { t } = useT();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<'wrong' | 'rate' | null>(null);
  const [busy, setBusy] = useState(false);

  if (session && !busy) return <Navigate to={safeNext(next)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      setError(err.status === 429 ? 'rate' : 'wrong');
      return;
    }
    navigate(safeNext(next), { replace: true });
  };

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : '/signup';

  return (
    <div className="two-col">
      <div className="stack">
        <h1>{t('login.title')}</h1>
        {error && <ErrorBox>{t(error === 'rate' ? 'login.rateLimited' : 'login.error')}</ErrorBox>}
        <form className="form-grid form-narrow" onSubmit={submit} noValidate>
          <Field label={t('signup.email')}>
            {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />}
          </Field>
          <Field label={t('signup.password')}>
            {(p) => <input {...p} type="password" autoComplete="current-password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />}
          </Field>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('login.submitting') : t('login.submit')}</button>
            <Link to="/reset-password">{t('login.forgot')}</Link>
          </div>
        </form>
      </div>
      <aside className="card" style={{ order: -1 }}>
        <h2>{t('login.newTitle')}</h2>
        <p>{t('login.newText')}</p>
        <Link to={signupHref} className="btn btn-secondary">{t('nav.signup')}</Link>
      </aside>
    </div>
  );
}
