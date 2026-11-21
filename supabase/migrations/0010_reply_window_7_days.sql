-- Owners now have 7 days (was 3) to answer a borrow request.
-- Only new requests get the longer window; requests already waiting keep the deadline they were given.
alter table public.loans alter column respond_by set default (now() + interval '7 days');
