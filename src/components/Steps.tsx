import { useT } from '../i18n';

/** Numbered step cards (turquoise circle with ink number, Persian digits in fa). */
export function Steps({ items }: { items: string[] }) {
  const { num } = useT();
  return (
    <ol className="steps">
      {items.map((text, i) => (
        <li key={i}>
          <span className="step-num" aria-hidden="true">{num(i + 1)}</span>
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}
