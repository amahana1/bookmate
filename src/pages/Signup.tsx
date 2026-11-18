import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { normalizeTelegram, validateSignup, type Errors, type SignupValues } from '../lib/validate';
import { toAsciiDigits } from '../lib/format';
import { safeNext } from '../lib/auth-url';
import { INSTAGRAM_URL, SITE_URL, TELEGRAM_GROUP_URL } from '../lib/config';
import { Field } from '../components/Field';
import { ErrorBox, StatusBox } from '../components/Feedback';
import { NeighbourhoodSelect } from '../components/NeighbourhoodSelect';

const EMPTY: SignupValues = { firstName: '', email: '', password: '', postcode: '', neighbourhood: '', telegram: '', acceptedRules: false };

export function Signup() {
  const { t, locale } = useT();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [v, setV] = useState<SignupValues>(EMPTY);
  const [errors, setErrors] = useState<Errors<SignupValues>>({});
  const [busy, setBusy] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  if (session && !busy) return <Navigate to={safeNext(next)} replace />;

  const set = <K extends keyof SignupValues>(k: K, value: SignupValues[K]) => setV((old) => ({ ...old, [k]: value }));
  const err = (k: keyof SignupValues) => (errors[k] ? t(errors[k]!) : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setDuplicate(false);
    setFailed(false);
    const found = validateSignup(v);
    setErrors(found);
    if (Object.keys(found).length > 0) return setFailedAttempts((n) => n + 1);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: v.email.trim(),
      password: v.password,
      options: {
        emailRedirectTo: `${SITE_URL}/confirm-email`,
        data: {
          first_name: v.firstName.trim(),
          postcode: toAsciiDigits(v.postcode.trim()),
          neighbourhood: v.neighbourhood,
          telegram: normalizeTelegram(v.telegram),
          locale,
        },
      },
    });
    if (error) {
      setBusy(false);
      if (/already|registered|exists/i.test(error.message)) setDuplicate(true);
      else setFailed(true);
      return;
    }
    if (data.session) navigate(next ? safeNext(next) : '/add?first=1', { replace: true });
    else navigate(`/confirm-email?email=${encodeURIComponent(v.email.trim())}`, { replace: true });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="form-narrow stack">
      <h1>{t('signup.title')}</h1>
      <p className="lead">{t('signup.lead')}</p>

      {duplicate && (
        <StatusBox title={t('signup.duplicateTitle')}>
          <p>{t('signup.duplicateText')}</p>
          <div className="btn-row">
            <Link className="btn btn-primary btn-small" to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>{t('nav.login')}</Link>
            <Link className="btn btn-secondary btn-small" to="/reset-password">{t('signup.resetLink')}</Link>
          </div>
        </StatusBox>
      )}
      {failed && <ErrorBox>{t('common.error')}</ErrorBox>}
      {hasErrors && <ErrorBox focusKey={failedAttempts}>{t('signup.fixErrors')}</ErrorBox>}

      <form className="form-grid" onSubmit={submit} noValidate>
        <Field label={t('signup.firstName')} error={err('firstName')}>
          {(p) => <input {...p} autoComplete="given-name" value={v.firstName} onChange={(e) => set('firstName', e.target.value)} dir="auto" />}
        </Field>
        <Field label={t('signup.email')} error={err('email')}>
          {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" dir="ltr" value={v.email} onChange={(e) => set('email', e.target.value)} />}
        </Field>
        <Field label={t('signup.password')} hint={t('signup.passwordHint')} error={err('password')}>
          {(p) => <input {...p} type="password" autoComplete="new-password" dir="ltr" value={v.password} onChange={(e) => set('password', e.target.value)} />}
        </Field>
        <div className="form-grid two">
          <Field label={t('signup.postcode')} hint={t('signup.postcodeHint')} error={err('postcode')}>
            {(p) => <input {...p} inputMode="numeric" autoComplete="postal-code" dir="ltr" maxLength={5} value={v.postcode} onChange={(e) => set('postcode', e.target.value)} />}
          </Field>
          <Field label={t('signup.neighbourhood')} hint={t('signup.neighbourhoodHint')} error={err('neighbourhood')}>
            {(p) => <NeighbourhoodSelect {...p} value={v.neighbourhood} onChange={(x) => set('neighbourhood', x)} />}
          </Field>
        </div>
        {errors.postcode === 'signup.error.notBerlin' && (
          <p className="small">
            {t('signup.notBerlinMore')} <a href={TELEGRAM_GROUP_URL}>{t('footer.telegram')}</a> · <a href={INSTAGRAM_URL}>{t('footer.instagram')}</a>
          </p>
        )}
        <Field label={t('signup.telegram')} optional={t('common.optional')} hint={t('signup.telegramHint')} error={err('telegram')}>
          {(p) => <input {...p} dir="ltr" autoComplete="off" placeholder="@username" value={v.telegram} onChange={(e) => set('telegram', e.target.value)} />}
        </Field>

        <div className="card">
          <h3>{t('signup.rulesTitle')}</h3>
          <ul className="teal-bullets">
            <li>{t('signup.rules1')}</li>
            <li>{t('signup.rules2')}</li>
            <li>{t('signup.rules3')}</li>
          </ul>
          <p style={{ margin: 0 }}><Link to="/rules" target="_blank">{t('signup.rulesLink')}</Link></p>
        </div>
        <div className="field">
          <label className="option">
            <input
              type="checkbox"
              checked={v.acceptedRules}
              onChange={(e) => set('acceptedRules', e.target.checked)}
              aria-invalid={errors.acceptedRules ? true : undefined}
            />
            {t('signup.accept')}
          </label>
          {errors.acceptedRules && <span className="field-error" role="alert">{t(errors.acceptedRules)}</span>}
        </div>
        <p className="small" style={{ margin: 0 }}>
          {t('signup.privacyPrefix')} <Link to="/privacy">{t('footer.privacy')}</Link>
        </p>
        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('signup.submitting') : t('signup.submit')}</button>
          <span className="small">{t('signup.haveAccount')} <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>{t('nav.login')}</Link></span>
        </div>
      </form>
    </div>
  );
}
