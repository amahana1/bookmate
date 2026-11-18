import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { StatusBox } from '../components/Feedback';

/** Used once email confirmation is switched on in Supabase. */
export function ConfirmEmail() {
  const { t } = useT();
  const { session } = useAuth();
  if (session) {
    return (
      <div className="form-narrow stack">
        <h1>{t('confirm.done')}</h1>
        <Link to="/add?first=1" className="btn btn-primary">{t('confirm.firstBook')}</Link>
      </div>
    );
  }
  return (
    <div className="form-narrow stack">
      <h1>{t('confirm.title')}</h1>
      <StatusBox><p style={{ margin: 0 }}>{t('confirm.text')}</p></StatusBox>
    </div>
  );
}
