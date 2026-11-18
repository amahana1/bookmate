-- Loan state machine. Every change goes through these functions; each checks the caller and the rules.

create schema if not exists bm_private;
revoke all on schema bm_private from public, anon, authenticated;

create or replace view bm_private.loan_rows as
select l.id, l.book_id, b.title as book_title, b.cover_path as book_cover_path, l.owner_id, l.borrower_id,
       po.first_name as owner_first_name, pb.first_name as borrower_first_name, l.status, l.handover_method,
       l.meetup_id, l.message, l.created_at, l.respond_by, l.accepted_at, l.received_at, l.due_date,
       l.extensions_used, l.extension_pending, l.return_marked_at, l.closed_at, l.closed_by, l.end_reason,
       l.has_open_report, l.is_sample
from public.loans l
join public.books b on b.id = l.book_id
join public.profiles po on po.id = l.owner_id
join public.profiles pb on pb.id = l.borrower_id;

create or replace function bm_private.log(p_loan uuid, p_actor uuid, p_type text, p_note text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.loan_events (loan_id, actor_id, type, note) values (p_loan, p_actor, p_type, p_note)
$$;

-- Order: book gone, sample, own book, no own book, overdue, active loan, pending limit, duplicate, book not free.
create or replace function public.can_request(p_book_id uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  b public.books;
begin
  if uid is null then return 'not_logged_in'; end if;
  select * into b from public.books where id = p_book_id;
  if not found or b.deleted_at is not null or b.hidden then return 'book_unavailable'; end if;
  if b.is_sample then return 'sample_book'; end if;
  if b.owner_id = uid then return 'own_book'; end if;
  if not exists (select 1 from public.books x where x.owner_id = uid and not x.is_sample and not x.hidden and x.deleted_at is null) then
    return 'no_own_book';
  end if;
  if exists (select 1 from public.loans l where l.borrower_id = uid and l.status = 'reading' and l.due_date < public.berlin_today()) then
    return 'has_overdue';
  end if;
  if exists (select 1 from public.loans l where l.borrower_id = uid and l.status in ('accepted', 'reading', 'return_marked')) then
    return 'has_active_loan';
  end if;
  if (select count(*) from public.loans l where l.borrower_id = uid and l.status = 'requested') >= 3 then
    return 'too_many_pending';
  end if;
  if exists (select 1 from public.loans l where l.borrower_id = uid and l.book_id = p_book_id and l.status = 'requested') then
    return 'already_requested';
  end if;
  if b.status = 'paused' or b.loan_state <> 'none' then return 'book_unavailable'; end if;
  return null;
end $$;

create or replace function public.request_loan(p_book_id uuid, p_handover text, p_meetup_id uuid default null, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  reason text;
  b public.books;
  lid uuid;
  mid uuid := p_meetup_id;
begin
  select * into b from public.books where id = p_book_id for update;
  reason := public.can_request(p_book_id);
  if reason is not null then raise exception using message = reason; end if;
  if p_handover is null or not (p_handover = any (b.handover_methods)) then raise exception using message = 'not_allowed'; end if;
  if p_handover <> 'meetup' or not exists (select 1 from public.meetups m where m.id = mid and m.starts_at > now()) then mid := null; end if;
  begin
    insert into public.loans (book_id, owner_id, borrower_id, handover_method, meetup_id, message)
    values (p_book_id, b.owner_id, uid, p_handover, mid, nullif(btrim(coalesce(p_message, '')), ''))
    returning id into lid;
  exception when unique_violation then
    raise exception using message = 'already_requested';
  end;
  perform bm_private.log(lid, uid, 'requested');
  return lid;
end $$;

create or replace function public.respond_request(p_loan_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
  r record;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or l.owner_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  if l.status <> 'requested' or l.respond_by < now() then raise exception using message = 'bad_state'; end if;
  if not p_accept then
    update public.loans set status = 'declined', ended_at = now(), end_reason = 'owner_declined' where id = l.id;
    perform bm_private.log(l.id, uid, 'declined');
    return;
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

create or replace function public.cancel_loan(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or uid is null or uid not in (l.owner_id, l.borrower_id) then raise exception using message = 'not_allowed'; end if;
  if l.status = 'requested' and uid = l.owner_id then raise exception using message = 'not_allowed'; end if;
  if l.status not in ('requested', 'accepted') then raise exception using message = 'bad_state'; end if;
  update public.loans set status = 'cancelled', ended_at = now(),
    end_reason = case when uid = l.owner_id then 'owner_cancelled' else 'borrower_cancelled' end
  where id = l.id;
  perform bm_private.log(l.id, uid, 'cancelled');
end $$;

create or replace function public.confirm_received(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
  n_months int;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or l.borrower_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  if l.status <> 'accepted' then raise exception using message = 'bad_state'; end if;
  select b.loan_months into n_months from public.books b where b.id = l.book_id;
  update public.loans set status = 'reading', received_at = now(),
    due_date = (public.berlin_today() + make_interval(months => n_months))::date
  where id = l.id;
  perform bm_private.log(l.id, uid, 'received');
end $$;

create or replace function public.request_extension(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or l.borrower_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  if l.status <> 'reading' then raise exception using message = 'bad_state'; end if;
  if l.extensions_used >= 2 or l.extension_pending then raise exception using message = 'not_allowed'; end if;
  update public.loans set extension_pending = true where id = l.id;
  perform bm_private.log(l.id, uid, 'extension_requested');
end $$;

create or replace function public.respond_extension(p_loan_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or l.owner_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  if l.status <> 'reading' or not l.extension_pending then raise exception using message = 'bad_state'; end if;
  if p_accept then
    update public.loans set extension_pending = false, extensions_used = extensions_used + 1, due_date = due_date + 14 where id = l.id;
    perform bm_private.log(l.id, uid, 'extension_accepted');
  else
    update public.loans set extension_pending = false where id = l.id;
    perform bm_private.log(l.id, uid, 'extension_declined');
  end if;
end $$;

create or replace function public.mark_returned(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or l.borrower_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  if l.status <> 'reading' then raise exception using message = 'bad_state'; end if;
  update public.loans set status = 'return_marked', return_marked_at = now(), extension_pending = false where id = l.id;
  perform bm_private.log(l.id, uid, 'returned');
end $$;

create or replace function public.confirm_return(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or l.owner_id is distinct from uid then raise exception using message = 'not_allowed'; end if;
  if l.status not in ('reading', 'return_marked') then raise exception using message = 'bad_state'; end if;
  update public.loans set status = 'closed', closed_at = now(), closed_by = 'owner', extension_pending = false where id = l.id;
  perform bm_private.log(l.id, uid, 'closed');
end $$;

create or replace function public.report_problem(p_loan_id uuid, p_kind text, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
  rid uuid;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or uid is null or uid not in (l.owner_id, l.borrower_id) then raise exception using message = 'not_allowed'; end if;
  insert into public.reports (loan_id, reporter_id, kind, message)
  values (l.id, uid, p_kind, nullif(btrim(coalesce(p_message, '')), '')) returning id into rid;
  update public.loans set has_open_report = true where id = l.id;
  perform bm_private.log(l.id, uid, 'problem_reported', p_kind);
  return rid;
end $$;

create or replace function public.get_loan_contacts(p_loan_id uuid)
returns table (user_id uuid, first_name text, email text, telegram text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.first_name, u.email::text, p.telegram
  from public.loans l
  join public.profiles p on p.id = case when l.owner_id = auth.uid() then l.borrower_id else l.owner_id end
  left join auth.users u on u.id = p.id
  where l.id = p_loan_id
    and auth.uid() in (l.owner_id, l.borrower_id)
    and l.status in ('accepted', 'reading', 'return_marked', 'closed')
$$;

create or replace function public.get_my_loans()
returns table (id uuid, book_id uuid, book_title text, book_cover_path text, owner_id uuid, borrower_id uuid,
  owner_first_name text, borrower_first_name text, status text, handover_method text, meetup_id uuid, message text,
  created_at timestamptz, respond_by timestamptz, accepted_at timestamptz, received_at timestamptz, due_date date,
  extensions_used int, extension_pending boolean, return_marked_at timestamptz, closed_at timestamptz, closed_by text,
  end_reason text, has_open_report boolean, is_sample boolean)
language sql stable security definer set search_path = '' as $$
  select r.* from bm_private.loan_rows r
  where auth.uid() in (r.owner_id, r.borrower_id)
  order by r.created_at desc
$$;

create or replace function public.get_loan(p_loan_id uuid)
returns table (id uuid, book_id uuid, book_title text, book_cover_path text, owner_id uuid, borrower_id uuid,
  owner_first_name text, borrower_first_name text, status text, handover_method text, meetup_id uuid, message text,
  created_at timestamptz, respond_by timestamptz, accepted_at timestamptz, received_at timestamptz, due_date date,
  extensions_used int, extension_pending boolean, return_marked_at timestamptz, closed_at timestamptz, closed_by text,
  end_reason text, has_open_report boolean, is_sample boolean)
language sql stable security definer set search_path = '' as $$
  select r.* from bm_private.loan_rows r
  where r.id = p_loan_id and (auth.uid() in (r.owner_id, r.borrower_id) or public.is_admin())
$$;

create or replace function public.get_loan_events(p_loan_id uuid) returns setof public.loan_events
language sql stable security definer set search_path = '' as $$
  select e.* from public.loan_events e
  join public.loans l on l.id = e.loan_id
  where e.loan_id = p_loan_id and (auth.uid() in (l.owner_id, l.borrower_id) or public.is_admin())
  order by e.created_at, e.id
$$;

create or replace function public.delete_book(p_book_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  b public.books;
  r record;
begin
  select * into b from public.books where id = p_book_id for update;
  if not found or b.owner_id is distinct from uid or b.deleted_at is not null then raise exception using message = 'not_allowed'; end if;
  if exists (select 1 from public.loans l where l.book_id = b.id and l.status in ('accepted', 'reading', 'return_marked')) then
    raise exception using message = 'bad_state';
  end if;
  update public.books set deleted_at = now() where id = b.id;
  for r in
    update public.loans set status = 'declined', ended_at = now(), end_reason = 'book_removed'
    where book_id = b.id and status = 'requested' returning id
  loop
    perform bm_private.log(r.id, uid, 'declined', 'book_removed');
  end loop;
end $$;

-- Grants: members only.
revoke execute on function bm_private.log(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.can_request(uuid), public.request_loan(uuid, text, uuid, text), public.respond_request(uuid, boolean),
  public.cancel_loan(uuid), public.confirm_received(uuid), public.request_extension(uuid), public.respond_extension(uuid, boolean),
  public.mark_returned(uuid), public.confirm_return(uuid), public.report_problem(uuid, text, text), public.get_loan_contacts(uuid),
  public.get_my_loans(), public.get_loan(uuid), public.get_loan_events(uuid), public.delete_book(uuid)
  from public, anon;
grant execute on function public.can_request(uuid), public.request_loan(uuid, text, uuid, text), public.respond_request(uuid, boolean),
  public.cancel_loan(uuid), public.confirm_received(uuid), public.request_extension(uuid), public.respond_extension(uuid, boolean),
  public.mark_returned(uuid), public.confirm_return(uuid), public.report_problem(uuid, text, text), public.get_loan_contacts(uuid),
  public.get_my_loans(), public.get_loan(uuid), public.get_loan_events(uuid), public.delete_book(uuid)
  to authenticated;
