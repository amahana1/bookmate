-- Fixes from the whole-branch review.
-- 1) request_loan serialises per borrower, so parallel calls cannot exceed the 3-pending limit.
-- 2) Contact details only ever after acceptance: reports need an accepted loan, contacts need accepted_at,
--    and an admin "close" on a still-pending request ends it as declined.

create or replace function public.request_loan(p_book_id uuid, p_handover text, p_meetup_id uuid default null, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  reason text;
  b public.books;
  lid uuid;
  mid uuid := p_meetup_id;
begin
  if uid is not null then
    perform 1 from public.profiles where id = uid for update;
  end if;
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

create or replace function public.report_problem(p_loan_id uuid, p_kind text, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  l public.loans;
  rid uuid;
begin
  select * into l from public.loans where id = p_loan_id for update;
  if not found or uid is null or uid not in (l.owner_id, l.borrower_id) then raise exception using message = 'not_allowed'; end if;
  if l.accepted_at is null then raise exception using message = 'bad_state'; end if;
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
    and l.accepted_at is not null
    and l.status in ('accepted', 'reading', 'return_marked', 'closed')
$$;

create or replace function public.admin_close_loan(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform bm_private.require_admin();
  update public.loans set status = 'declined', ended_at = now(), end_reason = 'admin_closed'
  where id = p_loan_id and status = 'requested';
  if found then
    perform bm_private.log(p_loan_id, auth.uid(), 'admin_closed');
    return;
  end if;
  update public.loans set status = 'closed', closed_at = now(), closed_by = 'admin', extension_pending = false
  where id = p_loan_id and status in ('accepted', 'reading', 'return_marked');
  if found then perform bm_private.log(p_loan_id, auth.uid(), 'admin_closed'); end if;
end $$;

-- create or replace keeps existing grants; restate them for clarity.
revoke execute on function public.request_loan(uuid, text, uuid, text), public.report_problem(uuid, text, text),
  public.get_loan_contacts(uuid), public.admin_close_loan(uuid) from public, anon;
grant execute on function public.request_loan(uuid, text, uuid, text), public.report_problem(uuid, text, text),
  public.get_loan_contacts(uuid), public.admin_close_loan(uuid) to authenticated;
