import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '../i18n';
import { WarningIcon } from './Icons';

export function Loading() {
  const { t } = useT();
  return <p role="status" className="muted">{t('common.loading')}</p>;
}

/** Error message: words + icon, never colour alone (doc 3 §7). `focusKey` changes → the box takes keyboard focus. */
export function ErrorBox({ children, focusKey }: { children: ReactNode; focusKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusKey) ref.current?.focus();
  }, [focusKey]);
  return (
    <div className="error-box" role="alert" ref={ref} tabIndex={focusKey !== undefined ? -1 : undefined}>
      <WarningIcon />
      <div>{children}</div>
    </div>
  );
}

export function StatusBox({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="status-box">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

interface ToastApi { show: (message: string) => void }
const ToastCtx = createContext<ToastApi>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((m: string) => setMessage(m), []);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(id);
  }, [message]);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div aria-live="polite">
        {message && (
          <div className="toast">
            <span>{message}</span>
            <button type="button" className="btn-link" onClick={() => setMessage(null)}>{t('common.close')}</button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastCtx);
}
