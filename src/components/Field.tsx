import { useId, type ReactNode } from 'react';
import { WarningIcon } from './Icons';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
}

/** Label + control + hint + error, wired with ids for screen readers. */
export function Field({ label, error, hint, optional, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {optional && <span className="muted">{optional}</span>}
      </label>
      {hint && <span id={hintId} className="hint">{hint}</span>}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error && (
        <span id={errId} className="field-error">
          <WarningIcon /> {error}
        </span>
      )}
    </div>
  );
}
