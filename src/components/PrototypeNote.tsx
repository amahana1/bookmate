import { useT } from '../i18n';

/** Always-visible note that this is a prototype with texts under review. */
export function PrototypeNote() {
  const { t } = useT();
  return (
    <p className="proto-note" style={{ margin: 0 }}>
      <span className="dot" aria-hidden="true" />
      {t('proto.note')}
    </p>
  );
}
