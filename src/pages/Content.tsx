import { Link } from 'react-router-dom';
import { useT, type TKey } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { ADMIN_TELEGRAM, CONTACT_EMAIL, TELEGRAM_GROUP_URL } from '../lib/config';
import { Steps } from '../components/Steps';
import { MeetupBox } from '../components/MeetupBox';
import { StatusBox } from '../components/Feedback';

function Bullets({ keys }: { keys: TKey[] }) {
  const { t } = useT();
  return <ul className="teal-bullets">{keys.map((k) => <li key={k}>{t(k)}</li>)}</ul>;
}

function Accordion({ items }: { items: [TKey, TKey][] }) {
  const { t } = useT();
  return (
    <div className="accordion">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>{t(q)}</summary>
          <div className="answer">{t(a)}</div>
        </details>
      ))}
    </div>
  );
}

const RULE_ROWS = ['membership', 'pending', 'concurrent', 'length', 'extension', 'handover', 'answer', 'return', 'money'] as const;

export function HowItWorks() {
  const { t } = useT();
  const { session } = useAuth();
  return (
    <div className="stack">
      <h1>{t('nav.how')}</h1>
      <p className="lead">{t('how.lead')}</p>
      <section className="section">
        <h2>{t('how.stepsTitle')}</h2>
        <Steps items={[t('how.s1'), t('how.s2'), t('how.s3'), t('how.s4'), t('how.s5')]} />
      </section>
      <section className="section">
        <h2>{t('how.rulesTitle')}</h2>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {RULE_ROWS.map((r) => (
                <tr key={r}>
                  <th scope="row">{t(`how.rule.${r}`)}</th>
                  <td>{t(`how.rule.${r}V`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small" style={{ marginTop: 10 }}><Link to="/rules">{t('signup.rulesLink')}</Link></p>
      </section>
      <div className="section cols-2">
        <section className="card">
          <h2 style={{ fontSize: 28 }}>{t('how.lendTitle')}</h2>
          <Bullets keys={['how.lend1', 'how.lend2', 'how.lend3', 'how.lend4']} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 28 }}>{t('how.problemTitle')}</h2>
          <Bullets keys={['how.problem1', 'how.problem2', 'how.problem3']} />
        </section>
      </div>
      <section className="section" style={{ maxWidth: 760 }}>
        <h2>{t('how.faqTitle')}</h2>
        <Accordion items={[['how.q1', 'how.a1'], ['how.q2', 'how.a2'], ['how.q3', 'how.a3'], ['how.q4', 'how.a4'], ['how.q5', 'how.a5'], ['how.q6', 'how.a6']]} />
      </section>
      <div className="section"><MeetupBox /></div>
      {!session && (
        <div className="section btn-row">
          <Link to="/signup" className="btn btn-primary">{t('nav.signup')}</Link>
          <Link to="/books" className="btn btn-secondary">{t('common.browse')}</Link>
        </div>
      )}
    </div>
  );
}

export function About() {
  const { t } = useT();
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.lead')}</p>
      <section className="section">
        <h2>{t('about.whoTitle')}</h2>
        <p>{t('about.who')}</p>
      </section>
      <div className="section cols-2">
        <section className="card">
          <h2 style={{ fontSize: 28 }}>{t('about.isTitle')}</h2>
          <Bullets keys={['about.is1', 'about.is2', 'about.is3']} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 28 }}>{t('about.notTitle')}</h2>
          <Bullets keys={['about.not1', 'about.not2', 'about.not3', 'about.not4']} />
        </section>
      </div>
      <section className="section">
        <h2>{t('about.joinTitle')}</h2>
        <p>{t('about.join')}</p>
        <div className="btn-row">
          <Link to="/add" className="btn btn-primary">{t('nav.add')}</Link>
          <a href={TELEGRAM_GROUP_URL} className="btn btn-secondary">{t('footer.telegram')}</a>
          <Link to="/contact" className="btn btn-secondary">{t('footer.contact')}</Link>
        </div>
      </section>
    </div>
  );
}

