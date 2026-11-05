# Adot Complex: technical design

Baseline: PRD v1.0 (5 November 2026). This document records engineering decisions.
It does not approve any open Adot decision (O-01 to O-09).

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router), TypeScript | Server-rendered crawlable pages (NFR-10); forms work through server actions, with server-side validation (FR-033) |
| Database | PostgreSQL through Drizzle ORM | Relational data, unique constraints for idempotency, plain SQL migrations for handover (NFR-11) |
| Local/test database | PGlite (embedded Postgres) | Same dialect and migrations as production, no Docker or install needed |
| Styling | Plain CSS with design tokens | Small surface; the palette is fixed by the PRD |
| Tests | Vitest against in-memory PGlite | Business rules are tested against real SQL constraints |

Set `DATABASE_URL` to use a hosted Postgres. Leave it unset to use PGlite in `DATA_DIR`.

## Structure

- `src/db`: schema, connection, migrations runner.
- `src/server`: all business rules. Functions take `db` as an argument so tests can run them directly. Nothing in here depends on Next.js.
- `src/app/[locale]`: public site (`/en`, `/am`).
- `src/app/admin`: authenticated dashboard (English only at launch, as the PRD allows).
- `src/i18n`: interface strings. Unit content has its own EN/AM columns.

## Key decisions

**Freshness (NFR-04).** Every public page renders dynamically from the database, so changes are visible on the next request and the 60-second limit holds by construction. If caching is added for performance, it must invalidate on unit changes and be covered by a timed test.

**Enquiry integrity (FR-033 to FR-036).** A hidden idempotency key is issued with the form. A unique constraint on that key means double taps and retries return the original record. The enquiry and its notification rows are written in one transaction, and email is sent only afterwards, so a mail outage cannot lose a lead. Sending claims a row atomically, so concurrent retries cannot send twice.

**Status separation (FR-014).** Publication and availability are separate columns. Only `Published` records with an eligible availability appear publicly. Eligibility is decided in one function that listing, detail pages and enquiry submission all share, and Ask Adot should use it too.

**Unit URLs (FR-020).** Leased and archived units return an informative page without unit details. Drafts return 404, so unpublished records are not revealed.

**Snapshots (FR-030, FR-040).** Enquiries copy the unit title and reference at submission. The unit foreign key uses `ON DELETE SET NULL`.

**Rent visibility (FR-013, FR-092).** Rent is shown only if `rentPublic` is set. Otherwise the public site shows "Contact for pricing".

## Interpretations of the PRD, to confirm with Adot

| Topic | PRD | Interim behaviour |
| --- | --- | --- |
| Who publishes units | J3 says content editor; FR-113 says leasing staff | Both can edit and publish. Only leasing staff and administrators change availability |
| "Assigned" content (FR-112) | Editors limited to assigned content | Role-level for now, with no per-record assignment |
| "Assigned" enquiries (FR-113) | Leasing staff manage assigned enquiries, but J5 has them assign | Leasing staff see unassigned enquiries and their own. Administrators see all |
| Under discussion (O-03) | Listing policy undecided | Setting, default off |
| Bilingual completeness (O-04) | Policy undecided | Missing Amharic warns but does not block; the public page falls back to English |
| General-interest enquiries on stale units | FR-020 and FR-095 | Use the Future availability form |
| Expired promotions | FR-004 MUST, FR-075 "if implemented" | Treat as MUST when promotions are built |
| Floor and category language | FR-001 requires approved Amharic content; the field list gives these no translation | Single-language values, so they appear as entered on Amharic pages. Needs fixed bilingual lists from Adot |
| Ethiopian calendar | Not addressed; FR-053 covers only the clock | Needs a decision before the Cinema phase |

## Delivery phases

1. **Leasing slice (this build):** language switching, navigation, Available Spaces, unit lifecycle, unit enquiries, Future availability enquiries, inbox, notifications with retry, roles, audit.
2. **Account security:** MFA and password recovery (FR-114). Must ship before any production use.
3. **Content:** Home with real photography, Cinema, Gym, Directory, Visit, Contact, Gym and General enquiry types.
4. **Ask Adot:** read-only lookups over the same eligibility functions, after O-08.
5. **Launch readiness:** real mail provider and media storage (O-09), Lighthouse and accessibility audits, backups, the 13 UAT demonstrations.
