import { useEffect, useRef } from 'react';
import { useT } from '../i18n';

/** Modal confirmation for destructive actions. */
export function ConfirmDialog({ open, text, confirmLabel, onConfirm, onCancel }: {
  open: boolean;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="confirm" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <p>{text}</p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-small" onClick={onConfirm}>{confirmLabel}</button>
        <button type="button" className="btn btn-secondary btn-small" onClick={onCancel}>{t('common.cancel')}</button>
      </div>
    </dialog>
  );
}
