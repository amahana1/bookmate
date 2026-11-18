import { useT } from '../i18n';
import { useNextMeetup } from '../api/meetups';
import type { Meetup } from '../types';
import { CalendarIcon } from './Icons';

export function meetupWhen(m: Meetup, t: ReturnType<typeof useT>): string {
  return t.t('meetup.when', { date: t.date(m.starts_at), from: t.time(m.starts_at), to: t.time(m.ends_at) });
}

/** Dark box with the next monthly meetup, or "date to be announced". */
export function MeetupBox({ meetup }: { meetup?: Meetup | null }) {
  const i18n = useT();
  const fetched = useNextMeetup();
  const m = meetup !== undefined ? meetup : fetched;
  return (
    <section className="meetup-box dark on-dark" aria-labelledby="meetup-title">
      <h2 id="meetup-title" style={{ fontSize: 28 }}>{i18n.t('meetup.title')}</h2>
      {m ? (
        <>
          <p className="when"><CalendarIcon /> {meetupWhen(m, i18n)}</p>
          <p className="label" style={{ marginTop: 4 }} dir="auto">
            {m.place}{m.neighbourhood ? `${i18n.locale === 'fa' ? '، ' : ', '}${m.neighbourhood}` : ''}
          </p>
        </>
      ) : (
        <p className="when">{m === null ? i18n.t('meetup.tba') : i18n.t('common.loading')}</p>
      )}
      <p style={{ margin: '10px 0 0' }}>{i18n.t('meetup.text')}</p>
    </section>
  );
}
