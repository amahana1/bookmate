-- Row-level security and column grants. The browser never writes loans, events or reports directly.

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.meetups enable row level security;
alter table public.loans enable row level security;
alter table public.loan_events enable row level security;
alter table public.reports enable row level security;

revoke all on public.profiles, public.books, public.meetups, public.loans, public.loan_events, public.reports from anon, authenticated;

-- Helper functions: callable by everyone because policies use them; trigger functions by nobody.
revoke execute on function public.handle_new_user(), public.handle_deleted_user(), public.books_before_write(),
  public.profiles_sync_neighbourhood(), public.loans_sync_book_state() from public, anon, authenticated;
grant execute on function public.is_admin(), public.bm_normalize(text), public.berlin_today() to anon, authenticated;

-- books
grant select on public.books to anon, authenticated;
grant insert (title, title_latin, author, translator, publisher, language, category, year, condition, loan_months, handover_methods, cover_path, status)
  on public.books to authenticated;
grant update (title, title_latin, author, translator, publisher, language, category, year, condition, loan_months, handover_methods, cover_path, status)
  on public.books to authenticated;
create policy books_read on public.books for select to anon, authenticated
  using ((not hidden and deleted_at is null) or owner_id = auth.uid() or public.is_admin());
create policy books_insert on public.books for insert to authenticated
  with check (owner_id = auth.uid());
create policy books_update on public.books for update to authenticated
  using (owner_id = auth.uid() and deleted_at is null) with check (owner_id = auth.uid());

-- profiles: own row only (admins see all). Others' names reach a member only through the loan functions.
grant select on public.profiles to authenticated;
grant update (first_name, postcode, neighbourhood, telegram, locale) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- meetups: public read, admin write
grant select on public.meetups to anon, authenticated;
grant insert, update, delete on public.meetups to authenticated;
create policy meetups_read on public.meetups for select to anon, authenticated using (true);
create policy meetups_admin_insert on public.meetups for insert to authenticated with check (public.is_admin());
create policy meetups_admin_update on public.meetups for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy meetups_admin_delete on public.meetups for delete to authenticated using (public.is_admin());

-- loans, events, reports: read for the two members and admins; no write grants.
grant select on public.loans, public.loan_events, public.reports to authenticated;
create policy loans_read on public.loans for select to authenticated
  using (auth.uid() = owner_id or auth.uid() = borrower_id or public.is_admin());
create policy loan_events_read on public.loan_events for select to authenticated
  using (exists (select 1 from public.loans l where l.id = loan_id and (auth.uid() = l.owner_id or auth.uid() = l.borrower_id or public.is_admin())));
create policy reports_read on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
