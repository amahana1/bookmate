import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { supabase } from '../lib/supabase';
import { CONTACT_EMAIL, EMAIL_ENABLED, SITE_URL } from '../lib/config';
import { isValidEmail } from '../lib/validate';
import { Field } from '../components/Field';
import { ErrorBox, StatusBox } from '../components/Feedback';

type Mode = 'request' | 'sent' | 'new' | 'expired';

export function ResetPassword() {
  const { t } = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(() => (window.location.hash.includes('error_code=otp_expired') ? 'expired' : 'request'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('new');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!EMAIL_ENABLED) {
    return (
      <div className="form-narrow stack">
        <h1>{t('reset.title')}</h1>
        <StatusBox><p style={{ margin: 0 }}>{t('reset.unavailable', { email: CONTACT_EMAIL })}</p></StatusBox>
      </div>
    );
  }

  const requestLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError(t('signup.error.email'));
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/reset-password` });
    setBusy(false);
    setError(null);
    setMode('sent'); // same message whether or not the account exists
  };

  const saveNew = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(t('signup.error.password'));
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(t('common.error'));
    navigate('/', { replace: true });
  };

  return (
    <div className="form-narrow stack">
      <h1>{mode === 'new' ? t('reset.newTitle') : t('reset.title')}</h1>
      {error && <ErrorBox>{error}</ErrorBox>}
      {mode === 'expired' && (
        <StatusBox>
          <p>{t('reset.expired')}</p>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setMode('request')}>{t('reset.sendNew')}</button>
        </StatusBox>
      )}
      {mode === 'sent' && <StatusBox><p style={{ margin: 0 }}>{t('reset.sent')}</p></StatusBox>}
      {mode === 'request' && (
        <form className="form-grid" onSubmit={requestLink} noValidate>
          <p className="lead">{t('reset.lead')}</p>
          <Field label={t('signup.email')}>
            {(p) => <input {...p} type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <div><button className="btn btn-primary" disabled={busy}>{t('reset.submit')}</button></div>
        </form>
      )}
      {mode === 'new' && (
        <form className="form-grid" onSubmit={saveNew} noValidate>
          <Field label={t('reset.newPassword')} hint={t('signup.passwordHint')}>
            {(p) => <input {...p} type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <div><button className="btn btn-primary" disabled={busy}>{t('reset.saveLogin')}</button></div>
        </form>
      )}
    </div>
  );
}
