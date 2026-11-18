import { useEffect, useState, type FormEvent } from 'react';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { updateProfile } from '../api/profile';
import { normalizeTelegram, postcodeError, telegramError } from '../lib/validate';
import { toAsciiDigits } from '../lib/format';
import { CONTACT_EMAIL } from '../lib/config';
import type { TKey } from '../i18n/translate';
import { Field } from '../components/Field';
import { ErrorBox, Loading, useToast } from '../components/Feedback';
import { NeighbourhoodSelect } from '../components/NeighbourhoodSelect';
import { LanguageSwitch } from '../components/LanguageSwitch';

export function Account() {
  const { t } = useT();
  const { session, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [firstName, setFirstName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [telegram, setTelegram] = useState('');
  const [errors, setErrors] = useState<Record<string, TKey>>({});
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState<TKey | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name);
    setPostcode(profile.postcode === '00000' ? '' : profile.postcode);
    setNeighbourhood(profile.neighbourhood);
    setTelegram(profile.telegram ?? '');
  }, [profile]);

  if (!profile || !session) return <Loading />;

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, TKey> = {};
    if (!firstName.trim()) found.firstName = 'signup.error.firstName';
    const pc = postcodeError(postcode);
    if (pc) found.postcode = pc;
    if (!neighbourhood) found.neighbourhood = 'signup.error.neighbourhood';
    const tg = telegramError(telegram);
    if (tg) found.telegram = tg;
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFailed(false);
    try {
      await updateProfile(session.user.id, {
        first_name: firstName.trim(),
        postcode: toAsciiDigits(postcode.trim()),
        neighbourhood,
        telegram: normalizeTelegram(telegram),
      });
      await refreshProfile();
      toast.show(t('account.saved'));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setPwError('signup.error.password');
    setPwError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setPwError('common.error');
    setPassword('');
    toast.show(t('account.passwordSaved'));
  };

  return (
    <div className="stack form-narrow">
      <h1>{t('account.title')}</h1>

      <section className="section stack">
        <h2>{t('account.profile')}</h2>
        {failed && <ErrorBox>{t('common.error')}</ErrorBox>}
        <form className="form-grid" onSubmit={saveProfile} noValidate>
          <Field label={t('signup.firstName')} error={errors.firstName && t(errors.firstName)}>
            {(p) => <input {...p} dir="auto" maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} />}
          </Field>
          <div className="field">
            <span className="label">{t('signup.email')}</span>
            <span dir="ltr" style={{ textAlign: 'start' }}>{session.user.email}</span>
          </div>
          <div className="form-grid two">
            <Field label={t('signup.postcode')} error={errors.postcode && t(errors.postcode)}>
              {(p) => <input {...p} dir="ltr" inputMode="numeric" maxLength={5} value={postcode} onChange={(e) => setPostcode(e.target.value)} />}
            </Field>
            <Field label={t('signup.neighbourhood')} error={errors.neighbourhood && t(errors.neighbourhood)}>
              {(p) => <NeighbourhoodSelect {...p} value={neighbourhood} onChange={setNeighbourhood} />}
            </Field>
          </div>
          <Field label={t('signup.telegram')} optional={t('common.optional')} hint={t('signup.telegramHint')} error={errors.telegram && t(errors.telegram)}>
            {(p) => <input {...p} dir="ltr" maxLength={33} placeholder="@username" value={telegram} onChange={(e) => setTelegram(e.target.value)} />}
          </Field>
          <div><button className="btn btn-primary" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</button></div>
        </form>
      </section>

      <section className="section stack">
        <h2>{t('account.language')}</h2>
        <LanguageSwitch />
      </section>

      <section className="section stack">
        <h2>{t('account.passwordTitle')}</h2>
        <form className="form-grid" onSubmit={savePassword} noValidate>
          <Field label={t('reset.newPassword')} hint={t('signup.passwordHint')} error={pwError ? t(pwError) : undefined}>
            {(p) => <input {...p} type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <div><button className="btn btn-secondary">{t('account.passwordSave')}</button></div>
        </form>
      </section>

      <section className="section stack">
        <h2>{t('account.deleteTitle')}</h2>
        <p>{t('account.deleteText', { email: CONTACT_EMAIL })}</p>
      </section>
    </div>
  );
}
