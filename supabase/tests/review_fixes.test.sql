-- Review fixes: no report or contact details before acceptance; admin close on a pending request declines it.
-- Run the whole file in one execute_sql call; it rolls back.
begin;
create function pg_temp.as_user(u uuid) returns void language sql as $$ select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true) $$;
create function pg_temp.err(q text) returns text language plpgsql as $$ begin execute q; return null; exception when others then return sqlerrm; end $$;
create temp table t (k text primary key, v uuid) on commit drop;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fix-f@example.com', '', '{"first_name":"Farah","postcode":"10115","neighbourhood":"Mitte"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fix-a@example.com', '', '{"first_name":"Aram","postcode":"10999","neighbourhood":"Kreuzberg"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fix-b@example.com', '', '{"first_name":"Bita","postcode":"12043","neighbourhood":"Neukölln"}', '{}', now(), now(), now());
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.books (id, owner_id, title, author, language, category, condition, loan_months, handover_methods) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', 'A1', 'x', 'fa', 'novel', 'good', 1, '{meetup}'),
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-0000000000b1', 'B1', 'x', 'fa', 'novel', 'good', 1, '{meetup}');
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('req', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup'));
  assert pg_temp.err(format('select public.report_problem(%L, %L, null)', (select v from t), 'other')) = 'bad_state', 'report_rejected_before_accept';
end $$;
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  perform public.admin_close_loan((select v from t));
  assert (select status from public.loans where id = (select v from t)) = 'declined', 'admin_close_requested_declines';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert (select count(*) from public.get_loan_contacts((select v from t))) = 0, 'no_contacts_without_acceptance';
end $$;
select 'review fixes passed' as result;
rollback;
