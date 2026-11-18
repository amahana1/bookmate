-- Admin, storage and sample-data tests. Run the whole file in one execute_sql call; it rolls back.
begin;
create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true)
$$;
create function pg_temp.err(q text) returns text language plpgsql as $$
begin execute q; return null; exception when others then return sqlerrm; end $$;
create temp table t (k text primary key, v uuid) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm-f@example.com', '', '{"first_name":"Farah","postcode":"10115","neighbourhood":"Mitte"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm-a@example.com', '', '{"first_name":"Aram","postcode":"10999","neighbourhood":"Kreuzberg"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm-b@example.com', '', '{"first_name":"Bita","postcode":"12043","neighbourhood":"Neukölln"}', '{}', now(), now(), now());
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.books (id, owner_id, title, author, language, category, condition, loan_months, handover_methods) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', 'A1', 'x', 'fa', 'novel', 'good', 1, '{meetup}'),
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-0000000000b1', 'B1', 'x', 'fa', 'novel', 'good', 1, '{meetup}');
insert into public.profiles (id, first_name, postcode, neighbourhood, is_sample) values ('00000000-0000-0000-0000-0000000000e1', 'S', '10999', 'Kreuzberg', true);
insert into public.books (owner_id, title, author, language, category, condition, loan_months, handover_methods, is_sample) values
  ('00000000-0000-0000-0000-0000000000e1', 'S1', 'x', 'fa', 'novel', 'good', 1, '{meetup}', true);
insert into public.meetups (starts_at, ends_at, neighbourhood) values (now() + interval '10 days', now() + interval '10 days 2 hours', 'Kreuzberg');

-- non_admin_rejected
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert pg_temp.err($q$select public.admin_set_book_hidden('00000000-0000-0000-0000-00000000b101', true)$q$) = 'not_allowed', 'non_admin_hide';
  assert pg_temp.err($q$select public.admin_stats()$q$) = 'not_allowed', 'non_admin_stats';
  assert pg_temp.err($q$select public.admin_remove_sample_data()$q$) = 'not_allowed', 'non_admin_remove_samples';
  assert pg_temp.err($q$select * from public.admin_list_reports()$q$) = 'not_allowed', 'non_admin_reports';
  assert pg_temp.err($q$select * from public.admin_list_overdue()$q$) = 'not_allowed', 'non_admin_overdue';
  assert pg_temp.err($q$select public.admin_close_loan(gen_random_uuid())$q$) = 'not_allowed', 'non_admin_close';
  assert pg_temp.err($q$select public.admin_resolve_report(gen_random_uuid())$q$) = 'not_allowed', 'non_admin_resolve';
end $$;

-- hide_book
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  perform public.admin_set_book_hidden('00000000-0000-0000-0000-00000000b101', true);
  assert (select hidden from public.books where id = '00000000-0000-0000-0000-00000000b101'), 'hide_book';
  assert public.can_request('00000000-0000-0000-0000-00000000b101') = 'book_unavailable', 'hidden_not_requestable';
  perform public.admin_set_book_hidden('00000000-0000-0000-0000-00000000b101', false);
  assert not (select hidden from public.books where id = '00000000-0000-0000-0000-00000000b101'), 'unhide_book';
end $$;

-- report_resolve and admin_close_loan
do $$ declare rid uuid; begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('loan', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_request((select v from t where k = 'loan'), true);
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  rid := public.report_problem((select v from t where k = 'loan'), 'no_show', 'نیامد');
  assert (select has_open_report from public.loans where id = (select v from t where k = 'loan')), 'report_sets_flag';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  assert (select count(*) from public.admin_list_reports()) = 1, 'admin_lists_open_reports';
  assert (select book_title from public.admin_list_reports()) = 'A1', 'report_row_has_book';
  perform public.admin_resolve_report(rid);
  assert not (select has_open_report from public.loans where id = (select v from t where k = 'loan')), 'report_resolve_clears_flag';
  assert (select status from public.reports where id = rid) = 'resolved', 'report_resolved';
  assert (select count(*) from public.admin_list_reports()) = 0, 'resolved_not_listed';
  perform public.admin_close_loan((select v from t where k = 'loan'));
  assert (select status || '/' || closed_by from public.loans where id = (select v from t where k = 'loan')) = 'closed/admin', 'admin_close_loan';
end $$;

-- overdue list
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('loan2', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_request((select v from t where k = 'loan2'), true);
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  perform public.confirm_received((select v from t where k = 'loan2'));
  update public.loans set due_date = public.berlin_today() - 2 where id = (select v from t where k = 'loan2');
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  assert (select count(*) from public.admin_list_overdue()) = 1, 'admin_lists_overdue';
end $$;

-- stats exclude samples
do $$ declare s json; begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  s := public.admin_stats();
  assert (s ->> 'books')::int = 2, 'stats_books_exclude_samples';
  assert (s ->> 'members')::int = 3, 'stats_members_exclude_samples';
  assert (s ->> 'requests')::int = 2, 'stats_requests';
  assert (s ->> 'completed_loans')::int = 1, 'stats_completed';
end $$;

-- remove samples
do $$ declare n int; begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
  n := public.admin_remove_sample_data();
  assert n > 0, 'remove_samples_count';
  assert (select count(*) from public.profiles where is_sample) = 0, 'no_sample_profiles';
  assert (select count(*) from public.books where is_sample) = 0, 'no_sample_books';
  assert (select count(*) from public.meetups) = 1, 'meetups_kept';
  assert (select count(*) from public.books where id = '00000000-0000-0000-0000-00000000a101') = 1, 'real_books_kept';
end $$;

-- storage policy: members write only to their own folder
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into storage.objects (bucket_id, name) values ('covers', '00000000-0000-0000-0000-0000000000a1/own.webp');
do $$ declare ok boolean := false; begin
  begin
    insert into storage.objects (bucket_id, name) values ('covers', '00000000-0000-0000-0000-0000000000b1/x.webp');
  exception when others then ok := true; end;
  assert ok, 'storage_policy';
end $$;
reset role;
do $$ begin
  assert (select public and file_size_limit = 2097152 from storage.buckets where id = 'covers'), 'covers_bucket_public_2mb';
end $$;

select 'admin tests passed' as result;
rollback;
