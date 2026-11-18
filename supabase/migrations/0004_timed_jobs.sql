-- Timed transitions (pg_cron). Sample loans are never touched except to keep their due dates fresh.

create extension if not exists pg_cron;

create or replace function public.run_timed_transitions() returns void
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  for r in
    update public.loans set status = 'expired', ended_at = now(), end_reason = 'no_answer'
    where status = 'requested' and respond_by < now() and not is_sample returning id
  loop
    perform bm_private.log(r.id, null, 'expired');
  end loop;
  for r in
    update public.loans set status = 'closed', closed_at = now(), closed_by = 'auto', extension_pending = false
    where status = 'return_marked' and return_marked_at < now() - interval '7 days' and not is_sample returning id
  loop
    perform bm_private.log(r.id, null, 'auto_closed');
  end loop;
end $$;

create or replace function public.refresh_sample_loans() returns void
language sql security definer set search_path = '' as $$
  update public.loans
  set due_date = (greatest(due_date, public.berlin_today()) + interval '1 month')::date
  where is_sample and status = 'reading' and due_date < public.berlin_today() + 7
$$;

revoke execute on function public.run_timed_transitions(), public.refresh_sample_loans() from public, anon, authenticated;

select cron.schedule('bm-timed', '*/15 * * * *', 'select public.run_timed_transitions()');
select cron.schedule('bm-sample-refresh', '0 3 * * *', 'select public.refresh_sample_loans()');
