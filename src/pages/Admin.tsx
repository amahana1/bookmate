import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useT, type TKey } from '../i18n';
import {
  adminCloseLoan, adminListBooks, adminListOverdue, adminListReports, adminRemoveSampleData, adminResolveReport,
  adminSetBookHidden, adminStats, createMeetup, deleteMeetup, updateMeetup,
  type AdminOverdue, type AdminReport, type AdminStats,
} from '../api/admin';
import { listMeetups } from '../api/meetups';
import { filterBooks } from '../lib/books';
import { berlinLocalToIso, isoToBerlinLocal } from '../lib/format';
import { BERLIN_ORTSTEILE } from '../lib/berlin';
import { MEETUP_PLACE_PLACEHOLDER } from '../lib/config';
import type { Book, Meetup } from '../types';
import { ErrorBox, Loading, StatusBox, useToast } from '../components/Feedback';
import { StatusChips } from '../components/BookBits';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { meetupWhen } from '../components/MeetupBox';

function Stats({ stats }: { stats: AdminStats }) {
  const { t, num } = useT();
  const pct = (v: number | null) => (v === null ? '—' : t('admin.percent', { n: Math.round(v * 100) }));
  const rows: [TKey, string][] = [
    ['admin.stat.members', num(stats.members)], ['admin.stat.books', num(stats.books)], ['admin.stat.requests', num(stats.requests)],
    ['admin.stat.acceptance', pct(stats.acceptance_rate)], ['admin.stat.completed', num(stats.completed_loans)],
    ['admin.stat.returnRate', pct(stats.return_rate)], ['admin.stat.active', num(stats.active_members_30d)],
  ];
  return (
    <div className="table-wrap">
      <table className="table"><tbody>
        {rows.map(([k, v]) => <tr key={k}><th scope="row">{t(k)}</th><td><strong>{v}</strong></td></tr>)}
      </tbody></table>
    </div>
  );
}

const EMPTY_MEETUP = { date: '', start: '15:00', end: '17:00', place: MEETUP_PLACE_PLACEHOLDER, neighbourhood: '' };