const RULE_SECTIONS: { id: string; title: TKey; items: TKey[] }[] = [
  { id: 'borrow', title: 'rules.borrowTitle', items: ['rules.b1', 'rules.b2', 'rules.b3'] },
  { id: 'return', title: 'rules.returnTitle', items: ['rules.r1', 'rules.r2', 'rules.r3'] },
  { id: 'lend', title: 'rules.lendTitle', items: ['rules.l1', 'rules.l2', 'rules.l3'] },
  { id: 'handover', title: 'rules.handoverTitle', items: ['rules.h1', 'rules.h2', 'rules.h3'] },
  { id: 'lost', title: 'rules.lostTitle', items: ['rules.x1', 'rules.x2', 'rules.x3', 'rules.x4'] },
  { id: 'telegram', title: 'rules.telegramTitle', items: ['rules.t1', 'rules.t2'] },
];

export function Rules() {
  const { t } = useT();
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <h1>{t('footer.rules')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('rules.updated')}</p>
      <p className="lead">{t('rules.lead')}</p>
      <nav aria-label={t('footer.rules')}>
        <ul className="teal-bullets">
          {RULE_SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{t(s.title)}</a></li>)}
        </ul>
      </nav>
      {RULE_SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="section">
          <h2>{t(s.title)}</h2>
          <Bullets keys={s.items} />
        </section>
      ))}
    </div>
  );
}

export function Contact() {
  const { t } = useT();
  return (
    <div className="stack form-narrow">
      <h1>{t('footer.contact')}</h1>
      <p className="lead">{t('contact.lead')}</p>
      <div className="card">
        <dl className="details">
          <dt>{t('contact.email')}</dt><dd>{CONTACT_EMAIL}</dd>
          <dt>{t('contact.telegram')}</dt><dd>{ADMIN_TELEGRAM}</dd>
        </dl>
        <p className="small" style={{ margin: '12px 0 0' }}>{t('contact.response')}</p>
      </div>
      <p>{t('contact.before')} <Link to="/how-it-works">{t('nav.how')}</Link></p>
      <StatusBox><p style={{ margin: 0 }}>{t('contact.loanProblem')}</p></StatusBox>
    </div>
  );
}

const PRIVACY: [TKey, TKey][] = [
  ['privacy.whoTitle', 'privacy.who'], ['privacy.whatTitle', 'privacy.what'], ['privacy.contactTitle', 'privacy.contact'],
  ['privacy.whereTitle', 'privacy.where'], ['privacy.cookiesTitle', 'privacy.cookies'], ['privacy.retentionTitle', 'privacy.retention'],
  ['privacy.rightsTitle', 'privacy.rights'],
];

export function Privacy() {
  const { t } = useT();
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <h1>{t('footer.privacy')}</h1>
      <StatusBox><p style={{ margin: 0 }}><strong>{t('privacy.draft')}</strong></p></StatusBox>
      {PRIVACY.map(([h, p]) => (
        <section key={h} className="section">
          <h2 style={{ fontSize: 28 }}>{t(h)}</h2>
          <p>{t(p, { email: CONTACT_EMAIL })}</p>
        </section>
      ))}
    </div>
  );
}

export function Impressum() {
  const { t } = useT();
  return (
    <div className="stack form-narrow">
      <h1 lang="de">Impressum</h1>
      <StatusBox><p style={{ margin: 0 }}><strong>{t('impressum.draft')}</strong></p></StatusBox>
      <address style={{ fontStyle: 'normal' }}>
        <p style={{ margin: 0 }}>{t('impressum.name')}</p>
        <p style={{ margin: 0 }}>{t('impressum.address')}</p>
        <p style={{ margin: 0 }}>{t('impressum.email', { email: CONTACT_EMAIL })}</p>
        <p style={{ margin: 0 }}>{t('impressum.second')}</p>
      </address>
    </div>
  );
}
