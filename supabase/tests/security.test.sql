-- Security tests. Run the whole file in one execute_sql call; it rolls back.
-- Works with or without the sample data loaded (assertions ignore is_sample rows).
begin;

-- Setup (as postgres): two members A and B, created through auth.users so the profile trigger runs.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sec-a@example.com', '', '{"first_name":"Aram","postcode":"10999","neighbourhood":"Kreuzberg","locale":"fa"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sec-b@example.com', '', '{"first_name":"Bita","postcode":"12043","neighbourhood":"Neukölln","telegram":"bita_k","locale":"de"}', '{}', now(), now(), now());
do $$ begin
  assert (select first_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'Aram', 'profile_created_by_trigger';
  assert (select telegram from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = 'bita_k', 'profile_telegram_from_metadata';
end $$;

-- As A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into public.books (title, author, language, category, condition, loan_months, handover_methods)
values ('چراغ‌ها را من خاموش می‌کنم', 'زویا پیرزاد', 'fa', 'novel', 'good', 1, '{meetup}');
do $$ begin
  assert (select owner_id from public.books where title like 'چراغ%' and not is_sample) = '00000000-0000-0000-0000-0000000000a1', 'owner_defaults_to_caller';
  assert (select neighbourhood from public.books where title like 'چراغ%' and not is_sample) = 'Kreuzberg', 'neighbourhood_copied';
end $$;
do $$ declare ok boolean := false; begin
  begin
    insert into public.books (title, author, language, category, condition, loan_months, handover_methods)
    values ('چراغ‌ها را من خاموش مي‌كنم', 'زویا پیرزاد', 'fa', 'novel', 'good', 1, '{meetup}');
  exception when unique_violation then ok := true; end;
  assert ok, 'duplicate_title_rejected';
end $$;
do $$ declare ok boolean := false; begin
  begin update public.books set hidden = true; exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_set_hidden';
end $$;
do $$ declare ok boolean := false; begin
  begin update public.books set is_sample = true; exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_set_sample';
end $$;
do $$ declare ok boolean := false; begin
  begin update public.books set loan_state = 'none'; exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_set_loan_state';
end $$;
do $$ declare ok boolean := false; begin
  begin
    insert into public.loans (book_id, owner_id, borrower_id, handover_method)
    select id, owner_id, '00000000-0000-0000-0000-0000000000b1', 'meetup' from public.books limit 1;
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_insert_loans';
end $$;
do $$ declare ok boolean := false; begin
  begin update public.profiles set is_admin = true where id = auth.uid(); exception when insufficient_privilege then ok := true; end;
  assert ok, 'member_cannot_make_self_admin';
end $$;
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'member_reads_only_own_profile';
end $$;
update public.profiles set neighbourhood = 'Moabit' where id = auth.uid();
do $$ begin
  assert (select neighbourhood from public.books where title like 'چراغ%' and not is_sample) = 'Moabit', 'neighbourhood_synced';
end $$;

-- As B: two books, and an attempt to edit A's book
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
insert into public.books (title, author, language, category, condition, loan_months, handover_methods) values
  ('بوف کور', 'صادق هدایت', 'fa', 'novel', 'good', 2, '{meetup,in_person}'),
  ('سووشون', 'سیمین دانشور', 'fa', 'novel', 'worn', 1, '{in_person}');
-- RLS hides A's book from B's update: it must touch 0 rows.
update public.books set title = 'x' where owner_id = '00000000-0000-0000-0000-0000000000a1';

-- As postgres: hide one of B's books, delete the other, add a loan between A and B.
reset role;
do $$ begin
  assert (select count(*) from public.books where title = 'x') = 0, 'member_cannot_edit_others_book';
end $$;
update public.books set hidden = true where title = 'بوف کور' and not is_sample;
update public.books set deleted_at = now() where title = 'سووشون' and not is_sample;
insert into public.loans (book_id, owner_id, borrower_id, handover_method)
select id, owner_id, '00000000-0000-0000-0000-0000000000b1', 'meetup' from public.books where title like 'چراغ%' and not is_sample;

-- As anon
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$ declare ok boolean; n int; begin
  ok := false; begin select count(*) into n from public.profiles; ok := n = 0; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon_cannot_read_profiles';
  ok := false; begin select count(*) into n from public.loans; ok := n = 0; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon_cannot_read_loans';
  ok := false; begin select count(*) into n from public.loan_events; ok := n = 0; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon_cannot_read_loan_events';
  ok := false; begin select count(*) into n from public.reports; ok := n = 0; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon_cannot_read_reports';
  assert (select count(*) from public.books where not is_sample) = 1, 'anon_reads_visible_books_only';
end $$;

-- As B again: sees own hidden book and own loan
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.books where title = 'بوف کور' and not is_sample) = 1, 'owner_sees_own_hidden_book';
  assert (select count(*) from public.loans) = 1, 'party_reads_own_loan';
end $$;

reset role;
select 'security tests passed' as result;
rollback;
