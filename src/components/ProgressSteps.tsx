import { useT } from '../i18n';
import { CheckIcon } from './Icons';

const STEPS = ['loan.step0', 'loan.step1', 'loan.step2', 'loan.step3', 'loan.step4', 'loan.step5'] as const;

/** Six loan steps: done = tint with ✓, current = turquoise and bold, upcoming = white with border. */
export function ProgressSteps({ current }: { current: number }) {
  const { t } = useT();
  return (
    <ol className="progress" aria-label={t('loan.progress')}>
      {STEPS.map((k, i) => {
        const done = i < current || current === 5;
        const now = i === current && current !== 5;
        return (
          <li key={k} className={done ? 'done' : now ? 'current' : ''} aria-current={now ? 'step' : undefined}>
            {done && <CheckIcon />} {t(k)}
            <span className="visually-hidden"> ({done ? t('loan.stepDone') : now ? t('loan.stepCurrent') : ''})</span>
          </li>
        );
      })}
    </ol>
  );
}
