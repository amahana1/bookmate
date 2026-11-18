import { BERLIN_ORTSTEILE } from '../lib/berlin';
import { useT } from '../i18n';

type Props = { value: string; onChange: (v: string) => void } & Record<string, unknown>;

/** Berlin Ortsteile, shown with their German names. */
export function NeighbourhoodSelect({ value, onChange, ...rest }: Props) {
  const { t } = useT();
  return (
    <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} lang="de" dir="ltr">
      <option value="">{t('signup.chooseNeighbourhood')}</option>
      {BERLIN_ORTSTEILE.map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
}
