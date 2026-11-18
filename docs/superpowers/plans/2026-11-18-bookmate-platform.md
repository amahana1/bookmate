# Book Mate Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A live member platform for Book Mate (هم‌کتاب) at https://bookmate.onrender.com where Berlin residents sign up, list books, and run full owner-approved loans, in Persian/German/English, seeded with clearly-labelled sample books.

**Architecture:** Vite + React SPA served as static files by Render. Supabase provides auth, Postgres and storage. Every loan rule lives in Postgres: RLS + column grants for reads/writes, `security definer` functions for every loan action, partial unique indexes against races, pg_cron for timed transitions. The browser never writes `loans` directly.

**Tech Stack:** Node 20 LTS, Vite 5, React 18, TypeScript 5, react-router-dom 6, @supabase/supabase-js 2, Vitest 2, @fontsource-variable/vazirmatn 5, @fontsource/lalezar 5. Supabase (Postgres 15+, pg_cron), Render static site, GitHub (`gh` CLI).

**Spec:** `docs/superpowers/specs/2026-11-18-bookmate-platform-design.md` (read it with this plan). Source docs `01-…`, `02-…`, `03-…md` in the repo root hold page copy intent (doc 2 §2) and the visual system (doc 3).

## Global Constraints

- Colours: only the 11 CSS custom properties in doc 3 §3, values verbatim (`--teal: #0B6B67` … `--hairline: #D7E6E4`). Turquoise/saffron never as text on light backgrounds. No gradients, no shadows, no emoji, no stock photos of people.
- Fonts: Lalezar only for wordmark/h1/h2, `font-weight: 400`, ≥28px, line-height 1.5. Vazirmatn for everything else; body 17px/1.9, never below 15px. Self-hosted via the `@fontsource` packages (bundled by Vite); no request to fonts.googleapis.com. Fallback `Vazirmatn, Tahoma, sans-serif`. Type scale: doc 3 §5 table.
- Focus: `outline: 3px solid var(--ink); outline-offset: 3px`; white outline on teal and ink backgrounds.
- Layout: max content width 1100px; side padding 16px phone / 32px desktop; works from 320px with no horizontal scroll; touch targets ≥44×44px; buttons and inputs 48px high; breakpoints 760/620/460px (doc 3 §6).
- Logical CSS properties only (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`).
- `fa` → `<html lang="fa" dir="rtl">`, Persian digits; `de`/`en` → `dir="ltr"`, Western digits. Gregorian dates in all three. Name always «هم‌کتاب» with U+200C.
- Status and errors never by colour alone — always words (plus icon where useful). Error box: white bg, 2px ink border, warning icon, bold text, `role="alert"`, no red.
- No invented facts: unknown contact/legal details are bracketed placeholders from `src/lib/config.ts` (`[ایمیل تماس]`, `[تلگرام ادمین]`, `[محل برگزاری]`).
- Copy I write is marked in the dictionary files with a `// AI copy: review` comment above each block.
- Always-visible prototype note: «نسخه آزمایشی · متن‌ها در حال بازبینی» / "Prototype · texts under review" / "Prototyp · Texte werden überprüft".
- No tracking/analytics scripts, no cookie banner. No secrets in the repo; only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EMAIL_ENABLED` reach the browser.
- Rules (spec §6): ≤3 `requested` per borrower; ≤1 active (`accepted|reading|return_marked`) per borrower and per book; owner answers within 3 days; loan length 1/2/3 months; ≤2 extensions of 14 days, one pending at a time; `return_marked` auto-closes after 7 days; handover `meetup|in_person` only; time zone Europe/Berlin.
- Sample rows (`is_sample = true`) are never requestable, never touched by timed jobs, excluded from overdue lists and stats.
- When doc 3 and the `ui-ux-pro-max` skill disagree, doc 3 wins.

## Review Focus

1. **Two members race for one book, or one borrower gets two accepts at once** → exactly one active loan per book and per borrower; the loser gets a clear "book no longer available" message, never a 500. (Task 3 test `race_second_accept_fails`.)
2. **Search with mixed scripts** — «چراغها» (no ZWNJ), «كليدر» (Arabic ك/ي), `Farzaneh` (translator, Latin), `persepolis` (case) → each finds its book. (Task 1 tests in `normalize.test.ts`.)
3. **Persian or Arabic-Indic digits typed into postcode/year fields** (`۱۰۹۹۹`, `١٠٩٩٩`) → accepted as `10999`. (Task 1 `toAsciiDigits` tests; used by Task 6 and Task 8 validators.)
4. **Logged-out visitor opens a deep link** (`/loans/:id`, `/add`, book page "request") → sent to login, then back to the exact page (request form open). (Task 5 test `buildLoginUrl` + Task 9 manual check.)
5. **Long Latin titles and German labels inside RTL layouts at 320px** → no horizontal scroll, text wraps. (Task 13 script check `document.documentElement.scrollWidth <= innerWidth` on every page at 320px in fa and de.)

---

## File Structure

```
.gitignore  package.json  package-lock.json  tsconfig.json  vite.config.ts  index.html
render.yaml                         # static site + SPA rewrite
supabase/migrations/
  0001_schema.sql                   # tables, indexes, bm_normalize, triggers
  0002_security.sql                 # RLS policies, column grants
  0003_loan_functions.sql           # can_request … get_loan, delete_book
  0004_timed_jobs.sql               # run_timed_transitions, refresh_sample_loans, cron schedules
  0005_admin_storage.sql            # admin_* functions, covers bucket + policies
supabase/seed/sample_data.sql       # 10 sample members, 24 books, sample loans
supabase/tests/
  security.test.sql  loans.test.sql  admin.test.sql   # run via execute_sql inside BEGIN … ROLLBACK
src/
  main.tsx  router.tsx  types.ts
  styles/tokens.css  base.css  components.css
  lib/config.ts  supabase.ts  normalize.ts  format.ts  berlin.ts  books.ts  loans.ts  validate.ts  auth-url.ts  covers.ts
  lib/*.test.ts
  i18n/index.tsx  fa.ts  de.ts  en.ts  i18n.test.ts
  auth/AuthProvider.tsx  RequireAuth.tsx  RequireAdmin.tsx
  api/books.ts  loans.ts  meetups.ts  admin.ts  profile.ts
  components/Header.tsx Footer.tsx PrototypeNote.tsx BookCard.tsx BookCover.tsx StatusChip.tsx
             MeetupBox.tsx Steps.tsx Field.tsx ErrorBox.tsx StatusBox.tsx Toast.tsx
             ProgressSteps.tsx Tabs.tsx Accordion.tsx LanguageSwitch.tsx
  pages/Home Books BookPage BookForm HowItWorks Login Signup MyLoans Account About Rules
        Contact Privacy Impressum LoanPage ResetPassword ConfirmEmail NotFound Admin  (.tsx)
```

Shared types (`src/types.ts`) — every later task uses these names:

```ts
export type Locale = 'fa' | 'de' | 'en';
export type LoanStatus = 'requested'|'accepted'|'reading'|'return_marked'|'closed'|'declined'|'cancelled'|'expired'|'withdrawn';
export type Handover = 'meetup' | 'in_person';
export type BookLang = 'fa'|'de'|'en'|'ar'|'tr'|'uk'|'ru'|'ku'|'bilingual'|'other';
export type Category = 'novel'|'poetry'|'children'|'history_society'|'biography_graphic'|'other';
export type Condition = 'like_new'|'good'|'worn';
export type BlockReason = 'not_logged_in'|'no_own_book'|'has_active_loan'|'too_many_pending'|'has_overdue'|'own_book'|'sample_book'|'book_unavailable'|'already_requested';
export type ReportKind = 'not_received'|'no_show'|'lost'|'damaged'|'other';
export interface Book { id: string; owner_id: string; title: string; title_latin: string|null; author: string; translator: string|null; publisher: string|null; language: BookLang; category: Category; year: number|null; condition: Condition; loan_months: 1|2|3; handover_methods: Handover[]; cover_path: string|null; status: 'available'|'paused'; hidden: boolean; is_sample: boolean; neighbourhood: string; loan_state: 'none'|'reserved'|'on_loan'; loan_due_date: string|null; created_at: string; }
export interface LoanRow { id: string; book_id: string; book_title: string; book_cover_path: string|null; owner_id: string; borrower_id: string; owner_first_name: string; borrower_first_name: string; status: LoanStatus; handover_method: Handover; meetup_id: string|null; message: string|null; created_at: string; respond_by: string; accepted_at: string|null; received_at: string|null; due_date: string|null; extensions_used: number; extension_pending: boolean; return_marked_at: string|null; closed_at: string|null; closed_by: 'owner'|'auto'|'admin'|null; end_reason: string|null; has_open_report: boolean; is_sample: boolean; }
export interface LoanEvent { id: string; loan_id: string; actor_id: string|null; type: string; note: string|null; created_at: string; }
export interface Meetup { id: string; starts_at: string; ends_at: string; place: string; neighbourhood: string; }
export interface Profile { id: string; first_name: string; postcode: string; neighbourhood: string; telegram: string|null; locale: Locale; is_admin: boolean; }
```

---

### Task 1: Toolchain, repo, scaffold, pure utilities

**Files:**
- Create: `.gitignore`, `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/types.ts`, `src/lib/normalize.ts`, `src/lib/format.ts`, `src/lib/berlin.ts`
- Test: `src/lib/normalize.test.ts`, `src/lib/format.test.ts`, `src/lib/berlin.test.ts`

**Interfaces:**
- Produces: `normalizeForSearch(s: string): string`; `matchesQuery(book: Pick<Book,'title'|'title_latin'|'author'|'translator'>, query: string): boolean`; `toAsciiDigits(s: string): string`; `formatNumber(n: number, locale: Locale): string`; `formatDate(iso: string, locale: Locale): string` (day month year, Gregorian, Persian digits for fa); `isBerlinPostcode(s: string): boolean`; `BERLIN_ORTSTEILE: readonly string[]`; all types in `src/types.ts`.

- [ ] **Step 1: Install tools.** `winget install --id OpenJS.NodeJS.LTS -e --source winget` and `winget install --id GitHub.cli -e --source winget`; then in the shell prepend `C:\Program Files\nodejs` and `C:\Program Files\GitHub CLI` and `C:\Program Files\Git\cmd` to `$env:PATH`. Verify: `node -v` (v20+), `npm -v`, `gh --version`.
- [ ] **Step 2: GitHub sign-in (owner action).** Start `gh auth login --web --git-protocol https` in the owner's Terminal panel (run_in_terminal) and ask them to finish it in the browser. Verify `gh auth status` shows logged in. Then `git init -b main` in the repo root and set repo-local identity from `gh api user` → `user.name = <login>`, `user.email = <id>+<login>@users.noreply.github.com`.
- [ ] **Step 3: Scaffold.** Hand-write `package.json` (scripts: `dev`, `build` = `tsc -b && vite build`, `preview`, `test` = `vitest run`), install deps listed in Tech Stack plus `typescript`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `vitest`. `.gitignore`: `node_modules`, `dist`, `.env*`, `.claude/settings.local.json`. `index.html` with `<html lang="fa" dir="rtl">`, `<title>هم‌کتاب · Book Mate</title>`, `<meta name="viewport" …>`, `<div id="root">`. Write `src/types.ts` exactly as in File Structure.
- [ ] **Step 4: Write failing tests.**
  - `normalize.test.ts`: `normalizeForSearch('چراغ‌ها') === normalizeForSearch('چراغها')`; `normalizeForSearch('كليدر') === normalizeForSearch('کلیدر')`; `normalizeForSearch('Persepolis') === normalizeForSearch('persepolis')`; `matchesQuery({title:'صد سال تنهایی', title_latin:null, author:'گابریل گارسیا مارکز', translator:'بهمن فرزانه (Bahman Farzaneh)'}, 'Farzaneh') === true`; `matchesQuery(…, 'فرزانه') === true`; `matchesQuery(…, 'دولت‌آبادی') === false`; multi-word query matches when every word matches some field.
  - `format.test.ts`: `toAsciiDigits('۱۰۹۹۹') === '10999'`; `toAsciiDigits('١٠٩٩٩') === '10999'`; `formatNumber(24,'fa') === '۲۴'`; `formatNumber(24,'de') === '24'`; `formatDate('2026-11-17','fa')` contains `۱۷` and `نوامبر` and `۲۰۲۶`; `formatDate('2026-11-17','de') === '17. November 2026'`; `formatDate('2026-11-17','en') === '17 November 2026'`.
  - `berlin.test.ts`: `isBerlinPostcode('10999')`, `('14199')`, `('۱۰۱۱۵')` true; `('14467')`, `('12529')`, `('10114')`, `('1099')`, `('abcde')` false; `BERLIN_ORTSTEILE` includes `Kreuzberg`, `Neukölln`, `Prenzlauer Berg`, `Wedding`, `Moabit`, `Steglitz` and has ≥90 entries.
- [ ] **Step 5: Run `npm test`** — Expected: FAIL (modules missing).
- [ ] **Step 6: Implement.** `normalizeForSearch`: NFC, lowercase, `ي→ی`, `ك→ک`, `ة→ه`, `أإآ→ا`, strip Arabic diacritics U+064B–U+065F and tatweel U+0640, remove U+200C/U+200D, collapse all whitespace to none, `toAsciiDigits`. `matchesQuery`: split query on whitespace, every normalized word must be a substring of the normalized concatenation of the four fields. `formatDate`: `Intl.DateTimeFormat` with `fa-IR-u-ca-gregory-nu-arabext` (verify output contains Persian month names for Gregorian months; if the runtime returns Jalali, use a fixed Persian month-name array: ژانویه فوریه مارس آوریل مه ژوئن ژوئیه اوت سپتامبر اکتبر نوامبر دسامبر), `de-DE`, `en-GB`; parse date-only strings as Europe/Berlin calendar dates (no UTC shift). `isBerlinPostcode`: `toAsciiDigits`, `/^\d{5}$/`, `10115 ≤ n ≤ 14199`, `n !== 12529` (Schönefeld). `BERLIN_ORTSTEILE`: the 96 official Berlin Ortsteile, German names, sorted.
- [ ] **Step 7: Run `npm test`** — Expected: PASS. Run `npm run build` — Expected: succeeds (placeholder `src/main.tsx` rendering nothing is fine).
- [ ] **Step 8: Commit** everything including the three source docs, `docs/`, `.claude/settings.json`: `git commit -m "chore: scaffold app and search/format/postcode utilities"`.

### Task 2: Supabase project, schema, security

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_security.sql`, `.env.local` (git-ignored)
- Test: `supabase/tests/security.test.sql`

**Interfaces:**
- Produces tables `profiles`, `books`, `loans`, `loan_events`, `reports`, `meetups` with the columns of `Profile`/`Book`/`LoanRow`(minus joined names)/`LoanEvent`/`Meetup` in `src/types.ts`, plus: `books.deleted_at timestamptz`, `books.title_norm text generated always as (public.bm_normalize(title)) stored`, `books.updated_at`; `loans.end_reason text`; `reports(id, loan_id, reporter_id, kind, message, status 'open'|'resolved', created_at, resolved_at)`.
- SQL helpers: `public.bm_normalize(text) returns text immutable` (same rules as `normalizeForSearch` minus digits), `public.is_admin() returns boolean stable security definer`, `public.berlin_today() returns date` (`(now() at time zone 'Europe/Berlin')::date`).
- Triggers: `handle_new_user` (after insert on `auth.users` → insert `profiles` from `raw_user_meta_data`: first_name, postcode, neighbourhood, telegram, locale default 'fa'); `books_set_neighbourhood` (before insert on books → copy owner's neighbourhood); `profiles_sync_neighbourhood` (after update of neighbourhood → update owner's books); `loans_sync_book_state` (after insert/update on loans → set `books.loan_state`/`loan_due_date` from the book's active loan: `accepted`→`reserved`, `reading|return_marked`→`on_loan` + due_date, none→`none`/null).
- Indexes: unique `(book_id) where status in ('accepted','reading','return_marked')`; unique `(borrower_id) where status in ('accepted','reading','return_marked')`; unique `(owner_id, title_norm) where deleted_at is null`; unique `(book_id, borrower_id) where status = 'requested'`.

- [ ] **Step 1: Create the project.** Supabase MCP: `get_cost` (type project, org `wqxkkrnqsmxkzxcyoore`) → `confirm_cost` → `create_project` name `bookmate`, region `eu-central-1`. Wait until status is ACTIVE_HEALTHY (`get_project`). Fetch `get_project_url` and `get_publishable_keys` (anon key); write `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EMAIL_ENABLED=false`.
- [ ] **Step 2: Write `security.test.sql`** (wrapped in `begin; … rollback;`, assertions as `do $$ begin assert …, '<name>'; end $$;`). Setup inserts two auth users A and B (trigger must create their profiles) and one book for each. Tests:
  - `profile_created_by_trigger`: profiles count for A = 1 with first_name from metadata.
  - `anon_cannot_read_profiles_loans_events_reports`: as `anon`, counts are 0.
  - `anon_reads_visible_books_only`: hidden and deleted books not returned to anon.
  - `member_cannot_set_hidden_or_sample`: as A, `update books set hidden = true` raises insufficient_privilege.
  - `member_cannot_insert_loans`: as A, `insert into loans …` raises.
  - `member_cannot_make_self_admin`: as A, `update profiles set is_admin = true` raises.
  - `member_reads_only_own_profile`: as A, `select count(*) from profiles` = 1.
  - `duplicate_title_rejected`: as A, inserting `چراغ‌ها را من خاموش می‌کنم` twice (second spelled with Arabic ي) raises unique_violation.
  - `neighbourhood_copied_and_synced`: A's book neighbourhood equals A's profile; after A updates neighbourhood, book follows.
  Run as a user via `set local role authenticated; select set_config('request.jwt.claims', json_build_object('sub', '<uuid>', 'role', 'authenticated')::text, true);`.
- [ ] **Step 3: Run it** with MCP `execute_sql` — Expected: FAIL (relations missing).
- [ ] **Step 4: Write `0001_schema.sql`** (extensions, helpers, tables with check constraints for every enum in `src/types.ts`, `loan_months between 1 and 3`, `extensions_used between 0 and 2`, `cardinality(handover_methods) >= 1`, indexes, triggers) **and `0002_security.sql`**: enable RLS on all six tables; `revoke all` from `anon, authenticated` then grant: books `select` to anon+authenticated (policy: `not hidden and deleted_at is null or owner_id = auth.uid() or is_admin()`), books `insert (title,title_latin,author,translator,publisher,language,category,year,condition,loan_months,handover_methods,cover_path,status)` and `update` on the same columns to authenticated (policy `owner_id = auth.uid()`, insert `with check owner_id = auth.uid()` with owner_id defaulting to `auth.uid()`); profiles `select` (own row or admin), `update (first_name, postcode, neighbourhood, telegram, locale)` own row; meetups `select` to all, writes admin only; loans/loan_events/reports `select` for parties or admin, no write grants. Apply both with `apply_migration`.
- [ ] **Step 5: Run `security.test.sql`** — Expected: all assertions pass (no error). Run MCP `get_advisors` (security) — Expected: no "RLS disabled" findings.
- [ ] **Step 6: Commit** `git commit -m "feat(db): schema, triggers and row-level security"`.

### Task 3: Loan functions and timed jobs

**Files:**
- Create: `supabase/migrations/0003_loan_functions.sql`, `supabase/migrations/0004_timed_jobs.sql`
- Test: `supabase/tests/loans.test.sql`

**Interfaces** (all `security definer`, `set search_path = public`, raise `exception using message = '<code>'` with codes from `BlockReason` or `not_allowed` / `bad_state`; every transition inserts a `loan_events` row with `type` = function's verb):
- `can_request(p_book_id uuid) returns text` — null or a `BlockReason` (checked in spec §6 order).
- `request_loan(p_book_id uuid, p_handover text, p_meetup_id uuid default null, p_message text default null) returns uuid` — `respond_by = now() + interval '3 days'`; `p_handover` must be in the book's `handover_methods`.
- `respond_request(p_loan_id uuid, p_accept boolean) returns void` — owner, `requested`, not past `respond_by`. Accept: status `accepted`; borrower's other `requested` → `withdrawn` (`end_reason 'accepted_elsewhere'`); other requests for the same book → `declined` (`end_reason 'lent_to_other'`).
- `cancel_loan(p_loan_id uuid)` — borrower when `requested`; either party when `accepted`.
- `confirm_received(p_loan_id uuid)` — borrower, `accepted` → `reading`, `due_date = berlin_today() + loan_months months` (book's value at that moment).
- `request_extension(p_loan_id uuid)` / `respond_extension(p_loan_id uuid, p_accept boolean)` — `reading`, `extensions_used < 2`, one pending; accept adds 14 days.
- `mark_returned(p_loan_id uuid)` — borrower, `reading` → `return_marked`.
- `confirm_return(p_loan_id uuid)` — owner, `reading|return_marked` → `closed`, `closed_by 'owner'`.
- `report_problem(p_loan_id uuid, p_kind text, p_message text) returns uuid` — either party; sets `has_open_report`.
- `get_loan_contacts(p_loan_id uuid) returns table(user_id uuid, first_name text, email text, telegram text)` — the *other* party only, only when caller is a party and status in `accepted|reading|return_marked|closed`.
- `get_my_loans() returns setof` rows shaped like `LoanRow` (joins book title/cover and both first names) where caller is a party; `get_loan(p_loan_id uuid)` same shape, one row, parties or admin; `get_loan_events(p_loan_id uuid) returns setof loan_events`.
- `delete_book(p_book_id uuid)` — owner; refuses with `bad_state` if an active loan exists; sets `deleted_at`; pending requests → `declined` (`end_reason 'book_removed'`).
- `run_timed_transitions() returns void` — non-sample `requested` with `respond_by < now()` → `expired`; non-sample `return_marked` with `return_marked_at < now() - interval '7 days'` → `closed`, `closed_by 'auto'`.
- `refresh_sample_loans() returns void` — sample loans in `reading` whose `due_date < berlin_today() + 7` get `+ interval '1 month'`.
- Cron: `cron.schedule('bm-timed', '*/15 * * * *', 'select public.run_timed_transitions()')`, `cron.schedule('bm-sample-refresh', '0 3 * * *', 'select public.refresh_sample_loans()')`.
- Grants: `execute` on the member functions to `authenticated` only; timed functions to nobody (revoke from public).

- [ ] **Step 1: Write `loans.test.sql`** (setup: members A (owner), B and C (borrowers), D (no books); each of A, B, C owns one book; a sample book S owned by a sample profile). Tests:
  - `block_no_own_book`: as D, `can_request(A.book) = 'no_own_book'`.
  - `block_sample_book`: as B, `can_request(S) = 'sample_book'`; `request_loan(S,…)` raises `sample_book`.
  - `block_own_book`: as A on own book → `own_book`.
  - `pending_limit_3`: B requests 3 different books OK; 4th raises `too_many_pending` (create extra books for A as needed).
  - `already_requested`: B requesting the same book twice raises `already_requested`.
  - `handover_must_match_book`: requesting `in_person` on a meetup-only book raises `not_allowed`.
  - `accept_withdraws_others`: A accepts B's request; B's other pending → `withdrawn`; C's pending request for that book → `declined` with `end_reason = 'lent_to_other'`; book `loan_state = 'reserved'`.
  - `one_active_loan`: after accept, B's `can_request(any) = 'has_active_loan'`.
  - `race_second_accept_fails`: two pending requests (B, C) for one book; owner accepts B; directly calling `respond_request(C_loan, true)` raises (`bad_state` or unique violation mapped to `book_unavailable`), never two active rows.
  - `contacts_hidden_until_accept`: before accept `get_loan_contacts` returns 0 rows for B; after accept returns A's email; never returns the caller's own row; D gets 0 rows.
  - `receive_sets_due_date`: `confirm_received` → `reading`, `due_date = berlin_today() + loan_months months`, book `loan_state='on_loan'`.
  - `due_date_fixed_after_edit`: owner changes `loan_months` 1→3 after receive; loan `due_date` unchanged.
  - `extensions_max_2`: two accepted extensions add 28 days total; third request raises `not_allowed`; a second request while one is pending raises.
  - `overdue_blocks_requests`: set B's `due_date` to yesterday (as postgres); B's `can_request = 'has_overdue'`.
  - `return_flow`: `mark_returned` → `return_marked`; owner `confirm_return` → `closed`, book `loan_state='none'`, B can request again.
  - `owner_confirms_from_reading`: `confirm_return` directly from `reading` closes.
  - `wrong_actor_rejected`: B cannot `respond_request`, A cannot `confirm_received`, C cannot touch the loan (all raise `not_allowed`).
  - `cancel_rules`: borrower cancels `requested`; owner cancels `accepted`; nobody cancels `reading`.
  - `timed_expire_and_autoclose`: backdate `respond_by` and `return_marked_at`, call `run_timed_transitions()` → `expired` / `closed` with `closed_by='auto'`; sample loans in the same states untouched.
  - `delete_book_rules`: delete with active loan raises `bad_state`; delete with only pending requests → requests `declined` with `end_reason='book_removed'`, book hidden from anon.
  - `events_written`: every step above added a `loan_events` row.
- [ ] **Step 2: Run it** — Expected: FAIL (functions missing).
- [ ] **Step 3: Write and apply `0003_loan_functions.sql` and `0004_timed_jobs.sql`** (enable `pg_cron` in 0004). Map `unique_violation` on the active-loan indexes to `book_unavailable` / `has_active_loan` inside the functions.
- [ ] **Step 4: Run `loans.test.sql` and `security.test.sql`** — Expected: both pass. `select jobname, schedule from cron.job` shows both jobs.
- [ ] **Step 5: Commit** `git commit -m "feat(db): loan state machine functions and timed jobs"`.

### Task 4: Admin functions, cover storage, sample data

**Files:**
- Create: `supabase/migrations/0005_admin_storage.sql`, `supabase/seed/sample_data.sql`
- Test: `supabase/tests/admin.test.sql`

**Interfaces:**
- `admin_set_book_hidden(p_book_id uuid, p_hidden boolean)`, `admin_resolve_report(p_report_id uuid)` (clears `has_open_report` when no open reports remain), `admin_close_loan(p_loan_id uuid)` (`closed_by 'admin'`), `admin_list_reports()`, `admin_list_overdue()`, `admin_remove_sample_data() returns integer` (rows deleted; profiles/books/loans/events/reports where sample; never meetups), `admin_stats() returns json` with keys `members, books, requests, acceptance_rate, completed_loans, return_rate, active_members_30d` — all excluding sample rows. Definitions: acceptance_rate = loans ever accepted / loans that got an answer or expired; return_rate = closed / loans ever received; active_members_30d = distinct members with a book created or a loan event in the last 30 days. Every admin function raises `not_allowed` unless `is_admin()`.
- Storage bucket `covers`: public, `file_size_limit 2097152`, mime `image/jpeg, image/webp, image/png`; insert/update/delete only where `(storage.foldername(name))[1] = auth.uid()::text`.
- Seed: 10 sample profiles (doc 2 §7 names/neighbourhoods as German Ortsteile names: Neukölln, Pankow, Schöneberg, Wedding, Friedrichshain, Prenzlauer Berg, Charlottenburg, Kreuzberg, Moabit, Steglitz), the 24 books with owners/authors/translators/languages/categories from doc 2 §7, statuses as listed (Persepolis paused), sample loans in `reading` for the books marked "on loan until …" with due dates spread 3–12 weeks after seed day, all `is_sample = true`. Idempotent (`on conflict do nothing`, fixed UUIDs).

- [ ] **Step 1: Write `admin.test.sql`**: `non_admin_rejected` (member calling each admin function raises `not_allowed`); `hide_book` (admin hides → anon can't see; unhide → visible); `stats_exclude_samples` (with seed loaded, stats `books` = real books only); `remove_samples` (returns > 0; afterwards no `is_sample` rows remain; a real meetup and real member's book still exist); `report_resolve` (member reports → `has_open_report` true → admin resolves → false); `storage_policy` (as A, insert into `storage.objects` with name `<B id>/x.jpg` raises).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Write and apply `0005_admin_storage.sql`; load `sample_data.sql`** via `execute_sql`.
- [ ] **Step 4: Run all three SQL test files** — Expected: pass. Check `select count(*) from books where is_sample` = 24.
- [ ] **Step 5: Commit** `git commit -m "feat(db): admin functions, cover storage, sample data"`.

### Task 5: App shell — design system, i18n, auth state, routing

**Files:**
- Create: `src/styles/*.css`, `src/i18n/{index.tsx,fa.ts,de.ts,en.ts}`, `src/lib/{config.ts,supabase.ts,auth-url.ts}`, `src/auth/{AuthProvider,RequireAuth,RequireAdmin}.tsx`, `src/router.tsx`, `src/main.tsx`, `src/components/{Header,Footer,PrototypeNote,LanguageSwitch,ErrorBox,StatusBox,Toast,Field}.tsx`, `src/pages/NotFound.tsx`
- Test: `src/i18n/i18n.test.ts`, `src/lib/auth-url.test.ts`

**Interfaces:**
- `useT(): { t: (key: string, vars?: Record<string, string|number>) => string; locale: Locale; setLocale(l: Locale): void; dir: 'rtl'|'ltr'; num(n: number): string; date(iso: string): string }`. Vars are formatted with the locale's digits. Locale order: profile → localStorage `bm-locale` (try/catch) → `fa`. Setting locale updates `<html lang dir>`.
- Dictionaries: `fa.ts` exports `const fa = {…} as const`; `de.ts`/`en.ts` typed `Record<keyof typeof fa, string>` style so a missing key is a type error. Keys are dotted (`nav.books`, `book.status.on_loan`…); doc 3 glossary terms verbatim.
- `useAuth(): { session: Session|null; profile: Profile|null; loading: boolean; refreshProfile(): Promise<void>; signOut(): Promise<void> }`.
- `buildLoginUrl(returnTo: string): string` → `/login?next=<encoded>`; `safeNext(next: string|null): string` returns `/` for anything not starting with a single `/`.
- `config.ts`: `CONTACT_EMAIL = '[ایمیل تماس]'`, `ADMIN_TELEGRAM = '[تلگرام ادمین]'`, `TELEGRAM_GROUP_URL = '#'`, `INSTAGRAM_URL = '#'`, `EMAIL_ENABLED = import.meta.env.VITE_EMAIL_ENABLED === 'true'`.
- Header per doc 2 (logged out: logo, کتاب‌ها, چطور کار می‌کند؟, ثبت کتاب (secondary style on teal), language switch, ورود, ثبت‌نام, search; logged in: first name menu with امانت‌های من (badge with count of items waiting for me), کتاب‌های من, تنظیمات حساب, خروج, plus مدیریت for admins). Mobile ≤760px: «منو» button toggling a teal-hover panel. Footer: dark ink, links (about, rules, contact, privacy, Impressum), Telegram/Instagram placeholders, line «هم‌کتاب · داوطلبانه و غیرتجاری · پایلوت برلین». `PrototypeNote` renders in the header area on every page.
- Routes: `/`, `/books`, `/books/:id`, `/add`, `/books/:id/edit`, `/how-it-works`, `/login`, `/signup`, `/me` (tabs `?tab=loans|books`), `/account`, `/about`, `/rules`, `/contact`, `/privacy`, `/impressum`, `/loans/:id`, `/reset-password`, `/confirm-email`, `/admin`, `*` → NotFound. Pages not built yet render a stub heading.

- [ ] **Step 1: Write failing tests.** `i18n.test.ts`: the key sets of fa, de, en are identical; no value is empty; every fa value containing «هم کتاب» (with a plain space) fails; `t('x', {n: 3})` in fa renders `۳`. `auth-url.test.ts`: `buildLoginUrl('/books/abc?request=1') === '/login?next=%2Fbooks%2Fabc%3Frequest%3D1'`; `safeNext('//evil.com') === '/'`; `safeNext('https://evil.com') === '/'`; `safeNext('/me?tab=loans') === '/me?tab=loans'`; `safeNext(null) === '/'`.
- [ ] **Step 2: Run `npm test`** — Expected: FAIL.
- [ ] **Step 3: Implement** the files above. CSS: `tokens.css` = doc 3 §3 `:root` block verbatim; `base.css` = font imports (`@fontsource-variable/vazirmatn`, `@fontsource/lalezar`), type scale, focus rules, layout container, breakpoints; `components.css` = doc 3 §7 components (both tables). Supabase client with `persistSession: true`.
- [ ] **Step 4: Run `npm test` and `npm run build`** — Expected: PASS / succeeds. `npm run dev`, open in the browser pane: header, footer, prototype note render in fa (RTL); switching to DE flips to LTR and persists after reload.
- [ ] **Step 5: Commit** `git commit -m "feat(app): design system, i18n, auth state, routing shell"`.

### Task 6: Sign up, log in, password, account

**Files:**
- Create: `src/lib/validate.ts`, `src/api/profile.ts`, `src/pages/{Signup,Login,ResetPassword,ConfirmEmail,Account}.tsx`
- Test: `src/lib/validate.test.ts`

**Interfaces:**
- `validateSignup(v: {firstName: string; email: string; password: string; postcode: string; neighbourhood: string; telegram: string; acceptedRules: boolean}): Partial<Record<keyof typeof v, string>>` — values are i18n keys. Password ≥ 8 chars. Telegram optional, stored without leading `@`, `/^[A-Za-z0-9_]{5,32}$/`.
- `updateProfile(p: Partial<Pick<Profile,'first_name'|'postcode'|'neighbourhood'|'telegram'|'locale'>>): Promise<void>`.
- Signup calls `supabase.auth.signUp({ email, password, options: { data: { first_name, postcode, neighbourhood, telegram, locale } } })`, maps "User already registered" to the duplicate-email state (doc 2 §6 with links to login/reset), then redirects to `safeNext(next)` or `/add?first=1`.
- Login: generic «ایمیل یا رمز عبور اشتباه است», email kept, redirect to `safeNext(next)`.
- ResetPassword: when `!EMAIL_ENABLED` shows the "not available yet" text + `CONTACT_EMAIL`; otherwise doc 2 §16 flow (`resetPasswordForEmail` with `redirectTo` `/reset-password`, then `updateUser({password})` on return).
- Account: edit profile fields; change password via `updateUser({ password })`; deletion-by-request text with `CONTACT_EMAIL`.

- [ ] **Step 1: Write failing tests** for `validateSignup`: empty object → errors on firstName, email, password, postcode, neighbourhood, acceptedRules; postcode `۱۴۴۶۷` → `signup.error.notBerlin`; postcode `۱۰۹۹۹` → no postcode error; telegram `@leila_k` → valid; telegram `a b` → error; password `1234567` → error.
- [ ] **Step 2: Run** — Expected: FAIL. **Step 3: Implement.** **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Manual check** against the live Supabase project with `npm run dev`: sign up a test member (non-Berlin postcode shows the Berlin-only message; duplicate email shows the duplicate state), log out, log in with a wrong password (generic error), log in correctly, edit neighbourhood in Account. Note: until email confirmation is turned off (Task 14 step 3) Supabase may refuse sign-up with an email error — if so, do Task 14 step 3 now.
- [ ] **Step 6: Commit** `git commit -m "feat(app): sign up, log in, password and account settings"`.

### Task 7: Home and book browsing

**Files:**
- Create: `src/lib/books.ts`, `src/api/{books.ts,meetups.ts}`, `src/components/{BookCard,BookCover,StatusChip,MeetupBox,Steps}.tsx`, `src/pages/{Home,Books}.tsx`
- Test: `src/lib/books.test.ts`

**Interfaces:**
- `listBooks(): Promise<Book[]>` (all visible, non-deleted; newest first); `getBook(id): Promise<Book|null>`; `nextMeetup(): Promise<Meetup|null>` (first with `starts_at > now()`).
- `filterBooks(books: Book[], f: {q: string; language: BookLang|'all'; category: Category|'all'; availableOnly: boolean}): Book[]`; `sortBooks(books: Book[], by: 'newest'|'title'): Book[]` (title uses `Intl.Collator` of the UI locale); `paginate<T>(items: T[], page: number, size = 12): {items: T[]; pages: number}`; `displayStatus(b: Book): 'available'|'reserved'|'on_loan'|'paused'`.
- `BookCover`: real image from the `covers` bucket public URL when `cover_path`, else the doc 3 placeholder (2:3, 8px spine on the inline-start edge, one of the four colour combos chosen by a stable hash of the id, title text inside).
- `StatusChip`: «موجود» ink on turquoise; «در امانت تا [تاریخ]» / «رزرو شده» / «متوقف‌شده توسط صاحب کتاب» ink on white with 1px border; plus a separate «نمونه» chip for samples. Words always present.
- Home per doc 2 §1 (8 newest; meetup box shows the date or «تاریخ دورهمی بعدی به‌زودی اعلام می‌شود»). Books per doc 2 §2 with filters in the URL query string; empty state with "clear search" and "ask in Telegram".

- [ ] **Step 1: Write failing tests**: `filterBooks` with q `كليدر` finds «کلیدر (جلد ۱ و ۲)»; `availableOnly` excludes `on_loan`, `reserved` and `paused`; language `de` returns only German books; `paginate` of 25 items page 3 returns 1 item and `pages = 3`; `displayStatus` returns `paused` for a paused book even with `loan_state 'none'`; `sortBooks(…,'title')` in fa orders «الف» before «ب».
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Manual check** in the browser pane: home shows sample books with «نمونه» chips; books page search for «چراغها» and `Farzaneh` works; filters survive reload.
- [ ] **Step 6: Commit** `git commit -m "feat(app): home page and book list with search and filters"`.

### Task 8: Add/edit a book and My books

**Files:**
- Create: `src/lib/covers.ts`, `src/pages/BookForm.tsx`, `src/pages/MyLoans.tsx` (books tab only in this task)
- Modify: `src/lib/validate.ts`, `src/api/books.ts`
- Test: extend `src/lib/validate.test.ts`

**Interfaces:**
- `validateBook(v: BookFormValues): Partial<Record<keyof BookFormValues, string>>` where `BookFormValues = { title; title_latin; author; translator; publisher; language; category; year: string; condition; loan_months: '1'|'2'|'3'; handover_methods: Handover[] }`. Required: title, author, language, category, condition, ≥1 handover. Year optional, `toAsciiDigits`, 1800…current year.
- `createBook(v, cover?: File): Promise<Book>`; `updateBook(id, v, cover?: File)`; `setBookPaused(id, paused: boolean)`; `deleteBook(id)` (RPC `delete_book`); `listMyBooks(): Promise<Book[]>`. Duplicate → Postgres `23505` → field error `book.error.duplicate` on title.
- `resizeImage(file: File, maxSide = 1000): Promise<Blob>` (canvas → WebP, fallback JPEG); uploads to `covers/<uid>/<uuid>.webp`.
- BookForm per doc 2 §3: logged-out message with login/signup links carrying `next=/add`; heading line «کتاب مال شما می‌ماند…»; "what books fit" = any book in any language you own; after save the "listed" box with «ثبت کتاب دیگر» and «گذاشتن پیوند در تلگرام» (copies the book URL). `/books/:id/edit` reuses the form (owner only).
- My books tab: list with status chip, loan length, actions edit / pause–resume / delete (confirm dialog; shows the `bad_state` message when on loan).

- [ ] **Step 1: Write failing tests** for `validateBook`: missing title → `book.error.required`; `handover_methods: []` → `book.error.handover`; year `۱۳۸۵` → error (out of range after conversion, 1385 < 1800); year `۲۰۰۱` → ok; year `abcd` → error.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Manual check**: add a book with a cover photo, see it on the home page; add the same title again → duplicate error, typed values kept; pause it → "paused" chip on its page; edit and save.
- [ ] **Step 6: Commit** `git commit -m "feat(app): add, edit, pause and delete books"`.

### Task 9: Book page and request form

**Files:**
- Create: `src/api/loans.ts`, `src/pages/BookPage.tsx`
- Test: `src/lib/loans.test.ts` (create `src/lib/loans.ts`)

**Interfaces:**
- `api/loans.ts`: `canRequest(bookId): Promise<BlockReason|null>`; `requestLoan(bookId, handover: Handover, meetupId: string|null, message: string): Promise<string>`; wrappers for every function in Task 3 (`respondRequest`, `cancelLoan`, `confirmReceived`, `requestExtension`, `respondExtension`, `markReturned`, `confirmReturn`, `reportProblem`, `getLoanContacts`, `getMyLoans`, `getLoan`, `getLoanEvents`); errors rethrown as `LoanError { code: BlockReason|'not_allowed'|'bad_state'|'unknown' }`.
- `lib/loans.ts`: `blockMessage(reason: BlockReason): { textKey: string; action?: { labelKey: string; to: string } }` — `no_own_book` → «اولین کتابتان را ثبت کنید» `/add`; `has_active_loan` → «امانت فعلی شما» `/me?tab=loans`; `has_overdue` → same with overdue text; `too_many_pending` → `/me?tab=loans`; `not_logged_in` → `buildLoginUrl('/books/:id?request=1')`; `sample_book` → explanatory text, no action.
- BookPage per doc 2 §14: details, status, loan length line «موجود · مدت امانت: ۱ ماه، به انتخاب صاحب کتاب», «عضوی در [محله]», request form opens in place (and auto-opens when `?request=1`), handover radio with «رایگان» next to each, meetup option labelled with the next meetup date or «دورهمی بعدی (تاریخ به‌زودی اعلام می‌شود)», optional message, line «صاحب کتاب ۳ روز برای پاسخ وقت دارد.»; on success navigate to `/loans/:id`. Sample books: «کتاب نمونه — امکان درخواست ندارد» box. 4 more books (same language or category). Deleted/missing → NotFound "removed by its owner" variant.

- [ ] **Step 1: Write failing tests** for `blockMessage`: each `BlockReason` returns a key that exists in `fa`; `no_own_book` action `to === '/add'`; `not_logged_in` action `to` starts with `/login?next=`; `sample_book` has no action.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Manual check** with two test members (X owns a book; Y has none): Y sees the "add your first book" block; after Y adds a book, Y sends a request and lands on the loan page; logged out, "request" on a book goes to login and returns with the form open.
- [ ] **Step 6: Commit** `git commit -m "feat(app): book page with in-page loan request"`.

### Task 10: Loan page and My loans

**Files:**
- Create: `src/pages/LoanPage.tsx`, `src/components/{ProgressSteps,Tabs}.tsx`
- Modify: `src/lib/loans.ts`, `src/pages/MyLoans.tsx`, `src/components/Header.tsx` (badge)
- Test: extend `src/lib/loans.test.ts`

**Interfaces:**
- `nextAction(loan: LoanRow, viewerId: string, today: string): { box: 'owner_respond'|'borrower_wait'|'arrange_handover'|'confirm_received'|'reading'|'extension_decide'|'extension_wait'|'owner_confirm_return'|'borrower_returned_wait'|'ended'; overdue: boolean }`.
- `progressStep(status: LoanStatus): 0|1|2|3|4|5` for the 6 steps درخواست، قبول، تحویل، خواندن، برگشت، بسته.
- `waitingForMe(loans: LoanRow[], viewerId: string): LoanRow[]` — requests to answer (owner, `requested`), returns to confirm (owner, `return_marked`), extensions to decide (owner, `extension_pending`), handovers to confirm (borrower, `accepted`). Header badge = its length (fa digits).
- LoanPage per doc 2 §15 minus postal: summary, ProgressSteps (done = tint + «✓», current = turquoise + bold), action box per `nextAction`, handover details (method, meetup date/place or "to be announced", contacts from `getLoanContacts` after accept), due date + extensions «تمدید: ۱ از ۲» + «درخواست ۲ هفته بیشتر», return section, «گزارش مشکل» (kind select + message), dated history from `getLoanEvents`, next meetup box. Ended states show the reason in words (`end_reason`). Non-party → NotFound.
- MyLoans loans tab per doc 2 §7: «منتظر پاسخ شما» (from `waitingForMe`), «کتاب‌هایی که امانت گرفته‌ام», «کتاب‌هایی که امانت داده‌ام», empty state text. Active ones first; ended loans not listed (past-loans page is a non-goal).

- [ ] **Step 1: Write failing tests**: owner + `requested` → `owner_respond`; borrower + `requested` → `borrower_wait`; borrower + `accepted` → `confirm_received`; owner + `reading` + `extension_pending` → `extension_decide`; borrower + `reading` with `due_date` yesterday → `overdue: true`; owner + `return_marked` → `owner_confirm_return`; any + `expired` → `ended`; `progressStep('return_marked') === 4`; `waitingForMe` returns exactly the owner's requested + return_marked loans and the borrower's accepted loan from a mixed list of 6.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Manual check** of the full cycle with X and Y in two browser tabs: request → X sees badge «۱» → accept → contacts visible to both → Y "I've received the book" → due date shown → Y asks extension → X accepts (+2 weeks) → Y "I've returned it" → X confirms → closed, book available again, Y's badge/quota cleared. Report a problem once and see it listed.
- [ ] **Step 6: Commit** `git commit -m "feat(app): loan page and my loans with waiting-for-you"`.

### Task 11: Content pages in three languages

**Files:**
- Create: `src/pages/{HowItWorks,About,Rules,Contact,Privacy,Impressum}.tsx`, `src/components/Accordion.tsx`
- Modify: `src/i18n/{fa,de,en}.ts`

**Interfaces:**
- Content follows doc 2 §4, §9–13, **rewritten to spec §6**: rules table rows عضویت (رایگان؛ فقط برلین) · درخواست هم‌زمان (تا ۳) · کتاب هم‌زمان (۱) · مدت امانت (۱، ۲ یا ۳ ماه، به انتخاب صاحب کتاب) · تمدید (تا ۲ بار، هر بار ۲ هفته، با موافقت صاحب کتاب) · تحویل (دورهمی ماهانه یا حضوری؛ رایگان) · پاسخ صاحب کتاب (۳ روز) · برگشت (اگر صاحب کتاب ظرف ۷ روز تأیید نکند، امانت بسته می‌شود) · ودیعه یا هزینه (ندارد؛ هم‌کتاب هیچ پولی جابه‌جا نمی‌کند). Six FAQ items from doc 2 §4, the postage one replaced by "Can I send a book by post? Not yet." Rules page: sections امانت گرفتن، برگرداندن، امانت دادن، تحویل، کتاب گم‌شده یا آسیب‌دیده، در گروه تلگرام. About adjusted to the wider immigrant community. Privacy/Impressum: doc 2 §12/§13 structure, legal text as visibly marked placeholders. Contact: `CONTACT_EMAIL`, `ADMIN_TELEGRAM`, link to FAQ, "use Report a problem".
- German and English full translations; every block I wrote carries `// AI copy: review`.

- [ ] **Step 1: Implement** the pages and dictionary entries.
- [ ] **Step 2: Run `npm test`** — Expected: i18n parity test PASS (catches any missing de/en key). `npm run build` succeeds.
- [ ] **Step 3: Manual check** each page in fa, de, en: no «هم کتاب», Persian digits in fa, no mention of post costs, credits or prices.
- [ ] **Step 4: Commit** `git commit -m "feat(app): how it works, rules, about, contact, privacy, impressum"`.

### Task 12: Admin page

**Files:**
- Create: `src/api/admin.ts`, `src/pages/Admin.tsx`

**Interfaces:**
- `api/admin.ts` wraps every Task 4 admin function plus meetups CRUD (`createMeetup({starts_at, ends_at, place, neighbourhood})`, `updateMeetup(id, …)`, `deleteMeetup(id)` via table writes under admin RLS).
- Admin page sections (spec §7 "+ Admin"): numbers (from `admin_stats`, fa digits, labelled), open reports (book, both first names, kind, message, date; "resolve", "close loan"), overdue loans, books (search box using `filterBooks`, hide/unhide), meetups (list + add/edit/delete form; date/time inputs in Europe/Berlin), sample data (count + «حذف همه داده‌های نمونه» with a confirm step showing the count). Route guarded by `RequireAdmin` (non-admins see NotFound).

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Manual check** with a test member temporarily made admin via `execute_sql` (`update profiles set is_admin = true where id = …`): stats render; hide/unhide a book; add a meetup → home page meetup box shows it; resolve the report from Task 10. **Do not** run "remove sample data" here. Revert the test member's admin flag.
- [ ] **Step 3: Commit** `git commit -m "feat(app): admin page"`.

### Task 13: UX pass

**Files:**
- Modify: any `src/` file the checks below flag.

- [ ] **Step 1: Load the `ui-ux-pro-max` skill** and run its pre-delivery checklist over the app (accessibility, forms, touch targets, focus, empty/error/loading states, motion). Fix findings unless they conflict with doc 3.
- [ ] **Step 2: Width check.** In the browser pane at 320px and 375px wide, for every route in fa and de, run `document.documentElement.scrollWidth <= window.innerWidth` — Expected: `true` everywhere. Check the header (menu button, wordmark + BOOK MATE stacked), book page, loan page, admin tables.
- [ ] **Step 3: Keyboard check.** Tab through header, book request form, loan actions: visible focus ring everywhere (white on teal/ink).
- [ ] **Step 4: Contrast spot check** against doc 3 §4 pairings for any colour used outside them.
- [ ] **Step 5: Run `npm test` and `npm run build`** — PASS / succeeds. **Commit** `git commit -m "fix(app): UX and accessibility pass"`.

### Task 14: Deploy to bookmate.onrender.com and verify live

**Files:**
- Create: `render.yaml`

**Interfaces:**
- `render.yaml`: one static service, `name: bookmate`, `runtime: static`, `buildCommand: npm ci && npm run build`, `staticPublishPath: dist`, `routes: [{ type: rewrite, source: /*, destination: /index.html }]`, envVars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`sync: false`), `VITE_EMAIL_ENABLED: "false"`.

