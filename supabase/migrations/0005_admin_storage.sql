-- Admin functions and cover-photo storage.

create or replace function bm_private.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception using message = 'not_allowed'; end if;
end $$;
revoke execute on function bm_private.require_admin() from public, anon, authenticated;

create or replace function public.admin_set_book_hidden(p_book_id uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform bm_private.require_admin();
  update public.books set hidden = p_hidden where id = p_book_id;
end $$;

create or replace function public.admin_resolve_report(p_report_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  lid uuid;
begin
  perform bm_private.require_admin();
  update public.reports set status = 'resolved', resolved_at = now() where id = p_report_id and status = 'open' returning loan_id into lid;
  if lid is not null then
    update public.loans set has_open_report = exists (select 1 from public.reports r where r.loan_id = lid and r.status = 'open') where id = lid;
    perform bm_private.log(lid, auth.uid(), 'report_resolved');
  end if;
end $$;

create or replace function public.admin_close_loan(p_loan_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform bm_private.require_admin();
  update public.loans set status = 'closed', closed_at = now(), closed_by = 'admin', extension_pending = false
  where id = p_loan_id and status in ('requested', 'accepted', 'reading', 'return_marked');
  if found then perform bm_private.log(p_loan_id, auth.uid(), 'admin_closed'); end if;
end $$;

create or replace function public.admin_list_reports()
returns table (report_id uuid, loan_id uuid, book_title text, owner_first_name text, borrower_first_name text,
  reporter_first_name text, kind text, message text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform bm_private.require_admin();
  return query
    select r.id, r.loan_id, lr.book_title, lr.owner_first_name, lr.borrower_first_name, p.first_name, r.kind, r.message, r.created_at
    from public.reports r
    join bm_private.loan_rows lr on lr.id = r.loan_id
    join public.profiles p on p.id = r.reporter_id
    where r.status = 'open'
    order by r.created_at;
end $$;

create or replace function public.admin_list_overdue()
returns table (loan_id uuid, book_title text, owner_first_name text, borrower_first_name text, due_date date)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform bm_private.require_admin();
  return query
    select lr.id, lr.book_title, lr.owner_first_name, lr.borrower_first_name, lr.due_date
    from bm_private.loan_rows lr
    where lr.status = 'reading' and lr.due_date < public.berlin_today() and not lr.is_sample
    order by lr.due_date;
end $$;

-- Success numbers from doc 1 §13, excluding sample rows.
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  answered int;
  accepted int;
  received int;
  closed int;
begin
  perform bm_private.require_admin();
  select count(*) filter (where accepted_at is not null or status in ('declined', 'expired')),
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

create or replace function public.admin_remove_sample_data() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n_loans int;
  n_books int;
  n_profiles int;
begin
  perform bm_private.require_admin();
  delete from public.loans where is_sample;
  get diagnostics n_loans = row_count;
  delete from public.books where is_sample;
  get diagnostics n_books = row_count;
  delete from public.profiles where is_sample;
  get diagnostics n_profiles = row_count;
  return n_loans + n_books + n_profiles;
end $$;

revoke execute on function public.admin_set_book_hidden(uuid, boolean), public.admin_resolve_report(uuid), public.admin_close_loan(uuid),
  public.admin_list_reports(), public.admin_list_overdue(), public.admin_stats(), public.admin_remove_sample_data()
  from public, anon;
grant execute on function public.admin_set_book_hidden(uuid, boolean), public.admin_resolve_report(uuid), public.admin_close_loan(uuid),
  public.admin_list_reports(), public.admin_list_overdue(), public.admin_stats(), public.admin_remove_sample_data()
  to authenticated;

-- Cover photos: public read; members write only inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 2097152, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy covers_select_own on storage.objects for select to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy covers_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy covers_update_own on storage.objects for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy covers_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
