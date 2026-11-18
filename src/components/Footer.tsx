import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { INSTAGRAM_URL, TELEGRAM_GROUP_URL } from '../lib/config';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="site-footer dark on-dark">
      <div className="container">
        <nav aria-label={t('footer.nav')}>
          <ul>
            <li><Link to="/about">{t('footer.about')}</Link></li>
            <li><Link to="/rules">{t('footer.rules')}</Link></li>
            <li><Link to="/contact">{t('footer.contact')}</Link></li>
            <li><Link to="/privacy">{t('footer.privacy')}</Link></li>
            <li><Link to="/impressum" lang="de">{t('footer.impressum')}</Link></li>
            <li><a href={TELEGRAM_GROUP_URL}>{t('footer.telegram')}</a></li>
            <li><a href={INSTAGRAM_URL}>{t('footer.instagram')}</a></li>
          </ul>
        </nav>
        <p className="line">{t('footer.line')}</p>
      </div>
    </footer>
  );
}