- [ ] **Step 1: Push.** `gh repo create bookmate --public --source . --remote origin --push`. Verify the repo URL with `gh repo view --json url`.
- [ ] **Step 2: Create the site.** Render MCP `create_static_site` in workspace `tea-dbv04s6tlv9c73fcpdh0`: name `bookmate`, repo URL from step 1, branch `main`, `buildCommand` `npm ci && npm run build`, `publishPath` `dist`, env vars from `.env.local` + `VITE_EMAIL_ENABLED=false`. Confirm the service URL is `https://bookmate.onrender.com`. Then apply the rewrite: `create_blueprint` with `existingResources: "adopt"` → `plan_blueprint` result reviewed with the owner → `approve_blueprint` only after their yes. If the blueprint route fails, ask the owner to add the rule in the Render dashboard (Static Site → Redirects/Rewrites: Source `/*`, Destination `/index.html`, Action Rewrite).
- [ ] **Step 3: Supabase auth settings (owner action in the Supabase dashboard if no tool covers it).** Authentication → Sign In / Providers → Email: turn **Confirm email** off. Authentication → URL Configuration: Site URL `https://bookmate.onrender.com`, redirect URLs `https://bookmate.onrender.com/**` and `http://localhost:5173/**`.
- [ ] **Step 4: Wait for the deploy** (`list_deploys` / `get_deploy` until `live`). Open `https://bookmate.onrender.com/books` directly (deep link must load, proving the rewrite).
- [ ] **Step 5: Live end-to-end check** with two fresh test members in the browser pane: sign up both (Berlin postcodes), each adds a book, full loan cycle as in Task 10 step 5, sample book shows «کتاب نمونه — امکان درخواست ندارد», language switch fa/de/en, 320px width check on home/book/loan pages. Then delete the two test members' data (`execute_sql`, delete their auth users; cascades) so the live site starts clean.
- [ ] **Step 6: Make the owner admin.** Ask the owner to sign up on the live site; then `update profiles set is_admin = true where id = (select id from auth.users where email = '<their email>')`. Owner confirms they see «مدیریت» in their menu.
- [ ] **Step 7: Commit and push** `render.yaml` and any fixes: `git commit -m "chore: render deploy config"` + `git push`. Verify auto-deploy picks it up.
