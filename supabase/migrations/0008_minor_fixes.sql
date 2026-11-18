-- Minor review fixes.
-- 1) respond_request takes advisory locks (borrower, then book) before any row lock, so simultaneous accepts
--    serialise instead of deadlocking; it also refuses books that are hidden or deleted.
-- 2) Acceptance rate counts only owner decisions and expiries as answers, not automatic declines.
-- 3) Profiles: neighbourhood length and Berlin postcode enforced by the database ('00000' = not given).

create or replace function public.respond_request(p_loan_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
  r record;
begin
  select * into l from public.loans where id = p_loan_id;
  if not found or l.owner_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  perform pg_advisory_xact_lock(hashtextextended('bm-borrower:' || l.borrower_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('bm-book:' || l.book_id::text, 0));
  select * into l from public.loans where id = p_loan_id for update;
  if l.status <> 'requested' or l.respond_by < now() then raise exception using message = 'bad_state'; end if;
  if not p_accept then
    update public.loans set status = 'declined', ended_at = now(), end_reason = 'owner_declined' where id = l.id;
    perform bm_private.log(l.id, uid, 'declined');
    return;
  end if;
  if exists (select 1 from public.books b where b.id = l.book_id and (b.hidden or b.deleted_at is not null)) then
    raise exception using message = 'book_unavailable';
  end if;
  begin
    update public.loans set status = 'accepted', accepted_at = now() where id = l.id;
  exception when unique_violation then
    if exists (select 1 from public.loans x where x.book_id = l.book_id and x.status in ('accepted', 'reading', 'return_marked')) then
      raise exception using message = 'book_unavailable';
    end if;
    raise exception using message = 'has_active_loan';
  end;
  perform bm_private.log(l.id, uid, 'accepted');
  for r in
    update public.loans set status = 'withdrawn', ended_at = now(), end_reason = 'accepted_elsewhere'
    where borrower_id = l.borrower_id and status = 'requested' and id <> l.id returning id
  loop
    perform bm_private.log(r.id, null, 'withdrawn');
  end loop;
  for r in
    update public.loans set status = 'declined', ended_at = now(), end_reason = 'lent_to_other'
    where book_id = l.book_id and status = 'requested' and id <> l.id returning id
  loop
    perform bm_private.log(r.id, null, 'declined', 'lent_to_other');
  end loop;
end $$;

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  answered int;
  accepted int;
  received int;
  closed int;
begin
  perform bm_private.require_admin();
  select count(*) filter (where accepted_at is not null or (status in ('declined', 'expired') and coalesce(end_reason, '') in ('owner_declined', 'no_answer'))),
         count(*) filter (where accepted_at is not null),
         count(*) filter (where received_at is not null),
         count(*) filter (where status = 'closed')
    into answered, accepted, received, closed
  from public.loans where not is_sample;
  return json_build_object(
    'members', (select count(*) from public.profiles where not is_sample),
    'books', (select count(*) from public.books where not is_sample and deleted_at is null),
    'requests', (select count(*) from public.loans where not is_sample),
    'acceptance_rate', case when answered = 0 then null else round(accepted::numeric / answered, 2) end,
    'completed_loans', closed,
    'return_rate', case when received = 0 then null else round(
      (select count(*) from public.loans where not is_sample and received_at is not null and status = 'closed')::numeric / received, 2) end,
    'active_members_30d', (select count(distinct x.id) from (
        select b.owner_id as id from public.books b where not b.is_sample and b.created_at > now() - interval '30 days'
        union
        select e.actor_id from public.loan_events e join public.loans l on l.id = e.loan_id
        where not l.is_sample and e.actor_id is not null and e.created_at > now() - interval '30 days'
      ) x)
  );
end $$;

alter table public.profiles add constraint profiles_neighbourhood_len check (char_length(neighbourhood) <= 60);
alter table public.profiles add constraint profiles_postcode_berlin
  check (postcode = '00000' or (postcode::int between 10115 and 14199 and postcode <> '12529'));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pc text := coalesce(m ->> 'postcode', '');
  loc text := coalesce(m ->> 'locale', 'fa');
  tg text := nullif(ltrim(btrim(coalesce(m ->> 'telegram', '')), '@'), '');
begin
  insert into public.profiles (id, first_name, postcode, neighbourhood, telegram, locale)
  values (
    new.id,
    left(coalesce(nullif(btrim(m ->> 'first_name'), ''), split_part(new.email, '@', 1)), 60),
    case when pc ~ '^[0-9]{5}$' and pc::int between 10115 and 14199 and pc <> '12529' then pc else '00000' end,
    left(coalesce(m ->> 'neighbourhood', ''), 60),
    case when tg ~ '^[A-Za-z0-9_]{5,32}$' then tg else null end,
    case when loc in ('fa', 'de', 'en') then loc else 'fa' end
  );
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
