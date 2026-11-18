-- Minor review fixes: hidden-book accept refused, honest acceptance rate, profile limits, function grants. Rolls back.
begin;
create function pg_temp.as_user(u uuid) returns void language sql as $$ select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true) $$;
create function pg_temp.err(q text) returns text language plpgsql as $$ begin execute q; return null; exception when others then return sqlerrm; end $$;
create temp table t (k text primary key, v uuid) on commit drop;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm-f@example.com', '', '{"first_name":"Farah","postcode":"10115","neighbourhood":"Mitte"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm-a@example.com', '', '{"first_name":"Aram","postcode":"10999","neighbourhood":"Kreuzberg"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm-b@example.com', '', '{"first_name":"Bita","postcode":"12043","neighbourhood":"Neukölln"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm-c@example.com', '', '{"first_name":"Cyrus","postcode":"13353","neighbourhood":"Wedding"}', '{}', now(), now(), now());
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.books (id, owner_id, title, author, language, category, condition, loan_months, handover_methods) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', 'A1', 'x', 'fa', 'novel', 'good', 1, '{meetup}'),
  ('00000000-0000-0000-0000-00000000a102', '00000000-0000-0000-0000-0000000000a1', 'A2', 'x', 'fa', 'novel', 'good', 1, '{meetup}'),
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-0000000000b1', 'B1', 'x', 'fa', 'novel', 'good', 1, '{meetup}'),
  ('00000000-0000-0000-0000-00000000c101', '00000000-0000-0000-0000-0000000000c1', 'C1', 'x', 'fa', 'novel', 'good', 1, '{meetup}');

-- an owner cannot accept a request for a book the admin has hidden
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('hid', public.request_loan('00000000-0000-0000-0000-00000000a102', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  perform public.admin_set_book_hidden('00000000-0000-0000-0000-00000000a102', true);
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert pg_temp.err(format('select public.respond_request(%L, true)', (select v from t where k = 'hid'))) = 'book_unavailable', 'no_accept_for_hidden_book';
end $$;

-- acceptance rate ignores automatic declines (lent to someone else)
do $$ declare base_answered numeric; s json; begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('b', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  insert into t values ('c', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_request((select v from t where k = 'b'), true);
  assert (select end_reason from public.loans where id = (select v from t where k = 'c')) = 'lent_to_other', 'auto_declined';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  s := public.admin_stats();
  -- among non-sample loans, only owner decisions and expiries count as "answered"
  assert (s ->> 'acceptance_rate')::numeric = round(
    (select count(*) filter (where accepted_at is not null)::numeric
     / nullif(count(*) filter (where accepted_at is not null or (status in ('declined', 'expired') and coalesce(end_reason, '') in ('owner_declined', 'no_answer'))), 0)
     from public.loans where not is_sample), 2), 'acceptance_rate_ignores_auto_declines';
end $$;

-- profile limits are enforced by the database
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert pg_temp.err($q$update public.profiles set neighbourhood = repeat('x', 61) where id = auth.uid()$q$) like '%violates check constraint%', 'neighbourhood_length_limited';
  assert pg_temp.err($q$update public.profiles set postcode = '14467' where id = auth.uid()$q$) like '%violates check constraint%', 'postcode_must_be_berlin';
  assert pg_temp.err($q$update public.profiles set postcode = '10245' where id = auth.uid()$q$) is null, 'berlin_postcode_accepted';
end $$;

-- grants: what a signed-in member and an anonymous visitor may execute
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
do $$ declare ok boolean; begin
  assert public.can_request('00000000-0000-0000-0000-00000000b101') is null or true, 'member_can_call_can_request';
  ok := false; begin perform public.run_timed_transitions(); exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_run_timed_jobs';
  ok := false; begin perform public.refresh_sample_loans(); exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_refresh_samples';
  ok := false; begin perform bm_private.log(gen_random_uuid(), null, 'x'); exception when insufficient_privilege or invalid_schema_name then ok := true; end;
  assert ok, 'member_cannot_write_events';
end $$;
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$ declare ok boolean; begin
  ok := false; begin perform public.admin_stats(); exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon_cannot_call_admin';
  ok := false; begin perform public.get_my_loans(); exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon_cannot_list_loans';
  assert (select count(*) from public.book_journey('00000000-0000-0000-0000-00000000b101')) = 1, 'anon_can_read_journey';
end $$;
reset role;
select 'minor fixes passed' as result;
rollback;
