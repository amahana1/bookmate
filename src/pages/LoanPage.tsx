import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useT, type TKey } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import {
  cancelLoan, confirmReceived, confirmReturn, getLoan, getLoanContacts, getLoanEvents, markReturned,
  reportProblem, requestExtension, respondExtension, respondRequest, type Contact,
} from '../api/loans';
import { getMeetup, nextMeetup } from '../api/meetups';
import { nextAction, progressStep } from '../lib/loans';
import { berlinToday } from '../lib/format';
import type { LoanEvent, LoanRow, Meetup, ReportKind } from '../types';
import { BookCover } from '../components/BookBits';
import { ErrorBox, Loading, StatusBox, useToast } from '../components/Feedback';
import { MeetupBox, meetupWhen } from '../components/MeetupBox';
import { WarningIcon } from '../components/Icons';
import { NotFound } from './NotFound';
import { notifyLoansChanged } from '../auth/useWaiting';

const REPORT_KINDS: ReportKind[] = ['not_received', 'no_show', 'lost', 'damaged', 'other'];
const SHOW_CONTACTS = new Set(['accepted', 'reading', 'return_marked', 'closed']);

export function LoanPage() {
  const { id = '' } = useParams();
  const i18n = useT();
  const { t, date } = i18n;
  const { session } = useAuth();
  const toast = useToast();
  const [loan, setLoan] = useState<LoanRow | null | undefined>(undefined);
  const [events, setEvents] = useState<LoanEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const [kind, setKind] = useState<ReportKind>('not_received');
  const [reportText, setReportText] = useState('');
  const [reported, setReported] = useState(false);

  const load = useCallback(async () => {
    try {
      const l = await getLoan(id);
      setLoan(l);
      if (!l) return;
      setEvents(await getLoanEvents(id));
      setContacts(l.accepted_at && SHOW_CONTACTS.has(l.status) ? await getLoanContacts(id) : []);
      if (l.handover_method === 'meetup') setMeetup(l.meetup_id ? await getMeetup(l.meetup_id) : await nextMeetup());
    } catch {
      setLoan(null);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loan === undefined) return <Loading />;
  if (loan === null || !session) return <NotFound />;

  const me = session.user.id;
  const isOwner = loan.owner_id === me;
  const isParty = isOwner || loan.borrower_id === me;
  const other = isOwner ? loan.borrower_first_name : loan.owner_first_name;
  const { box, overdue } = nextAction(loan, me, berlinToday());

  /** Runs a loan action; returns true on success. The page reloads either way so stale buttons disappear. */
  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setActionFailed(false);
    let ok = false;
    try {
      await fn();
      ok = true;
      toast.show(t('loan.actionDone'));
      notifyLoansChanged();
    } catch {
      setActionFailed(true);
    } finally {
      await load();
      setBusy(false);
    }
    return ok;
  };

  const sendReport = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => reportProblem(loan.id, kind, reportText))) {
      setReported(true);
      setReportText('');
    }
  };

  const btn = (labelKey: TKey, fn: () => Promise<unknown>, primary = true) => (
    <button type="button" className={`btn ${primary ? 'btn-primary' : 'btn-secondary'} btn-small`} disabled={busy} onClick={() => run(fn)}>
      {t(labelKey)}
    </button>
  );
  const due = loan.due_date ? date(loan.due_date) : '';

  const actionBox = () => {
    if (!isParty) return null;
    switch (box) {
      case 'owner_respond':
        return (<><p>{t('loan.box.owner_respond', { name: other, date: date(loan.respond_by) })}</p>
          <div className="btn-row">{btn('loan.accept', () => respondRequest(loan.id, true))}{btn('loan.decline', () => respondRequest(loan.id, false), false)}</div></>);
      case 'borrower_wait':
        return (<><p>{t('loan.box.borrower_wait', { date: date(loan.respond_by) })}</p>
          <div className="btn-row">{btn('loan.cancelRequest', () => cancelLoan(loan.id), false)}</div></>);
      case 'arrange_handover':
        return (<><p>{t('loan.box.arrange_handover', { name: other })}</p>
          <div className="btn-row">{btn('loan.cancelLoan', () => cancelLoan(loan.id), false)}</div></>);
      case 'confirm_received':
        return (<><p>{t('loan.box.confirm_received')}</p>
          <div className="btn-row">{btn('loan.received', () => confirmReceived(loan.id))}{btn('loan.cancelLoan', () => cancelLoan(loan.id), false)}</div></>);
      case 'reading':
        return isOwner ? (<><p>{t('loan.box.readingOwner', { name: other, date: due })}</p>
          <div className="btn-row">{btn('loan.confirmReturn', () => confirmReturn(loan.id))}</div></>)
          : (<><p>{t('loan.box.readingBorrower', { date: due })}</p>
          <div className="btn-row">{btn('loan.returned', () => markReturned(loan.id))}
            {loan.extensions_used < 2 && btn('loan.askExtension', () => requestExtension(loan.id), false)}</div></>);
      case 'extension_decide':
        return (<><p>{t('loan.box.extension_decide', { name: other })}</p>
          <div className="btn-row">{btn('loan.extAccept', () => respondExtension(loan.id, true))}{btn('loan.extDecline', () => respondExtension(loan.id, false), false)}{btn('loan.confirmReturn', () => confirmReturn(loan.id), false)}</div></>);
      case 'extension_wait':
        return (<><p>{t('loan.box.extension_wait')}</p><div className="btn-row">{btn('loan.returned', () => markReturned(loan.id))}</div></>);
      case 'owner_confirm_return':
        return (<><p>{t('loan.box.owner_confirm_return', { name: other })}</p><div className="btn-row">{btn('loan.confirmReturn', () => confirmReturn(loan.id))}</div></>);
      case 'borrower_returned_wait':
        return <p style={{ margin: 0 }}>{t('loan.box.borrower_returned_wait')}</p>;
      case 'ended':
        return null;
    }
  };

  const endedText = (() => {
    if (loan.status === 'closed') return loan.closed_by === 'auto' ? t('loan.closedAuto') : loan.closed_by === 'admin' ? t('loan.closedAdmin') : null;
    if (loan.end_reason) return t(`loan.reason.${loan.end_reason}` as TKey);
    return null;
  })();

  // Library-card rows: a dated stamp when done, a filled "now" mark for the step in progress, an empty slot when upcoming.
  const current = progressStep(loan);
  const ended = box === 'ended' && loan.status !== 'closed';
  const stampDates = [loan.created_at, loan.accepted_at, loan.received_at, loan.return_marked_at ?? loan.closed_at, loan.return_marked_at ?? loan.closed_at, loan.closed_at];
  const cardRows = (['loan.step0', 'loan.step1', 'loan.step2', 'loan.step3', 'loan.step4', 'loan.step5'] as const).map((key, i) => {
    const done = loan.status === 'closed' || i < current;
    const now = !done && !ended && i === current;
    const when = stampDates[i];
    return { key, state: done ? 'done' : now ? 'now' : 'todo', text: done ? (when ? date(when) : '✓') : now ? t('loancard.now') : t('loancard.upcoming') };
  });

  return (
    <>
      <nav className="breadcrumb" aria-label="breadcrumb">
        <ol><li><Link to="/me?tab=loans">{t('nav.myLoans')}</Link></li><li aria-current="page" dir="auto">{loan.book_title}</li></ol>
      </nav>
      <div className="section loan-grid">
        <section className="loan-card" aria-labelledby="loan-card-title">
          <div className="loan-card-head">
            <h1 id="loan-card-title">{t('loancard.title')}</h1>
            <span className="holes" aria-hidden="true"><span /><span /></span>
          </div>
          <div className="loan-card-book">
            <BookCover book={{ id: loan.book_id, title: loan.book_title, cover_path: loan.book_cover_path }} small />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 21, fontWeight: 700 }}><Link to={`/books/${loan.book_id}`} dir="auto" style={{ color: 'inherit' }}>{loan.book_title}</Link></p>
              <p style={{ margin: 0 }}>{t(`loan.status.${loan.status}`)}</p>
              <p className="muted" style={{ margin: 0 }}>
                {t('loan.owner')}: <span dir="auto">{loan.owner_first_name}</span> · {t('loan.borrower')}: <span dir="auto">{loan.borrower_first_name}</span>
              </p>
            </div>
          </div>
          <ol className="loan-card-rows" aria-label={t('loan.progress')}>
            {cardRows.map((r) => (
              <li key={r.key} aria-current={r.state === 'now' ? 'step' : undefined}>
                <span className="label">{t(r.key)}</span>
                <span className={`date-stamp${r.state === 'done' ? '' : ` ${r.state}`}`}>{r.state === 'done' ? `✓ ${r.text}` : r.text}</span>
              </li>
            ))}
          </ol>
          {(loan.status === 'reading' || loan.status === 'return_marked') && loan.due_date && (
            <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div className="return-stamp">
                <span className="small" style={{ fontWeight: 700 }}>{t('loancard.returnBy')}</span>
                <span className="when">{due}</span>
              </div>
              <p className="muted" style={{ margin: 0, flex: '1 1 180px' }}>{t('loan.extensions', { used: loan.extensions_used })}</p>
            </div>
          )}
        </section>

        <div className="stack" style={{ gap: 20 }}>
          {actionFailed && <ErrorBox>{t('loan.actionFailed')}</ErrorBox>}
          {overdue && <div className="error-box" role="status"><WarningIcon /><div>{t('loan.overdue')}</div></div>}
          {loan.has_open_report && <StatusBox><p style={{ margin: 0 }}>{t('loan.problemOpen')}</p></StatusBox>}
          {box !== 'ended' && isParty && <StatusBox title={t('loan.nowTitle')}>{actionBox()}</StatusBox>}
          {box === 'ended' && endedText && <StatusBox><p style={{ margin: 0 }}>{endedText}</p></StatusBox>}
        <section className="card stack">
          <h2 style={{ fontSize: 28, margin: 0 }}>{t('loan.handoverTitle')}</h2>
          <p style={{ margin: 0 }}>
            {loan.handover_method === 'meetup'
              ? meetup ? t('loan.meetupAt', { when: meetupWhen(meetup, i18n) }) : t('loan.meetupTba')
              : t('loan.inPerson')}
          </p>
          {meetup && loan.handover_method === 'meetup' && <p className="muted" style={{ margin: 0 }} dir="auto">{meetup.place} {meetup.neighbourhood}</p>}
          {contacts.length > 0 ? (
            contacts.map((c) => (
              <div key={c.user_id}>
                <h3 style={{ marginTop: 8 }}>{t('loan.contactTitle', { name: c.first_name })}</h3>
                <dl className="details">
                  {c.email && (<><dt>{t('loan.email')}</dt><dd><a href={`mailto:${c.email}`} dir="ltr">{c.email}</a></dd></>)}
                  {c.telegram && (<><dt>{t('loan.telegram')}</dt><dd><a href={`https://t.me/${c.telegram}`} dir="ltr">@{c.telegram}</a></dd></>)}
                </dl>
              </div>
            ))
          ) : (
            isParty && loan.status === 'requested' && <p className="muted" style={{ margin: 0 }}>{t('loan.contactHidden')}</p>
          )}
          {loan.message && (
            <div>
              <h3 style={{ marginTop: 8 }}>{t('loan.messageFrom', { name: loan.borrower_first_name })}</h3>
              <p dir="auto" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{loan.message}</p>
            </div>
          )}
        </section>

          <MeetupBox />
        </div>
      </div>

      {isParty && loan.accepted_at && (
        <section className="section form-narrow">
          <h2>{t('loan.problemTitle')}</h2>
          {reported ? <StatusBox><p style={{ margin: 0 }}>{t('loan.problemSent')}</p></StatusBox> : (
            <form className="form-grid" onSubmit={sendReport}>
              <div className="field">
                <label htmlFor="report-kind">{t('loan.problemKind')}</label>
                <select id="report-kind" value={kind} onChange={(e) => setKind(e.target.value as ReportKind)}>
                  {REPORT_KINDS.map((k) => <option key={k} value={k}>{t(`report.${k}`)}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="report-text">{t('loan.problemMessage')} <span className="muted">{t('common.optional')}</span></label>
                <textarea id="report-text" dir="auto" maxLength={2000} value={reportText} onChange={(e) => setReportText(e.target.value)} />
              </div>
              <div><button type="submit" className="btn btn-secondary" disabled={busy}>{t('loan.problemSend')}</button></div>
            </form>
          )}
        </section>
      )}

      <section className="section">
        <h2>{t('loan.historyTitle')}</h2>
        <ul className="loan-list">
          {events.map((e) => (
            <li key={e.id} className="small"><strong>{date(e.created_at)}</strong> · {t(`event.${e.type}` as TKey)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