function Meetups({ meetups, reload }: { meetups: Meetup[]; reload: () => void }) {
  const i18n = useT();
  const { t } = i18n;
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_MEETUP);
  const [error, setError] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const startEdit = (m: Meetup) => {
    const s = isoToBerlinLocal(m.starts_at);
    setEditing(m.id);
    setForm({ date: s.date, start: s.time, end: isoToBerlinLocal(m.ends_at).time, place: m.place, neighbourhood: m.neighbourhood });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.start || !form.end || form.end <= form.start) return setError(true);
    setError(false);
    const input = {
      starts_at: berlinLocalToIso(form.date, form.start), ends_at: berlinLocalToIso(form.date, form.end),
      place: form.place.trim() || MEETUP_PLACE_PLACEHOLDER, neighbourhood: form.neighbourhood,
    };
    try {
      if (editing) await updateMeetup(editing, input);
      else await createMeetup(input);
      toast.show(t('account.saved'));
      setEditing(null);
      setForm(EMPTY_MEETUP);
      reload();
    } catch {
      setError(true);
    }
  };

  const now = new Date().toISOString();
  return (
    <div className="stack">
      {meetups.length === 0 ? <p className="muted">{t('admin.noMeetups')}</p> : (
        <ul className="loan-list">
          {meetups.map((m) => (
            <li key={m.id} className="loan-row">
              <div className="body">
                <div className="title">{meetupWhen(m, i18n)} {m.starts_at < now && <span className="chip">{t('admin.past')}</span>}</div>
                <div className="meta" dir="auto">{m.place} · {m.neighbourhood}</div>
              </div>
              <div className="btn-row" style={{ gap: 8 }}>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => startEdit(m)}>{t('admin.edit')}</button>
                <button type="button" className="btn-link" onClick={() => setToDelete(m.id)}>{t('admin.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="card form-grid" onSubmit={save}>
        <h3 style={{ margin: 0 }}>{editing ? t('admin.editMeetup') : t('admin.addMeetup')}</h3>
        {error && <ErrorBox>{t('admin.meetupError')}</ErrorBox>}
        <div className="form-grid two">
          <div className="field"><label htmlFor="m-date">{t('admin.date')}</label><input id="m-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="field"><label htmlFor="m-nb">{t('signup.neighbourhood')}</label>
            <select id="m-nb" lang="de" dir="ltr" value={form.neighbourhood} onChange={(e) => setForm({ ...form, neighbourhood: e.target.value })}>
              <option value="">{t('signup.chooseNeighbourhood')}</option>
              {BERLIN_ORTSTEILE.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="m-start">{t('admin.start')}</label><input id="m-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
          <div className="field"><label htmlFor="m-end">{t('admin.end')}</label><input id="m-end" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>{t('admin.timeNote')}</p>
        <div className="field">
          <label htmlFor="m-place">{t('admin.place')}</label>
          <span className="hint">{t('admin.placeHint')}</span>
          <input id="m-place" dir="auto" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
        </div>
        <div className="btn-row">
          <button type="submit" className="btn btn-primary btn-small">{t('admin.saveMeetup')}</button>
          {editing && <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditing(null); setForm(EMPTY_MEETUP); }}>{t('common.cancel')}</button>}
        </div>
      </form>
      <ConfirmDialog open={toDelete !== null} text={t('admin.deleteMeetup')} confirmLabel={t('admin.delete')}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => { const id = toDelete!; setToDelete(null); await deleteMeetup(id); reload(); }} />
    </div>
  );
}

export function Admin() {
  const { t, date } = useT();
  const toast = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [overdue, setOverdue] = useState<AdminOverdue[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [q, setQ] = useState('');
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [confirmSamples, setConfirmSamples] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, r, o, b, m] = await Promise.all([adminStats(), adminListReports(), adminListOverdue(), adminListBooks(), listMeetups()]);
      setStats(s); setReports(r); setOverdue(o); setBooks(b); setMeetups(m);
      setLoaded(true);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast.show(t('loan.actionDone'));
      await load();
    } catch {
      setFailed(true);
    }
  };

  const sampleCount = books.filter((b) => b.is_sample).length;
  const shown = useMemo(() => filterBooks(books, { q, language: 'all', category: 'all', availableOnly: false }).slice(0, 50), [books, q]);

  if (failed) return <ErrorBox>{t('common.error')}</ErrorBox>;
  if (!loaded || !stats) return <Loading />;

  return (
    <div className="stack">
      <h1>{t('nav.admin')}</h1>

      <section className="section" style={{ maxWidth: 640 }}>
        <h2>{t('admin.stats')}</h2>
        <p className="small muted">{t('admin.statsNote')}</p>
        <Stats stats={stats} />
      </section>

      <section className="section">
        <h2>{t('admin.reports')}</h2>
        {reports.length === 0 ? <p className="muted">{t('admin.noReports')}</p> : (
          <ul className="loan-list">
            {reports.map((r) => (
              <li key={r.report_id} className="loan-row">
                <div className="body stack" style={{ gap: 4 }}>
                  <div className="title" dir="auto">{r.book_title} · {t(`report.${r.kind}` as TKey)}</div>
                  <div className="meta">{t('admin.parties', { owner: r.owner_first_name, borrower: r.borrower_first_name })}</div>
                  <div className="meta">{t('admin.reportBy', { name: r.reporter_first_name, date: date(r.created_at) })}</div>
                  {r.message && <p dir="auto" style={{ margin: 0 }}>{r.message}</p>}
                  <div className="btn-row" style={{ gap: 8 }}>
                    <button className="btn btn-secondary btn-small" onClick={() => act(() => adminResolveReport(r.report_id))}>{t('admin.resolve')}</button>
                    <button className="btn btn-secondary btn-small" onClick={() => act(() => adminCloseLoan(r.loan_id))}>{t('admin.closeLoan')}</button>
                    <Link to={`/loans/${r.loan_id}`}>{t('admin.openLoan')}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>{t('admin.overdue')}</h2>
        {overdue.length === 0 ? <p className="muted">{t('admin.noOverdue')}</p> : (
          <ul className="loan-list">
            {overdue.map((o) => (
              <li key={o.loan_id} className="loan-row">
                <div className="body">
                  <Link to={`/loans/${o.loan_id}`} className="title" dir="auto">{o.book_title}</Link>
                  <div className="meta">{t('admin.parties', { owner: o.owner_first_name, borrower: o.borrower_first_name })} · {t('loan.dueDate', { date: date(o.due_date) })}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>{t('admin.meetups')}</h2>
        <Meetups meetups={meetups} reload={load} />
      </section>

      <section className="section">
        <h2>{t('admin.books')}</h2>
        <div className="field" style={{ maxWidth: 420, marginBottom: 14 }}>
          <label htmlFor="admin-q">{t('nav.searchLabel')}</label>
          <input id="admin-q" type="search" dir="auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.searchPlaceholder')} />
        </div>
        <ul className="loan-list">
          {shown.map((b) => (
            <li key={b.id} className="loan-row">
              <div className="body stack" style={{ gap: 4 }}>
                <Link to={`/books/${b.id}`} className="title" dir="auto">{b.title}</Link>
                <span className="meta" dir="auto">{b.author} · {b.neighbourhood}</span>
                <StatusChips book={b} />
              </div>
              <button className="btn btn-secondary btn-small" onClick={() => act(() => adminSetBookHidden(b.id, !b.hidden))}>
                {b.hidden ? t('admin.unhide') : t('admin.hide')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" style={{ maxWidth: 640 }}>
        <h2>{t('admin.samples')}</h2>
        {sampleCount === 0 ? <p className="muted">{t('admin.noSamples')}</p> : (
          <StatusBox>
            <p>{t('admin.samplesCount', { n: sampleCount })}</p>
            <button className="btn btn-secondary btn-small" onClick={() => setConfirmSamples(true)}>{t('admin.removeSamples')}</button>
          </StatusBox>
        )}
        <ConfirmDialog open={confirmSamples} text={t('admin.removeConfirm', { n: sampleCount })} confirmLabel={t('admin.removeSamples')}
          onCancel={() => setConfirmSamples(false)}
          onConfirm={() => { setConfirmSamples(false); void act(async () => { await adminRemoveSampleData(); toast.show(t('admin.removed')); }); }} />
      </section>
    </div>
  );
}
