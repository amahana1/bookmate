import { useT } from '../i18n';

/** "How it works" as three dashed library stamps. */
export function Stamps() {
  const { t, num } = useT();
  const items = [
    { label: t('stamps.l1'), text: t('stamps.t1'), tilt: -6 },
    { label: t('stamps.l2'), text: t('stamps.t2'), tilt: 4 },
    { label: t('stamps.l3'), text: t('stamps.t3'), tilt: -3 },
  ];
  return (
    <ol className="stamps">
      {items.map((s, i) => (
        <li key={i}>
          <span className="stamp" style={{ transform: `rotate(${s.tilt}deg)` }} aria-hidden="true">
            <span className="num">{num(i + 1)}</span>
          </span>
          <div>
            <h3 style={{ margin: 0 }}>{s.label}</h3>
            <p style={{ margin: 0 }}>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
