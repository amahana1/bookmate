# Book Mate (هم‌کتاب) member platform — design

- **Date:** 2026-11-18
- **Status:** draft, awaiting approval
- **Source material:** `01-book-mate-project-and-pilot.md`, `02-book-mate-website-and-prototype.md`, `03-book-mate-design-system.md` (all in the repo root, in Persian). Those three documents remain the reference for page content, copy intent and the visual system. This document records what changes from them and how the live platform is built.

## 1. Intent and why

Book Mate is a volunteer, non-commercial lending network: members lend books from their own shelves to each other, and **every book always goes back to its owner**. The owner must accept a request before anything happens. Nothing is sold, no money moves through the platform.

The owner wants the 18-page member platform from document 2 built as a **live, working prototype** that real people can sign up to and use, seeded with sample books so it isn't empty on day one.

- **Audience (owner's words):** the whole immigrant community in Berlin, with German supported. Persian speakers are the founding group.
- **Success (owner's words):** hundreds of people actually borrowing and lending books — not sign-ups.
- **Privacy (owner's words):** normal privacy; it is a prototype.

## 2. Goals, non-goals, anti-goals

### Goals
1. Anyone in Berlin can create an account, list books, request a book, and complete a full loan (request → accept → handover → reading → return → owner confirms) without admin help.
2. The rules (section 6) are enforced by the database, not just the UI.
3. Persian (default, RTL), German and English (LTR) interface.
4. Looks and reads like documents 2 and 3: calm, trustworthy, volunteer; teal design system; mobile first from 320px.
5. Sample books make the shelf look alive but never trap a real person waiting on a fake owner.
6. An admin can moderate (hide books, see reported problems), manage meetups, remove all sample data in one action, and see the pilot success numbers from document 1 §13.
7. Live at **https://bookmate.onrender.com**.

### Non-goals (not in this version)
- Postal loans and anything about postage costs (doc 2 §3 "مسیر پستی"). Handover is monthly meetup or in person only.
- Credits/points, deposits, any money, donations.
- Mobile app, Telegram bot.
- Waitlist / "notify me when returned", requested-books list, category pages, past-loans page, interest list for other cities.
- Open Library auto-fill.
- Per-book link previews (Open Graph) for Telegram/Instagram.
- Email notifications and password reset by email **until an SMTP sender is configured** (section 9).
- Account delete button (deletion is by request, per doc 1 §15).
- Review-before-publish for new books.

### Anti-goals (failure even if it "works")
- Anything that looks like a shop or startup: prices, carts, "sign up now", growth-hacking copy, invented testimonials or statistics, stock photos of people, emoji, gradients, heavy shadows (doc 3 §8).
- A real member requesting a sample book and waiting for nobody.
- Rules that can be bypassed from the browser (e.g. borrowing two books by calling the API directly).
- A member's email/Telegram visible to anyone before the owner accepts that member's request; anything more precise than the neighbourhood visible publicly.
- Tracking or analytics scripts, Google-hosted fonts.
- Invented facts: unknown details stay as bracketed placeholders, e.g. `[ایمیل تماس]`, `[محل برگزاری]` (doc 3 §2).

## 3. Constraints

- **Hosting:** Render, static site on the free plan, service name `bookmate` → `bookmate.onrender.com` (checked free on 2026-11-18). Render deploys from a GitHub repository; the owner has a GitHub account.
- **Backend:** Supabase (new project, free plan, region **eu-central-1 Frankfurt**), in the owner's existing org "Mbagher's Org". Auth, Postgres, Storage, scheduled jobs (pg_cron).
- **Cost:** free tiers only.
- **No secrets in the repo.** Only the Supabase URL and anon (public) key reach the browser; everything sensitive is protected by row-level security.
- **Design system:** document 3 is binding: colours as CSS custom properties (only those 11), contrast pairings, Lalezar (wordmark/h1/h2, weight 400 only) and Vazirmatn (everything else), self-hosted woff2 via the `@fontsource` packages, logical CSS properties, focus outline rules, components, touch targets ≥44px, 48px buttons/inputs, status never by colour alone.
- **UI/UX review:** use the installed `ui-ux-pro-max` skill for UX guidelines and its pre-delivery checklist during the build; where it conflicts with document 3, document 3 wins.

## 4. Approaches

| | Approach | Trade-offs |
|---|---|---|
| **A — chosen** | **Static single-page app on Render + Supabase.** React app built with Vite into static files, served by Render's static hosting. All rules live in Postgres: row-level security, `security definer` functions for every loan action, pg_cron for timed transitions. | Free and **never sleeps** (Render free web services sleep after 15 min, costing the next visitor ~1 min). Fast CDN, nothing to keep running. Rules can't be bypassed because the browser can only call checked database functions. Cost: shared links show one generic preview, not per-book. |
| B | Next.js server app on a Render web service. | Per-book link previews work. But free plan sleeps (≈1 min first load) or costs ~$7/month; more moving parts. |
| Dropped | Plain HTML/JS without a framework | 18 pages × 3 languages with shared login state becomes hard to maintain. |
| Dropped | Host everything on Supabase only | Owner asked for Render. |

The owner left the technical choice to me; A was presented as the pick and the owner proceeded.

## 5. Decisions

### Decided by the owner
- Build the account platform now (not the one-page pilot site the documents recommend).
- Audience: whole immigrant community in Berlin; support German.
- Success = hundreds of people borrowing and lending.
- Demo with sample books; sample books are **labelled "sample", cannot be requested, and an admin can remove all sample data in one action**.
- Normal, prototype-level privacy.
- Address: `bookmate.onrender.com` (owner chose this over `hamketab.onrender.com` after being told "Bookmate" is an existing app's name — the trademark question stays open for later, doc 1 §14).
- Deploy from the owner's GitHub account.
- **Open sign-ups right away** at launch. A small, always-visible note says this is a prototype and the texts are being reviewed («نسخه آزمایشی · متن‌ها در حال بازبینی» / "Prototype · texts under review" / "Prototyp · Texte werden überprüft"). The owner and a German speaker review copy after launch. No sign-up on/off switch.

### Proposed by me, accepted without correction
- **Languages:** Persian (default), German, English. Persian digits in Persian UI; Western digits in German/English.
- **Books:** any book in any language that a member owns (resolves doc 1 open question 9).
- **Loan length:** owner picks 1, 2 or 3 months per book (default 1). Up to 2 extensions of 2 weeks, each needing owner agreement.
- **Requests:** up to **3 pending requests** at a time, but only **1 active borrowed book**. When an owner accepts one request, the borrower's other pending requests are withdrawn automatically (resolves doc 1 open question 2 differently from the prototype).
- **Handover:** monthly meetup or in person only; no post.
- **New books appear immediately**; admin can hide.
- **Owner never confirms return:** 7 days after the borrower marks "I've returned it", the loan closes automatically (resolves doc 1 open question 5).
- **Problems:** "Report a problem" on the loan page (didn't arrive / no-show / lost / damaged / other) → visible to admin.
- **Notifications:** on-site only at launch (count badge on "My loans", "Waiting for you" box). Email confirmation off so people can join immediately. Emails switch on later when the owner configures a Gmail SMTP sender in Supabase.
- **Admin:** the owner's account.

### My calls (not discussed; owner can correct)
- GitHub repository **public**, named `bookmate`. Nothing secret is in it; a public repo lets Render deploy without installing Render's GitHub app.
- Request expiry: owner has **3 days** to respond, then the request expires (doc 2's figure).
- Overdue = borrowing past the due date. An overdue borrower can't send new requests. No automated admin contact in this version; overdue loans are listed on the admin page.
- Either party can cancel an accepted loan **before** the handover is confirmed.
- The owner can confirm the return directly from "reading" (if the borrower forgot to tap "I've returned it").
- Contact details shown after acceptance: the other member's **email** and, if they entered one, **Telegram username**. Nothing else.
- Neighbourhood is stored on the member's profile (chosen from a list of Berlin Ortsteile at signup), shown on their books. Postcode is never shown publicly.
- Status label for lent books: «در امانت تا [تاریخ]» / "On loan until [date]" (doc 3 glossary). Accepted-but-not-yet-handed-over books show «رزرو شده» / "Reserved".
- **Meetups are always real, never sample.** No meetups are seeded. The admin adds real meetups on the admin page. While no upcoming meetup exists, the "next meetup" boxes say the date will be announced, and a borrower can still choose "monthly meetup" — the loan then shows "next meetup (date to be announced)" and picks up the date once the admin adds one. So books whose only handover method is the meetup stay requestable.
- **Public pages show the owner's neighbourhood only, not their first name** (doc 2 §14: «عضوی در [محله]»). First names are visible only to the other member of a loan (an owner sees the requester's first name when deciding).
- Owners can delete a book that has no active loan; old links to it then show the "removed by its owner" not-found variant (doc 2 §18). Deletion is soft (row kept, flagged) so loan history stays intact.
- Lost or damaged book: handled through "Report a problem"; the admin resolves the report and can close the loan; the owner can then delete or keep the book. No compensation tracking.
- Time zone for all dates, deadlines and timed jobs: Europe/Berlin.

## 6. Loan rules and states

### Who can request
A member can send a request only if **all** hold:
1. They have at least one listed book of their own that is not hidden (sample books don't count).
2. They have no active borrowed loan (status `accepted`, `reading` or `return_marked`).
3. They have fewer than 3 pending (`requested`) requests.
4. They have no overdue loan.
5. The book is not theirs, not a sample, not paused, not hidden, and has no active loan.
6. They don't already have a pending request for this book.

When a rule blocks the request, the book page names the rule and offers the fix as a button (doc 2 §14: "add your first book", "you have a book out", "you have an overdue book"; plus "you already have 3 requests waiting").

### States
```
requested ──accept──▶ accepted ──borrower: "I've received the book"──▶ reading
    │                    │                                               │
    ├─decline──▶ declined├─cancel (either, before handover)──▶ cancelled │
    ├─cancel (borrower)─▶ cancelled                                      │
    ├─3 days, no answer─▶ expired                                        │
    └─another request of this borrower accepted ─▶ withdrawn             │
                                                                         │
reading ──borrower: "I've returned it"──▶ return_marked ──owner confirms──▶ closed
   │                                          └──7 days, no owner action──▶ closed (auto)
   └──owner confirms return directly──────────────────────────────────────▶ closed
```
- `accepted`: contact details of both parties become visible to each other. Other pending requests **for the same book** by other members become `declined` automatically with the reason "lent to someone else".
- `reading`: `due_date = received date + loan_months`. Borrower may request an extension (max 2, one pending at a time); owner accepts (+14 days) or declines.
- Overdue is derived: `reading` and today > `due_date`. Shown as a label in words, not colour only.
- A reported problem does not change the state; it creates a report record, marks the loan "problem reported" and appears on the admin page. Admin can mark the report resolved and, if needed, close the loan.
- Every transition writes a dated entry to the loan history shown on the loan page.

### Timed transitions (pg_cron, every 15 minutes)
- `requested` older than 3 days → `expired`.
- `return_marked` older than 7 days → `closed` (closed_by = auto).
- Sample loans are excluded from these jobs, from overdue lists and from stats. A daily job moves any sample loan's due date forward by a month when it is within 7 days, so sample books never look overdue however long the samples stay up.

## 7. Pages

Content and intent per page follow document 2 §2 unless noted. URLs are clean paths (`/books/…`), which needs an SPA rewrite rule on Render.

| # | Page | Notes / changes from doc 2 |
|---|---|---|
| — | Header & footer | As doc 2 (logged-out / logged-in menus, search, prominent «ثبت کتاب»). Language switch: فا / DE / EN. Footer links + Telegram/Instagram links as placeholders. |
| 1 | Home | Hero names Berlin; three steps; 8 newest books; next meetup box; "add a book" invitation. |
| 2 | Books | List + search + filters (language, category, available only, sort), 12 per page. Search normalises Arabic ي/ك to ی/ک, ignores ZWNJ and spaces, case-insensitive Latin, and matches title (both scripts), author and translator. Empty state as doc 2. |
| 3 | Add a book | Fields: title (original script), title in Latin letters (optional), author, translator (optional), publisher (optional), language, category, year (optional), condition, loan length (1/2/3 months), handover methods (meetup, in person; at least one), cover photo (optional). Logged-out: prompt to log in, return here after. Field-level errors, input preserved, duplicate warning (same owner + same normalised title). After saving: "listed" confirmation with "add another" and "share link". |
| 4 | How it works | Steps, rules table, lending, problems, 6-question accordion — **rewritten to section 6 rules** (no post, no postage, 3 pending/1 active, 7-day auto-close). |
| 5 | Log in | Email + password; generic error; return to the page the member came from (including an open request form). Supabase's built-in rate limiting replaces doc 2's 5-attempt lock. |
| 6 | Sign up | First name, email, password, Berlin postcode (validated), neighbourhood (Berlin Ortsteile list), optional Telegram username, rules checkbox with 3-line summary + link, privacy link. Non-Berlin postcode → doc 2 message. Duplicate email → doc 2 message. Email confirmation off. |
| 7 | My loans / My books | Two tabs as doc 2. "Waiting for you" at top (new requests, returns to confirm, extension requests). Borrowed, lent, my books with status (available, reserved, on loan until, paused, hidden by admin) and actions (edit, pause/resume, add). Edit is a real form (reuse Add a book). |
| 8 | Account settings | Name, postcode, neighbourhood, Telegram, language; change password (works while logged in, no email needed); deletion by request with contact placeholder. |
| 9 | About | Doc 2 §9, adjusted to the wider immigrant community; volunteer names not shown ("a small group of volunteers"). |
| 10 | Community rules | Updated to section 6. Full text in all three languages. |
| 11 | Contact | `[ایمیل تماس]`, `[تلگرام ادمین]` placeholders from one config file; link to FAQ; "use Report a problem on the loan page". No form. |
| 12 | Privacy | Structure from doc 2 §12; legal text left as clearly marked placeholders. States only the login cookie/local storage is used, no tracking. |
| 13 | Impressum | Placeholder content, clearly marked. |
| 14 | Book page | As doc 2 §14 with in-page request form (handover method with "free" next to each, which meetup, optional message, "owner has 3 days to answer"). Sample books: "Sample book — can't be requested" in place of the button, with one line explaining sample books. |
| 15 | Loan page | As doc 2 §15 without the postal path: summary, 6-step progress, "what you need to do now" box per viewer and state, handover details, contacts (after accept), due date & extensions, return, report problem, dated history, next meetup. Only the two members and admins can open it. |
| 16 | Password reset | If email is not configured: explains reset by email isn't available yet and gives the contact placeholder. If configured: doc 2 flow. Controlled by one build-time flag. |
| 17 | Email confirmation | Built for when email confirmation is switched on; hidden from flows while it's off. |
| 18 | Not found | Removed book / unknown page variants. |
| + | **Admin** (`/admin`, admins only) | Open reports (resolve; close loan); books (search, hide/unhide); overdue loans; meetups (add/edit/delete: date, time, neighbourhood/place text); sample data (counts + "remove all sample data" with confirmation); numbers from doc 1 §13: members, books listed, requests, acceptance rate, completed loans, return rate, active members (30 days). |

## 8. Data (Supabase)

Tables (all with RLS on):
- **profiles** — `id` (uuid; equals the auth user id for real members), `first_name`, `postcode`, `neighbourhood`, `telegram` (nullable), `locale`, `is_admin`, `is_sample`, `created_at`. Created by trigger on auth sign-up from the sign-up metadata. Sample profiles have no auth user. Public can read only `id`, `neighbourhood`, `is_sample` (via a view or column-limited policy); the other member of a shared loan can also read `first_name`; a member reads/updates their own full row (except `is_admin`, `is_sample`); postcode/telegram never public.
- **books** — `id`, `owner_id`, `title`, `title_latin`, `author`, `translator`, `publisher`, `language`, `category`, `year`, `condition`, `loan_months` (1–3), `handover_methods` (array: `meetup`, `in_person`), `cover_path`, `status` (`available` | `paused` | `hidden`), `is_sample`, `created_at`, `updated_at`, plus a normalised search column. Public read for non-hidden books; owner insert/update own (cannot set `hidden` or `is_sample`); admin all.
- **loans** — `id`, `book_id`, `owner_id`, `borrower_id`, `status`, `handover_method`, `meetup_id`, `message`, timestamps per transition, `respond_by`, `due_date`, `extensions_used`, `extension_pending`, `closed_by`, `has_open_report`, `is_sample`. Readable only by the two parties and admins. **No direct insert/update from the browser**: every change goes through a `security definer` function that checks the caller and the rules.
- **loan_events** — history entries (`loan_id`, `actor_id`, `type`, `note`, `created_at`); readable by parties and admins; written only by the functions.
- **reports** — `loan_id`, `reporter_id`, `kind`, `message`, `status` (`open` | `resolved`), timestamps.
- **meetups** — `starts_at`, `ends_at`, `place` (text, may be a placeholder), `neighbourhood`. Public read, admin write. Never sample. `loans.meetup_id` is nullable ("next meetup, date to be announced").
- **Storage** bucket `covers`: public read; members upload to their own folder; images resized client-side (max ~1000px, JPEG/WebP) and size-limited.

Functions (RPC): `request_loan`, `respond_request`, `cancel_loan`, `confirm_received`, `request_extension`, `respond_extension`, `mark_returned`, `confirm_return`, `report_problem`, `get_loan_contacts` (returns the other party's email/Telegram only when caller is a party and status ≥ accepted), admin: `admin_set_book_hidden`, `admin_resolve_report`, `admin_close_loan`, `admin_remove_sample_data`, `admin_stats`. Plus a "can I request this book?" check returning the blocking rule, used by the book page.

## 9. Auth and email

- Supabase email + password. Email confirmation **off** at launch; Site URL and redirect URLs set to `https://bookmate.onrender.com`.
- Built-in Supabase mailer is not relied on for members.
- **Later (owner step):** create a project Gmail account with an app password and enter it in Supabase → Auth → SMTP; then turn email confirmation on and flip the site's email flag. Loan notification emails are a follow-up after that and out of scope here.
- Admin: after the owner signs up on the live site, their profile gets `is_admin = true` (set via SQL).

## 10. Languages

- Interface strings in three dictionaries (fa, de, en). `fa` sets `<html lang="fa" dir="rtl">`; de/en set `lang` and `dir="ltr"`. Choice remembered (localStorage; profile `locale` when logged in).
- Persian UI uses Persian digits for numbers and dates; German/English use Western digits. Dates: Gregorian calendar in all three languages (doc 2 sample data uses Gregorian dates in Persian).
- User-entered book data is shown as entered; Latin-script fields get `dir="ltr"`/`dir="auto"` as appropriate.
- Persian copy follows doc 3 tone and glossary; German and English follow the doc 3 glossary's English column, with German written fresh. Copy I write is marked for review (comment in the dictionary files: `AI copy: review`).
- Book language filter values: فارسی, Deutsch, English, العربية, Türkçe, Українська, Русский, Kurdî, دوزبانه/Bilingual, other.

## 11. Sample data

- The 10 members and 24 books from doc 2 §7, all flagged `is_sample`. **No sample meetups** (section 5). Some sample books show "on loan until …" via sample loans between sample members, with due dates 1–3 months after deploy and kept fresh by the daily job (section 6).
- Sample books show a visible "sample" chip (words, not colour only), can't be requested, and are excluded from admin stats.
- `admin_remove_sample_data` deletes all sample profiles, books, loans and events, after a confirmation step. It never touches meetups or real members' data.

## 12. Deployment

1. Create Supabase project (Frankfurt, free), apply migrations (schema, RLS, functions, cron, storage), seed sample data.
2. Push the code to a new public GitHub repo `bookmate` under the owner's account (owner signs in to GitHub when Git asks).
3. Create the Render static site `bookmate` from that repo: build `npm ci && npm run build`, publish `dist`, env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EMAIL_ENABLED=false`, rewrite `/* → /index.html`. Auto-deploy on push to `main`.
4. Set Supabase auth Site URL/redirects to the live URL; confirm email confirmation is off (owner may need to flip this in the Supabase dashboard if the tools can't).
5. Verify on the live site: sign up, add a book, request, accept, receive, return, confirm, with two real test accounts; check mobile width (320px and 375px), RTL/LTR switching, and that sample books can't be requested.

## 13. Left to the builder

- Exact component structure, routing library, state management, styling approach (plain CSS with the doc 3 tokens is expected).
- Berlin postcode validation method (official list preferred; a range check with known exceptions is acceptable for the prototype) and the Ortsteile list.
- Category list (start from doc 2's five sample categories).
- Testing approach: unit tests for pure logic (search normalisation, digit/date formatting, rule messages); SQL-level tests that exercise every loan function as different users; a live end-to-end check (section 12 step 5).
- Pagination and query strategy (fetching all visible books and filtering client-side is fine at prototype scale).
- Wording of new copy, following doc 3 tone and glossary.

## 14. Still open (not blocking this build)

- Trademark/name check for "Bookmate" (doc 1 §14).
- Impressum and privacy text, consent text (legal advice).
- Whether to add postal loans later.
- SMTP sender and email notifications.
- Real cover photos and who takes them.
