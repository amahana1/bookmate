import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { getMyLoans } from '../api/loans';
import { nextAction, waitingForMe } from '../lib/loans';
import { berlinToday } from '../lib/format';
import type { LoanRow } from '../types';
import { BookCover } from '../components/BookBits';
import { ErrorBox, Loading, StatusBox } from '../components/Feedback';

function LoanRowItem({ loan, me }: { loan: LoanRow; me: string }) {
  const { t, date } = useT();
  const other = loan.owner_id === me ? loan.borrower_first_name : loan.owner_first_name;
  const { overdue } = nextAction(loan, me, berlinToday());
  return (
    <li className="loan-row">
      <BookCover book={{ id: loan.book_id, title: loan.book_title, cover_path: loan.book_cover_path }} small />
      <div className="body">
        <Link to={`/loans/${loan.id}`} className="title" dir="auto">{loan.book_title}</Link>
        <div className="meta">{t(`loan.status.${loan.status}`)} · {t('myloans.with', { name: other })}</div>
        {loan.due_date && (loan.status === 'reading' || loan.status === 'return_marked') && (
          <div className="meta">{t('loan.dueDate', { date: date(loan.due_date) })} · {t('loan.extensions', { used: loan.extensions_used })}</div>
        )}
        {overdue && <div className="meta"><strong>{t('loan.overdue')}</strong></div>}
      </div>
    </li>
  );
}

function Section({ title, loans, me }: { title: string; loans: LoanRow[]; me: string }) {
  const { t } = useT();
  return (
    <section className="section">
      <h2 style={{ fontSize: 28 }}>{title}</h2>
      {loans.length === 0 ? <p className="muted">{t('myloans.none')}</p> : (
        <ul className="loan-list">{loans.map((l) => <LoanRowItem key={l.id} loan={l} me={me} />)}</ul>
      )}
    </section>
  );
}

const OPEN = new Set(['requested', 'accepted', 'reading', 'return_marked']);

export function MyLoansTab() {
  const { t } = useT();
  const { session } = useAuth();
  const [loans, setLoans] = useState<LoanRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getMyLoans().then(setLoans).catch(() => setFailed(true));
  }, []);

  if (failed) return <ErrorBox>{t('common.error')}</ErrorBox>;
  if (!loans || !session) return <Loading />;
  const me = session.user.id;
  const open = loans.filter((l) => OPEN.has(l.status));
  if (open.length === 0) return <StatusBox><p style={{ margin: 0 }}>{t('myloans.empty')}</p></StatusBox>;

  const waiting = waitingForMe(open, me);
  const waitingIds = new Set(waiting.map((l) => l.id));
  const borrowed = open.filter((l) => l.borrower_id === me && !waitingIds.has(l.id));
  const lent = open.filter((l) => l.owner_id === me && !waitingIds.has(l.id));

  return (
    <>
      <Section title={t('myloans.waiting')} loans={waiting} me={me} />
      <Section title={t('myloans.borrowed')} loans={borrowed} me={me} />
      <Section title={t('myloans.lent')} loans={lent} me={me} />
    </>
  );
}
