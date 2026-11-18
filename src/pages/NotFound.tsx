import { Link } from 'react-router-dom';
import { useT } from '../i18n';

/** Unknown page, or (variant "book") a book its owner removed. */
export function NotFound({ variant = 'page', title }: { variant?: 'page' | 'book'; title?: string }) {
  const { t } = useT();
  return (
    <div className="stack form-narrow">
      <h1>{variant === 'book' ? t('notFound.bookTitle') : t('notFound.title')}</h1>
      {title && <p dir="auto"><strong>{title}</strong></p>}
      <p className="lead">{variant === 'book' ? t('notFound.bookText') : t('notFound.text')}</p>
      <div className="btn-row">
        <Link to="/books" className="btn btn-primary">{t('common.browse')}</Link>
        <Link to="/" className="btn btn-secondary">{t('common.home')}</Link>
      </div>
    </div>
  );
}
