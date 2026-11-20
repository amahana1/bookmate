import { useId, type ReactNode } from 'react';
import { WarningIcon } from './Icons';

export interface FieldControlProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  'aria-required'?: true;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  /** Shows an asterisk after the label and marks the control as required for screen readers. */
  required?: boolean;
  children: (props: FieldControlProps) => ReactNode;
}

/** Label + control + hint + error, wired with ids for screen readers. */
export function Field({ label, error, hint, optional, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
        {optional && <> <span className="muted">{optional}</span></>}
      </label>
      {hint && <span id={hintId} className="hint">{hint}</span>}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, 'aria-required': required ? true : undefined })}
      {error && (
        <span id={errId} className="field-error">
          <WarningIcon /> {error}
        </span>
      )}
    </div>
  );
}
