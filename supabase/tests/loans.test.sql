-- Loan rule tests. Run the whole file in one execute_sql call; it rolls back.
begin;
create temp table t (k text primary key, v uuid) on commit drop;
create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true)
$$;
create function pg_temp.err(q text) returns text language plpgsql as $$
begin execute q; return null; exception when others then return sqlerrm; end $$;
create function pg_temp.id(key text) returns uuid language sql as $$ select v from t where k = key $$;
create function pg_temp.st(key text) returns text language sql as $$ select status from public.loans where id = (select v from t where k = key) $$;

-- Members A (owner), B, C (borrowers), D (no books); sample owner E1 and sample borrower E2.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'loan-a@example.com', '', '{"first_name":"Aram","postcode":"10999","neighbourhood":"Kreuzberg"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'loan-b@example.com', '', '{"first_name":"Bita","postcode":"12043","neighbourhood":"Neukölln","telegram":"bita_k"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'loan-c@example.com', '', '{"first_name":"Cyrus","postcode":"13353","neighbourhood":"Wedding"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'loan-d@example.com', '', '{"first_name":"Dara","postcode":"10405","neighbourhood":"Prenzlauer Berg"}', '{}', now(), now(), now());
insert into public.profiles (id, first_name, postcode, neighbourhood, is_sample) values
  ('00000000-0000-0000-0000-0000000000e1', 'Sample1', '10999', 'Kreuzberg', true),
  ('00000000-0000-0000-0000-0000000000e2', 'Sample2', '12043', 'Neukölln', true);

insert into public.books (id, owner_id, title, author, language, category, condition, loan_months, handover_methods, is_sample) values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1', 'A1', 'x', 'fa', 'novel', 'good', 1, '{meetup,in_person}', false),
  ('00000000-0000-0000-0000-00000000a102', '00000000-0000-0000-0000-0000000000a1', 'A2', 'x', 'fa', 'novel', 'good', 2, '{meetup,in_person}', false),
  ('00000000-0000-0000-0000-00000000a103', '00000000-0000-0000-0000-0000000000a1', 'A3', 'x', 'fa', 'novel', 'good', 1, '{meetup,in_person}', false),
  ('00000000-0000-0000-0000-00000000a104', '00000000-0000-0000-0000-0000000000a1', 'A4', 'x', 'fa', 'novel', 'good', 1, '{meetup}', false),
  ('00000000-0000-0000-0000-00000000a105', '00000000-0000-0000-0000-0000000000a1', 'A5', 'x', 'fa', 'novel', 'good', 1, '{meetup,in_person}', false),
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-0000000000b1', 'B1', 'x', 'fa', 'novel', 'good', 1, '{meetup,in_person}', false),
  ('00000000-0000-0000-0000-00000000c101', '00000000-0000-0000-0000-0000000000c1', 'C1', 'x', 'fa', 'novel', 'good', 1, '{meetup,in_person}', false),
  ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-0000000000e1', 'S1', 'x', 'fa', 'novel', 'good', 1, '{meetup,in_person}', true);

-- block reasons
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
  assert public.can_request('00000000-0000-0000-0000-00000000a101') = 'no_own_book', 'block_no_own_book';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert public.can_request('00000000-0000-0000-0000-00000000e101') = 'sample_book', 'block_sample_book';
  assert pg_temp.err($q$select public.request_loan('00000000-0000-0000-0000-00000000e101', 'meetup')$q$) = 'sample_book', 'request_sample_book_raises';
  assert public.can_request('00000000-0000-0000-0000-00000000a101') is null, 'b_can_request_a1';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert public.can_request('00000000-0000-0000-0000-00000000a101') = 'own_book', 'block_own_book';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert pg_temp.err($q$select public.request_loan('00000000-0000-0000-0000-00000000a104', 'in_person')$q$) = 'not_allowed', 'handover_must_match_book';
end $$;

-- requests, duplicates and the pending limit
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('b_a1', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup', null, 'سلام'));
  insert into t values ('b_a2', public.request_loan('00000000-0000-0000-0000-00000000a102', 'in_person'));
  assert pg_temp.err($q$select public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup')$q$) = 'already_requested', 'already_requested';
  insert into t values ('b_a3', public.request_loan('00000000-0000-0000-0000-00000000a103', 'meetup'));
  assert public.can_request('00000000-0000-0000-0000-00000000a105') = 'too_many_pending', 'pending_limit_3';
  assert pg_temp.err($q$select public.request_loan('00000000-0000-0000-0000-00000000a105', 'meetup')$q$) = 'too_many_pending', 'pending_limit_3_raises';
  assert (select respond_by from public.loans where id = pg_temp.id('b_a1')) between now() + interval '71 hours' and now() + interval '73 hours', 'respond_by_3_days';
  assert (select count(*) from public.get_loan_contacts(pg_temp.id('b_a1'))) = 0, 'contacts_hidden_until_accept';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  insert into t values ('c_a1', public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup'));
end $$;

-- accept withdraws the borrower's other requests and declines others for the same book
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert pg_temp.err(format('select public.respond_request(%L, true)', pg_temp.id('b_a1'))) = 'not_allowed', 'borrower_cannot_accept';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_request(pg_temp.id('b_a1'), true);
  assert pg_temp.st('b_a1') = 'accepted', 'accepted';
  assert pg_temp.st('b_a2') = 'withdrawn' and pg_temp.st('b_a3') = 'withdrawn', 'accept_withdraws_others';
  assert (select end_reason from public.loans where id = pg_temp.id('b_a2')) = 'accepted_elsewhere', 'withdraw_reason';
  assert pg_temp.st('c_a1') = 'declined', 'accept_declines_same_book';
  assert (select end_reason from public.loans where id = pg_temp.id('c_a1')) = 'lent_to_other', 'decline_reason';
  assert (select loan_state from public.books where id = '00000000-0000-0000-0000-00000000a101') = 'reserved', 'book_reserved';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert public.can_request('00000000-0000-0000-0000-00000000c101') = 'has_active_loan', 'one_active_loan';
end $$;

-- contacts after accept: only the other member, never the caller, nobody else
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert (select count(*) from public.get_loan_contacts(pg_temp.id('b_a1'))) = 1, 'contacts_one_row';
  assert (select email from public.get_loan_contacts(pg_temp.id('b_a1'))) = 'loan-a@example.com', 'contacts_show_owner';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert (select telegram from public.get_loan_contacts(pg_temp.id('b_a1'))) = 'bita_k', 'contacts_show_borrower';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
  assert (select count(*) from public.get_loan_contacts(pg_temp.id('b_a1'))) = 0, 'contacts_hidden_from_others';
  assert (select count(*) from public.get_loan(pg_temp.id('b_a1'))) = 0, 'get_loan_hidden_from_others';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert (select owner_first_name from public.get_loan(pg_temp.id('b_a1'))) = 'Aram', 'get_loan_names';
  assert (select count(*) from public.get_my_loans()) = 3, 'get_my_loans_rows';
end $$;

-- race: a second accept on the same book never creates two active loans
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  insert into t values ('c_a2', public.request_loan('00000000-0000-0000-0000-00000000a102', 'meetup'));
  insert into public.loans (book_id, owner_id, borrower_id, handover_method) values
    ('00000000-0000-0000-0000-00000000a102', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1', 'meetup');
  insert into t select 'd_a2', id from public.loans where borrower_id = '00000000-0000-0000-0000-0000000000d1';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_request(pg_temp.id('c_a2'), true);
  update public.loans set status = 'requested', ended_at = null, end_reason = null where id = pg_temp.id('d_a2');
  assert pg_temp.err(format('select public.respond_request(%L, true)', pg_temp.id('d_a2'))) = 'book_unavailable', 'race_second_accept_fails';
  assert (select count(*) from public.loans where book_id = '00000000-0000-0000-0000-00000000a102' and status in ('accepted', 'reading', 'return_marked')) = 1, 'race_one_active';
end $$;

-- receiving, due date, extensions
do $$ declare d0 date; begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert pg_temp.err(format('select public.confirm_received(%L)', pg_temp.id('b_a1'))) = 'not_allowed', 'owner_cannot_confirm_received';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  perform public.confirm_received(pg_temp.id('b_a1'));
  assert pg_temp.st('b_a1') = 'reading', 'receive_status';
  d0 := (public.berlin_today() + interval '1 month')::date;
  assert (select due_date from public.loans where id = pg_temp.id('b_a1')) = d0, 'receive_sets_due_date';
  assert (select loan_state from public.books where id = '00000000-0000-0000-0000-00000000a101') = 'on_loan', 'book_on_loan';
  assert (select loan_due_date from public.books where id = '00000000-0000-0000-0000-00000000a101') = d0, 'book_due_date';
  update public.books set loan_months = 3 where id = '00000000-0000-0000-0000-00000000a101';
  assert (select due_date from public.loans where id = pg_temp.id('b_a1')) = d0, 'due_date_fixed_after_edit';

  perform public.request_extension(pg_temp.id('b_a1'));
  assert (select extension_pending from public.loans where id = pg_temp.id('b_a1')), 'extension_pending';
  assert pg_temp.err(format('select public.request_extension(%L)', pg_temp.id('b_a1'))) = 'not_allowed', 'one_pending_extension';
  assert pg_temp.err(format('select public.respond_extension(%L, true)', pg_temp.id('b_a1'))) = 'not_allowed', 'borrower_cannot_answer_extension';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_extension(pg_temp.id('b_a1'), true);
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  perform public.request_extension(pg_temp.id('b_a1'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_extension(pg_temp.id('b_a1'), true);
  assert (select due_date from public.loans where id = pg_temp.id('b_a1')) = d0 + 28, 'extensions_add_14_days_each';
  assert (select extensions_used from public.loans where id = pg_temp.id('b_a1')) = 2, 'extensions_used_2';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert pg_temp.err(format('select public.request_extension(%L)', pg_temp.id('b_a1'))) = 'not_allowed', 'extensions_max_2';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  assert pg_temp.err(format('select public.mark_returned(%L)', pg_temp.id('b_a1'))) = 'not_allowed', 'stranger_cannot_touch_loan';
end $$;

-- return flow
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  perform public.mark_returned(pg_temp.id('b_a1'));
  assert pg_temp.st('b_a1') = 'return_marked', 'mark_returned';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.confirm_return(pg_temp.id('b_a1'));
  assert pg_temp.st('b_a1') = 'closed', 'confirm_return_closes';
  assert (select closed_by from public.loans where id = pg_temp.id('b_a1')) = 'owner', 'closed_by_owner';
  assert (select loan_state from public.books where id = '00000000-0000-0000-0000-00000000a101') = 'none', 'book_free_again';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert public.can_request('00000000-0000-0000-0000-00000000a103') is null, 'borrower_free_again';
  -- owner confirms directly from reading
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  perform public.confirm_received(pg_temp.id('c_a2'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.confirm_return(pg_temp.id('c_a2'));
  assert pg_temp.st('c_a2') = 'closed', 'owner_confirms_from_reading';
end $$;

-- cancel rules
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('b_a3_2', public.request_loan('00000000-0000-0000-0000-00000000a103', 'meetup'));
  perform public.cancel_loan(pg_temp.id('b_a3_2'));
  assert pg_temp.st('b_a3_2') = 'cancelled', 'borrower_cancels_request';
  insert into t values ('b_a3_3', public.request_loan('00000000-0000-0000-0000-00000000a103', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert pg_temp.err(format('select public.cancel_loan(%L)', pg_temp.id('b_a3_3'))) = 'not_allowed', 'owner_declines_not_cancels_request';
  perform public.respond_request(pg_temp.id('b_a3_3'), true);
  perform public.cancel_loan(pg_temp.id('b_a3_3'));
  assert pg_temp.st('b_a3_3') = 'cancelled', 'owner_cancels_accepted';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  insert into t values ('b_a3_4', public.request_loan('00000000-0000-0000-0000-00000000a103', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.respond_request(pg_temp.id('b_a3_4'), true);
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  perform public.confirm_received(pg_temp.id('b_a3_4'));
  assert pg_temp.err(format('select public.cancel_loan(%L)', pg_temp.id('b_a3_4'))) = 'bad_state', 'nobody_cancels_reading';
end $$;

-- delete rules: refused with an active loan; pending requests are declined
do $$ begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  assert pg_temp.err($q$select public.delete_book('00000000-0000-0000-0000-00000000a103')$q$) = 'bad_state', 'delete_refused_when_on_loan';
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  insert into t values ('c_a5', public.request_loan('00000000-0000-0000-0000-00000000a105', 'meetup'));
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
  perform public.delete_book('00000000-0000-0000-0000-00000000a105');
  assert (select deleted_at is not null from public.books where id = '00000000-0000-0000-0000-00000000a105'), 'book_soft_deleted';
  assert pg_temp.st('c_a5') = 'declined', 'delete_declines_pending';
  assert (select end_reason from public.loans where id = pg_temp.id('c_a5')) = 'book_removed', 'delete_reason';
end $$;

-- overdue blocks new requests (shown before "has an active loan")
do $$ begin
  update public.loans set due_date = public.berlin_today() - 1 where id = pg_temp.id('b_a3_4');
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
  assert public.can_request('00000000-0000-0000-0000-00000000c101') = 'has_overdue', 'overdue_blocks_requests';
end $$;

-- timed transitions skip sample loans
do $$ declare sid uuid; begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
  insert into t values ('c_a4', public.request_loan('00000000-0000-0000-0000-00000000a104', 'meetup'));
  update public.loans set respond_by = now() - interval '1 minute' where id = pg_temp.id('c_a4');
  update public.loans set status = 'return_marked', return_marked_at = now() - interval '8 days', due_date = public.berlin_today() + 10 where id = pg_temp.id('b_a3_4');
  insert into public.loans (book_id, owner_id, borrower_id, handover_method, respond_by, is_sample) values
    ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2', 'meetup', now() - interval '1 day', true)
  returning id into sid;
  insert into t values ('samp', sid);
  perform public.run_timed_transitions();
  assert pg_temp.st('c_a4') = 'expired', 'timed_expire';
  assert pg_temp.st('b_a3_4') = 'closed' and (select closed_by from public.loans where id = pg_temp.id('b_a3_4')) = 'auto', 'timed_autoclose';
  assert pg_temp.st('samp') = 'requested', 'timed_skips_samples';
end $$;

-- sample loans never look overdue
do $$ begin
  update public.loans set status = 'reading', received_at = now(), due_date = public.berlin_today() + 3 where id = pg_temp.id('samp');
  perform public.refresh_sample_loans();
  assert (select due_date from public.loans where id = pg_temp.id('samp')) > public.berlin_today() + 7, 'sample_due_dates_refreshed';
end $$;

-- every step left a history entry; anon cannot call loan functions
do $$ begin
  assert (select count(*) from public.loan_events where loan_id = pg_temp.id('b_a1')) >= 9, 'events_written';
  assert (select count(*) from public.loan_events where loan_id = pg_temp.id('c_a1') and type = 'declined') = 1, 'events_for_auto_decline';
end $$;
set local role anon;
do $$ begin
  assert pg_temp.err($q$select public.request_loan('00000000-0000-0000-0000-00000000a101', 'meetup')$q$) like 'permission denied%', 'anon_cannot_call_rpc';
end $$;
reset role;

select 'loan tests passed' as result;
rollback;
