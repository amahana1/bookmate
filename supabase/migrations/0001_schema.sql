-- Book Mate schema: tables, helpers, indexes, triggers.

create or replace function public.bm_normalize(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select regexp_replace(
    translate(lower(coalesce(t, '')), 'يىكةأإآ', 'ییکهااا'),
    '[ً-ٰٟـ‌‍[:space:]]', '', 'g')
$$;

create or replace function public.berlin_today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Europe/Berlin')::date
$$;

create table public.profiles (
  id uuid primary key,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 60),
  postcode text not null check (postcode ~ '^[0-9]{5}$'),
  neighbourhood text not null default '',
  telegram text check (telegram is null or telegram ~ '^[A-Za-z0-9_]{5,32}$'),
  locale text not null default 'fa' check (locale in ('fa', 'de', 'en')),
  is_admin boolean not null default false,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  title_latin text check (title_latin is null or char_length(title_latin) <= 200),
  author text not null check (char_length(btrim(author)) between 1 and 200),
  translator text check (translator is null or char_length(translator) <= 200),
  publisher text check (publisher is null or char_length(publisher) <= 200),
  language text not null check (language in ('fa', 'de', 'en', 'ar', 'tr', 'uk', 'ru', 'ku', 'bilingual', 'other')),
  category text not null check (category in ('novel', 'poetry', 'children', 'history_society', 'biography_graphic', 'other')),
  year int check (year is null or year between 1800 and 2100),
  condition text not null check (condition in ('like_new', 'good', 'worn')),
  loan_months int not null default 1 check (loan_months between 1 and 3),
  handover_methods text[] not null check (cardinality(handover_methods) >= 1 and handover_methods <@ array['meetup', 'in_person']),
  cover_path text check (cover_path is null or char_length(cover_path) <= 300),
  status text not null default 'available' check (status in ('available', 'paused')),
  hidden boolean not null default false,
  is_sample boolean not null default false,
  neighbourhood text not null default '',
  loan_state text not null default 'none' check (loan_state in ('none', 'reserved', 'on_loan')),
  loan_due_date date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title_norm text generated always as (public.bm_normalize(title)) stored
);
create unique index books_owner_title_uniq on public.books (owner_id, title_norm) where deleted_at is null;
create index books_created_idx on public.books (created_at desc);
create index books_owner_idx on public.books (owner_id);

create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  place text not null default '[محل برگزاری]' check (char_length(place) <= 200),
  neighbourhood text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  borrower_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'reading', 'return_marked', 'closed', 'declined', 'cancelled', 'expired', 'withdrawn')),
  handover_method text not null check (handover_method in ('meetup', 'in_person')),
  meetup_id uuid references public.meetups (id) on delete set null,
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now(),
  respond_by timestamptz not null default (now() + interval '3 days'),
  accepted_at timestamptz,
  received_at timestamptz,
  due_date date,
  extensions_used int not null default 0 check (extensions_used between 0 and 2),
  extension_pending boolean not null default false,
  return_marked_at timestamptz,
  closed_at timestamptz,
  closed_by text check (closed_by in ('owner', 'auto', 'admin')),
  ended_at timestamptz,
  end_reason text,
  has_open_report boolean not null default false,
  is_sample boolean not null default false,
  check (owner_id <> borrower_id)
);
create unique index loans_one_active_per_book on public.loans (book_id) where status in ('accepted', 'reading', 'return_marked');
create unique index loans_one_active_per_borrower on public.loans (borrower_id) where status in ('accepted', 'reading', 'return_marked');
create unique index loans_one_pending_per_book_borrower on public.loans (book_id, borrower_id) where status = 'requested';
create index loans_owner_idx on public.loans (owner_id);
create index loans_borrower_idx on public.loans (borrower_id);
create index loans_book_idx on public.loans (book_id);

create table public.loan_events (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);
create index loan_events_loan_idx on public.loan_events (loan_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('not_received', 'no_show', 'lost', 'damaged', 'other')),
  message text check (message is null or char_length(message) <= 2000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index reports_loan_idx on public.reports (loan_id);

-- Profiles follow auth users.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pc text := coalesce(m ->> 'postcode', '');
  loc text := coalesce(m ->> 'locale', 'fa');
  tg text := nullif(ltrim(btrim(coalesce(m ->> 'telegram', '')), '@'), '');
begin
  insert into public.profiles (id, first_name, postcode, neighbourhood, telegram, locale)
  values (
    new.id,
    coalesce(nullif(btrim(m ->> 'first_name'), ''), split_part(new.email, '@', 1)),
    case when pc ~ '^[0-9]{5}$' then pc else '00000' end,
    coalesce(m ->> 'neighbourhood', ''),
    case when tg ~ '^[A-Za-z0-9_]{5,32}$' then tg else null end,
    case when loc in ('fa', 'de', 'en') then loc else 'fa' end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_deleted_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end $$;
create trigger on_auth_user_deleted after delete on auth.users for each row execute function public.handle_deleted_user();

-- Books carry the owner's neighbourhood (profiles are not public).
create or replace function public.books_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.neighbourhood := coalesce((select p.neighbourhood from public.profiles p where p.id = new.owner_id), '');
  else
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger books_before_write before insert or update on public.books for each row execute function public.books_before_write();

create or replace function public.profiles_sync_neighbourhood() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.books set neighbourhood = new.neighbourhood where owner_id = new.id;
  return null;
end $$;
create trigger profiles_sync_neighbourhood after update of neighbourhood on public.profiles
  for each row when (old.neighbourhood is distinct from new.neighbourhood) execute function public.profiles_sync_neighbourhood();

-- Books show the state of their active loan.
create or replace function public.loans_sync_book_state() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  a_status text;
  a_due date;
begin
  select l.status, l.due_date into a_status, a_due
  from public.loans l
  where l.book_id = new.book_id and l.status in ('accepted', 'reading', 'return_marked')
  limit 1;
  update public.books set
    loan_state = case when a_status is null then 'none' when a_status = 'accepted' then 'reserved' else 'on_loan' end,
    loan_due_date = case when a_status in ('reading', 'return_marked') then a_due else null end
  where id = new.book_id;
  return null;
end $$;
create trigger loans_sync_book_state after insert or update on public.loans for each row execute function public.loans_sync_book_state();
