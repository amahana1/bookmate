# Book Mate — "Living Shelf" redesign (approved)

- **Date:** 2026-11-18 · **Status:** approved by the owner ("Looks good, build it") after reviewing the Claude Design canvas https://claude.ai/artifact/DwRk1r9vGSSMWuryLznTW5
- **Builds on:** `2026-11-18-bookmate-platform-design.md` (all rules, data and privacy decisions unchanged) and doc 3 (colours, fonts, contrast pairs, no shadows/gradients/emoji — unchanged).

## Intent
The owner asked for a creative, innovative site that stays Persian-first and responsive. Of three directions (Living shelf, Paper notebook, Bold poster) the owner chose **Living shelf**: keep the approved brand and put the creativity into how people browse and borrow.

## Approaches considered
| | Direction | Trade-off |
|---|---|---|
| **Chosen** | Living shelf — brand kept, books as spines on a shelf, Berlin district map, loan as a library card | Distinctive and bookish without breaking doc 3 or its WCAG pairs |
| Rejected | Paper notebook — new literary identity, Naskh headings | Replaces the approved colours and heading font |
| Rejected | Bold poster — huge type, colour blocks, stickers | Risks the "shop/startup" look doc 1/3 rule out |

## What changes (as drawn on the canvas)
1. **Home**
   - Hero: eyebrow «قفسه‌ی مشترک برلین», new h1/lead, search.
   - **Shelf**: the newest books as spines (height/width varied, stable per book; doc 3 palette with matching text colour; vertical title), grouped by book language with dark bookends; tapping a spine lifts it and shows a card (title, author, status, neighbourhood, sample chip, "open book"). Phone: the shelf scrolls sideways.
   - **District map** «قفسه‌ی محله‌ها»: the 12 Bezirke as a geographic tile grid (kept left-to-right inside the RTL page), shade by number of listed books with the number always written; tile → book list filtered to that district. Phone (≤620px): a two-column list sorted by count. Only districts, never addresses.
   - **How it works** as three dashed "library stamps"; meetup box (ink) and invite box (saffron).
2. **Book page**: cover slightly tilted ("pulled from the shelf"); **journey** timeline: on the shelf since [date] → [n] completed loans → now (status) → next reader; mini-shelf of the same owner's other books; request card unchanged in behaviour.
3. **Loan page**: a **library card**: ink header, book row, one row per step (request, accept, handover, reading, return, closed) with a dashed date stamp when done, a filled "now" mark, an empty slot when upcoming; large "return by" stamp with extensions used; actions, contacts, report and meetup in the side column; history kept below.
4. **Books list**: accepts a district filter from the map (`?d=<Bezirk>`), shown as a removable chip.
5. Header nav: «قفسه‌ها» (books) · «نقشه‌ی محله‌ها» (home map) · «چطور کار می‌کند؟».

## Data
- New public, aggregate-only function `book_journey(p_book_id)` → `{listed_at, completed_loans}`; reveals no member data.
- Ortsteil → Bezirk mapping in `src/lib/berlin.ts` (sample neighbourhoods resolve correctly).

## Constraints kept
Persian RTL default, Persian digits, three languages; Lalezar/Vazirmatn self-hosted; contrast pairs from doc 3; status never by colour alone; touch targets ≥44px; `prefers-reduced-motion` turns off the spine lift animation; no horizontal page scroll at 320px.

## Builder's calls
Spine dimensions derive from a hash of the book id and title length. The header CTA keeps «ثبت کتاب» (glossary term, space); the longer «کتابت را روی قفسه بگذار» is used in the invite box. ProgressSteps is replaced by the card rows.

## Build order
1. Tested helpers: `bezirkOf`, `districtCounts`, `spineFor`. 2. `book_journey` migration with SQL test. 3. Shelf + map + stamps on Home, district filter on Books. 4. Book page journey + owner shelf; Loan card. 5. Responsive (320/375/768/1280, fa+de) and keyboard checks. 6. Commit, deploy, live check.
