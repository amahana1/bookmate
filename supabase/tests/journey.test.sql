-- book_journey: public aggregate (listed date + completed loans), hidden books invisible to others. Rolls back.
begin;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'j-a@example.com', '', '{"first_name":"Aram","postcode":"10999","neighbourhood":"Kreuzberg"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'j-b@example.com', '', '{"first_name":"Bita","postcode":"12043","neighbourhood":"Neukölln"}', '{}', now(), now(), now());
insert into public.books (id, owner_id, title, author, language, category, condition, loan_months, handover_methods, created_at) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', 'A1', 'x', 'fa', 'novel', 'good', 1, '{meetup}', '2026-10-01T10:00:00Z'),
  ('00000000-0000-0000-0000-00000000a102', '00000000-0000-0000-0000-0000000000a1', 'A2', 'x', 'fa', 'novel', 'good', 1, '{meetup}', now());
insert into public.loans (book_id, owner_id, borrower_id, handover_method, status, closed_at, closed_by) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'meetup', 'closed', now(), 'owner'),
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'meetup', 'closed', now(), 'owner'),
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'meetup', 'declined', null, null);
update public.books set hidden = true where id = '00000000-0000-0000-0000-00000000a102';
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$ begin
  assert (select completed_loans from public.book_journey('00000000-0000-0000-0000-00000000a101')) = 2, 'journey_counts_closed_loans';
  assert (select listed_at from public.book_journey('00000000-0000-0000-0000-00000000a101')) = '2026-10-01T10:00:00Z'::timestamptz, 'journey_listed_at';
  assert (select count(*) from public.book_journey('00000000-0000-0000-0000-00000000a102')) = 0, 'journey_hidden_book_invisible';
end $$;
reset role;
select 'journey tests passed' as result;
rollback;
